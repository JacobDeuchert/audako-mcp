import { toTextResponse } from './helpers.js';
import { getSessionInfoSchema } from './schemas.js';
export function createGetSessionInfoTool(sessionContext) {
    return {
        name: 'audako_mcp_get_session_info',
        label: 'Get Session Info',
        description: 'Get current client session context from backend bridge (tenantId, groupId, entityType, app).',
        parameters: getSessionInfoSchema,
        execute: async () => {
            return toTextResponse({
                tenantId: sessionContext.getTenantId(),
                groupId: sessionContext.getGroupId(),
                entityType: sessionContext.getEntityType(),
                app: sessionContext.getApp(),
            });
        },
    };
}
//# sourceMappingURL=get-session-info.js.map