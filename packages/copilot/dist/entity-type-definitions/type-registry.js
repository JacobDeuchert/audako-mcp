const typeRegistry = new Map();
const entityContractRegistry = new Map();
function normalizeTypeKey(value) {
    return value.trim().toLowerCase();
}
function getAllKeys(def) {
    const keys = [def.key];
    if ('aliases' in def && def.aliases) {
        keys.push(...def.aliases);
    }
    if ('entityType' in def && def.entityType) {
        keys.push(def.entityType);
    }
    return keys;
}
export function registerType(def) {
    const keys = getAllKeys(def);
    for (const key of keys) {
        const normalizedKey = normalizeTypeKey(key);
        if (typeRegistry.has(normalizedKey)) {
            throw new Error(`Type key "${key}" (from type "${def.key}") is already registered. ` +
                `Collision detected during registration.`);
        }
    }
    for (const key of keys) {
        const normalizedKey = normalizeTypeKey(key);
        typeRegistry.set(normalizedKey, def);
    }
}
export function registerEntityContract(contract) {
    const def = contract.getDefinition();
    const keys = [contract.key, contract.entityType, ...(contract.aliases ?? [])];
    for (const key of keys) {
        const normalizedKey = normalizeTypeKey(key);
        if (entityContractRegistry.has(normalizedKey)) {
            throw new Error(`Entity contract key "${key}" (from contract "${def.key}") is already registered. ` +
                `Collision detected during registration.`);
        }
    }
    for (const key of keys) {
        const normalizedKey = normalizeTypeKey(key);
        entityContractRegistry.set(normalizedKey, contract);
    }
}
export function resolveEntityContract(entityType) {
    return entityContractRegistry.get(normalizeTypeKey(entityType));
}
export function resolveType(key) {
    return typeRegistry.get(normalizeTypeKey(key));
}
export function listTypes() {
    const seen = new Set();
    const result = [];
    for (const def of typeRegistry.values()) {
        if (!seen.has(def.key)) {
            seen.add(def.key);
            result.push(def);
        }
    }
    return result.sort((a, b) => a.key.localeCompare(b.key));
}
export function listTypeKeys() {
    return listTypes().map(def => def.key);
}
export function clearTypeRegistry() {
    typeRegistry.clear();
}
export function getTypeRegistrySize() {
    return typeRegistry.size;
}
//# sourceMappingURL=type-registry.js.map