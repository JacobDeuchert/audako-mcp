import type { Server as HttpServer } from 'node:http';
import {
  type CommandAcknowledgementPayload,
  type CommandName,
  type PromptCancelPayload,
  PromptCancelPayloadSchema,
  type PromptSendPayload,
  PromptSendPayloadSchema,
  type QuestionAnswerPayload,
  QuestionAnswerPayloadSchema,
  type SessionSnapshotPayload,
  type SessionUpdatePayload,
  SessionUpdatePayloadSchema,
} from '@audako/contracts';
import { type Namespace, Server, type Socket } from 'socket.io';
import { createLogger } from '../config/app-config.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import { buildSessionEvent } from '../services/session-event-utils.js';
import {
  sanitizeSessionInfoUpdate,
  toSessionInfoResponse,
} from '../services/session-info-utils.js';
import type { SessionRegistry, SessionRegistryEntry } from '../services/session-registry.js';
import type { SessionRequestHub } from '../services/session-request-hub.js';

const logger = createLogger('session-socketio-gateway');

interface SocketAuthPayload {
  sessionId: string;
  token: string;
}

interface SessionOwnershipState {
  controllerSocketId: string;
  eventHubUnsubscribe?: () => void;
}

interface AuthenticatedSocketData {
  auth: SocketAuthPayload;
}

type SessionSocket = Socket & {
  data: AuthenticatedSocketData;
};

type AcknowledgementCallback = (ack: CommandAcknowledgementPayload) => void;

export interface SessionSocketIoGatewayDeps {
  registry: SessionRegistry;
  eventHub: SessionEventHub;
  requestHub: SessionRequestHub;
}

