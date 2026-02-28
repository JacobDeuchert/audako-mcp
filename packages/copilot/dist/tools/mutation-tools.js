import { createCreateEntityTool } from './create-entity.js';
import { createMoveEntityTool } from './move-entity.js';
import { createUpdateEntityTool } from './update-entity.js';
export function createMutationTools(sessionContext, audakoServices, mutationThrottle, scopeGuard, permissions, eventHub, requestHub) {
    return [
        createCreateEntityTool({
            sessionContext,
            audakoServices,
            mutationThrottle,
            scopeGuard,
            permissions,
            eventHub,
            requestHub,
        }),
        createUpdateEntityTool({
            sessionContext,
            audakoServices,
            mutationThrottle,
            scopeGuard,
            permissions,
            eventHub,
            requestHub,
        }),
        createMoveEntityTool({
            sessionContext,
            audakoServices,
            mutationThrottle,
            scopeGuard,
            permissions,
            eventHub,
            requestHub,
        }),
    ];
}
//# sourceMappingURL=mutation-tools.js.map