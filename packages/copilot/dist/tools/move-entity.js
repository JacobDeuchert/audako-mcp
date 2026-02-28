import { ensureInlineMutationPermission } from '../services/inline-mutation-permissions.js';
import { moveEntitySchema } from './schemas.js';
function normalizePermissionMode(mode) {
    return mode === 'fail_fast' ? 'fail_fast' : 'interactive';
}
async function runInMutationThrottle(mutationThrottle, handler) {
    if (typeof mutationThrottle.execute === 'function') {
        return mutationThrottle.execute(handler);
    }
    if (typeof mutationThrottle.run === 'function') {
        return mutationThrottle.run(handler);
    }
    return handler();
}
async function ensureMutationPermission(input) {
    if (input.permissionMode === 'fail_fast') {
        if (!input.permissionStore.hasPermission(input.entityType)) {
            throw new Error(`Mutation blocked: permission denied for ${input.entityType}.`);
        }
        return;
    }
    await ensureInlineMutationPermission({
        sessionId: input.sessionId,
        entityType: input.entityType,
        permissionStore: input.permissionStore,
        sessionRequestHub: input.sessionRequestHub,
    });
}
export function createMoveEntityTool(deps) {
    return {
        name: 'audako_mcp_move_entity',
        label: 'Move Entity',
        description: 'Move an entity to another group.',
        parameters: moveEntitySchema,
        execute: async (_toolCallId, params) => {
            const sessionId = deps.sessionContext.getSessionId();
            await ensureMutationPermission({
                sessionId,
                entityType: params.entityType,
                permissionMode: normalizePermissionMode(params.permissionMode),
                permissionStore: deps.permissions,
                sessionRequestHub: deps.requestHub,
            });
            await deps.scopeGuard.validate(deps.sessionContext.getGroupId(), params.entityType);
            const moveResult = await runInMutationThrottle(deps.mutationThrottle, async () => {
                return deps.audakoServices.group.moveEntity(params.entityType, params.entityId, params.targetGroupId);
            });
            const fromGroupId = moveResult.fromGroupId ?? deps.sessionContext.getGroupId() ?? params.targetGroupId;
            const toGroupId = moveResult.toGroupId ?? params.targetGroupId;
            deps.eventHub.publish(sessionId, {
                type: 'entity.moved',
                timestamp: new Date().toISOString(),
                payload: {
                    entityType: params.entityType,
                    entityId: params.entityId,
                    fromGroupId,
                    toGroupId,
                },
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Moved ${params.entityType} ${params.entityId} to group ${params.targetGroupId}`,
                    },
                ],
                details: {
                    entityType: params.entityType,
                    entityId: params.entityId,
                    fromGroupId,
                    toGroupId,
                },
            };
        },
    };
}
//# sourceMappingURL=move-entity.js.map