import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import Fastify from 'fastify';
import { appConfig, createLogger } from './config/index.js';
import { healthRoutes } from './routes/health.routes.js';
import { sessionRoutes } from './routes/session.routes.js';
import { SessionEventHub } from './services/session-event-hub.js';
import { SessionRegistry } from './services/session-registry.js';
import { SessionRequestHub } from './services/session-request-hub.js';

const logger = createLogger('server');

export async function createServer() {
  const fastify = Fastify({
    logger: { level: appConfig.logLevel },
  });

  await fastify.register(cors, {
    origin: true,
  });

  await fastify.register(websocket);

  // Initialize services
  const sessionRegistry = new SessionRegistry(appConfig.session.idleTimeout);
  const sessionEventHub = new SessionEventHub();
  const sessionRequestHub = new SessionRequestHub();

  sessionRegistry.onSessionRemoved((entry, reason) => {
    sessionRequestHub.cancelSession(entry.sessionId);
    sessionEventHub.closeSession(entry.sessionId, reason);
  });

  // Register routes
  await healthRoutes(fastify, sessionRegistry);
  await sessionRoutes(fastify, sessionRegistry, sessionEventHub, sessionRequestHub);

  // Start cleanup task
  sessionRegistry.startCleanupTask(900000); // 15 minutes

  // Graceful shutdown
  const shutdownHandler = async () => {
    logger.info('Shutting down server...');
    sessionRegistry.stopCleanupTask();
    // Cancel all pending requests for all sessions
    const allSessions = sessionRegistry.getAllSessions();
    for (const session of allSessions) {
      sessionRequestHub.cancelSession(session.sessionId);
    }
    sessionEventHub.closeAll();
    await sessionRegistry.removeAllSessions();
    await fastify.close();
    logger.info('Server shut down complete');
    process.exit(0);
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  return fastify;
}
