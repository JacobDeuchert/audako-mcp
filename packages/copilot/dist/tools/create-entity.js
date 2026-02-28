import { resolveEntityTypeContract } from '../entity-type-definitions/index.js';
import { ensureInlineMutationPermission } from '../services/inline-mutation-permissions.js';
import { createEntitySchema } from './schemas.js';
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
export function createCreateEntityTool(deps) {
    return {
        name: 'audako_mcp_create_entity',
        label: 'Create Entity',
        description: 'Create a configuration entity with schema-validated payload.',
        parameters: createEntitySchema,
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
            const createdEntity = await runInMutationThrottle(deps.mutationThrottle, async () => {
                const contract = resolveEntityTypeContract(params.entityType);
                if (!contract) {
                    throw new Error(`Unsupported entity type '${params.entityType}'.`);
                }
                const validationErrors = contract.validate(params.payload, 'create');
                if (validationErrors.length > 0) {
                    throw new Error(`Entity payload validation failed: ${validationErrors.join('; ')}`);
                }
                return deps.audakoServices.entityData.create(params.entityType, params.payload);
            });
            const entityId = createdEntity.id ?? createdEntity.Id;
            if (!entityId) {
                throw new Error('Created entity response did not include an ID.');
            }
            deps.eventHub.publish(sessionId, {
                type: 'entity.created',
                timestamp: new Date().toISOString(),
                payload: {
                    entityType: params.entityType,
                    entityId,
                    data: createdEntity,
                },
            });
            return {
                content: [{ type: 'text', text: `Created ${params.entityType} with ID ${entityId}` }],
                details: {
                    entityType: params.entityType,
                    entityId,
                },
            };
        },
    };
}
//# sourceMappingURL=create-entity.js.map