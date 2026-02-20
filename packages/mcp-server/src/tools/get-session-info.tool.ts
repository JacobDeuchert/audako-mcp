import { logger } from '../services/logger.js';
import { fetchSessionInfo, getSessionInfoEndpoint } from '../services/session-info.js';
import { toErrorResponse, toTextResponse } from './helpers.js';
import { defineTool } from './registry.js';

export const toolDefinitions = [
  defineTool({
    name: 'get-session-info',
    config: {
      description:
        'Get current client session context from backend bridge (tenantId, groupId, entityType, app).',
      inputSchema: {},
    },
    handler: async () => {
      const sessionId = process.env.AUDAKO_SESSION_ID;

      if (!sessionId) {
        await logger.warn('get-session-info: AUDAKO_SESSION_ID is not set');
        return toErrorResponse(
          'Session is not configured. Missing AUDAKO_SESSION_ID in MCP environment.',
        );
      }

      const endpoint = getSessionInfoEndpoint(sessionId);

      try {
        await logger.trace('get-session-info', 'fetching session info', {
          sessionId,
          endpoint,
        });

        const payload = await fetchSessionInfo();

        await logger.debug('get-session-info: session info retrieved', {
          sessionId,
          tenantId: payload.tenantId,
          groupId: payload.groupId,
          entityType: payload.entityType,
          app: payload.app,
        });

        return toTextResponse(payload);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logger.error('get-session-info: failed to fetch session info', {
          sessionId,
          endpoint,
          error: errorMessage,
        });

        return toErrorResponse(`Failed to get session info: ${errorMessage}`);
      }
    },
  }),
];
