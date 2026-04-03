import { serve } from '@hono/node-server';
import { type Context, Hono, type Next } from 'hono';
import { cors } from 'hono/cors';
import { appConfig, createLogger } from './config/app-config.js';
import { SessionSocketIoGateway } from './gateway/session-socketio-gateway.js';
import { registerSessionRoutes } from './routes/session.routes.js';
import { SessionEventHub } from './services/session-event-hub.js';
import { SessionRegistry } from './services/session-registry.js';
import { SessionRequestHub } from './services/session-request-hub.js';

const logger = createLogger('server');

type NodeLikeServer = {
  close: (callback: (error?: Error) => void) => void;
};

interface ServerStartOptions {
  host: string;
  port: number;
}

export interface CopilotServer {
  readonly app: Hono;
  start: (options: ServerStartOptions) => Promise<void>;
  shutdown: () => Promise<void>;
}

export async function createServer(): Promise<CopilotServer> {
  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: appConfig.cors.origins.length === 0 || appConfig.cors.origins.includes('*') ? '*' : appConfig.cors.origins,
    }),
  );

  app.use('*', async (context: Context, next: Next) => {
    const startedAt = Date.now();
    await next();

    logger.info(
      {
        method: context.req.method,
        path: context.req.path,
        statusCode: context.res.status,
        durationMs: Date.now() - startedAt,
      },
      'HTTP request handled',
    );
  });

  // Initialize services
  const sessionRegistry = new SessionRegistry(appConfig.session.idleTimeout);
  const sessionEventHub = new SessionEventHub();
  const sessionRequestHub = new SessionRequestHub();
  const sessionSocketGateway = new SessionSocketIoGateway({
    registry: sessionRegistry,
    eventHub: sessionEventHub,
    requestHub: sessionRequestHub,
  });

  sessionRegistry.onSessionRemoved((entry, reason) => {
    sessionRequestHub.cancelSession(entry.sessionId);
    sessionEventHub.closeSession(entry.sessionId, reason);
    sessionSocketGateway.handleSessionExpired(entry.sessionId, reason);
  });

  app.get('/health', (context: Context) => {
    return context.json({
      status: 'ok' as const,
      activeSessions: sessionRegistry.getActiveSessionCount(),
      timestamp: new Date().toISOString(),
    });
  });

  registerSessionRoutes(app, {
    registry: sessionRegistry,
    eventHub: sessionEventHub,
    requestHub: sessionRequestHub,
  });

  // Start cleanup task
  sessionRegistry.startCleanupTask(900000); // 15 minutes

  let nodeServer: NodeLikeServer | undefined;
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
      await new Promise<void>((resolve, reject) => {
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
    async start(options: ServerStartOptions) {
      nodeServer = serve({
        fetch: app.fetch,
        port: options.port,
        hostname: options.host,
      });

      sessionSocketGateway.attachToHttpServer(nodeServer as unknown as import('node:http').Server);
    },
    shutdown,
  };
}
