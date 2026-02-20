import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../services/logger.js';

const MUTATING_TOOL_NAMES = new Set(['create-entity', 'update-entity']);
const DEFAULT_MUTATION_DELAY_MS = 150;

let mutationQueue: Promise<void> = Promise.resolve();

function sleep(delayMs: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, delayMs);
  });
}

function resolveMutationDelayMs(): number {
  const configuredDelay = process.env.AUDAKO_MUTATION_DELAY_MS?.trim();
  if (!configuredDelay) {
    return DEFAULT_MUTATION_DELAY_MS;
  }

  const parsedDelay = Number(configuredDelay);
  if (!Number.isFinite(parsedDelay) || parsedDelay < 0) {
    return DEFAULT_MUTATION_DELAY_MS;
  }

  return Math.floor(parsedDelay);
}

async function runWithMutationThrottle<T>(toolName: string, handler: () => Promise<T>): Promise<T> {
  const delayMs = resolveMutationDelayMs();

  let releaseQueue: () => void = () => {};
  const previousOperation = mutationQueue;
  mutationQueue = new Promise<void>(resolve => {
    releaseQueue = resolve;
  });

  await previousOperation;

  try {
    if (delayMs > 0) {
      await logger.trace(toolName, 'throttle delay before execution', {
        delayMs,
      });
      await sleep(delayMs);
    }

    return await handler();
  } finally {
    releaseQueue();
  }
}

function wrapHandlerWithThrottle(definition: ToolDefinition): ToolDefinition['handler'] {
  if (!MUTATING_TOOL_NAMES.has(definition.name)) {
    return definition.handler;
  }

  return async (...args: any[]) => {
    return runWithMutationThrottle(definition.name, async () => {
      return definition.handler(...args);
    });
  };
}

export interface ToolDefinition {
  name: string;
  config: Parameters<McpServer['registerTool']>[1];
  handler: (...args: any[]) => Promise<unknown> | unknown;
}

export function defineTool(definition: ToolDefinition): ToolDefinition {
  return definition;
}

export function registerToolDefinitions(server: McpServer, definitions: ToolDefinition[]) {
  for (const definition of definitions) {
    const wrappedHandler = wrapHandlerWithThrottle(definition);

    server.registerTool(
      definition.name,
      definition.config,
      wrappedHandler as Parameters<McpServer['registerTool']>[2],
    );
  }
}
