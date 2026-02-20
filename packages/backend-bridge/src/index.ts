import { appConfig, createLogger } from './config/index.js';
import { createServer } from './server.js';

const logger = createLogger('main');

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
