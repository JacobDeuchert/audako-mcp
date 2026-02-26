import { logger } from '../services/logger.js';
import { getContext } from '../services/session-context.js';
import { resolveSessionId } from '../services/session-id.js';
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
      const sessionId = resolveSessionId();

      if (!sessionId) {
        await logger.warn('get-session-info: AUDAKO_SESSION_ID is not set');
        return toErrorResponse(
          'Session is not configured. Missing AUDAKO_SESSION_ID in MCP environment.',
        );
      }

      await logger.trace('get-session-info', 'fetching session context', { sessionId });

      const context = await getContext();

      await logger.debug('get-session-info: session context retrieved', {
        sessionId,
        tenantId: context.tenantId,
        groupId: context.groupId,
        entityType: context.entityType,
        app: context.app,
      });

      return toTextResponse({
        tenantId: context.tenantId,
        groupId: context.groupId,
        entityType: context.entityType,
        app: context.app,
        updatedAt: context.updatedAt,
      });
    },
  }),
];
