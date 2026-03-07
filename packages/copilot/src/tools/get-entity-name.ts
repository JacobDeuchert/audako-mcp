import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import { EntityType } from 'audako-core';
import type { AudakoServices } from '../services/audako-services.js';
import { toErrorResponse, toTextResponse } from './helpers.js';

const getEntityNameSchema = Type.Object({
  entityType: Type.String({ description: "Entity type name, for example 'Signal' or 'Group'." }),
  entityId: Type.String({ description: 'The ID of the entity to resolve.' }),
});

const supportedEntityTypes = Object.values(EntityType) as EntityType[];

function resolveEntityType(entityType: string): EntityType | undefined {
  const normalizedEntityType = entityType.trim().toLowerCase();
  return supportedEntityTypes.find(value => value.toLowerCase() === normalizedEntityType);
}

export function createGetEntityNameTool(
  audakoServices: AudakoServices,
): AgentTool<typeof getEntityNameSchema> {
  return {
    name: 'get_entity_name',
    label: 'Get Entity Name',
    description: 'Get an entity name by entity type and entity ID.',
    parameters: getEntityNameSchema,
    execute: async (_toolCallId, { entityType, entityId }) => {
      const normalizedEntityId = entityId.trim();
      const resolvedEntityType = resolveEntityType(entityType);

      if (!normalizedEntityId) {
        return toErrorResponse("'entityId' must be a non-empty string.");
      }

      if (!resolvedEntityType) {
        const normalizedEntityType = entityType.trim();
        const sortedSupportedEntityTypes = [...supportedEntityTypes].sort((a, b) =>
          a.localeCompare(b),
        );

        return toErrorResponse(`Unsupported entity type '${normalizedEntityType || entityType}'.`, {
          supportedTypes: sortedSupportedEntityTypes,
        });
      }

      try {
        const entity = await audakoServices.entityService.getPartialEntityById<any>(
          resolvedEntityType,
          normalizedEntityId,
          { Name: 1 },
        );

        const entityName = typeof entity?.Name?.Value === 'string' ? entity.Name.Value : '';
        return toTextResponse(entityName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toErrorResponse(`Failed to resolve entity name: ${errorMessage}`);
      }
    },
  };
}
