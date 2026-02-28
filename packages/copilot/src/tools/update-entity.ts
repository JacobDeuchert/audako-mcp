import type { AgentTool } from '@mariozechner/pi-agent-core';
import { resolveEntityTypeContract } from '../entity-type-definitions/index.js';
import type { InlineMutationPermissionRequestHub } from '../services/inline-mutation-permissions.js';
import { ensureInlineMutationPermission } from '../services/inline-mutation-permissions.js';
import type { MutationPermissionsStore } from '../services/mutation-permissions.js';
import { updateEntitySchema } from './schemas.js';

type AgentSchema<T> = T & any;
type PermissionMode = 'interactive' | 'fail_fast';

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
  publish(
    sessionId: string,
    event: {
      type: 'entity.updated';
      timestamp: string;
      payload: {
        entityType: string;
        entityId: string;
        changes: Record<string, unknown>;
      };
    },
  ): unknown;
}

interface AudakoServicesLike {
  entityData: {
    update(
      entityType: string,
      entityId: string,
      changes: Record<string, unknown>,
    ): Promise<UpdateEntityResult>;
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

export function createUpdateEntityTool(
  deps: UpdateEntityToolDependencies,
): AgentTool<AgentSchema<typeof updateEntitySchema>> {
  return {
    name: 'audako_mcp_update_entity',
    label: 'Update Entity',
    description: 'Update an existing configuration entity with partial changes.',
    parameters: updateEntitySchema,
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

      const updatedEntity = await runInMutationThrottle(deps.mutationThrottle, async () => {
        const contract = resolveEntityTypeContract(params.entityType);
        if (!contract) {
          throw new Error(`Unsupported entity type '${params.entityType}'.`);
        }

        const validationErrors = contract.validate(params.changes, 'update');
        if (validationErrors.length > 0) {
          throw new Error(`Entity update validation failed: ${validationErrors.join('; ')}`);
        }

        return deps.audakoServices.entityData.update(
          params.entityType,
          params.entityId,
          params.changes,
        );
      });

      const entityId = updatedEntity.id ?? updatedEntity.Id ?? params.entityId;

      deps.eventHub.publish(sessionId, {
        type: 'entity.updated',
        timestamp: new Date().toISOString(),
        payload: {
          entityType: params.entityType,
          entityId,
          changes: params.changes,
        },
      });

      return {
        content: [{ type: 'text', text: `Updated ${params.entityType} with ID ${entityId}` }],
        details: {
          entityType: params.entityType,
          entityId,
        },
      };
    },
  };
}
