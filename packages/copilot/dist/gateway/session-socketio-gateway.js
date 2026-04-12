import { PromptCancelPayloadSchema, PromptSendPayloadSchema, QuestionAnswerPayloadSchema, SessionUpdatePayloadSchema, } from '@audako/contracts';
import { Server } from 'socket.io';
import { createLogger } from '../config/app-config.js';
import { buildSessionEvent } from '../services/session-event-utils.js';
import { sanitizeSessionInfoUpdate, toSessionInfoResponse, } from '../services/session-info-utils.js';
const logger = createLogger('session-socketio-gateway');
function buildSnapshotPayload(entry) {
    return {
        sessionId: entry.sessionId,
        scadaUrl: entry.scadaUrl,
        sessionInfo: {
            tenantId: entry.session.sessionContext.tenantId,
            groupId: entry.session.sessionContext.groupId,
            entityType: entry.session.sessionContext.entityType,
            app: entry.session.sessionContext.app,
            updatedAt: new Date().toISOString(),
        },
        isActive: true,
    };
}
function acceptedAck(commandId, command) {
    return {
        commandId,
        command,
        status: 'accepted',
        acknowledgedAt: new Date().toISOString(),
    };
}
function rejectedAck(commandId, command, code, message) {
    return {
        commandId,
        command,
        status: 'rejected',
        acknowledgedAt: new Date().toISOString(),
        error: {
            code,
            message,
        },
    };
}
function resolveAck(command, ack) {
    return payload => {
        if (!ack) {
            logger.warn({ command, ackPayload: payload }, 'Missing acknowledgement callback for command');
            return;
        }
        ack(payload);
    };
}
function parseSocketAuth(auth) {
    if (!auth || typeof auth !== 'object') {
        return null;
    }
    const candidate = auth;
    const sessionId = candidate.sessionId;
    const token = candidate.token;
    if (typeof sessionId !== 'string' || sessionId.length === 0) {
        return null;
    }
    if (typeof token !== 'string' || token.length === 0) {
        return null;
    }
    return {
        sessionId,
        token,
    };
}
function toHandshakeError(code, message) {
    const error = new Error(message);
    error.data = {
        code,
        message,
    };
    return error;
}
export class SessionSocketIoGateway {
    deps;
    sessionStates = new Map();
    io;
    namespace;
    constructor(deps) {
        this.deps = deps;
    }
    attachToHttpServer(server) {
        const io = new Server(server, {
            path: '/socket.io',
            cors: {
                origin: '*',
            },
        });
        const namespace = io.of('/session');
        namespace.use((socket, next) => {
            const auth = parseSocketAuth(socket.handshake.auth);
            if (!auth) {
                next(toHandshakeError('AUTH_INVALID', 'Handshake auth must include token and sessionId'));
                return;
            }
            if (!this.deps.registry.verifySessionToken(auth.sessionId, auth.token)) {
                next(toHandshakeError('AUTH_INVALID_TOKEN', 'Invalid or expired session token'));
                return;
            }
            const sessionEntry = this.deps.registry.getSession(auth.sessionId);
            if (!sessionEntry) {
                next(toHandshakeError('SESSION_NOT_FOUND', 'Session not found'));
                return;
            }
            socket.data.auth = auth;
            next();
        });
        namespace.on('connection', (socket) => {
            void this.handleConnection(socket);
        });
        this.io = io;
        this.namespace = namespace;
    }
    close() {
        for (const state of this.sessionStates.values()) {
            state.eventHubUnsubscribe?.();
        }
        this.sessionStates.clear();
        this.io?.close();
        this.io = undefined;
        this.namespace = undefined;
    }
    handleSessionExpired(sessionId, reason) {
        const state = this.sessionStates.get(sessionId);
        if (!state) {
            return;
        }
        this.namespace?.to(sessionId).disconnectSockets(true);
        this.cleanupState(sessionId);
        logger.info({ sessionId, reason }, 'Session Socket.IO state cleaned up after expiry');
    }
    async handleConnection(socket) {
        const sessionId = socket.data.auth.sessionId;
        const entry = this.deps.registry.getSession(sessionId);
        if (!entry) {
            socket.emit('assistant.error', buildSessionEvent('assistant.error', sessionId, {
                errorMessage: 'Session not found',
                errorCode: 'SESSION_NOT_FOUND',
            }));
            socket.disconnect(true);
            return;
        }
        let state = this.sessionStates.get(sessionId);
        if (!state) {
            state = {
                controllerSocketId: socket.id,
            };
            state.eventHubUnsubscribe = this.deps.eventHub.subscribe(sessionId, event => {
                this.namespace?.to(sessionId).emit(event.type, event);
            });
            this.sessionStates.set(sessionId, state);
        }
        if (state.controllerSocketId !== socket.id) {
            const previousController = this.namespace?.sockets.get(state.controllerSocketId);
            state.controllerSocketId = socket.id;
            if (previousController) {
                previousController.disconnect(true);
            }
        }
        socket.join(sessionId);
        socket.emit('session.snapshot', buildSessionEvent('session.snapshot', sessionId, buildSnapshotPayload(entry)));
        socket.on('prompt.send', (payload, ack) => {
            void this.handlePromptSend(socket, payload, ack);
        });
        socket.on('prompt.cancel', (payload, ack) => {
            this.handlePromptCancel(socket, payload, ack);
        });
        socket.on('question.answer', (payload, ack) => {
            this.handleQuestionAnswer(socket, payload, ack);
        });
        socket.on('session.update', (payload, ack) => {
            void this.handleSessionUpdate(socket, payload, ack);
        });
        socket.on('disconnect', () => {
            void this.handleDisconnect(socket);
        });
    }
    ensureActiveController(socket, command, commandId, ack) {
        const sessionId = socket.data.auth.sessionId;
        const state = this.sessionStates.get(sessionId);
        const sendAck = resolveAck(command, ack);
        if (!state || state.controllerSocketId !== socket.id) {
            sendAck(rejectedAck(commandId, command, 'NOT_ACTIVE_CONTROLLER', 'Socket is not the active controller for this session'));
            return false;
        }
        return true;
    }
    async handlePromptSend(socket, payload, ack) {
        const sendAck = resolveAck('prompt.send', ack);
        const parsed = PromptSendPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            sendAck(rejectedAck('invalid', 'prompt.send', 'INVALID_PAYLOAD', 'Invalid prompt.send payload'));
            return;
        }
        const { commandId, content } = parsed.data;
        if (!this.ensureActiveController(socket, 'prompt.send', commandId, ack)) {
            return;
        }
        const sessionId = socket.data.auth.sessionId;
        const state = this.sessionStates.get(sessionId);
        const entry = this.deps.registry.getSession(sessionId);
        if (!state || !entry) {
            sendAck(rejectedAck(commandId, 'prompt.send', 'SESSION_NOT_FOUND', 'Session is no longer available'));
            return;
        }
        const prompt = content.trim();
        if (!prompt) {
            sendAck(rejectedAck(commandId, 'prompt.send', 'PROMPT_EMPTY', 'Prompt content cannot be empty'));
            return;
        }
        if (entry.session.inFlightTurn) {
            sendAck(rejectedAck(commandId, 'prompt.send', 'TURN_ALREADY_IN_FLIGHT', 'An assistant turn is already in progress for this session'));
            return;
        }
        sendAck(acceptedAck(commandId, 'prompt.send'));
        try {
            await entry.session.promptInteractive(prompt);
        }
        catch (error) {
            this.deps.eventHub.publish(sessionId, buildSessionEvent('assistant.error', sessionId, {
                errorMessage: error instanceof Error ? error.message : String(error),
                errorCode: 'PROMPT_SEND_FAILED',
            }));
        }
    }
    handlePromptCancel(socket, payload, ack) {
        const sendAck = resolveAck('prompt.cancel', ack);
        const parsed = PromptCancelPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            sendAck(rejectedAck('invalid', 'prompt.cancel', 'INVALID_PAYLOAD', 'Invalid prompt.cancel payload'));
            return;
        }
        const { commandId } = parsed.data;
        if (!this.ensureActiveController(socket, 'prompt.cancel', commandId, ack)) {
            return;
        }
        const sessionId = socket.data.auth.sessionId;
        const state = this.sessionStates.get(sessionId);
        const entry = this.deps.registry.getSession(sessionId);
        if (!state || !entry) {
            sendAck(rejectedAck(commandId, 'prompt.cancel', 'SESSION_NOT_FOUND', 'Session is no longer available'));
            return;
        }
        if (!entry.session.inFlightTurn) {
            sendAck(rejectedAck(commandId, 'prompt.cancel', 'TURN_NOT_IN_FLIGHT', 'No assistant turn is currently in progress'));
            return;
        }
        entry.session.abort();
        sendAck(acceptedAck(commandId, 'prompt.cancel'));
    }
    handleQuestionAnswer(socket, payload, ack) {
        const sendAck = resolveAck('question.answer', ack);
        const parsed = QuestionAnswerPayloadSchema.safeParse(payload);
        if (!parsed.success) {
            sendAck(rejectedAck('invalid', 'question.answer', 'INVALID_PAYLOAD', 'Invalid question.answer payload'));
            return;
        }
        const { commandId, questionId, answers } = parsed.data;
        if (!this.ensureActiveController(socket, 'question.answer', commandId, ack)) {
            return;
        }
        const sessionId = socket.data.auth.sessionId;
        const entry = this.deps.registry.getSession(sessionId);
        if (!entry) {
            sendAck(rejectedAck(commandId, 'question.answer', 'SESSION_NOT_FOUND', 'Session is no longer available'));
            return;
        }
        const resolution = this.deps.requestHub.resolve(sessionId, questionId, answers);
        if (!resolution.resolved) {
            sendAck(rejectedAck(commandId, 'question.answer', 'QUESTION_NOT_PENDING', `No pending question with id '${questionId}'`));
            return;
        }
        sendAck(acceptedAck(commandId, 'question.answer'));
    }
    async handleSessionUpdate(socket, payload, ack) {
        const sendAck = resolveAck('session.update', ack);
        const parsed = SessionUpdatePayloadSchema.safeParse(payload);
        if (!parsed.success) {
            sendAck(rejectedAck('invalid', 'session.update', 'INVALID_PAYLOAD', 'Invalid session.update payload'));
            return;
        }
        const { commandId, sessionInfo } = parsed.data;
        if (!this.ensureActiveController(socket, 'session.update', commandId, ack)) {
            return;
        }
        const sessionId = socket.data.auth.sessionId;
        const entry = this.deps.registry.getSession(sessionId);
        if (!entry) {
            sendAck(rejectedAck(commandId, 'session.update', 'SESSION_NOT_FOUND', 'Session is no longer available'));
            return;
        }
        const sanitized = sanitizeSessionInfoUpdate(sessionInfo);
        await entry.session.updateContext(sanitized);
        this.deps.eventHub.publish(sessionId, buildSessionEvent('session.updated', sessionId, toSessionInfoResponse(sessionId, {
            tenantId: entry.session.sessionContext.tenantId,
            groupId: entry.session.sessionContext.groupId,
            entityType: entry.session.sessionContext.entityType,
            app: entry.session.sessionContext.app,
        })));
        sendAck(acceptedAck(commandId, 'session.update'));
    }
    async handleDisconnect(socket) {
        const sessionId = socket.data.auth.sessionId;
        const state = this.sessionStates.get(sessionId);
        if (!state || state.controllerSocketId !== socket.id) {
            return;
        }
        state.controllerSocketId = '';
        const entry = this.deps.registry.getSession(sessionId);
        if (!entry?.session.inFlightTurn) {
            return;
        }
        entry.session.abort();
        this.deps.eventHub.publish(sessionId, buildSessionEvent('assistant.error', sessionId, {
            errorMessage: 'Active controller disconnected during an in-flight turn. Session expired; bootstrap a fresh session to continue.',
            errorCode: 'CONTROLLER_DISCONNECTED_SESSION_EXPIRED',
        }));
        await this.deps.registry.removeSessionBySessionId(sessionId, 'controller_disconnect');
        this.cleanupState(sessionId);
    }
    cleanupState(sessionId) {
        const state = this.sessionStates.get(sessionId);
        if (!state) {
            return;
        }
        state.eventHubUnsubscribe?.();
        this.sessionStates.delete(sessionId);
    }
}
//# sourceMappingURL=session-socketio-gateway.js.map