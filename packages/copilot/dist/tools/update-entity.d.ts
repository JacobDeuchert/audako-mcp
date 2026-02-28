import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { InlineMutationPermissionRequestHub } from '../services/inline-mutation-permissions.js';
import type { MutationPermissionsStore } from '../services/mutation-permissions.js';
import { updateEntitySchema } from './schemas.js';
type AgentSchema<T> = T & any;
type UpdateEntityResult = {
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
        type: 'entity.updated';
        timestamp: string;
        payload: {
            entityType: string;
            entityId: string;
            changes: Record<string, unknown>;
        };
    }): unknown;
}
interface AudakoServicesLike {
    entityData: {
        update(entityType: string, entityId: string, changes: Record<string, unknown>): Promise<UpdateEntityResult>;
    };
}
export interface UpdateEntityToolDependencies {
    sessionContext: SessionContextLike;
    audakoServices: AudakoServicesLike;
    mutationThrottle: MutationThrottleLike;
    scopeGuard: ScopeGuardLike;
    permissions: MutationPermissionsStore;
    eventHub: EventHubLike;
    requestHub: InlineMutationPermissionRequestHub;
}
export declare function createUpdateEntityTool(deps: UpdateEntityToolDependencies): AgentTool<AgentSchema<typeof updateEntitySchema>>;
export {};
//# sourceMappingURL=update-entity.d.ts.map