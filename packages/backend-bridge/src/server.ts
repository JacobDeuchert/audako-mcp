import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { pino } from 'pino';
import { appConfig } from './config/index.js';
import { PortAllocator } from './services/port-allocator.js';
import { ServerRegistry } from './services/server-registry.js';
import { OpencodeFactory } from './services/opencode-factory.js';
import { SessionEventHub } from './services/session-event-hub.js';
import { SessionRequestHub } from './services/session-request-hub.js';
import { healthRoutes } from './routes/health.routes.js';
import { sessionRoutes } from './routes/session.routes.js';

const logger = pino({
  name: 'backend-bridge',
  level: appConfig.logLevel,
});

export async function createServer() {
  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: appConfig.logLevel,
    },
  });

  // Register CORS
  await fastify.register(cors, {
    origin: true, // Allow all origins for now (configure as needed)
  });

  await fastify.register(websocket);

  // Initialize services
  const portAllocator = new PortAllocator(appConfig.opencode.basePort, appConfig.opencode.maxPort);

  const serverRegistry = new ServerRegistry(
    portAllocator,
    appConfig.opencode.maxServers,
    appConfig.opencode.idleTimeout,
  );

  const opencodeFactory = new OpencodeFactory();
  const sessionEventHub = new SessionEventHub();
  const sessionRequestHub = new SessionRequestHub();

  serverRegistry.onServerRemoved((entry, reason) => {
    sessionRequestHub.cancelSession(entry.sessionId, reason);
    sessionEventHub.closeSession(entry.sessionId, reason);
  });

  // Register routes
  await healthRoutes(fastify, serverRegistry, portAllocator, appConfig.opencode.maxServers);
  await sessionRoutes(fastify, serverRegistry, opencodeFactory, sessionEventHub, sessionRequestHub);

  // Start cleanup task
  serverRegistry.startCleanupTask(appConfig.opencode.cleanupInterval);

  // Graceful shutdown
  const shutdownHandler = async () => {
    logger.info('Shutting down server...');
    serverRegistry.stopCleanupTask();
    sessionRequestHub.cancelAll('server_shutdown');
    sessionEventHub.closeAll();
    await serverRegistry.removeAllServers();
    await fastify.close();
    logger.info('Server shut down complete');
    process.exit(0);
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  return fastify;
}
