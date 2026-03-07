import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { pino } from 'pino';
// Load .env from the package root, regardless of cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });
const port = parseInt(process.env.PORT || '3001', 10);
const logLevel = process.env.LOG_LEVEL || 'info';
/** Root pino logger – every module should derive a child from this. */
export const rootLogger = pino({ name: 'copilot', level: logLevel });
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
/**
 * Load the system prompt for the OpenCode agent from prompts/scada-agent.md
 * @returns Promise resolving to the system prompt text
 * @throws Error if the file cannot be read
 */
export async function loadSystemPrompt() {
    try {
        const { readFile } = await import('node:fs/promises');
        const systemPromptPath = path.resolve(__dirname, '../../prompts/scada-agent.md');
        const content = await readFile(systemPromptPath, 'utf-8');
        return content;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load system prompt: ${message}`);
    }
}
//# sourceMappingURL=app-config.js.map