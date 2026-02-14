import { EntityType } from "audako-core";

export type DefinitionFieldType = "string" | "number" | "boolean" | "enum";
export type ValidationMode = "create" | "update";

export interface EntityFieldDefinition {
  key: string;
  type: DefinitionFieldType;
  description: string;
  requiredOnCreate?: boolean;
  enumValues?: string[];
  appliesTo?: string[];
}

export interface EntityTypeDefinition {
  key: string;
  aliases?: string[];
  entityType: EntityType;
  description: string;
  fields: EntityFieldDefinition[];
  examples?: EntityTypeExamples;
}

export interface EntityContractContext {
  tenantRootGroupId?: string;
}

export interface EntityTypeExamples {
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}
