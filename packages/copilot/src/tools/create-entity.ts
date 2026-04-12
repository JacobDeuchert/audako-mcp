// Import type files to trigger self-registration
import '../entity-type-definitions/Signal/contract.js';
import '../entity-type-definitions/Group/contract.js';
import '../entity-type-definitions/DataConnection/contract.js';
import '../entity-type-definitions/DataSource/contract.js';

import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import { createLogger } from '../config/app-config.js';
import { resolveContract } from '../entity-type-definitions/contract-registry.js';
import { normalizePermissionMode } from '../services/permission-service.js';
import type { MutationToolDependencies } from './mutation-tools.js';

const logger = createLogger('create-entity');

const createEntitySchema = Type.Object({
  entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
  payload: Type.Object(
    {},
    {
      additionalProperties: true,
      description:
        'Entity data payload containing all fields for the entity. Use get-type-definition tool to discover available fields for each entity type.',
    },
  ),
  permissionMode: Type.Optional(
    Type.Union([Type.Literal('interactive'), Type.Literal('fail_fast')], {
      description:
        'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
    }),
  ),
});

export function createCreateEntityTool(
  deps: MutationToolDependencies,
): AgentTool<typeof createEntitySchema, { entityType: string; entityId: string }> {
  return {
    name: 'create_entity',
    label: 'Create Entity',
    description:
      'Create a configuration entity. All fields (name, groupId, description, and entity-specific settings) go in the payload object. Use get_entity_definition to discover available fields for each entity type.',
    parameters: createEntitySchema,
    execute: async (_toolCallId, params) => {
      logger.info(
        {
          sessionId: deps.sessionId,
          entityType: params.entityType,
          payload: params.payload,
        },
        'LLM create_entity payload',
      );

      const sessionId = deps.sessionId;
      const contract = resolveContract(params.entityType);
      if (!contract) {
        throw new Error(`Unsupported entity type '${params.entityType}'.`);
      }

      const payload: Record<string, unknown> = {
        ...(params.payload as Record<string, unknown>),
      };

      const resolvedGroupId = typeof payload.groupId === 'string' ? payload.groupId : undefined;

      if (resolvedGroupId && !/^[a-f\d]{24}$/i.test(resolvedGroupId)) {
        throw new Error(
          `Invalid groupId '${resolvedGroupId}'. Must be a valid 24-character MongoDB ObjectId. Use get_session_info to resolve IDs from the current session context.`,
        );
      }

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
        logger.info(
          { entityType: params.entityType, entity: entityToCreate },
          'Sending entity to backend',
        );
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
          groupId:
            typeof createdEntity.GroupId === 'string'
              ? createdEntity.GroupId
              : (resolvedGroupId ?? ''),
          metadata: {
            tenantId: deps.sessionContext.tenantId,
            sourceTool: 'create-entity',
            timestamp: new Date().toISOString(),
          },
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
