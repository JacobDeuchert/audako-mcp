import { groupEntityContract } from './group.contract.js';
import { signalEntityContract } from './signal.contract.js';
const entityTypeContracts = [
    groupEntityContract,
    signalEntityContract,
];
function normalizeEntityType(value) {
    return value.trim().toLowerCase();
}
function getContractKeys(contract) {
    return [contract.key, contract.entityType, ...(contract.aliases ?? [])];
}
export function listEntityTypeDefinitions() {
    return entityTypeContracts.map(contract => contract.getDefinition());
}
export function getSupportedEntityTypeNames() {
    return entityTypeContracts.map(contract => contract.key).sort((a, b) => a.localeCompare(b));
}
export function resolveEntityTypeContract(entityType) {
    const normalized = normalizeEntityType(entityType);
    return entityTypeContracts.find(contract => getContractKeys(contract).map(normalizeEntityType).includes(normalized));
}
//# sourceMappingURL=index.js.map