import type { ConfigurationEntity } from 'audako-core';
import type { ConfigurationEntityContract } from './base-entity.contract.js';

type AnyConfigurationEntityContract = ConfigurationEntityContract<
  ConfigurationEntity,
  Record<string, unknown>,
  Record<string, unknown>
>;

const contractRegistry = new Map<string, AnyConfigurationEntityContract>();

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function registerContract(contract: AnyConfigurationEntityContract): void {
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

export function resolveContract(key: string): AnyConfigurationEntityContract | undefined {
  return contractRegistry.get(normalizeKey(key));
}

export function listContracts(): AnyConfigurationEntityContract[] {
  const seen = new Set<string>();
  const result: AnyConfigurationEntityContract[] = [];
  for (const contract of contractRegistry.values()) {
    const def = contract.getDefinition();
    if (!seen.has(def.key)) {
      seen.add(def.key);
      result.push(contract);
    }
  }
  return result;
}
