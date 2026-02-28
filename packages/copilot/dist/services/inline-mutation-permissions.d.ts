import type { QuestionRequest } from '@audako/contracts';
import type { MutationPermissionsStore } from './mutation-permissions.js';
export interface InlineMutationPermissionRequestHub {
    create(sessionId: string, request: QuestionRequest): Promise<unknown>;
}
export interface EnsureInlineMutationPermissionInput {
    sessionId: string;
    entityType: string;
    permissionStore: MutationPermissionsStore;
    sessionRequestHub: InlineMutationPermissionRequestHub;
}
export declare function ensureInlineMutationPermission(input: EnsureInlineMutationPermissionInput): Promise<void>;
//# sourceMappingURL=inline-mutation-permissions.d.ts.map