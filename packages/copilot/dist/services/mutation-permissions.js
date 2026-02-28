function normalizeEntityType(entityType) {
    const normalizedEntityType = entityType.trim();
    if (!normalizedEntityType) {
        throw new Error('Entity type must be a non-empty string.');
    }
    return normalizedEntityType;
}
export class MutationPermissions {
    grantedEntityTypes = new Set();
    hasPermission(entityType) {
        return this.grantedEntityTypes.has(normalizeEntityType(entityType));
    }
    grantPermission(entityType) {
        this.grantedEntityTypes.add(normalizeEntityType(entityType));
    }
    revokePermission(entityType) {
        this.grantedEntityTypes.delete(normalizeEntityType(entityType));
    }
}
//# sourceMappingURL=mutation-permissions.js.map