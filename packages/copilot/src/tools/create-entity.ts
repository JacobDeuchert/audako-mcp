import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import { resolveEntityTypeContract } from '../entity-type-definitions/entity-type-registry.js';
import type { AudakoServices } from '../services/audako-services.js';
import type { MutationThrottle } from '../services/mutation-throttle.js';
import { normalizePermissionMode, type PermissionService } from '../services/permission-service.js';
import type { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';

const createEntitySchema = Type.Object({
  entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
  name: Type.String({ description: 'Name of the entity.' }),
  groupId: Type.String({
    description:
      'Parent group ID. Pass a real group ID or the literal "context" to use group from session context.',
  }),
  description: Type.Optional(Type.String({ description: 'Description of the entity.' })),
  settings: Type.Optional(
    Type.Object(
      {},
      {
        additionalProperties: true,
        description:
          'Entity-type-specific settings. Use get_entity_definition to discover available fields for each entity type.',
      },
    ),
  ),
  permissionMode: Type.Optional(
    Type.Union([Type.Literal('interactive'), Type.Literal('fail_fast')], {
      description:
        'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
    }),
  ),
});

export interface CreateEntityToolDependencies {
  sessionId: string;
  sessionContext: SessionContext;
  audakoServices: AudakoServices;
  mutationThrottle: MutationThrottle;
  permissionService: PermissionService;
  eventHub: SessionEventHub;
}

export function createCreateEntityTool(
  deps: CreateEntityToolDependencies,
): AgentTool<typeof createEntitySchema, { entityType: string; entityId: string }> {
  return {
    name: 'create_entity',
    label: 'Create Entity',
    description:
      'Create a configuration entity. Common fields (name, groupId, description) are top-level parameters. Entity-specific settings go in the settings object.',
    parameters: createEntitySchema,
    execute: async (_toolCallId, params) => {
      const sessionId = deps.sessionId;
      const contract = resolveEntityTypeContract(params.entityType);
      if (!contract) {
        throw new Error(`Unsupported entity type '${params.entityType}'.`);
      }

      // Resolve "context" keyword to tenant root group ID
      let resolvedGroupId = params.groupId;
      if (resolvedGroupId === 'context') {
        const tenantRootGroupId = deps.sessionContext.resolvedTenant?.tenantRootGroupId;
        if (!tenantRootGroupId) {
          throw new Error(
            'groupId is "context" but no tenant root group is available in session context. Ensure a tenant is selected.',
          );
        }
        resolvedGroupId = tenantRootGroupId;
      }

      // Reassemble flat payload from top-level parameters
      const payload: Record<string, unknown> = {
        name: params.name,
        groupId: resolvedGroupId,
        ...(params.description !== undefined ? { description: params.description } : {}),
        ...((params.settings as Record<string, unknown>) ?? {}),
      };

      await deps.permissionService.hasPermission(
        sessionId,
        params.entityType,
        resolvedGroupId,
        normalizePermissionMode(params.permissionMode),
        'create_entity',
      );

      const validationErrors = contract.validate(payload, 'create');
      if (validationErrors.length > 0) {
        throw new Error(`Entity payload validation failed: ${validationErrors.join('; ')}`);
      }

      const createdEntity = await deps.mutationThrottle.run(async () => {
        const entityToCreate = contract.fromPayload(payload);
        return deps.audakoServices.entityService.addEntity(contract.entityType, entityToCreate);
      });

      const entityId = createdEntity.Id;
      if (!entityId) {
        throw new Error('Created entity response did not include an ID.');
      }

      deps.eventHub.publish(sessionId, {
        type: 'entity.created',
        sessionId,
        timestamp: new Date().toISOString(),
        payload: {
          entityType: contract.entityType,
          entityId,
          data: contract.toPayload(createdEntity),
        },
      });

      return {
        content: [{ type: 'text', text: `Created ${contract.entityType} with ID ${entityId}` }],
        details: {
          entityType: contract.entityType,
          entityId,
        },
      };
    },
  };
}
