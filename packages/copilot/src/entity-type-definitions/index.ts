// Type definitions

// Base contract exports
export {
  ConfigurationEntityContract,
  type ConfigurationEntityModel,
  configurationEntityFieldDefinitions,
} from './base-entity.contract.js';
// Legacy entity contracts (for backward compatibility)
export { groupEntityContract } from './group.contract.js';

// Settings types (barrel export)
export {
  SignalAnalogSettings,
  SignalCounterSettings,
  SignalDigitalSettings,
  SignalUniversalSettings,
} from './settings-types/index.js';
export { signalEntityContract } from './signal.contract.js';
// Type registry functions
export {
  clearTypeRegistry,
  getTypeRegistrySize,
  listAllTypeKeys,
  registerEntityType,
  registerSettingsType,
  resolveTypeDefinition,
} from './type-registry.js';
export type {
  DefinitionFieldType,
  EntityContractContext,
  EntityFieldDefinition,
  EntityTypeDefinition,
  EntityTypeExamples,
  SettingsFieldDefinition,
  SettingsTypeDefinition,
  TypeDefinition,
  ValidationMode,
} from './types.js';

// Utility exports
export { buildZodSchemaFromFieldDefinitions } from './zod-utils.js';
