import { EntityType } from 'audako-core';
import { z } from 'zod';
import { audakoServices } from '../../services/audako-services.js';
import { logger } from '../../services/logger.js';
import { defineTool } from '../registry.js';
import { toErrorResponse, toTextResponse } from '../helpers.js';

const supportedEntityTypes = Object.values(EntityType) as EntityType[];

function resolveEntityType(entityType: string): EntityType | undefined {
  const normalizedEntityType = entityType.trim().toLowerCase();
  return supportedEntityTypes.find(value => value.toLowerCase() === normalizedEntityType);
}

export const toolDefinitions = [
  defineTool({
    name: 'get-entity-name',
    config: {
      description: 'Get an entity name by entity type and entity ID.',
      inputSchema: {
        entityType: z.string().describe("Entity type name, for example 'Signal' or 'Group'."),
        entityId: z.string().describe('The ID of the entity to resolve.'),
      },
    },
    handler: async ({ entityType, entityId }) => {
      const normalizedEntityId = entityId.trim();
      const resolvedEntityType = resolveEntityType(entityType);

      await logger.trace('get-entity-name', 'started', {
        entityType,
        entityId: normalizedEntityId,
      });

      if (!normalizedEntityId) {
        return toErrorResponse("'entityId' must be a non-empty string.");
      }

      if (!resolvedEntityType) {
        const normalizedEntityType = entityType.trim();
        const sortedSupportedEntityTypes = [...supportedEntityTypes].sort((a, b) =>
          a.localeCompare(b),
        );

        await logger.warn('get-entity-name: unsupported entity type', {
          entityType: normalizedEntityType,
          supportedTypes: sortedSupportedEntityTypes,
        });

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

        await logger.info('get-entity-name: resolved successfully', {
          entityType: resolvedEntityType,
          entityId: normalizedEntityId,
          hasName: entityName.length > 0,
        });

        return toTextResponse(entityName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logger.error('get-entity-name: failed', {
          entityType: resolvedEntityType,
          entityId: normalizedEntityId,
          error: errorMessage,
        });

        return toErrorResponse(`Failed to resolve entity name: ${errorMessage}`);
      }
    },
  }),
];
