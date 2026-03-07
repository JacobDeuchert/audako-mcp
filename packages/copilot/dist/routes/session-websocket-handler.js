import { isBridgeSessionWebSocketClientMessage, } from '@audako/contracts';
import { createLogger } from '../config/app-config.js';
import { buildSessionEvent } from '../services/session-event-utils.js';
import { sanitizeSessionInfoUpdate, toSessionInfoResponse, } from '../services/session-info-utils.js';
const logger = createLogger('session-websocket-handler');
const HEARTBEAT_INTERVAL_MS = 30000;
function buildSessionSnapshotPayload(entry) {
    return {
        sessionId: entry.sessionId,
        scadaUrl: entry.scadaUrl,
        sessionInfo: {
            tenantId: entry.sessionContext.tenantId,
            groupId: entry.sessionContext.groupId,
            entityType: entry.sessionContext.entityType,
            app: entry.sessionContext.app,
            updatedAt: new Date().toISOString(),
        },
        isActive: true,
    };
}
function extractSocket(connection) {
    if (connection && typeof connection === 'object' && 'socket' in connection) {
        return connection.socket;
    }
    return connection;
}
function extractSessionToken(query) {
    if (!query || typeof query !== 'object') {
        return undefined;
    }
    const token = query.sessionToken;
    if (typeof token !== 'string') {
        return undefined;
    }
    return token;
}
function tryParseJsonObject(value) {
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
            return parsed;
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
function parseIncomingSocketMessage(rawMessage) {
    const trimmed = rawMessage.trim();
    if (!trimmed) {
        return { type: 'unknown' };
    }
    const parsed = tryParseJsonObject(trimmed);
    if (!parsed) {
        return { type: 'user_message', content: rawMessage };
    }
    if (isBridgeSessionWebSocketClientMessage(parsed)) {
        return parsed;
    }
    return { type: 'unknown' };
}
export function createSessionWebSocketHandler({ registry, eventHub, requestHub, }) {
    return function handleWebSocket(connection, request) {
        const { sessionId } = request.params;
        const socket = extractSocket(connection);
        const entry = registry.getSession(sessionId);
        if (!entry) {
            socket.close(4404, 'session_not_found');
            return;
        }
        const token = extractSessionToken(request.query);
        if (!token || !registry.verifySessionToken(sessionId, token)) {
            socket.close(4401, 'unauthorized');
            return;
        }
        eventHub.subscribe(sessionId, socket);
        try {
            socket.send(JSON.stringify(buildSessionEvent('session.snapshot', sessionId, buildSessionSnapshotPayload(entry))));
        }
        catch {
            eventHub.unsubscribe(sessionId, socket);
            socket.close(1011, 'snapshot_delivery_failed');
            return;
        }
        let isAlive = true;
        socket.on?.('message', async (data) => {
            try {
                const rawMessage = typeof data === 'string' ? data : data.toString('utf-8');
                const currentEntry = registry.getSession(sessionId);
                if (!currentEntry) {
                    return;
                }
                const message = parseIncomingSocketMessage(rawMessage);
                if (message.type === 'ping') {
                    isAlive = true;
                    try {
                        const pong = { type: 'pong' };
                        socket.send(JSON.stringify(pong));
                    }
                    catch (error) {
                        logger.warn({
                            sessionId,
                            error: error instanceof Error ? error.message : String(error),
                        }, 'Failed to send pong response');
                    }
                    return;
                }
                if (message.type === 'cancel') {
                    currentEntry.agent.abort();
                    return;
                }
                if (message.type === 'hub.response') {
                    const resolution = requestHub.resolve(sessionId, message.requestId, message.response);
                    if (!resolution.resolved) {
                        logger.warn({
                            sessionId,
                            requestId: message.requestId,
                        }, 'Ignoring hub.response for unknown request');
                        return;
                    }
                    eventHub.publish(sessionId, buildSessionEvent('hub.response', sessionId, {
                        requestId: message.requestId,
                        response: message.response,
                        respondedAt: resolution.respondedAt,
                    }));
                    return;
                }
                if (message.type === 'session.info.update') {
                    const sanitized = sanitizeSessionInfoUpdate(message.sessionInfo);
                    await currentEntry.sessionContext.update(sanitized);
                    const response = toSessionInfoResponse(currentEntry.sessionId, {
                        tenantId: currentEntry.sessionContext.tenantId,
                        groupId: currentEntry.sessionContext.groupId,
                        entityType: currentEntry.sessionContext.entityType,
                        app: currentEntry.sessionContext.app,
                    });
                    eventHub.publish(sessionId, buildSessionEvent('session.info.updated', sessionId, response));
                    return;
                }
                if (message.type === 'unknown') {
                    logger.warn({
                        sessionId,
                        rawMessage,
                    }, 'Ignoring unsupported websocket message');
                    return;
                }
                const prompt = message.content.trim();
                if (!prompt) {
                    return;
                }
                logger.info({
                    sessionId,
                    messageLength: prompt.length,
                }, 'Received message from user');
                await currentEntry.agent.prompt(prompt);
            }
            catch (error) {
                logger.error({
                    sessionId,
                    error: error instanceof Error ? error.message : String(error),
                }, 'Error handling user message');
            }
        });
        const heartbeat = setInterval(() => {
            if (!isAlive) {
                socket.close(1001, 'heartbeat_timeout');
                return;
            }
            isAlive = false;
            socket.ping?.();
        }, HEARTBEAT_INTERVAL_MS);
        const onDisconnect = () => {
            clearInterval(heartbeat);
            eventHub.unsubscribe(sessionId, socket);
        };
        socket.on?.('pong', () => {
            isAlive = true;
        });
        socket.on?.('close', onDisconnect);
        socket.on?.('error', onDisconnect);
    };
}
//# sourceMappingURL=session-websocket-handler.js.map