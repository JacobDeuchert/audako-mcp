import { config } from 'dotenv';
import path from 'path';
import { pino } from 'pino';
import { fileURLToPath } from 'url';

// Load .env from the package root, regardless of cwd.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });

const port = parseInt(process.env.PORT || '3001', 10);
const logLevel = process.env.LOG_LEVEL || 'info';

/** Root pino logger – every module should derive a child from this. */
export const rootLogger = pino({ name: 'copilot', level: logLevel });

/** Create a named child logger that inherits the root log level. */
export function createLogger(name: string) {
  return rootLogger.child({ module: name });
}

export const appConfig = {
  port,
  host: process.env.HOST || '0.0.0.0',

  // Session Configuration
  session: {
    idleTimeout: parseInt(process.env.SESSION_IDLE_TIMEOUT || '1800000', 10), // 30 minutes default
  },

  // LLM Configuration
  llm: {
    provider: process.env.LLM_PROVIDER || 'anthropic',
    modelName: process.env.LLM_MODEL_NAME || 'anthropic/claude-sonnet-4-20250514',
  },

  // Logging
  logLevel,
};
