// Type definitions
// Base contract exports
export { ConfigurationEntityContract, configurationEntityFieldDefinitions, } from './base-entity.contract.js';
// Documentation loader exports
export { loadMarkdownContent, resolveExtendedInfo, } from './doc-loader.js';
// Legacy entity contracts (for backward compatibility)
export { groupEntityContract } from './Group/contract.js';
export { signalEntityContract } from './Signal/contract.js';
// Settings types (barrel export)
export { SignalAnalogSettings, SignalCounterSettings, SignalDigitalSettings, SignalUniversalSettings, } from './Signal/settings/index.js';
export { clearTypeRegistry, getSupportedEntityTypeNames, getTypeRegistrySize, listAllTypeKeys, listEntityTypeDefinitions, registerEntityType, registerSettingsType, resolveEntityTypeContract, resolveTypeDefinition, } from './unified-type-registry.js';
// Utility exports
export { buildZodSchemaFromFieldDefinitions } from './zod-utils.js';
//# sourceMappingURL=index.js.map