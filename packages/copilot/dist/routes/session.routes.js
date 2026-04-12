import { createSessionAgent } from '../agent/agent-factory.js';
import { getProfile } from '../agent/profiles.js';
import { createWsEventBridge } from '../agent/ws-event-bridge.js';
import { createLogger } from '../config/app-config.js';
import { createAudakoServices } from '../services/audako-services.js';
import { UpstreamAuthError, validateUpstreamToken } from '../services/auth-validator.js';
import { ChildSessionExecutor } from '../services/child-session-executor.js';
import { ChildSessionManager } from '../services/child-session-runtime.js';
import { DefaultPermissionService } from '../services/permission-service.js';
import { SessionContext } from '../services/session-context.js';
import { buildSessionEvent } from '../services/session-event-utils.js';
import { sanitizeSessionInfoUpdate, toSessionInfoResponse, } from '../services/session-info-utils.js';
import { ToolRequestHub } from '../services/tool-request-hub.js';
import { InteractiveSession } from '../session/interactive-session.js';
const logger = createLogger('session-routes');
export function registerSessionRoutes(app, deps) {
    const { registry, eventHub, requestHub, sessionTodoStore } = deps;
    const childSessionManager = new ChildSessionManager(registry, eventHub);
    const toolRequestHub = new ToolRequestHub(requestHub, eventHub);
    const permissionService = new DefaultPermissionService(registry, toolRequestHub);
    const childSessionExecutor = new ChildSessionExecutor({
        registry,
        eventHub,
        childSessionManager,
        requestHub: toolRequestHub,
        permissionService,
        sessionTodoStore,
    });
    registry.onSessionRemoved(entry => {
        permissionService.clearSession(entry.sessionId);
        childSessionManager.cancelChildSessionsForParent(entry.sessionId, 'parent_session_removed');
    });
    // ── Route map ────────────────────────────────────────────────────────
    app.post('/api/session/bootstrap', handleBootstrap);
    app.get('/api/session/:sessionId/info', handleGetSessionInfo);
    // ── Helpers ──────────────────────────────────────────────────────────
    function normalizeScadaUrl(value) {
        const trimmed = value.trim();
        try {
            const parsed = new URL(trimmed);
            const path = parsed.pathname.replace(/\/+$/, '');
            return parsed.origin + (path === '/' ? '' : path);
        }
        catch {
            return trimmed.replace(/\/+$/, '');
        }
    }
    function toSessionInfoSnapshot(tenantId, groupId, entityType, app) {
        return {
            tenantId,
            groupId,
            entityType,
            app,
            updatedAt: new Date().toISOString(),
        };
    }
    function unauthorized(context, message) {
        const payload = {
            error: 'Unauthorized',
            message,
        };
        return context.json(payload, 401);
    }
    function requireSessionAuth(context, sessionId) {
        const authHeader = context.req.header('authorization');
        if (!authHeader) {
            return unauthorized(context, 'Authorization header required');
        }
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        if (!match) {
            return unauthorized(context, 'Invalid authorization format');
        }
        const token = match[1];
        if (!registry.verifySessionToken(sessionId, token)) {
            return unauthorized(context, 'Invalid session token');
        }
        return null;
    }
    // ── Handlers ─────────────────────────────────────────────────────────
    async function handleBootstrap(context) {
        let body;
        try {
            body = await context.req.json();
        }
        catch {
            return context.json({
                error: 'Bad Request',
                message: 'Invalid JSON body',
            }, 400);
        }
        const { scadaUrl, accessToken, sessionInfo } = body;
        const normalizedScadaUrl = scadaUrl ? normalizeScadaUrl(scadaUrl) : undefined;
        const normalizedAccessToken = accessToken?.trim();
        if (!normalizedScadaUrl || !normalizedAccessToken) {
            return context.json({
                error: 'Bad Request',
                message: 'scadaUrl and accessToken are required',
            }, 400);
        }
        logger.info({
            scadaUrl: normalizedScadaUrl,
            hasSessionInfo: Boolean(sessionInfo),
        }, 'Bootstrap request received');
        // Validate upstream token before provisioning.
        try {
            await validateUpstreamToken(normalizedScadaUrl, normalizedAccessToken);
        }
        catch (authError) {
            if (authError instanceof UpstreamAuthError) {
                logger.warn({ scadaUrl: normalizedScadaUrl, statusCode: authError.statusCode }, 'Bootstrap upstream auth failed');
                return context.json({
                    error: authError.statusCode === 403 ? 'Forbidden' : 'Unauthorized',
                    message: authError.message,
                }, authError.statusCode === 403 ? 403 : 401);
            }
            throw authError;
        }
        try {
            const { entry, isNew, sessionToken } = await registry.getOrCreateSession(normalizedScadaUrl, normalizedAccessToken, async (sessionId) => {
                // Create audako services
                const audakoServices = await createAudakoServices(normalizedScadaUrl, normalizedAccessToken);
                // Create session context and bind services for resolution
                const sessionContext = new SessionContext({
                    sessionId,
                    scadaUrl: normalizedScadaUrl,
                    accessToken: normalizedAccessToken,
                    tenantId: sessionInfo?.tenantId,
                    groupId: sessionInfo?.groupId,
                    entityType: sessionInfo?.entityType,
                    app: sessionInfo?.app,
                });
                sessionContext.bindServices(audakoServices);
                const { agent, destroy: agentDestroy } = await createSessionAgent({
                    sessionContext,
                    audakoServices,
                    eventHub,
                    requestHub: toolRequestHub,
                    permissionService,
                    sessionTodoStore,
                    childSessionExecutor,
                    profile: getProfile('primary'),
                });
                const eventBridgeUnsubscribe = createWsEventBridge(agent, sessionId, eventHub);
                const session = new InteractiveSession({
                    sessionId,
                    agent,
                    destroyAgent: agentDestroy,
                    sessionContext,
                    audakoServices,
                    eventBridgeUnsubscribe,
                });
                return { session };
            });
            // Update session info if provided
            if (sessionInfo && !isNew) {
                const sanitized = sanitizeSessionInfoUpdate(sessionInfo);
                await entry.session.updateContext(sanitized);
                eventHub.publish(entry.sessionId, buildSessionEvent('session.updated', entry.sessionId, toSessionInfoResponse(entry.sessionId, {
                    tenantId: entry.session.sessionContext.tenantId,
                    groupId: entry.session.sessionContext.groupId,
                    entityType: entry.session.sessionContext.entityType,
                    app: entry.session.sessionContext.app,
                })));
            }
            const response = {
                sessionId: entry.sessionId,
                isNew,
                scadaUrl: entry.scadaUrl,
                sessionInfo: toSessionInfoSnapshot(entry.session.sessionContext.tenantId, entry.session.sessionContext.groupId, entry.session.sessionContext.entityType, entry.session.sessionContext.app),
                realtime: {
                    transport: 'socket.io',
                    protocolVersion: 'v1',
                    namespace: '/session',
                    path: '/socket.io',
                    auth: {
                        type: 'session_token',
                        token: sessionToken,
                    },
                    room: {
                        type: 'session',
                        id: entry.sessionId,
                    },
                },
            };
            logger.info({
                scadaUrl: entry.scadaUrl,
                sessionId: entry.sessionId,
                isNew,
            }, 'Bootstrap request resolved');
            return context.json(response);
        }
        catch (error) {
            logger.error({
                scadaUrl: normalizedScadaUrl,
                error: error instanceof Error ? error.message : String(error),
            }, 'Bootstrap request failed');
            return context.json({
                error: 'Failed to bootstrap chat session',
                message: error instanceof Error ? error.message : String(error),
            }, 500);
        }
    }
    async function handleGetSessionInfo(context) {
        const sessionId = context.req.param('sessionId');
        if (!sessionId) {
            return context.json({
                error: 'Bad Request',
                message: 'sessionId is required',
            }, 400);
        }
        const authResponse = requireSessionAuth(context, sessionId);
        if (authResponse) {
            return authResponse;
        }
        const entry = registry.getSession(sessionId);
        if (!entry) {
            return context.json({
                error: 'Not Found',
                message: `Session not found: ${sessionId}`,
            }, 404);
        }
        return context.json(toSessionInfoResponse(sessionId, {
            tenantId: entry.session.sessionContext.tenantId,
            groupId: entry.session.sessionContext.groupId,
            entityType: entry.session.sessionContext.entityType,
            app: entry.session.sessionContext.app,
        }));
    }
}
//# sourceMappingURL=session.routes.js.map