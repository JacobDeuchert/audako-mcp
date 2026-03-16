// Import type files to trigger self-registration
import '../entity-type-definitions/Signal/contract.js';
import '../entity-type-definitions/Group/contract.js';

import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import type { EntityTypeDefinition } from '../entity-type-definitions/types.js';
import { listTypes } from '../services/type-registry.js';
import { toTextResponse } from './helpers.js';

const listEntityTypesSchema = Type.Object({}, { additionalProperties: false });

export const listEntityTypesTool: AgentTool<typeof listEntityTypesSchema> = {
  name: 'list_entity_types',
  label: 'List Entity Types',
  description: 'List supported configuration entity types that can be created or updated.',
  parameters: listEntityTypesSchema,
  execute: async () => {
    const definitions = listTypes();
    const payload = definitions
      .filter((def): def is EntityTypeDefinition => 'entityType' in def)
      .map(definition => ({
        key: definition.key,
        aliases: definition.aliases ?? [],
        entityType: definition.entityType,
        description: definition.description,
      }));

    return toTextResponse(payload);
  },
};
