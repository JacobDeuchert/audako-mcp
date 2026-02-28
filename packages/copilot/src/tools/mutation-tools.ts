import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { InlineMutationPermissionRequestHub } from '../services/inline-mutation-permissions.js';
import type { MutationPermissionsStore } from '../services/mutation-permissions.js';
import { createCreateEntityTool } from './create-entity.js';
import { createMoveEntityTool } from './move-entity.js';
import { createUpdateEntityTool } from './update-entity.js';

interface SessionContextLike {
  getSessionId(): string;
  getGroupId(): string | undefined;
}

interface AudakoServicesLike {
  entityData: {
    create(entityType: string, payload: Record<string, unknown>): Promise<Record<string, unknown>>;
    update(
      entityType: string,
      entityId: string,
      changes: Record<string, unknown>,
    ): Promise<Record<string, unknown>>;
  };
  group: {
    moveEntity(
      entityType: string,
      entityId: string,
      targetGroupId: string,
    ): Promise<{ fromGroupId?: string; toGroupId?: string }>;
  };
}

interface MutationThrottleLike {
  execute?(handler: () => Promise<unknown> | unknown): Promise<unknown>;
  run?(handler: () => Promise<unknown> | unknown): Promise<unknown>;
}

interface ScopeGuardLike {
  validate(groupId: string | undefined, entityType: string): Promise<void> | void;
}

interface EventHubLike {
  publish(sessionId: string, event: { type: string; timestamp: string; payload: unknown }): unknown;
}

export function createMutationTools(
  sessionContext: SessionContextLike,
  audakoServices: AudakoServicesLike,
  mutationThrottle: MutationThrottleLike,
  scopeGuard: ScopeGuardLike,
  permissions: MutationPermissionsStore,
  eventHub: EventHubLike,
  requestHub: InlineMutationPermissionRequestHub,
): AgentTool<any>[] {
  return [
    createCreateEntityTool({
      sessionContext,
      audakoServices,
      mutationThrottle,
      scopeGuard,
      permissions,
      eventHub,
      requestHub,
    }),
    createUpdateEntityTool({
      sessionContext,
      audakoServices,
      mutationThrottle,
      scopeGuard,
      permissions,
      eventHub,
      requestHub,
    }),
    createMoveEntityTool({
      sessionContext,
      audakoServices,
      mutationThrottle,
      scopeGuard,
      permissions,
      eventHub,
      requestHub,
    }),
  ];
}
