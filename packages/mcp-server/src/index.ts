#!/usr/bin/env node

import "dotenv/config";

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { autoRegisterTools } from "./tools/auto-register.js";
import { initializeServices } from "./services/audako-services.js";
import { logger } from "./services/logger.js";

const docsDir = join(import.meta.dirname, "docs");

const systemUrl = process.env.AUDAKO_SYSTEM_URL ?? "not configured";

const server = new McpServer(
  {
    name: "audako-mcp",
    version: "1.0.0",
  },
  {
    instructions: `You are connected to the Audako system at: ${systemUrl}

Before creating or updating entities, select a tenant with select-tenant.
Use list-entity-types to discover supported entity types.
Use get-entity-definition before create-entity or update-entity to get the expected fields and enums.`,
  },
);

// Register resource to list available docs
server.registerResource(
  "docs-index",
  "docs://index",
  { description: "List of all available documentation files" },
  async () => {
    await logger.trace("docs-index", "listing documentation files");
    const files = await readdir(docsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));
    await logger.debug("docs-index: found documentation files", {
      count: mdFiles.length,
      files: mdFiles,
    });
    return {
      contents: [
        {
          uri: "docs://index",
          mimeType: "text/plain",
          text: mdFiles.join("\n"),
        },
      ],
    };
  },
);

// Register resource template for individual docs
server.registerResource(
  "doc",
  new ResourceTemplate("docs://files/{filename}", { list: undefined }),
  { description: "Read a specific documentation file by name" },
  async (uri, { filename }) => {
    await logger.trace("doc", "reading documentation file", { filename });
    try {
      const content = await readFile(
        join(docsDir, filename as string),
        "utf-8",
      );
      await logger.debug("doc: file read successfully", {
        filename,
        size: content.length,
      });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    } catch (error) {
      await logger.error("doc: failed to read file", {
        filename,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
);

// Start the server
async function main() {
  await logger.info("Audako MCP Server starting", {
    version: "1.0.0",
    systemUrl: systemUrl,
    logFilePath: logger.getLogFilePath(),
    logLevel: logger.getMinLevel(),
  });

  try {
    await autoRegisterTools(server);
    await logger.info("Tools registered", { source: "auto-discovery" });

    await initializeServices();
    await logger.info("Services initialized successfully");

    const transport = new StdioServerTransport();
    await server.connect(transport);

    await logger.info("Audako MCP Server running on stdio");
    console.error("Audako MCP Server running on stdio");
  } catch (error) {
    await logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

main().catch(async (error) => {
  await logger.error("Fatal error in main", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  console.error("Fatal error:", error);
  process.exit(1);
});
