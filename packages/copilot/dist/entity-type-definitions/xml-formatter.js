function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function isEntityTypeDefinition(def) {
    return 'entityType' in def;
}
function generateSchema(def) {
    const fields = def.fields;
    const properties = {};
    const required = [];
    for (const field of fields) {
        const fieldSchema = {
            description: field.description,
        };
        if (field.type === 'enum') {
            fieldSchema.type = 'string';
            fieldSchema.enum = field.enumValues;
        }
        else if (field.type === 'polymorphic') {
            fieldSchema.type = 'object';
            if ('polymorphic' in field && field.polymorphic) {
                fieldSchema.polymorphic = field.polymorphic;
            }
        }
        else {
            fieldSchema.type = field.type;
        }
        const fieldKey = field.dtoName ?? field.key;
        properties[fieldKey] = fieldSchema;
        if ('requiredOnCreate' in field && field.requiredOnCreate) {
            required.push(fieldKey);
        }
        else if ('required' in field && field.required) {
            required.push(fieldKey);
        }
    }
    return {
        type: 'object',
        properties,
        required,
    };
}
function getExtendedInfoContent(def) {
    if (!def.extendedInfo) {
        return '';
    }
    if (typeof def.extendedInfo === 'string') {
        return def.extendedInfo;
    }
    if (def.extendedInfo.type === 'string') {
        return def.extendedInfo.content;
    }
    return '';
}
export function toXmlFormat(def) {
    const name = def.key;
    const aliases = isEntityTypeDefinition(def) && def.aliases ? def.aliases.join(', ') : '';
    const generalInfo = getExtendedInfoContent(def);
    const schema = JSON.stringify(generateSchema(def), null, 2);
    return `<typeDefinition>
  <name>${escapeXml(name)}</name>
  <aliases>${escapeXml(aliases)}</aliases>
  <generalInfo>
${escapeXml(generalInfo)}
  </generalInfo>
  <schema>
${escapeXml(schema)}
  </schema>
</typeDefinition>`;
}
//# sourceMappingURL=xml-formatter.js.map