import { appConfig, createLogger } from './config/app-config.js';
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
        sessionIdleTimeout: appConfig.session.idleTimeout,
        llmProvider: appConfig.llm.provider,
        llmModel: appConfig.llm.modelName,
      },
      'Copilot server started',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
