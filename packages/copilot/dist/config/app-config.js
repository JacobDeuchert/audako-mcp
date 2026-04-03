import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { pino } from 'pino';
// Load .env from the package root, regardless of cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });
const port = parseInt(process.env.PORT || '3001', 10);
const logLevel = process.env.LOG_LEVEL || 'info';
const logDir = process.env.LOG_DIR || path.resolve(__dirname, '../../logs');
const logFile = process.env.LOG_FILE || path.join(logDir, 'app.log');
/** Root pino logger – every module should derive a child from this. */
export const rootLogger = pino({
    name: 'copilot',
    level: logLevel,
    transport: {
        targets: [
            { target: 'pino/file', options: { destination: 1 } },
            { target: 'pino/file', options: { destination: logFile, mkdir: true } },
        ],
    },
});
/** Create a named child logger that inherits the root log level. */
export function createLogger(name) {
    return rootLogger.child({ module: name });
}
export const appConfig = {
    port,
    host: process.env.HOST || '0.0.0.0',
    // CORS Configuration
    cors: {
        origins: (process.env.CORS_ORIGINS || '*')
            .split(',')
            .map(origin => origin.trim())
            .filter(Boolean),
    },
    // Session Configuration
    session: {
        idleTimeout: parseInt(process.env.SESSION_IDLE_TIMEOUT || '1800000', 10), // 30 minutes default
    },
    // LLM Configuration
    llm: {
        provider: process.env.LLM_PROVIDER || 'anthropic',
        modelName: process.env.LLM_MODEL_NAME || 'claude-sonnet-4-20250514',
    },
    // Mutation Configuration
    mutation: {
        delayMs: parseInt(process.env.MUTATION_DELAY_MS || '100', 10),
    },
    // Request Configuration
    request: {
        timeoutMs: parseInt(process.env.QUESTION_TIMEOUT_MS || '120000', 10), // 2 minutes default
    },
    // Logging
    logLevel,
};
//# sourceMappingURL=app-config.js.map