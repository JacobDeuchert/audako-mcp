import { z } from 'zod';
import {
  getSupportedEntityTypeNames,
  resolveEntityTypeContract,
} from '../../entity-type-definitions/index.js';
import { logger } from '../../services/logger.js';
import { defineTool } from '../registry.js';
import { toErrorResponse, toTextResponse } from '../helpers.js';

export const toolDefinitions = [
  defineTool({
    name: 'get-entity-definition',
    config: {
      description:
        'Return the field definition for an entity type, including required fields and enum options.',
      inputSchema: {
        entityType: z.string().describe("Entity type name, for example 'Signal'."),
      },
    },
    handler: async ({ entityType }) => {
      await logger.trace('get-entity-definition', 'started', { entityType });

      const contract = resolveEntityTypeContract(entityType);
      if (!contract) {
        const supportedTypes = getSupportedEntityTypeNames();
        await logger.warn('get-entity-definition: unsupported entity type', {
          entityType,
          supportedTypes,
        });

        return toErrorResponse(`Unsupported entity type '${entityType}'.`, {
          supportedTypes,
        });
      }

      return toTextResponse(contract.getDefinition());
    },
  }),
];
