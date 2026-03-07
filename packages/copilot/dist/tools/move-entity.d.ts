import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { InlineMutationPermissionRequestHub } from '../services/inline-mutation-permissions.js';
import type { MutationPermissionsStore } from '../services/mutation-permissions.js';
declare const moveEntitySchema: import("@sinclair/typebox").TObject<{
    entityType: import("@sinclair/typebox").TString;
    entityId: import("@sinclair/typebox").TString;
    targetGroupId: import("@sinclair/typebox").TString;
    permissionMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"interactive">, import("@sinclair/typebox").TLiteral<"fail_fast">]>>;
}>;
type MoveEntityResult = {
    fromGroupId?: string;
    toGroupId?: string;
};
interface SessionContextLike {
    getSessionId(): string;
    getGroupId(): string | undefined;
}
interface MutationThrottleLike {
    execute?(handler: () => Promise<unknown> | unknown): Promise<unknown>;
    run?(handler: () => Promise<unknown> | unknown): Promise<unknown>;
}
interface ScopeGuardLike {
    validate(groupId: string | undefined, entityType: string): Promise<void> | void;
}
interface EventHubLike {
    publish(sessionId: string, event: {
        type: 'entity.moved';
        timestamp: string;
        payload: {
            entityType: string;
            entityId: string;
            fromGroupId: string;
            toGroupId: string;
        };
    }): unknown;
}
interface AudakoServicesLike {
    group: {
        moveEntity(entityType: string, entityId: string, targetGroupId: string): Promise<MoveEntityResult>;
    };
}
export interface MoveEntityToolDependencies {
    sessionContext: SessionContextLike;
    audakoServices: AudakoServicesLike;
    mutationThrottle: MutationThrottleLike;
    scopeGuard: ScopeGuardLike;
    permissions: MutationPermissionsStore;
    eventHub: EventHubLike;
    requestHub: InlineMutationPermissionRequestHub;
}
export declare function createMoveEntityTool(deps: MoveEntityToolDependencies): AgentTool<typeof moveEntitySchema, {
    entityType: string;
    entityId: string;
    fromGroupId: string;
    toGroupId: string;
}>;
export {};
//# sourceMappingURL=move-entity.d.ts.map