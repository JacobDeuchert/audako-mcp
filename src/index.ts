#!/usr/bin/env node

import "dotenv/config";

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { registerCreateSignalTool } from "./tools/index.js";

const docsDir = join(import.meta.dirname, "docs");

const server = new McpServer({
  name: "audako-mcp",
  version: "1.0.0",
});

// Register tools
server.registerTool(
  "hello",
  {
    description: "A simple hello world tool",
    inputSchema: {
      name: z.string().optional().describe("Name to greet"),
    },
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name ?? "World"}!`,
        },
      ],
    };
  }
);

registerCreateSignalTool(server);

// Register resource to list available docs
server.registerResource(
  "docs-index",
  "docs://index",
  { description: "List of all available documentation files" },
  async () => {
    const files = await readdir(docsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));
    return {
      contents: [
        {
          uri: "docs://index",
          mimeType: "text/plain",
          text: mdFiles.join("\n"),
        },
      ],
    };
  }
);

// Register resource template for individual docs
server.registerResource(
  "doc",
  new ResourceTemplate("docs://files/{filename}", { list: undefined }),
  { description: "Read a specific documentation file by name" },
  async (uri, { filename }) => {
    const content = await readFile(join(docsDir, filename as string), "utf-8");
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Audako MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
