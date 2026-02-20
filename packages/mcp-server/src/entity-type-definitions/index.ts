import { BaseEntityContract } from './base-entity.contract.js';
import { groupEntityContract } from './group.contract.js';
import { signalEntityContract } from './signal.contract.js';
import { EntityTypeDefinition } from './types.js';

const entityTypeContracts: BaseEntityContract<any, any, any>[] = [
  groupEntityContract,
  signalEntityContract,
];

function normalizeEntityType(value: string): string {
  return value.trim().toLowerCase();
}

function getContractKeys(contract: BaseEntityContract<any, any, any>): string[] {
  return [contract.key, contract.entityType, ...(contract.aliases ?? [])];
}

export function listEntityTypeDefinitions(): EntityTypeDefinition[] {
  return entityTypeContracts.map(contract => contract.getDefinition());
}

export function getSupportedEntityTypeNames(): string[] {
  return entityTypeContracts.map(contract => contract.key).sort((a, b) => a.localeCompare(b));
}

export function resolveEntityTypeContract(
  entityType: string,
): BaseEntityContract<any, any, any> | undefined {
  const normalized = normalizeEntityType(entityType);

  return entityTypeContracts.find(contract =>
    getContractKeys(contract).map(normalizeEntityType).includes(normalized),
  );
}
