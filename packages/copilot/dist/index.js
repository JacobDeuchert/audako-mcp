import { appConfig, createLogger } from './config/app-config.js';
import { createServer } from './server.js';
const logger = createLogger('main');
async function start() {
    const server = await createServer();
    let isShuttingDown = false;
    const shutdown = async (signal) => {
        if (isShuttingDown) {
            return;
        }
        isShuttingDown = true;
        logger.info({ signal }, 'Shutdown signal received');
        try {
            await server.shutdown();
            process.exit(0);
        }
        catch (error) {
            logger.error({ error, signal }, 'Failed during shutdown');
            process.exit(1);
        }
    };
    process.once('SIGTERM', () => {
        void shutdown('SIGTERM');
    });
    process.once('SIGINT', () => {
        void shutdown('SIGINT');
    });
    try {
        await server.start({
            port: appConfig.port,
            host: appConfig.host,
        });
        logger.info({
            port: appConfig.port,
            host: appConfig.host,
            sessionIdleTimeout: appConfig.session.idleTimeout,
            llmProvider: appConfig.llm.provider,
            llmModel: appConfig.llm.modelName,
        }, 'Copilot server started');
    }
    catch (error) {
        logger.error({ error }, 'Failed to start server');
        await server.shutdown();
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map