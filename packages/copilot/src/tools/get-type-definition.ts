// Import type files to trigger self-registration
import '../entity-type-definitions/Signal/contract.js';
import '../entity-type-definitions/Group/contract.js';

import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import type {
  EntityFieldDefinition,
  EntityTypeDefinition,
  TypeDefinition,
} from '../entity-type-definitions/types.js';
import { listTypeKeys, resolveType } from '../services/type-registry.js';
import { toErrorResponse, toTextResponse } from './helpers.js';

const getTypeDefinitionSchema = Type.Object({
  typeKey: Type.String({
    description: "Type key to resolve, for example 'Signal' or 'DigitalSettings'.",
  }),
});

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isEntityTypeDefinition(def: TypeDefinition): def is EntityTypeDefinition {
  return 'entityType' in def;
}

function getExtendedInfoContent(def: TypeDefinition): string | undefined {
  return def.extendedInfo || undefined;
}

function generateSchema(def: TypeDefinition): object {
  const fields = def.fields;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const field of fields) {
    const fieldSchema: Record<string, unknown> = {
      description: field.description,
    };

    if (field.type === 'enum') {
      fieldSchema.type = 'string';
      fieldSchema.enum = field.enumValues;
    } else if (field.type === 'polymorphic') {
      fieldSchema.type = 'object';
      const entityField = field as EntityFieldDefinition;
      if (entityField.polymorphic) {
        // fieldSchema.discriminatorField = entityField.polymorphic.discriminatorField;
        fieldSchema.availableTypes = [...new Set(Object.values(entityField.polymorphic.mapping))];
      }
    } else {
      fieldSchema.type = field.type;
    }

    const fieldKey = field.dtoName ?? field.key;
    properties[fieldKey] = fieldSchema;

    if ('requiredOnCreate' in field && field.requiredOnCreate) {
      required.push(fieldKey);
    } else if ('required' in field && field.required) {
      required.push(fieldKey);
    }
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

function toXmlFormat(def: TypeDefinition): string {
  const name = def.key;
  const aliases =
    isEntityTypeDefinition(def) && def.aliases?.length ? def.aliases.join(', ') : undefined;
  const generalInfo = getExtendedInfoContent(def);
  const schema = JSON.stringify(generateSchema(def), null, 2);

  const aliasesTag = aliases ? `\n  <aliases>${escapeXml(aliases)}</aliases>` : '';
  const generalInfoTag = generalInfo
    ? `\n  <generalInfo>\n${escapeXml(generalInfo)}\n  </generalInfo>`
    : '';

  return `<typeDefinition name="${escapeXml(name)}">
  ${aliasesTag}${generalInfoTag}
  <schema>
${escapeXml(schema)}
  </schema>
</typeDefinition>`;
}

export const getTypeDefinitionTool: AgentTool<typeof getTypeDefinitionSchema> = {
  name: 'get_type_definition',
  label: 'Get Type Definition',
  description:
    'Return the field definition for an entity type or settings type, including required fields and enum options.',
  parameters: getTypeDefinitionSchema,
  execute: async (_toolCallId, { typeKey }) => {
    const definition = resolveType(typeKey);
    if (!definition) {
      const validTypeKeys = listTypeKeys();
      return toErrorResponse(`Unknown type key '${typeKey}'.`, {
        validTypeKeys,
      });
    }

    return toTextResponse(toXmlFormat(definition));
  },
};
