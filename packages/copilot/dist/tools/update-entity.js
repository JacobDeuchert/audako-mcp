// Import type files to trigger self-registration
import '../entity-type-definitions/Signal/contract.js';
import '../entity-type-definitions/Group/contract.js';
import { Type } from '@mariozechner/pi-ai';
import { resolveContract } from '../entity-type-definitions/contract-registry.js';
import { normalizePermissionMode } from '../services/permission-service.js';
const updateEntitySchema = Type.Object({
    entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
    entityId: Type.String({ description: 'The ID of the entity to update.' }),
    changes: Type.Object({}, {
        additionalProperties: true,
        description: 'Partial field updates. Use get-entity-definition first.',
    }),
    permissionMode: Type.Optional(Type.Union([Type.Literal('interactive'), Type.Literal('fail_fast')], {
        description: 'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
    })),
});
export function createUpdateEntityTool(deps) {
    return {
        name: 'update_entity',
        label: 'Update Entity',
        description: 'Update an existing configuration entity with partial changes.',
        parameters: updateEntitySchema,
        execute: async (_toolCallId, params) => {
            const sessionId = deps.sessionId;
            const contract = resolveContract(params.entityType);
            if (!contract) {
                throw new Error(`Unsupported entity type '${params.entityType}'.`);
            }
            const existingForScope = await deps.audakoServices.entityService.getPartialEntityById(contract.entityType, params.entityId, { GroupId: 1 });
            const groupIdValue = existingForScope.GroupId;
            const entityGroupId = typeof groupIdValue === 'string' ? groupIdValue : undefined;
            await deps.permissionService.hasPermission(sessionId, params.entityType, entityGroupId, normalizePermissionMode(params.permissionMode), 'update_entity');
            const validationErrors = contract.validate(params.changes, 'update');
            if (validationErrors.length > 0) {
                throw new Error(`Entity update validation failed: ${validationErrors.join('; ')}`);
            }
            const updatedEntity = await deps.mutationThrottle.run(async () => {
                const existingEntity = await deps.audakoServices.entityService.getEntityById(contract.entityType, params.entityId);
                const entityToUpdate = contract.applyUpdate(existingEntity, params.changes);
                return deps.audakoServices.entityService.updateEntity(contract.entityType, entityToUpdate);
            });
            const entityId = updatedEntity.Id || params.entityId;
            const changedFields = Object.keys(params.changes);
            deps.eventHub.publish(sessionId, {
                type: 'entity.updated',
                sessionId,
                timestamp: new Date().toISOString(),
                payload: {
                    entityType: contract.entityType,
                    entityId,
                    groupId: typeof updatedEntity.GroupId === 'string' ? updatedEntity.GroupId : entityGroupId ?? '',
                    changedFields,
                    changes: params.changes,
                    metadata: {
                        tenantId: deps.sessionContext.tenantId,
                        sourceTool: 'update-entity',
                        timestamp: new Date().toISOString(),
                    },
                },
            });
            return {
                content: [{ type: 'text', text: `Updated ${contract.entityType} with ID ${entityId}` }],
                details: {
                    entityType: contract.entityType,
                    entityId,
                },
            };
        },
    };
}
//# sourceMappingURL=update-entity.js.map