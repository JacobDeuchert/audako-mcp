import Fastify from 'fastify';
import cors from '@fastify/cors';
import { pino } from 'pino';
import { appConfig } from './config/index.js';
import { PortAllocator } from './services/port-allocator.js';
import { ServerRegistry } from './services/server-registry.js';
import { OpencodeFactory } from './services/opencode-factory.js';
import { healthRoutes } from './routes/health.routes.js';
import { opencodeRoutes } from './routes/opencode.routes.js';

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

  // Initialize services
  const portAllocator = new PortAllocator(
    appConfig.opencode.basePort,
    appConfig.opencode.maxPort
  );

  const serverRegistry = new ServerRegistry(
    portAllocator,
    appConfig.opencode.maxServers,
    appConfig.opencode.idleTimeout
  );

  const opcodeFactory = new OpencodeFactory();

  // Register routes
  await healthRoutes(fastify, serverRegistry, portAllocator, appConfig.opencode.maxServers);
  await opencodeRoutes(fastify, serverRegistry, opcodeFactory);

  // Start cleanup task
  serverRegistry.startCleanupTask(appConfig.opencode.cleanupInterval);

  // Graceful shutdown
  const shutdownHandler = async () => {
    logger.info('Shutting down server...');
    serverRegistry.stopCleanupTask();
    await fastify.close();
    logger.info('Server shut down complete');
    process.exit(0);
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  return fastify;
}
