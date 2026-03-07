import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { InlineMutationPermissionRequestHub } from '../services/inline-mutation-permissions.js';
import type { MutationPermissionsStore } from '../services/mutation-permissions.js';
declare const createEntitySchema: import("@sinclair/typebox").TObject<{
    entityType: import("@sinclair/typebox").TString;
    payload: import("@sinclair/typebox").TObject<{}>;
    permissionMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"interactive">, import("@sinclair/typebox").TLiteral<"fail_fast">]>>;
}>;
type CreateEntityResult = {
    id?: string;
    Id?: string;
    [key: string]: unknown;
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
        type: 'entity.created';
        timestamp: string;
        payload: {
            entityType: string;
            entityId: string;
            data: Record<string, unknown>;
        };
    }): unknown;
}
interface AudakoServicesLike {
    entityData: {
        create(entityType: string, payload: Record<string, unknown>): Promise<CreateEntityResult>;
    };
}
export interface CreateEntityToolDependencies {
    sessionContext: SessionContextLike;
    audakoServices: AudakoServicesLike;
    mutationThrottle: MutationThrottleLike;
    scopeGuard: ScopeGuardLike;
    permissions: MutationPermissionsStore;
    eventHub: EventHubLike;
    requestHub: InlineMutationPermissionRequestHub;
}
export declare function createCreateEntityTool(deps: CreateEntityToolDependencies): AgentTool<typeof createEntitySchema, {
    entityType: string;
    entityId: string;
}>;
export {};
//# sourceMappingURL=create-entity.d.ts.map