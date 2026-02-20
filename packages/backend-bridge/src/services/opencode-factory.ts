import { createOpencode } from '@opencode-ai/sdk/v2';
import { pino } from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appConfig } from '../config/index.js';

const logger = pino({ name: 'opencode-factory' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const agentPromptPath = path.resolve(__dirname, '../../.opencode/prompts/scada-agent.md');
const agentPrompt = fs.readFileSync(agentPromptPath, 'utf-8');

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
 * Creates an OpenCode runtime instance for a specific SCADA context.
 */
export async function createOpencodeServer(config: OpencodeServerConfig) {
  const { scadaUrl, accessToken, port, sessionId, bridgeUrl, model, corsOrigins = [] } = config;

  const mcpServerPath = path.resolve(__dirname, '../../../mcp-server/dist/index.js');

  const allowedCorsOrigins = [...new Set([...appConfig.opencode.corsOrigins, ...corsOrigins])];

  logger.info(
    { scadaUrl, port, sessionId, model, corsOrigins: allowedCorsOrigins },
    'Creating OpenCode runtime',
  );

  logger.info(
    { mcpServerPath, agentPromptPath },
    'Resolved paths for OpenCode runtime dependencies',
  );

  try {
    const opencode = await createOpencode({
      port,
      config: {
        default_agent: 'audako',
        agent: {
          audako: {
            mode: 'primary',
            description: 'SCADA system assistant with Audako tools',
            model: model || 'openai/gpt-5.3-codex',
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
          patch: false,
          apply_patch: false,
          webfetch: false,
          websearch: false,
          task: false,
          todowrite: false,
          'audako-mcp*': true,
          // "weblate-mcp*": false,
        },
        mcp: {
          'audako-mcp': {
            type: 'local',
            command: ['node', mcpServerPath],
            enabled: true,
            environment: {
              AUDAKO_SYSTEM_URL: scadaUrl,
              AUDAKO_TOKEN: accessToken,
              AUDAKO_SESSION_ID: sessionId,
              AUDAKO_BRIDGE_URL: bridgeUrl,
              AUDAKO_MUTATION_DELAY_MS: process.env.AUDAKO_MUTATION_DELAY_MS ?? '150',
            },
          },
        },
      },
    });

    logger.info({ scadaUrl, port, sessionId }, 'OpenCode runtime created successfully');

    return opencode;
  } catch (error) {
    logger.error(
      {
        scadaUrl,
        port,
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to create OpenCode runtime',
    );
    throw error;
  }
}

export class OpencodeFactory {
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
