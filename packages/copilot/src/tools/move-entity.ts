import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { InlineMutationPermissionRequestHub } from '../services/inline-mutation-permissions.js';
import { ensureInlineMutationPermission } from '../services/inline-mutation-permissions.js';
import type { MutationPermissionsStore } from '../services/mutation-permissions.js';
import { moveEntitySchema } from './schemas.js';

type AgentSchema<T> = T & any;
type PermissionMode = 'interactive' | 'fail_fast';

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
  publish(
    sessionId: string,
    event: {
      type: 'entity.moved';
      timestamp: string;
      payload: {
        entityType: string;
        entityId: string;
        fromGroupId: string;
        toGroupId: string;
      };
    },
  ): unknown;
}

interface AudakoServicesLike {
  group: {
    moveEntity(
      entityType: string,
      entityId: string,
      targetGroupId: string,
    ): Promise<MoveEntityResult>;
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

function normalizePermissionMode(mode: unknown): PermissionMode {
  return mode === 'fail_fast' ? 'fail_fast' : 'interactive';
}

async function runInMutationThrottle<T>(
  mutationThrottle: MutationThrottleLike,
  handler: () => Promise<T> | T,
): Promise<T> {
  if (typeof mutationThrottle.execute === 'function') {
    return mutationThrottle.execute(handler) as Promise<T>;
  }

  if (typeof mutationThrottle.run === 'function') {
    return mutationThrottle.run(handler) as Promise<T>;
  }

  return handler();
}

async function ensureMutationPermission(input: {
  sessionId: string;
  entityType: string;
  permissionMode: PermissionMode;
  permissionStore: MutationPermissionsStore;
  sessionRequestHub: InlineMutationPermissionRequestHub;
}): Promise<void> {
  if (input.permissionMode === 'fail_fast') {
    if (!input.permissionStore.hasPermission(input.entityType)) {
      throw new Error(`Mutation blocked: permission denied for ${input.entityType}.`);
    }
    return;
  }

  await ensureInlineMutationPermission({
    sessionId: input.sessionId,
    entityType: input.entityType,
    permissionStore: input.permissionStore,
    sessionRequestHub: input.sessionRequestHub,
  });
}

export function createMoveEntityTool(
  deps: MoveEntityToolDependencies,
): AgentTool<AgentSchema<typeof moveEntitySchema>> {
  return {
    name: 'audako_mcp_move_entity',
    label: 'Move Entity',
    description: 'Move an entity to another group.',
    parameters: moveEntitySchema,
    execute: async (_toolCallId, params) => {
      const sessionId = deps.sessionContext.getSessionId();

      await ensureMutationPermission({
        sessionId,
        entityType: params.entityType,
        permissionMode: normalizePermissionMode(params.permissionMode),
        permissionStore: deps.permissions,
        sessionRequestHub: deps.requestHub,
      });

      await deps.scopeGuard.validate(deps.sessionContext.getGroupId(), params.entityType);

      const moveResult = await runInMutationThrottle(deps.mutationThrottle, async () => {
        return deps.audakoServices.group.moveEntity(
          params.entityType,
          params.entityId,
          params.targetGroupId,
        );
      });

      const fromGroupId =
        moveResult.fromGroupId ?? deps.sessionContext.getGroupId() ?? params.targetGroupId;
      const toGroupId = moveResult.toGroupId ?? params.targetGroupId;

      deps.eventHub.publish(sessionId, {
        type: 'entity.moved',
        timestamp: new Date().toISOString(),
        payload: {
          entityType: params.entityType,
          entityId: params.entityId,
          fromGroupId,
          toGroupId,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: `Moved ${params.entityType} ${params.entityId} to group ${params.targetGroupId}`,
          },
        ],
        details: {
          entityType: params.entityType,
          entityId: params.entityId,
          fromGroupId,
          toGroupId,
        },
      };
    },
  };
}
