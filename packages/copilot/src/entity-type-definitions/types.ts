import type { EntityType } from 'audako-core';

export type DefinitionFieldType = 'string' | 'number' | 'boolean' | 'enum' | 'polymorphic';
export type ValidationMode = 'create' | 'update';

/**
 * Configuration for polymorphic fields.
 * Maps discriminator values to settings type keys.
 */
export interface PolymorphicFieldConfig {
  /** Field name that determines which settings type to use (e.g., 'type') */
  discriminatorField: string;
  /** Maps discriminator values to settings type keys */
  mapping: Record<string, string>;
}

export interface EntityFieldDefinition {
  key: string;
  dtoName?: string;
  type: DefinitionFieldType;
  description: string;
  entityPath?: string;
  requiredOnCreate?: boolean;
  enumValues?: string[];
  /** Polymorphic configuration (required when type === 'polymorphic') */
  polymorphic?: PolymorphicFieldConfig;
}

export interface EntityTypeDefinition {
  key: string;
  aliases?: string[];
  entityType: EntityType;
  description: string;
  fields: EntityFieldDefinition[];
  extendedInfo?: string;
}

export interface EntityContractContext {
  tenantRootGroupId?: string;
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
  extendedInfo?: string;
}

// Union type for all type definitions
export type TypeDefinition = EntityTypeDefinition | SettingsTypeDefinition;
