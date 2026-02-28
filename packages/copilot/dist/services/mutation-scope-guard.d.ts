export type MutationScopeBlockReason = 'missing_context_group' | 'missing_target_group' | 'outside_context_group' | 'target_group_lookup_failed';
interface MutationScopeInput {
    contextGroupId?: string;
    targetGroupId?: string;
}
interface MutationScopeAllowedResult {
    allowed: true;
    contextGroupId: string;
    targetGroupId: string;
    targetGroupPath: string[];
    targetGroupLabel?: string;
}
interface MutationScopeBlockedResult {
    allowed: false;
    reason: MutationScopeBlockReason;
    contextGroupId?: string;
    targetGroupId?: string;
    targetGroupPath?: string[];
    targetGroupLabel?: string;
}
export type MutationScopeResult = MutationScopeAllowedResult | MutationScopeBlockedResult;
export interface PermissionContextEntry {
    key: string;
    value: string;
}
export interface OutOfContextMutationErrorPayload {
    errorCode: 'OUT_OF_CONTEXT_MUTATION';
    message: string;
    requiredAction: 'user_confirmation_required';
    reason: MutationScopeBlockReason;
    tool: string;
    nextAction: 'retry_with_permission_mode_interactive_or_change_context';
    permissionMode: 'fail_fast';
    permissionRequest: {
        tool: string;
        context: PermissionContextEntry[];
        entityType: string;
        entityId?: string;
        entityName?: string;
        targetGroupId?: string;
        targetGroupLabel?: string;
        reason: MutationScopeBlockReason;
    };
}
export interface MutationScopeEntityService {
    getPartialEntityById<T>(entityType: string, id: string, queryParameters: Record<string, unknown>): Promise<T>;
}
export declare function evaluateMutationScope(input: MutationScopeInput, entityService: MutationScopeEntityService): Promise<MutationScopeResult>;
export declare function buildOutOfContextMutationErrorPayload(input: {
    tool: string;
    reason: MutationScopeBlockReason;
    entityType: string;
    entityId?: string;
    entityName?: string;
    targetGroupId?: string;
    targetGroupLabel?: string;
}): OutOfContextMutationErrorPayload;
export {};
//# sourceMappingURL=mutation-scope-guard.d.ts.map