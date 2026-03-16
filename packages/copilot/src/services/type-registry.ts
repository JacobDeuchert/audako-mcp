import type { TypeDefinition } from '../entity-type-definitions/types.js';

const typeRegistry = new Map<string, TypeDefinition>();

function normalizeTypeKey(value: string): string {
  return value.trim().toLowerCase();
}

function getAllKeys(def: TypeDefinition): string[] {
  const keys = [def.key];
  if ('aliases' in def && def.aliases) {
    keys.push(...def.aliases);
  }
  if ('entityType' in def && def.entityType) {
    keys.push(def.entityType);
  }
  return keys;
}

export function registerType(def: TypeDefinition): void {
  const keys = getAllKeys(def);
  for (const key of keys) {
    const normalizedKey = normalizeTypeKey(key);
    if (typeRegistry.has(normalizedKey)) {
      throw new Error(`Type key "${key}" (from type "${def.key}") is already registered.`);
    }
  }
  for (const key of keys) {
    typeRegistry.set(normalizeTypeKey(key), def);
  }
}

export function resolveType(key: string): TypeDefinition | undefined {
  return typeRegistry.get(normalizeTypeKey(key));
}

export function listTypes(): TypeDefinition[] {
  const seen = new Set<string>();
  const result: TypeDefinition[] = [];
  for (const def of typeRegistry.values()) {
    if (!seen.has(def.key)) {
      seen.add(def.key);
      result.push(def);
    }
  }
  return result.sort((a, b) => a.key.localeCompare(b.key));
}

export function listTypeKeys(): string[] {
  return listTypes().map(def => def.key);
}
