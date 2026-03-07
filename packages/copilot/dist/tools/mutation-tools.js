import { createCreateEntityTool } from './create-entity.js';
import { createMoveEntityTool } from './move-entity.js';
import { createUpdateEntityTool } from './update-entity.js';
export function createMutationTools(sessionId, sessionContext, audakoServices, mutationThrottle, permissionService, eventHub) {
    return [
        createCreateEntityTool({
            sessionId,
            sessionContext,
            audakoServices,
            mutationThrottle,
            permissionService,
            eventHub,
        }),
        createUpdateEntityTool({
            sessionId,
            sessionContext,
            audakoServices,
            mutationThrottle,
            permissionService,
            eventHub,
        }),
        createMoveEntityTool({
            sessionId,
            sessionContext,
            audakoServices,
            mutationThrottle,
            permissionService,
            eventHub,
        }),
    ];
}
//# sourceMappingURL=mutation-tools.js.map