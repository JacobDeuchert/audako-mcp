import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { InlineMutationPermissionRequestHub } from '../services/inline-mutation-permissions.js';
import type { MutationPermissionsStore } from '../services/mutation-permissions.js';
import { createEntitySchema } from './schemas.js';
type AgentSchema<T> = T & any;
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
export declare function createCreateEntityTool(deps: CreateEntityToolDependencies): AgentTool<AgentSchema<typeof createEntitySchema>>;
export {};
//# sourceMappingURL=create-entity.d.ts.map