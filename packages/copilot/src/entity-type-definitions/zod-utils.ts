import { z } from 'zod';
import type {
  EntityFieldDefinition,
  EntityTypeDefinition,
  SettingsFieldDefinition,
  SettingsTypeDefinition,
} from './types.js';

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
    case 'polymorphic':
      throw new Error(
        `Polymorphic field '${field.key}' must be handled via buildNestedEntitySchema.`,
      );
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

  return z.object(shape).passthrough();
}

export function formatZodValidationErrors(error: z.ZodError): string[] {
  return error.issues.map(issue => {
    const path = issue.path.join('.');
    return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
  });
}

/**
 * Converts a SettingsFieldDefinition to a Zod schema.
 * Similar to toZodFieldSchema but for settings fields which use `required` instead of `requiredOnCreate`.
 */
function settingsFieldToZodSchema(field: SettingsFieldDefinition): z.ZodTypeAny {
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
        throw new Error(`Settings field '${field.key}' is enum but has no enumValues configured.`);
      }

      const [firstValue, ...otherValues] = enumValues;
      schema = z.enum([firstValue, ...otherValues] as [string, ...string[]]);
      break;
    }
    default:
      throw new Error(`Unsupported settings field type '${String(field.type)}'.`);
  }

  return schema.describe(field.description || field.key);
}

/**
 * Builds a strict Zod schema from a SettingsTypeDefinition.
 * Unknown fields are rejected (no .passthrough()).
 */
export function buildSettingsZodSchema(settingsDef: SettingsTypeDefinition): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of settingsDef.fields) {
    const dtoFieldName = field.dtoName ?? field.key;

    if (shape[dtoFieldName]) {
      throw new Error(`Duplicate settings DTO field definition '${dtoFieldName}'.`);
    }

    const baseSchema = settingsFieldToZodSchema(field);
    shape[dtoFieldName] = field.required ? baseSchema : baseSchema.optional();
  }

  // Strict schema - unknown fields will be rejected
  return z.object(shape).strict();
}

/**
 * Builds a Zod schema for nested entities with polymorphic settings support.
 * Base fields use .passthrough() (unknown fields allowed), but settings use strict validation.
 */
export function buildNestedEntitySchema(
  entityDef: EntityTypeDefinition,
  mode: 'create' | 'update',
): z.ZodObject<any> {
  const baseShape: Record<string, z.ZodTypeAny> = {};

  for (const field of entityDef.fields) {
    const dtoFieldName = field.dtoName ?? field.key;

    if (baseShape[dtoFieldName]) {
      throw new Error(`Duplicate DTO field definition '${dtoFieldName}'.`);
    }

    if (field.type === 'polymorphic') {
      continue;
    }

    const isRequired = mode === 'create' && (field.requiredOnCreate ?? false);
    const baseSchema = toZodFieldSchema(field);
    baseShape[dtoFieldName] = isRequired ? baseSchema : baseSchema.optional();
  }

  for (const field of entityDef.fields) {
    if (field.type === 'polymorphic' && field.polymorphic) {
      const dtoFieldName = field.dtoName ?? field.key;
      const isRequired = mode === 'create' && (field.requiredOnCreate ?? false);
      baseShape[dtoFieldName] = isRequired
        ? z.object({}).passthrough()
        : z.record(z.any()).optional();
    }
  }

  return z.object(baseShape).passthrough();
}

/**
 * Validates a settings payload against a SettingsTypeDefinition.
 * Returns an array of error messages (empty if valid).
 */
export function validateSettingsPayload(
  settingsDef: SettingsTypeDefinition,
  payload: unknown,
): string[] {
  try {
    const schema = buildSettingsZodSchema(settingsDef);
    const result = schema.safeParse(payload);

    if (result.success) {
      return [];
    }

    const validFields = settingsDef.fields.map(f => f.dtoName ?? f.key).join(', ');

    return result.error.issues.map(issue => {
      const path = issue.path.join('.');
      if (path.length > 0) {
        return `${path}: ${issue.message} (Valid fields: ${validFields})`;
      }
      return `${issue.message} (Valid fields: ${validFields})`;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      `Settings validation failed: ${message}. Try loading the settings type definition first.`,
    ];
  }
}
