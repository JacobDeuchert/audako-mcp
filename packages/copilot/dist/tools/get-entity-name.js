import { EntityType } from 'audako-core';
import { toErrorResponse, toTextResponse } from './helpers.js';
import { getEntityNameSchema } from './schemas.js';
const supportedEntityTypes = Object.values(EntityType);
function resolveEntityType(entityType) {
    const normalizedEntityType = entityType.trim().toLowerCase();
    return supportedEntityTypes.find(value => value.toLowerCase() === normalizedEntityType);
}
export function createGetEntityNameTool(audakoServices) {
    return {
        name: 'audako_mcp_get_entity_name',
        label: 'Get Entity Name',
        description: 'Get an entity name by entity type and entity ID.',
        parameters: getEntityNameSchema,
        execute: async (_toolCallId, { entityType, entityId }) => {
            const normalizedEntityId = entityId.trim();
            const resolvedEntityType = resolveEntityType(entityType);
            if (!normalizedEntityId) {
                return toErrorResponse("'entityId' must be a non-empty string.");
            }
            if (!resolvedEntityType) {
                const normalizedEntityType = entityType.trim();
                const sortedSupportedEntityTypes = [...supportedEntityTypes].sort((a, b) => a.localeCompare(b));
                return toErrorResponse(`Unsupported entity type '${normalizedEntityType || entityType}'.`, {
                    supportedTypes: sortedSupportedEntityTypes,
                });
            }
            try {
                const entity = await audakoServices.entityService.getPartialEntityById(resolvedEntityType, normalizedEntityId, { Name: 1 });
                const entityName = typeof entity?.Name?.Value === 'string' ? entity.Name.Value : '';
                return toTextResponse(entityName);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return toErrorResponse(`Failed to resolve entity name: ${errorMessage}`);
            }
        },
    };
}
//# sourceMappingURL=get-entity-name.js.map