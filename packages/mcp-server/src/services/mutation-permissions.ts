export interface PermissionContextEntry {
  key: string;
  value: string;
}

export interface PermissionScope {
  toolName: string;
  context: PermissionContextEntry[];
}

const sessionPermissionGrants = new Set<string>();

function normalizePermissionContextEntry(entry: PermissionContextEntry): PermissionContextEntry {
  const key = entry.key.trim().toLowerCase();
  const value = entry.value.trim();

  if (!key) {
    throw new Error('Permission context key must be a non-empty string.');
  }

  if (!value) {
    throw new Error(`Permission context value for key '${key}' must be a non-empty string.`);
  }

  return { key, value };
}

function normalizePermissionScope(scope: PermissionScope): PermissionScope {
  const normalizedToolName = scope.toolName.trim();
  if (!normalizedToolName) {
    throw new Error('Permission scope toolName must be a non-empty string.');
  }

  if (!Array.isArray(scope.context) || scope.context.length === 0) {
    throw new Error('Permission scope context must contain at least one key/value entry.');
  }

  const normalizedContext = scope.context.map(normalizePermissionContextEntry).sort((a, b) => {
    if (a.key === b.key) {
      return a.value.localeCompare(b.value);
    }

    return a.key.localeCompare(b.key);
  });

  return {
    toolName: normalizedToolName,
    context: normalizedContext,
  };
}

function buildScopeFingerprint(scope: PermissionScope): string {
  return scope.context.map(entry => `${entry.key}=${entry.value}`).join('::');
}

function buildScopeKey(scope: PermissionScope): string {
  return `${scope.toolName}::${buildScopeFingerprint(scope)}`;
}

export function hasSessionPermission(scope: PermissionScope): boolean {
  const normalizedScope = normalizePermissionScope(scope);
  const key = buildScopeKey(normalizedScope);
  return sessionPermissionGrants.has(key);
}

export function grantSessionPermission(scope: PermissionScope): void {
  const normalizedScope = normalizePermissionScope(scope);
  const key = buildScopeKey(normalizedScope);
  sessionPermissionGrants.add(key);
}

export function userHasPermission(scope: PermissionScope): boolean {
  return hasSessionPermission(scope);
}
