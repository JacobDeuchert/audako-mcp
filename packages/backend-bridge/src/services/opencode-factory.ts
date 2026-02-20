import { createOpencode } from '@opencode-ai/sdk/v2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { appConfig, createLogger } from '../config/index.js';
import type { OpencodeRuntime } from '../types/index.js';
import { getErrorMessage } from '../utils.js';

const logger = createLogger('opencode-factory');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const agentPromptPath = path.resolve(__dirname, '../../.opencode/prompts/scada-agent.md');
const agentPrompt = fs.readFileSync(agentPromptPath, 'utf-8');

export class OpencodeFactory {
  async createServer(
    scadaUrl: string,
    accessToken: string,
    port: number,
    sessionId: string,
    corsOrigins?: string[],
  ): Promise<OpencodeRuntime> {
    const mcpServerPath = path.resolve(__dirname, '../../../mcp-server/dist/index.js');
    const bridgeUrl = appConfig.bridge.internalUrl;
    const model = appConfig.defaultModel;

    // TODO: Pass allowedCorsOrigins to createOpencode() once @opencode-ai/sdk supports a cors option in ServerOptions.
    const allowedCorsOrigins = [
      ...new Set([...appConfig.opencode.corsOrigins, ...(corsOrigins ?? [])]),
    ];
    void allowedCorsOrigins;

    try {
      const opencode = await createOpencode({
        port,
        config: {
          default_agent: 'audako',
          agent: {
            audako: {
              mode: 'primary',
              description: 'SCADA system assistant with Audako tools',
              model,
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

      return opencode;
    } catch (error) {
      logger.error(
        {
          scadaUrl,
          port,
          sessionId,
          error: getErrorMessage(error),
        },
        'Failed to create OpenCode runtime',
      );
      throw error;
    }
  }
}
