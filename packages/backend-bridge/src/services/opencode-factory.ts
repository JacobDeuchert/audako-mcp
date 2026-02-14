import { createOpencode } from "@opencode-ai/sdk/v2";
import { pino } from "pino";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { appConfig } from "../config/index.js";

const logger = pino({ name: "opencode-factory" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const agentPromptPath = path.resolve(__dirname, "../../prompts/scada-agent.md");

export interface OpencodeServerConfig {
  scadaUrl: string;
  accessToken: string;
  port: number;
  sessionId: string;
  bridgeUrl: string;
  model?: string;
  corsOrigins?: string[];
}

/**
 * Creates an OpenCode server instance configured for a specific SCADA system
 * @param config - Server configuration
 * @returns OpenCode server instance
 */
export async function createOpencodeServer(config: OpencodeServerConfig) {
  const {
    scadaUrl,
    accessToken,
    port,
    sessionId,
    bridgeUrl,
    model,
    corsOrigins = [],
  } = config;
  const mcpServerPath = path.resolve(
    __dirname,
    "../../../mcp-server/dist/index.js",
  );
  const allowedCorsOrigins = [
    ...new Set([...appConfig.opencode.corsOrigins, ...corsOrigins]),
  ];

  logger.info(
    { scadaUrl, port, sessionId, model, corsOrigins: allowedCorsOrigins },
    "Creating OpenCode server instance",
  );

  logger.info(
    { mcpServerPath, agentPromptPath },
    "Resolved paths for MCP server and agent prompt",
  )

  try {
    const agentPrompt = fs.readFileSync(agentPromptPath, "utf-8");

    const opencode = await createOpencode({
      port: port,
      config: {
        // Custom primary agent for SCADA operations
        default_agent: "audako",
        agent: {
          audako: {
            mode: "primary",
            description: "SCADA system assistant with Audako tools",
            model: model || "mistral/devstral-2512",
            prompt: agentPrompt,
          },
        },

        tools: {
          bash: false,
          edit: false,
          write: false,
          read: false,
          grep: false,
          glob: false,
          list: false,
          lsp: false,
          path: false,
          webfetch: false,
          websearch: true,

          // Enable all MCP tools from our SCADA server
          "audako-mcp": true,
        },

        //   // Configure MCP server with SCADA credentials
        mcp: {
          "audako-mcp": {
            type: "local",
            command: ["node", mcpServerPath],
            enabled: true,
            environment: {
              AUDAKO_SYSTEM_URL: scadaUrl,
              AUDAKO_TOKEN: accessToken,
              AUDAKO_SESSION_ID: sessionId,
              AUDAKO_BRIDGE_URL: bridgeUrl,
            },
          },
        },
        //   model: model || 'openai/gpt-5.2-codex',
      },
    });

    logger.info(
      { scadaUrl, port, sessionId },
      "OpenCode server instance created successfully",
    );
    return opencode;
  } catch (error) {
    logger.error(
      { error, scadaUrl, port, sessionId },
      "Failed to create OpenCode server instance",
    );
    throw error;
  }
}

/**
 * Factory class for creating and managing OpenCode servers
 */
export class OpencodeFactory {
  /**
   * Creates a new OpenCode server instance
   * @param scadaUrl - SCADA system URL
   * @param accessToken - Access token for SCADA system
   * @param port - Port to bind the server to
   * @param model - Optional model override
   * @returns OpenCode server instance
   */
  async createServer(
    scadaUrl: string,
    accessToken: string,
    port: number,
    sessionId: string,
    model?: string,
    corsOrigins?: string[],
  ): Promise<any> {
    return createOpencodeServer({
      scadaUrl,
      accessToken,
      port,
      sessionId,
      bridgeUrl: appConfig.bridge.internalUrl,
      model,
      corsOrigins,
    });
  }
}
