export interface MutationPermissionsStore {
    hasPermission(entityType: string): boolean;
    grantPermission(entityType: string): void;
    revokePermission(entityType: string): void;
}
export declare class MutationPermissions implements MutationPermissionsStore {
    private readonly grantedEntityTypes;
    hasPermission(entityType: string): boolean;
    grantPermission(entityType: string): void;
    revokePermission(entityType: string): void;
}
//# sourceMappingURL=mutation-permissions.d.ts.map