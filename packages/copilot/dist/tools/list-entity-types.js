// Import type files to trigger self-registration
import '../entity-type-definitions/Signal/contract.js';
import '../entity-type-definitions/Group/contract.js';
import '../entity-type-definitions/DataConnection/contract.js';
import '../entity-type-definitions/DataSource/contract.js';
import { Type } from '@mariozechner/pi-ai';
import { listTypes } from '../services/type-registry.js';
import { toTextResponse } from './helpers.js';
const listEntityTypesSchema = Type.Object({}, { additionalProperties: false });
export const listEntityTypesTool = {
    name: 'list_entity_types',
    label: 'List Entity Types',
    description: 'List supported configuration entity types that can be created or updated.',
    parameters: listEntityTypesSchema,
    execute: async () => {
        const definitions = listTypes();
        const payload = definitions
            .filter((def) => 'entityType' in def)
            .map(definition => ({
            key: definition.key,
            aliases: definition.aliases ?? [],
            entityType: definition.entityType,
            description: definition.description,
        }));
        return toTextResponse(payload);
    },
};
//# sourceMappingURL=list-entity-types.js.map