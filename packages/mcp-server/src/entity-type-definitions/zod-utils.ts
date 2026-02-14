import { z } from "zod";
import { DefinitionFieldType, EntityFieldDefinition } from "./types.js";

interface FieldTypeDetails {
  type: DefinitionFieldType;
  enumValues?: string[];
}

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;

  while (true) {
    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = current.unwrap();
      continue;
    }

    if (current instanceof z.ZodDefault) {
      current = current.removeDefault();
      continue;
    }

    if (current instanceof z.ZodEffects) {
      current = current.innerType();
      continue;
    }

    return current;
  }
}

function toFieldTypeDetails(
  fieldKey: string,
  schema: z.ZodTypeAny,
): FieldTypeDetails {
  const unwrapped = unwrapSchema(schema);

  if (unwrapped instanceof z.ZodString) {
    return { type: "string" };
  }

  if (unwrapped instanceof z.ZodNumber) {
    return { type: "number" };
  }

  if (unwrapped instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }

  if (unwrapped instanceof z.ZodEnum) {
    return { type: "enum", enumValues: [...unwrapped.options] };
  }

  if (unwrapped instanceof z.ZodNativeEnum) {
    const enumValues = Object.values(unwrapped.enum).filter(
      (value): value is string => typeof value === "string",
    );
    return { type: "enum", enumValues };
  }

  throw new Error(`Unsupported zod schema type for field '${fieldKey}'.`);
}

export function buildFieldDefinitionsFromSchema(
  schema: z.AnyZodObject,
  options?: { appliesTo?: Record<string, string[]> },
): EntityFieldDefinition[] {
  const shape = schema.shape as Record<string, z.ZodTypeAny>;

  return Object.entries(shape).map(([fieldKey, fieldSchema]) => {
    const details = toFieldTypeDetails(fieldKey, fieldSchema);

    return {
      key: fieldKey,
      type: details.type,
      description: fieldSchema.description ?? fieldKey,
      requiredOnCreate: !fieldSchema.isOptional(),
      enumValues: details.enumValues,
      appliesTo: options?.appliesTo?.[fieldKey],
    };
  });
}

export function formatZodValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
  });
}
