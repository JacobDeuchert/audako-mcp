import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import {
  getSupportedEntityTypeNames,
  resolveEntityTypeContract,
} from '../entity-type-definitions/entity-type-registry.js';
import { toErrorResponse, toTextResponse } from './helpers.js';

const getEntityDefinitionSchema = Type.Object({
  entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
});

export const getEntityDefinitionTool: AgentTool<typeof getEntityDefinitionSchema> = {
  name: 'get_entity_definition',
  label: 'Get Entity Definition',
  description:
    'Return the field definition for an entity type, including required fields and enum options.',
  parameters: getEntityDefinitionSchema,
  execute: async (_toolCallId, { entityType }) => {
    const contract = resolveEntityTypeContract(entityType);
    if (!contract) {
      const supportedTypes = getSupportedEntityTypeNames();
      return toErrorResponse(`Unsupported entity type '${entityType}'.`, {
        supportedTypes,
      });
    }

    return toTextResponse(contract.getDefinition());
  },
};
