import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import { resolveEntityTypeContract } from '../entity-type-definitions/entity-type-registry.js';
import type { AudakoServices } from '../services/audako-services.js';
import type { MutationThrottle } from '../services/mutation-throttle.js';
import { normalizePermissionMode, type PermissionService } from '../services/permission-service.js';
import type { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';

const moveEntitySchema = Type.Object({
  entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
  entityId: Type.String({ description: 'The ID of the entity to move.' }),
  targetGroupId: Type.String({ description: 'The ID of the destination group.' }),
  permissionMode: Type.Optional(
    Type.Union([Type.Literal('interactive'), Type.Literal('fail_fast')], {
      description:
        'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
    }),
  ),
});

export interface MoveEntityToolDependencies {
  sessionId: string;
  sessionContext: SessionContext;
  audakoServices: AudakoServices;
  mutationThrottle: MutationThrottle;
  permissionService: PermissionService;
  eventHub: SessionEventHub;
}

export function createMoveEntityTool(
  deps: MoveEntityToolDependencies,
): AgentTool<
  typeof moveEntitySchema,
  { entityType: string; entityId: string; fromGroupId: string; toGroupId: string }
> {
  return {
    name: 'move_entity',
    label: 'Move Entity',
    description: 'Move an entity to another group.',
    parameters: moveEntitySchema,
    execute: async (_toolCallId, params) => {
      const sessionId = deps.sessionId;
      const contract = resolveEntityTypeContract(params.entityType);
      if (!contract) {
        throw new Error(`Unsupported entity type '${params.entityType}'.`);
      }

      await deps.permissionService.hasPermission(
        sessionId,
        params.entityType,
        params.targetGroupId,
        normalizePermissionMode(params.permissionMode),
        'move_entity',
      );

      await deps.mutationThrottle.run(async () => {
        await deps.audakoServices.entityService.moveTo(
          params.entityId,
          params.targetGroupId,
          contract.entityType,
        );
      });

      const fromGroupId = deps.sessionContext.groupId ?? params.targetGroupId;
      const toGroupId = params.targetGroupId;

      deps.eventHub.publish(sessionId, {
        type: 'entity.moved',
        sessionId,
        timestamp: new Date().toISOString(),
        payload: {
          entityType: contract.entityType,
          entityId: params.entityId,
          fromGroupId,
          toGroupId,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: `Moved ${contract.entityType} ${params.entityId} to group ${params.targetGroupId}`,
          },
        ],
        details: {
          entityType: contract.entityType,
          entityId: params.entityId,
          fromGroupId,
          toGroupId,
        },
      };
    },
  };
}
