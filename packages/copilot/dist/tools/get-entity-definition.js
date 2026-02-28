import { getSupportedEntityTypeNames, resolveEntityTypeContract, } from '../entity-type-definitions/index.js';
import { toErrorResponse, toTextResponse } from './helpers.js';
import { getEntityDefinitionSchema } from './schemas.js';
export const getEntityDefinitionTool = {
    name: 'audako_mcp_get_entity_definition',
    label: 'Get Entity Definition',
    description: 'Return the field definition for an entity type, including required fields and enum options.',
    parameters: getEntityDefinitionSchema,
    execute: async (_toolCallId, { entityType }) => {
        const contract = resolveEntityTypeContract(entityType);
        if (!contract) {
            const supportedTypes = getSupportedEntityTypeNames();
            return toErrorResponse(`Unsupported entity type '${entityType}'.`, {
                supportedTypes,
            });
        }
        return toTextResponse(contract.getDefinition());
    },
};
//# sourceMappingURL=get-entity-definition.js.map