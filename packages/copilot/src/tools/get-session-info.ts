import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { SessionContext } from '../services/session-context.js';
import { toTextResponse } from './helpers.js';
import { getSessionInfoSchema } from './schemas.js';

type AgentSchema<T> = T & any;

export function createGetSessionInfoTool(
  sessionContext: SessionContext,
): AgentTool<AgentSchema<typeof getSessionInfoSchema>> {
  return {
    name: 'audako_mcp_get_session_info',
    label: 'Get Session Info',
    description:
      'Get current client session context from backend bridge (tenantId, groupId, entityType, app).',
    parameters: getSessionInfoSchema,
    execute: async () => {
      return toTextResponse({
        tenantId: sessionContext.getTenantId(),
        groupId: sessionContext.getGroupId(),
        entityType: sessionContext.getEntityType(),
        app: sessionContext.getApp(),
      }) as any;
    },
  };
}
