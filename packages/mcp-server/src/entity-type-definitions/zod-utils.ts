import { z } from 'zod';
import { EntityFieldDefinition } from './types.js';

function toZodFieldSchema(field: EntityFieldDefinition): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

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
      schema = z.enum([firstValue, ...otherValues] as [string, ...string[]]);
      break;
    }
    default:
      throw new Error(`Unsupported field type '${String(field.type)}'.`);
  }

  return schema.describe(field.description || field.key);
}

export function buildZodSchemaFromFieldDefinitions(
  fields: EntityFieldDefinition[],
  mode: 'create' | 'update',
): z.AnyZodObject {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const dtoFieldName = field.dtoName ?? field.key;

    if (shape[dtoFieldName]) {
      throw new Error(`Duplicate DTO field definition '${dtoFieldName}'.`);
    }

    const isRequired = mode === 'create' && (field.requiredOnCreate ?? false);
    const baseSchema = toZodFieldSchema(field);
    shape[dtoFieldName] = isRequired ? baseSchema : baseSchema.optional();
  }

  return z.object(shape).strict();
}

export function formatZodValidationErrors(error: z.ZodError): string[] {
  return error.issues.map(issue => {
    const path = issue.path.join('.');
    return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
  });
}
