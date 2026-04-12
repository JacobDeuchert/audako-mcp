import { Type } from '@mariozechner/pi-ai';
import { toTextResponse } from './helpers.js';
const getSessionInfoSchema = Type.Object({}, { additionalProperties: false });
export function createGetSessionInfoTool(sessionContext) {
    return {
        name: 'get_session_info',
        label: 'Get Session Info',
        description: 'Get current client session context from backend bridge (tenantId, groupId, entityType, app).',
        parameters: getSessionInfoSchema,
        execute: async () => {
            const snapshot = sessionContext.promptSnapshot;
            return toTextResponse({
                tenantId: snapshot.tenantId,
                groupId: snapshot.groupId,
                entityType: snapshot.entityType,
                app: snapshot.app,
            });
        },
    };
}
//# sourceMappingURL=get-session-info.js.map