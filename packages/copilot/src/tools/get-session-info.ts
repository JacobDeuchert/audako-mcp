import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import type { SessionContext } from '../services/session-context.js';
import { toTextResponse } from './helpers.js';

const getSessionInfoSchema = Type.Object({}, { additionalProperties: false });

export function createGetSessionInfoTool(
  sessionContext: SessionContext,
): AgentTool<typeof getSessionInfoSchema> {
  return {
    name: 'get_session_info',
    label: 'Get Session Info',
    description:
      'Get current client session context from backend bridge (tenantId, groupId, entityType, app).',
    parameters: getSessionInfoSchema,
    execute: async () => {
      return toTextResponse({
        tenantId: sessionContext.tenantId,
        groupId: sessionContext.groupId,
        entityType: sessionContext.entityType,
        app: sessionContext.app,
      });
    },
  };
}
