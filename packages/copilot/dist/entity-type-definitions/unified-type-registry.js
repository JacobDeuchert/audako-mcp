import { groupEntityContract } from './Group/contract.js';
import { signalEntityContract } from './Signal/contract.js';
import { SignalAnalogSettings } from './Signal/settings/analog.settings.js';
import { SignalCounterSettings } from './Signal/settings/counter.settings.js';
import { SignalDigitalSettings } from './Signal/settings/digital.settings.js';
import { SignalUniversalSettings } from './Signal/settings/universal.settings.js';
const typeRegistry = new Map();
const entityContractRegistry = new Map();
const entityTypeContracts = [
    groupEntityContract,
    signalEntityContract,
];
function normalizeTypeKey(value) {
    return value.trim().toLowerCase();
}
function getEntityTypeKeys(def) {
    const keys = [def.key, def.entityType];
    if (def.aliases) {
        keys.push(...def.aliases);
    }
    return keys;
}
function getContractKeys(contract) {
    return [contract.key, contract.entityType, ...(contract.aliases ?? [])];
}
function registerEntityContract(contract) {
    const def = contract.getDefinition();
    const keys = getContractKeys(contract);
    for (const key of keys) {
        const normalizedKey = normalizeTypeKey(key);
        if (typeRegistry.has(normalizedKey)) {
            throw new Error(`Entity type key "${key}" (from entity "${def.key}") is already registered. ` +
                `Collision detected during registration.`);
        }
    }
    for (const key of keys) {
        const normalizedKey = normalizeTypeKey(key);
        typeRegistry.set(normalizedKey, def);
        entityContractRegistry.set(normalizedKey, contract);
    }
}
function initializeEntityTypes() {
    for (const contract of entityTypeContracts) {
        registerEntityContract(contract);
    }
}
export function listEntityTypeDefinitions() {
    return entityTypeContracts.map(contract => contract.getDefinition());
}
export function getSupportedEntityTypeNames() {
    return entityTypeContracts.map(contract => contract.key).sort((a, b) => a.localeCompare(b));
}
export function resolveEntityTypeContract(entityType) {
    return entityContractRegistry.get(normalizeTypeKey(entityType));
}
export function registerSettingsType(def) {
    const normalizedKey = normalizeTypeKey(def.key);
    if (typeRegistry.has(normalizedKey)) {
        throw new Error(`Settings type with key "${def.key}" is already registered. ` +
            `Collision detected during registration.`);
    }
    typeRegistry.set(normalizedKey, def);
}
export function registerEntityType(def) {
    const entityKeys = getEntityTypeKeys(def);
    for (const key of entityKeys) {
        const normalizedKey = normalizeTypeKey(key);
        if (typeRegistry.has(normalizedKey)) {
            throw new Error(`Entity type key "${key}" (from entity "${def.key}") is already registered. ` +
                `Collision detected during registration.`);
        }
    }
    for (const key of entityKeys) {
        const normalizedKey = normalizeTypeKey(key);
        typeRegistry.set(normalizedKey, def);
    }
}
export function resolveTypeDefinition(key) {
    const normalizedKey = normalizeTypeKey(key);
    return typeRegistry.get(normalizedKey);
}
export function listAllTypeKeys() {
    const uniqueKeys = new Set();
    for (const [, def] of typeRegistry.entries()) {
        uniqueKeys.add(def.key);
    }
    return Array.from(uniqueKeys).sort((a, b) => a.localeCompare(b));
}
export function clearTypeRegistry() {
    typeRegistry.clear();
    entityContractRegistry.clear();
}
export function getTypeRegistrySize() {
    return typeRegistry.size;
}
initializeEntityTypes();
registerSettingsType(SignalAnalogSettings);
registerSettingsType(SignalDigitalSettings);
registerSettingsType(SignalCounterSettings);
registerSettingsType(SignalUniversalSettings);
//# sourceMappingURL=unified-type-registry.js.map