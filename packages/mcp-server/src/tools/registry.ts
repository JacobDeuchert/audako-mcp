import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ToolDefinition {
  name: string;
  config: Parameters<McpServer["registerTool"]>[1];
  handler: (...args: any[]) => Promise<unknown> | unknown;
}

export function defineTool(definition: ToolDefinition): ToolDefinition {
  return definition;
}

export function registerToolDefinitions(
  server: McpServer,
  definitions: ToolDefinition[],
) {
  for (const definition of definitions) {
    server.registerTool(
      definition.name,
      definition.config,
      definition.handler as Parameters<McpServer["registerTool"]>[2],
    );
  }
}
