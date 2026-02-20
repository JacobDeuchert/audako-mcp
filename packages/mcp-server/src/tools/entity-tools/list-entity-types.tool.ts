import { listEntityTypeDefinitions } from '../../entity-type-definitions/index.js';
import { logger } from '../../services/logger.js';
import { defineTool } from '../registry.js';
import { toTextResponse } from '../helpers.js';

export const toolDefinitions = [
  defineTool({
    name: 'list-entity-types',
    config: {
      description: 'List supported configuration entity types that can be created or updated.',
      inputSchema: {},
    },
    handler: async () => {
      const definitions = listEntityTypeDefinitions();
      await logger.trace('list-entity-types', 'returning supported entity types', {
        count: definitions.length,
      });

      const payload = definitions.map(definition => ({
        key: definition.key,
        aliases: definition.aliases ?? [],
        entityType: definition.entityType,
        description: definition.description,
        fieldCount: definition.fields.length,
      }));

      return toTextResponse(payload);
    },
  }),
];