function buildSnapshotPayload(entry: SessionRegistryEntry): SessionSnapshotPayload {
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

function acceptedAck(commandId: string, command: CommandName): CommandAcknowledgementPayload {
  return {
    commandId,
    command,
    status: 'accepted',
    acknowledgedAt: new Date().toISOString(),
  };
}

function rejectedAck(
  commandId: string,
  command: CommandName,
  code: string,
  message: string,
): CommandAcknowledgementPayload {
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

function resolveAck(command: CommandName, ack?: AcknowledgementCallback): AcknowledgementCallback {
  return payload => {
    if (!ack) {
      logger.warn({ command, ackPayload: payload }, 'Missing acknowledgement callback for command');
      return;
    }

    ack(payload);
  };
}

function parseSocketAuth(auth: unknown): SocketAuthPayload | null {
  if (!auth || typeof auth !== 'object') {
    return null;
  }

  const candidate = auth as Record<string, unknown>;
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

function toHandshakeError(code: string, message: string): Error & { data?: unknown } {
  const error = new Error(message) as Error & { data?: unknown };
  error.data = {
    code,
    message,
  };
  return error;
}

export class SessionSocketIoGateway {
  private readonly sessionStates = new Map<string, SessionOwnershipState>();
  private io?: Server;
  private namespace?: Namespace;

  constructor(private readonly deps: SessionSocketIoGatewayDeps) {}

  attachToHttpServer(server: HttpServer): void {
    const io = new Server(server, {
      path: '/socket.io',
      cors: {
        origin: '*',
      },
    });

    const namespace = io.of('/session');

    namespace.use((socket: Socket, next: (error?: Error) => void) => {
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

      (socket as SessionSocket).data.auth = auth;
      next();
    });

    namespace.on('connection', (socket: Socket) => {
      void this.handleConnection(socket as SessionSocket);
    });

    this.io = io;
    this.namespace = namespace;
  }

  close(): void {
    for (const state of this.sessionStates.values()) {
      state.eventHubUnsubscribe?.();
    }

    this.sessionStates.clear();
    this.io?.close();
    this.io = undefined;
    this.namespace = undefined;
  }

  handleSessionExpired(sessionId: string, reason: string): void {
    const state = this.sessionStates.get(sessionId);
    if (!state) {
      return;
    }

    this.namespace?.to(sessionId).disconnectSockets(true);
    this.cleanupState(sessionId);

    logger.info({ sessionId, reason }, 'Session Socket.IO state cleaned up after expiry');
  }

  private async handleConnection(socket: SessionSocket): Promise<void> {
    const sessionId = socket.data.auth.sessionId;
    const entry = this.deps.registry.getSession(sessionId);
    if (!entry) {
      socket.emit(
        'assistant.error',
        buildSessionEvent('assistant.error', sessionId, {
          errorMessage: 'Session not found',
          errorCode: 'SESSION_NOT_FOUND',
        }),
      );
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
    socket.emit(
      'session.snapshot',
      buildSessionEvent('session.snapshot', sessionId, buildSnapshotPayload(entry)),
    );

    socket.on('prompt.send', (payload: unknown, ack?: AcknowledgementCallback) => {
      void this.handlePromptSend(socket, payload, ack);
    });
    socket.on('prompt.cancel', (payload: unknown, ack?: AcknowledgementCallback) => {
      this.handlePromptCancel(socket, payload, ack);
    });
    socket.on('question.answer', (payload: unknown, ack?: AcknowledgementCallback) => {
      this.handleQuestionAnswer(socket, payload, ack);
    });
    socket.on('session.update', (payload: unknown, ack?: AcknowledgementCallback) => {
      void this.handleSessionUpdate(socket, payload, ack);
    });
    socket.on('disconnect', () => {
      void this.handleDisconnect(socket);
    });
  }

  private ensureActiveController(
    socket: SessionSocket,
    command: CommandName,
    commandId: string,
    ack?: AcknowledgementCallback,
  ): boolean {
    const sessionId = socket.data.auth.sessionId;
    const state = this.sessionStates.get(sessionId);
    const sendAck = resolveAck(command, ack);

    if (!state || state.controllerSocketId !== socket.id) {
      sendAck(
        rejectedAck(
          commandId,
          command,
          'NOT_ACTIVE_CONTROLLER',
          'Socket is not the active controller for this session',
        ),
      );
      return false;
    }

    return true;
  }

  private async handlePromptSend(
    socket: SessionSocket,
    payload: unknown,
    ack?: AcknowledgementCallback,
  ): Promise<void> {
    const sendAck = resolveAck('prompt.send', ack);
    const parsed = PromptSendPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      sendAck(
        rejectedAck('invalid', 'prompt.send', 'INVALID_PAYLOAD', 'Invalid prompt.send payload'),
      );
      return;
    }

    const { commandId, content }: PromptSendPayload = parsed.data;
    if (!this.ensureActiveController(socket, 'prompt.send', commandId, ack)) {
      return;
    }

    const sessionId = socket.data.auth.sessionId;
    const state = this.sessionStates.get(sessionId);
    const entry = this.deps.registry.getSession(sessionId);
    if (!state || !entry) {
      sendAck(
        rejectedAck(
          commandId,
          'prompt.send',
          'SESSION_NOT_FOUND',
          'Session is no longer available',
        ),
      );
      return;
    }

    const prompt = content.trim();
    if (!prompt) {
      sendAck(
        rejectedAck(commandId, 'prompt.send', 'PROMPT_EMPTY', 'Prompt content cannot be empty'),
      );
      return;
    }

    if (entry.session.inFlightTurn) {
      sendAck(
        rejectedAck(
          commandId,
          'prompt.send',
          'TURN_ALREADY_IN_FLIGHT',
          'An assistant turn is already in progress for this session',
        ),
      );
      return;
    }

    sendAck(acceptedAck(commandId, 'prompt.send'));

    try {
      await entry.session.promptInteractive(prompt);
    } catch (error) {
      this.deps.eventHub.publish(
        sessionId,
        buildSessionEvent('assistant.error', sessionId, {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode: 'PROMPT_SEND_FAILED',
        }),
      );
    }
  }

  private handlePromptCancel(
    socket: SessionSocket,
    payload: unknown,
    ack?: AcknowledgementCallback,
  ): void {
    const sendAck = resolveAck('prompt.cancel', ack);
    const parsed = PromptCancelPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      sendAck(
        rejectedAck('invalid', 'prompt.cancel', 'INVALID_PAYLOAD', 'Invalid prompt.cancel payload'),
      );
      return;
    }

    const { commandId }: PromptCancelPayload = parsed.data;
    if (!this.ensureActiveController(socket, 'prompt.cancel', commandId, ack)) {
      return;
    }

    const sessionId = socket.data.auth.sessionId;
    const state = this.sessionStates.get(sessionId);
    const entry = this.deps.registry.getSession(sessionId);
    if (!state || !entry) {
      sendAck(
        rejectedAck(
          commandId,
          'prompt.cancel',
          'SESSION_NOT_FOUND',
          'Session is no longer available',
        ),
      );
      return;
    }

    if (!entry.session.inFlightTurn) {
      sendAck(
        rejectedAck(
          commandId,
          'prompt.cancel',
          'TURN_NOT_IN_FLIGHT',
          'No assistant turn is currently in progress',
        ),
      );
      return;
    }

    entry.session.abort();
    sendAck(acceptedAck(commandId, 'prompt.cancel'));
  }

  private handleQuestionAnswer(
    socket: SessionSocket,
    payload: unknown,
    ack?: AcknowledgementCallback,
  ): void {
    const sendAck = resolveAck('question.answer', ack);
    const parsed = QuestionAnswerPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      sendAck(
        rejectedAck(
          'invalid',
          'question.answer',
          'INVALID_PAYLOAD',
          'Invalid question.answer payload',
        ),
      );
      return;
    }

    const { commandId, questionId, answers }: QuestionAnswerPayload = parsed.data;
    if (!this.ensureActiveController(socket, 'question.answer', commandId, ack)) {
      return;
    }

    const sessionId = socket.data.auth.sessionId;
    const entry = this.deps.registry.getSession(sessionId);
    if (!entry) {
      sendAck(
        rejectedAck(
          commandId,
          'question.answer',
          'SESSION_NOT_FOUND',
          'Session is no longer available',
        ),
      );
      return;
    }

    const resolution = this.deps.requestHub.resolve(sessionId, questionId, answers);
    if (!resolution.resolved) {
      sendAck(
        rejectedAck(
          commandId,
          'question.answer',
          'QUESTION_NOT_PENDING',
          `No pending question with id '${questionId}'`,
        ),
      );
      return;
    }

    sendAck(acceptedAck(commandId, 'question.answer'));
  }

  private async handleSessionUpdate(
    socket: SessionSocket,
    payload: unknown,
    ack?: AcknowledgementCallback,
  ): Promise<void> {
    const sendAck = resolveAck('session.update', ack);
    const parsed = SessionUpdatePayloadSchema.safeParse(payload);

    if (!parsed.success) {
      sendAck(
        rejectedAck(
          'invalid',
          'session.update',
          'INVALID_PAYLOAD',
          'Invalid session.update payload',
        ),
      );
      return;
    }

    const { commandId, sessionInfo }: SessionUpdatePayload = parsed.data;
    if (!this.ensureActiveController(socket, 'session.update', commandId, ack)) {
      return;
    }

    const sessionId = socket.data.auth.sessionId;
    const entry = this.deps.registry.getSession(sessionId);
    if (!entry) {
      sendAck(
        rejectedAck(
          commandId,
          'session.update',
          'SESSION_NOT_FOUND',
          'Session is no longer available',
        ),
      );
      return;
    }

    const sanitized = sanitizeSessionInfoUpdate(sessionInfo);
    await entry.session.updateContext(sanitized);
    this.deps.eventHub.publish(
      sessionId,
      buildSessionEvent(
        'session.updated',
        sessionId,
        toSessionInfoResponse(sessionId, {
          tenantId: entry.session.sessionContext.tenantId,
          groupId: entry.session.sessionContext.groupId,
          entityType: entry.session.sessionContext.entityType,
          app: entry.session.sessionContext.app,
        }),
      ),
    );

    sendAck(acceptedAck(commandId, 'session.update'));
  }

  private async handleDisconnect(socket: SessionSocket): Promise<void> {
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

    this.deps.eventHub.publish(
      sessionId,
      buildSessionEvent('assistant.error', sessionId, {
        errorMessage:
          'Active controller disconnected during an in-flight turn. Session expired; bootstrap a fresh session to continue.',
        errorCode: 'CONTROLLER_DISCONNECTED_SESSION_EXPIRED',
      }),
    );

    await this.deps.registry.removeSessionBySessionId(sessionId, 'controller_disconnect');
    this.cleanupState(sessionId);
  }

  private cleanupState(sessionId: string): void {
    const state = this.sessionStates.get(sessionId);
    if (!state) {
      return;
    }

    state.eventHubUnsubscribe?.();
    this.sessionStates.delete(sessionId);
  }
}
