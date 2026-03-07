import { Type } from '@mariozechner/pi-ai';
import { listEntityTypeDefinitions } from '../entity-type-definitions/entity-type-registry.js';
import { toTextResponse } from './helpers.js';
const listEntityTypesSchema = Type.Object({}, { additionalProperties: false });
export const listEntityTypesTool = {
    name: 'list_entity_types',
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