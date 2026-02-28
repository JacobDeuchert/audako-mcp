import { listEntityTypeDefinitions } from '../entity-type-definitions/index.js';
import { toTextResponse } from './helpers.js';
import { listEntityTypesSchema } from './schemas.js';
export const listEntityTypesTool = {
    name: 'audako_mcp_list_entity_types',
    label: 'List Entity Types',
    description: 'List supported configuration entity types that can be created or updated.',
    parameters: listEntityTypesSchema,
    execute: async () => {
        const definitions = listEntityTypeDefinitions();
        const payload = definitions.map(definition => ({
            key: definition.key,
            aliases: definition.aliases ?? [],
            entityType: definition.entityType,
            description: definition.description,
            fieldCount: definition.fields.length,
        }));
        return toTextResponse(payload);
    },
};
//# sourceMappingURL=list-entity-types.js.map