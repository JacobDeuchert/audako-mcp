import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { appConfig, createLogger } from './config/app-config.js';
import { SessionSocketIoGateway } from './gateway/session-socketio-gateway.js';
import { registerSessionRoutes } from './routes/session.routes.js';
import { SessionEventHub } from './services/session-event-hub.js';
import { SessionRegistry } from './services/session-registry.js';
import { SessionRequestHub } from './services/session-request-hub.js';
import { SessionTodoStore } from './services/session-todo-store.js';
const logger = createLogger('server');
export async function createServer() {
    const app = new Hono();
    app.use('*', cors({
        origin: appConfig.cors.origins.length === 0 || appConfig.cors.origins.includes('*')
            ? '*'
            : appConfig.cors.origins,
    }));
    app.use('*', async (context, next) => {
        const startedAt = Date.now();
        await next();
        logger.info({
            method: context.req.method,
            path: context.req.path,
            statusCode: context.res.status,
            durationMs: Date.now() - startedAt,
        }, 'HTTP request handled');
    });
    // Initialize services
    const sessionRegistry = new SessionRegistry(appConfig.session.idleTimeout);
    const sessionEventHub = new SessionEventHub();
    const sessionRequestHub = new SessionRequestHub();
    const sessionTodoStore = new SessionTodoStore();
    const sessionSocketGateway = new SessionSocketIoGateway({
        registry: sessionRegistry,
        eventHub: sessionEventHub,
        requestHub: sessionRequestHub,
    });
    sessionRegistry.onSessionRemoved((entry, reason) => {
        sessionRequestHub.cancelSession(entry.sessionId);
        sessionEventHub.closeSession(entry.sessionId, reason);
        sessionSocketGateway.handleSessionExpired(entry.sessionId, reason);
        sessionTodoStore.clear(entry.sessionId);
    });
    app.get('/health', (context) => {
        return context.json({
            status: 'ok',
            activeSessions: sessionRegistry.getActiveSessionCount(),
            timestamp: new Date().toISOString(),
        });
    });
    registerSessionRoutes(app, {
        registry: sessionRegistry,
        eventHub: sessionEventHub,
        requestHub: sessionRequestHub,
        sessionTodoStore,
    });
    // Start cleanup task
    sessionRegistry.startCleanupTask(900000); // 15 minutes
    let nodeServer;
    let isShuttingDown = false;
    const shutdown = async () => {
        if (isShuttingDown) {
            return;
        }
        isShuttingDown = true;
        logger.info('Shutting down server...');
        sessionRegistry.stopCleanupTask();
        // Cancel all pending requests for all sessions
        const allSessions = sessionRegistry.getAllSessions();
        for (const session of allSessions) {
            sessionRequestHub.cancelSession(session.sessionId);
        }
        sessionEventHub.closeAll();
        sessionSocketGateway.close();
        await sessionRegistry.removeAllSessions();
        if (nodeServer) {
            await new Promise((resolve, reject) => {
                nodeServer?.close(error => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        }
        logger.info('Server shut down complete');
    };
    return {
        app,
        async start(options) {
            nodeServer = serve({
                fetch: app.fetch,
                port: options.port,
                hostname: options.host,
            });
            sessionSocketGateway.attachToHttpServer(nodeServer);
        },
        shutdown,
    };
}
//# sourceMappingURL=server.js.map