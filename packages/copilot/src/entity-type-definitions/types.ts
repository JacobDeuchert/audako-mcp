import type { EntityType } from 'audako-core';

export type DefinitionFieldType = 'string' | 'number' | 'boolean' | 'enum';
export type ValidationMode = 'create' | 'update';

export interface EntityFieldDefinition {
  key: string;
  dtoName?: string;
  type: DefinitionFieldType;
  description: string;
  entityPath?: string;
  requiredOnCreate?: boolean;
  enumValues?: string[];
}

export interface EntityTypeDefinition {
  key: string;
  aliases?: string[];
  entityType: EntityType;
  description: string;
  fields: EntityFieldDefinition[];
  examples?: EntityTypeExamples;
  // Polymorphic settings support
  typeMapping?: Record<string, string>;
  settingsDiscriminatorField?: string;
  settingsPayloadField?: string;
  settingsTypes?: SettingsTypeDefinition[];
}

export interface EntityContractContext {
  tenantRootGroupId?: string;
}

export interface EntityTypeExamples {
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}

// Settings type definitions for polymorphic entities (e.g., Signal with different settings types)

export interface SettingsFieldDefinition {
  key: string;
  dtoName?: string;
  type: DefinitionFieldType;
  description: string;
  entityPath?: string;
  required?: boolean;
  enumValues?: string[];
}

export interface SettingsTypeDefinition {
  key: string;
  description: string;
  fields: SettingsFieldDefinition[];
  example?: Record<string, unknown>;
}

// Union type for all type definitions
export type TypeDefinition = EntityTypeDefinition | SettingsTypeDefinition;
