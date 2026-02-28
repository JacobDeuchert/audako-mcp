export interface MutationPermissionsStore {
  hasPermission(entityType: string): boolean;
  grantPermission(entityType: string): void;
  revokePermission(entityType: string): void;
}

function normalizeEntityType(entityType: string): string {
  const normalizedEntityType = entityType.trim();
  if (!normalizedEntityType) {
    throw new Error('Entity type must be a non-empty string.');
  }

  return normalizedEntityType;
}

export class MutationPermissions implements MutationPermissionsStore {
  private readonly grantedEntityTypes = new Set<string>();

  hasPermission(entityType: string): boolean {
    return this.grantedEntityTypes.has(normalizeEntityType(entityType));
  }

  grantPermission(entityType: string): void {
    this.grantedEntityTypes.add(normalizeEntityType(entityType));
  }

  revokePermission(entityType: string): void {
    this.grantedEntityTypes.delete(normalizeEntityType(entityType));
  }
}
