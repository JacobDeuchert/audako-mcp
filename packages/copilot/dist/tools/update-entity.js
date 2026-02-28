import { resolveEntityTypeContract } from '../entity-type-definitions/index.js';
import { ensureInlineMutationPermission } from '../services/inline-mutation-permissions.js';
import { updateEntitySchema } from './schemas.js';
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
export function createUpdateEntityTool(deps) {
    return {
        name: 'audako_mcp_update_entity',
        label: 'Update Entity',
        description: 'Update an existing configuration entity with partial changes.',
        parameters: updateEntitySchema,
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
            const updatedEntity = await runInMutationThrottle(deps.mutationThrottle, async () => {
                const contract = resolveEntityTypeContract(params.entityType);
                if (!contract) {
                    throw new Error(`Unsupported entity type '${params.entityType}'.`);
                }
                const validationErrors = contract.validate(params.changes, 'update');
                if (validationErrors.length > 0) {
                    throw new Error(`Entity update validation failed: ${validationErrors.join('; ')}`);
                }
                return deps.audakoServices.entityData.update(params.entityType, params.entityId, params.changes);
            });
            const entityId = updatedEntity.id ?? updatedEntity.Id ?? params.entityId;
            deps.eventHub.publish(sessionId, {
                type: 'entity.updated',
                timestamp: new Date().toISOString(),
                payload: {
                    entityType: params.entityType,
                    entityId,
                    changes: params.changes,
                },
            });
            return {
                content: [{ type: 'text', text: `Updated ${params.entityType} with ID ${entityId}` }],
                details: {
                    entityType: params.entityType,
                    entityId,
                },
            };
        },
    };
}
//# sourceMappingURL=update-entity.js.map