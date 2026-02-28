import type { AgentTool } from '@mariozechner/pi-agent-core';
import { resolveEntityTypeContract } from '../entity-type-definitions/index.js';
import type { InlineMutationPermissionRequestHub } from '../services/inline-mutation-permissions.js';
import { ensureInlineMutationPermission } from '../services/inline-mutation-permissions.js';
import type { MutationPermissionsStore } from '../services/mutation-permissions.js';
import { createEntitySchema } from './schemas.js';

type AgentSchema<T> = T & any;
type PermissionMode = 'interactive' | 'fail_fast';

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
  publish(
    sessionId: string,
    event: {
      type: 'entity.created';
      timestamp: string;
      payload: {
        entityType: string;
        entityId: string;
        data: Record<string, unknown>;
      };
    },
  ): unknown;
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

export function createCreateEntityTool(
  deps: CreateEntityToolDependencies,
): AgentTool<AgentSchema<typeof createEntitySchema>> {
  return {
    name: 'audako_mcp_create_entity',
    label: 'Create Entity',
    description: 'Create a configuration entity with schema-validated payload.',
    parameters: createEntitySchema,
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

      const createdEntity = await runInMutationThrottle(deps.mutationThrottle, async () => {
        const contract = resolveEntityTypeContract(params.entityType);
        if (!contract) {
          throw new Error(`Unsupported entity type '${params.entityType}'.`);
        }

        const validationErrors = contract.validate(params.payload, 'create');
        if (validationErrors.length > 0) {
          throw new Error(`Entity payload validation failed: ${validationErrors.join('; ')}`);
        }

        return deps.audakoServices.entityData.create(params.entityType, params.payload);
      });

      const entityId = createdEntity.id ?? createdEntity.Id;
      if (!entityId) {
        throw new Error('Created entity response did not include an ID.');
      }

      deps.eventHub.publish(sessionId, {
        type: 'entity.created',
        timestamp: new Date().toISOString(),
        payload: {
          entityType: params.entityType,
          entityId,
          data: createdEntity,
        },
      });

      return {
        content: [{ type: 'text', text: `Created ${params.entityType} with ID ${entityId}` }],
        details: {
          entityType: params.entityType,
          entityId,
        },
      };
    },
  };
}
