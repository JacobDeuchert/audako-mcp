import { config } from 'dotenv';

// Load environment variables
config();

const port = parseInt(process.env.PORT || '3000', 10);

export const appConfig = {
  // Backend Bridge Configuration
  port,
  host: process.env.HOST || '0.0.0.0',

  bridge: {
    internalUrl: process.env.BACKEND_BRIDGE_INTERNAL_URL || `http://127.0.0.1:${port}`,
    publicUrl: process.env.BACKEND_BRIDGE_PUBLIC_URL,
  },

  // OpenCode runtime configuration
  opencode: {
    basePort: parseInt(process.env.OPENCODE_BASE_PORT || '30000', 10),
    maxPort: parseInt(process.env.OPENCODE_MAX_PORT || '31000', 10),
    maxServers: parseInt(process.env.OPENCODE_MAX_SERVERS || '50', 10),
    idleTimeout: parseInt(process.env.OPENCODE_IDLE_TIMEOUT || '3600000', 10), // 1 hour default
    cleanupInterval: parseInt(process.env.OPENCODE_CLEANUP_INTERVAL || '900000', 10), // 15 minutes default
    corsOrigins: (process.env.OPENCODE_CORS_ORIGINS || '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
  },

  // Default Model
  defaultModel: process.env.DEFAULT_MODEL,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};
