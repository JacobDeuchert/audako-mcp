const contractRegistry = new Map();
function normalizeKey(value) {
    return value.trim().toLowerCase();
}
export function registerContract(contract) {
    const def = contract.getDefinition();
    const keys = [def.key, ...(def.aliases || []), def.entityType];
    for (const key of keys) {
        const normalizedKey = normalizeKey(key);
        if (contractRegistry.has(normalizedKey)) {
            throw new Error(`Contract "${key}" (from "${def.key}") is already registered.`);
        }
    }
    for (const key of keys) {
        contractRegistry.set(normalizeKey(key), contract);
    }
}
export function resolveContract(key) {
    return contractRegistry.get(normalizeKey(key));
}
export function listContracts() {
    const seen = new Set();
    const result = [];
    for (const contract of contractRegistry.values()) {
        const def = contract.getDefinition();
        if (!seen.has(def.key)) {
            seen.add(def.key);
            result.push(contract);
        }
    }
    return result;
}
//# sourceMappingURL=contract-registry.js.map