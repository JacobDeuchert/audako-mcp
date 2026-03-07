import { z } from 'zod';
function toZodFieldSchema(field) {
    let schema;
    switch (field.type) {
        case 'string':
            schema = z.string();
            break;
        case 'number':
            schema = z.number();
            break;
        case 'boolean':
            schema = z.boolean();
            break;
        case 'enum': {
            const enumValues = field.enumValues ?? [];
            if (enumValues.length === 0) {
                throw new Error(`Field '${field.key}' is enum but has no enumValues configured.`);
            }
            const [firstValue, ...otherValues] = enumValues;
            schema = z.enum([firstValue, ...otherValues]);
            break;
        }
        default:
            throw new Error(`Unsupported field type '${String(field.type)}'.`);
    }
    return schema.describe(field.description || field.key);
}
export function buildZodSchemaFromFieldDefinitions(fields, mode) {
    const shape = {};
    for (const field of fields) {
        const dtoFieldName = field.dtoName ?? field.key;
        if (shape[dtoFieldName]) {
            throw new Error(`Duplicate DTO field definition '${dtoFieldName}'.`);
        }
        const isRequired = mode === 'create' && (field.requiredOnCreate ?? false);
        const baseSchema = toZodFieldSchema(field);
        shape[dtoFieldName] = isRequired ? baseSchema : baseSchema.optional();
    }
    return z.object(shape).passthrough();
}
export function formatZodValidationErrors(error) {
    return error.issues.map(issue => {
        const path = issue.path.join('.');
        return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
    });
}
//# sourceMappingURL=zod-utils.js.map