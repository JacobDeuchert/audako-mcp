import { Type } from '@mariozechner/pi-ai';
import { listAllTypeKeys, resolveTypeDefinition, } from '../entity-type-definitions/type-registry.js';
import { toErrorResponse, toTextResponse } from './helpers.js';
const getTypeDefinitionSchema = Type.Object({
    typeKey: Type.String({
        description: "Type key to resolve, for example 'Signal' or 'DigitalSettings'.",
    }),
});
export const getTypeDefinitionTool = {
    name: 'get_type_definition',
    label: 'Get Type Definition',
    description: 'Return the field definition for an entity type or settings type, including required fields and enum options.',
    parameters: getTypeDefinitionSchema,
    execute: async (_toolCallId, { typeKey }) => {
        const definition = resolveTypeDefinition(typeKey);
        if (!definition) {
            const validTypeKeys = listAllTypeKeys();
            return toErrorResponse(`Unknown type key '${typeKey}'.`, {
                validTypeKeys,
            });
        }
        if ('entityType' in definition) {
            const simplifiedDefinition = {
                ...definition,
                settingsTypes: definition.settingsTypes?.map(st => st.key) ?? [],
            };
            return toTextResponse(simplifiedDefinition);
        }
        else {
            return toTextResponse(definition);
        }
    },
};
//# sourceMappingURL=get-type-definition.js.map