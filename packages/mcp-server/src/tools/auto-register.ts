import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { pathToFileURL } from "url";
import { registerToolDefinitions, ToolDefinition } from "./registry.js";

const TOOL_FILE_SUFFIX = ".tool.js";

interface ToolModule {
  toolDefinitions?: unknown;
}

async function findToolFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => findToolFiles(join(dirPath, entry.name))),
  );

  const localToolFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(TOOL_FILE_SUFFIX))
    .map((entry) => join(dirPath, entry.name));

  return [...localToolFiles, ...nestedFiles.flat()].sort();
}

function getDefinitions(modulePath: string, module: ToolModule): ToolDefinition[] {
  if (!Array.isArray(module.toolDefinitions)) {
    throw new Error(
      `Tool module ${modulePath} must export a 'toolDefinitions' array.`,
    );
  }

  return module.toolDefinitions as ToolDefinition[];
}

export async function autoRegisterTools(server: McpServer) {
  const toolsDir = import.meta.dirname;
  const toolFiles = await findToolFiles(toolsDir);
  const seenToolNames = new Set<string>();

  for (const toolFile of toolFiles) {
    const moduleUrl = pathToFileURL(toolFile).href;
    const module = (await import(moduleUrl)) as ToolModule;
    const definitions = getDefinitions(toolFile, module);

    for (const definition of definitions) {
      if (!definition || typeof definition.name !== "string") {
        throw new Error(
          `Tool module ${toolFile} contains an invalid tool definition.`,
        );
      }

      if (seenToolNames.has(definition.name)) {
        throw new Error(`Duplicate tool name detected: ${definition.name}`);
      }

      seenToolNames.add(definition.name);
    }

    registerToolDefinitions(server, definitions);
  }
}
