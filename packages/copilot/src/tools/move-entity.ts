// Import type files to trigger self-registration
import '../entity-type-definitions/Signal/contract.js';
import '../entity-type-definitions/Group/contract.js';

import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import { resolveContract } from '../entity-type-definitions/contract-registry.js';
import { normalizePermissionMode } from '../services/permission-service.js';
import type { MutationToolDependencies } from './mutation-tools.js';

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

export function createMoveEntityTool(
  deps: MutationToolDependencies,
): AgentTool<
  typeof moveEntitySchema,
  { entityType: string; entityId: string; sourceGroupId?: string; targetGroupId: string }
> {
  return {
    name: 'move_entity',
    label: 'Move Entity',
    description: 'Move an entity to another group.',
    parameters: moveEntitySchema,
    execute: async (_toolCallId, params) => {
      const sessionId = deps.sessionId;
      const contract = resolveContract(params.entityType);
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

      const existingEntity = await deps.audakoServices.entityService.getPartialEntityById(
        contract.entityType,
        params.entityId,
        { GroupId: 1 },
      );
      const currentGroupId = (existingEntity as Record<string, unknown>).GroupId;

      await deps.mutationThrottle.run(async () => {
        await deps.audakoServices.entityService.moveTo(
          params.entityId,
          params.targetGroupId,
          contract.entityType,
        );
      });

      const sourceGroupId = typeof currentGroupId === 'string' ? currentGroupId : undefined;
      const targetGroupId = params.targetGroupId;

      deps.eventHub.publish(sessionId, {
        type: 'entity.moved',
        sessionId,
        timestamp: new Date().toISOString(),
        payload: {
          entityType: contract.entityType,
          entityId: params.entityId,
          sourceGroupId,
          targetGroupId,
          metadata: {
            tenantId: deps.sessionContext.tenantId,
            sourceTool: 'move-entity',
            timestamp: new Date().toISOString(),
          },
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
          sourceGroupId,
          targetGroupId,
        },
      };
    },
  };
}
