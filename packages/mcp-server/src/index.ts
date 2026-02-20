#!/usr/bin/env node

import 'dotenv/config';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { autoRegisterTools } from './tools/auto-register.js';
import { registerDocsResources } from './tools/docs-resources.js';
import { initializeServices } from './services/audako-services.js';
import { logger } from './services/logger.js';

const systemUrl = process.env.AUDAKO_SYSTEM_URL ?? 'not configured';

const server = new McpServer(
  {
    name: 'audako-mcp',
    version: '1.0.0',
  },
  {
    instructions: `You are connected to the Audako system at: ${systemUrl}
Use list-entity-types to discover supported entity types.
Use get-entity-definition before create-entity or update-entity to get the expected fields and enums.`,
  },
);

registerDocsResources(server);

// Start the server
async function main() {
  await logger.info('Audako MCP Server starting', {
    version: '1.0.0',
    systemUrl: systemUrl,
    logFilePath: logger.getLogFilePath(),
    logLevel: logger.getMinLevel(),
  });

  try {
    await autoRegisterTools(server);
    await logger.info('Tools registered', { source: 'auto-discovery' });

    await initializeServices();
    await logger.info('Services initialized successfully');

    const transport = new StdioServerTransport();
    await server.connect(transport);

    await logger.info('Audako MCP Server running on stdio');
    console.error('Audako MCP Server running on stdio');
  } catch (error) {
    await logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

main().catch(async error => {
  await logger.error('Fatal error in main', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  console.error('Fatal error:', error);
  process.exit(1);
});
