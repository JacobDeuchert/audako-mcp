const typeRegistry = new Map();
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
/**
 * Registers a settings type definition.
 * Throws an error if the key is already registered.
 */
export function registerSettingsType(def) {
    const normalizedKey = normalizeTypeKey(def.key);
    if (typeRegistry.has(normalizedKey)) {
        throw new Error(`Settings type with key "${def.key}" is already registered. ` +
            `Collision detected during registration.`);
    }
    typeRegistry.set(normalizedKey, def);
}
/**
 * Registers an entity type definition.
 * Automatically registers any associated settings types.
 * Throws an error if any key is already registered.
 */
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
    if (def.settingsTypes && def.settingsTypes.length > 0) {
        for (const settingsType of def.settingsTypes) {
            registerSettingsType(settingsType);
        }
    }
}
/**
 * Resolves a type definition by key (case-insensitive).
 * Returns undefined if not found.
 */
export function resolveTypeDefinition(key) {
    const normalizedKey = normalizeTypeKey(key);
    return typeRegistry.get(normalizedKey);
}
/**
 * Returns all registered type keys.
 * Returns unique keys in sorted order.
 */
export function listAllTypeKeys() {
    const uniqueKeys = new Set();
    for (const [_, def] of typeRegistry.entries()) {
        if ('entityType' in def) {
            uniqueKeys.add(def.key);
        }
        else {
            uniqueKeys.add(def.key);
        }
    }
    return Array.from(uniqueKeys).sort((a, b) => a.localeCompare(b));
}
/**
 * Clears all registered types.
 * Primarily useful for testing.
 */
export function clearTypeRegistry() {
    typeRegistry.clear();
}
/**
 * Gets the count of registered type entries (including aliases).
 */
export function getTypeRegistrySize() {
    return typeRegistry.size;
}
//# sourceMappingURL=type-registry.js.map