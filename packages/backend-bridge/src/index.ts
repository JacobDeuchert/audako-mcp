import { createServer } from './server.js';
import { appConfig } from './config/index.js';
import { pino } from 'pino';

const logger = pino({
  name: 'main',
  level: appConfig.logLevel,
});

async function start() {
  try {
    const server = await createServer();

    await server.listen({
      port: appConfig.port,
      host: appConfig.host,
    });

    logger.info(
      {
        port: appConfig.port,
        host: appConfig.host,
        opencodeBasePort: appConfig.opencode.basePort,
        opencodeMaxPort: appConfig.opencode.maxPort,
        maxServers: appConfig.opencode.maxServers,
      },
      'Backend Bridge server started',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
