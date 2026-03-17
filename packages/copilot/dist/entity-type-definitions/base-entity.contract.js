import { EntityUtils } from 'audako-core';
import { existsSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';
import { fileURLToPath } from 'url';
import { loadMarkdownFile } from '../services/doc-loader.js';
import { resolveType } from '../services/type-registry.js';
import { formatZodValidationErrors, validateSettingsPayload } from './zod-utils.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function resolveMarkdownPath(markdownPath) {
    if (isAbsolute(markdownPath)) {
        return markdownPath;
    }
    const candidatePaths = [
        join(__dirname, markdownPath),
        join(__dirname, '..', '..', 'src', 'entity-type-definitions', markdownPath),
        join(process.cwd(), 'src', 'entity-type-definitions', markdownPath),
        join(process.cwd(), 'packages', 'copilot', 'src', 'entity-type-definitions', markdownPath),
    ];
    const existingPath = candidatePaths.find(candidate => existsSync(candidate));
    return existingPath ?? markdownPath;
}
function resolveExtendedInfo(extendedInfo) {
    if (!extendedInfo.toLowerCase().endsWith('.md')) {
        return extendedInfo;
    }
    return loadMarkdownFile(resolveMarkdownPath(extendedInfo));
}
export class BaseEntityContract {
    aliases = [];
    cachedDefinition;
    getDefinition() {
        if (!this.cachedDefinition) {
            this.cachedDefinition = {
                key: this.entityType,
                aliases: this.aliases,
                entityType: this.entityType,
                description: this.description,
                fields: this.fieldDefinitions.map(field => ({
                    key: field.key,
                    dtoName: field.dtoName ?? field.key,
                    type: field.type,
                    description: field.description,
                    entityPath: field.entityPath,
                    requiredOnCreate: field.requiredOnCreate ?? false,
                    enumValues: field.enumValues,
                    polymorphic: field.polymorphic,
                })),
                extendedInfo: typeof this.extendedInfo === 'string'
                    ? resolveExtendedInfo(this.extendedInfo)
                    : undefined,
            };
        }
        return this.cachedDefinition;
    }
    validate(payload, mode) {
        const schema = mode === 'create' ? this.createSchema : this.updateSchema;
        const result = schema.safeParse(payload);
        const errors = [];
        if (!result.success) {
            errors.push(...formatZodValidationErrors(result.error));
        }
        errors.push(...this.validatePolymorphicFields(payload));
        return errors;
    }
    validatePolymorphicFields(payload) {
        const errors = [];
        for (const field of this.fieldDefinitions) {
            if (field.type !== 'polymorphic' || !field.polymorphic)
                continue;
            const dtoFieldName = field.dtoName ?? field.key;
            const fieldValue = payload[dtoFieldName];
            if (fieldValue === undefined || fieldValue === null)
                continue;
            const discriminatorValue = payload[field.polymorphic.discriminatorField];
            if (typeof discriminatorValue !== 'string') {
                errors.push(`Discriminator field '${field.polymorphic.discriminatorField}' is required and must be a string.`);
                continue;
            }
            const settingsTypeKey = field.polymorphic.mapping[discriminatorValue];
            if (!settingsTypeKey) {
                errors.push(`No settings type mapping for ${field.polymorphic.discriminatorField}='${discriminatorValue}'.`);
                continue;
            }
            const settingsTypeDef = resolveType(settingsTypeKey);
            if (!settingsTypeDef || 'entityType' in settingsTypeDef) {
                errors.push(`Settings type '${settingsTypeKey}' not found in type registry.`);
                continue;
            }
            errors.push(...validateSettingsPayload(settingsTypeDef, fieldValue));
        }
        return errors;
    }
    fromPayload(payload, context) {
        const parsedPayload = this.parseCreatePayload(payload);
        return this.fromCreatePayload(parsedPayload, context);
    }
    applyUpdate(existingEntity, changes, context) {
        const parsedChanges = this.parseUpdatePayload(changes);
        return this.fromUpdatedPayload(existingEntity, parsedChanges, context);
    }
    parseCreatePayload(payload) {
        const result = this.createSchema.safeParse(payload);
        if (result.success) {
            return result.data;
        }
        throw new Error(formatZodValidationErrors(result.error).join('; '));
    }
    parseUpdatePayload(payload) {
        const result = this.updateSchema.safeParse(payload);
        if (result.success) {
            return result.data;
        }
        throw new Error(formatZodValidationErrors(result.error).join('; '));
    }
}
export const configurationEntityFieldDefinitions = [
    {
        key: 'name',
        dtoName: 'name',
        description: 'Name of the entity.',
        type: 'string',
        requiredOnCreate: true,
    },
    {
        key: 'description',
        dtoName: 'description',
        description: 'Description of the entity.',
        type: 'string',
        requiredOnCreate: false,
    },
    {
        key: 'groupId',
        dtoName: 'groupId',
        description: 'Parent group ID. Pass a real group ID or the literal "context" to use group from session context.',
        type: 'string',
        requiredOnCreate: true,
    },
];
export class ConfigurationEntityContract extends BaseEntityContract {
    applyConfigurationEntityContext(model, context) {
        if (!model.groupId && context?.tenantRootGroupId) {
            model.groupId = context.tenantRootGroupId;
        }
    }
    setBaseEntityModelProperties(model, entity) {
        this.setModelValueIfDefined(model, 'id', entity.Id);
        this.setModelValueIfDefined(model, 'path', entity.Path ? [...entity.Path] : undefined);
        this.setModelValueIfDefined(model, 'name', EntityUtils.getPropertyValue(entity, 'Name', true));
        this.setModelValueIfDefined(model, 'description', EntityUtils.getPropertyValue(entity, 'Description', true));
        this.setModelValueIfDefined(model, 'groupId', entity.GroupId);
    }
    applyBaseEntityProperties(entity, model) {
        if (typeof model.id !== 'undefined') {
            entity.Id = model.id;
        }
        if (typeof model.path !== 'undefined') {
            entity.Path = [...model.path];
        }
        if (model.name !== undefined) {
            EntityUtils.setPropertyValue(entity, 'Name', model.name, true);
        }
        if (model.description !== undefined) {
            EntityUtils.setPropertyValue(entity, 'Description', model.description, true);
        }
        if (model.groupId !== undefined) {
            entity.GroupId = model.groupId;
        }
    }
    getDtoFieldName(field) {
        return field.dtoName ?? field.key;
    }
    setModelValueIfDefined(model, key, value) {
        if (typeof value === 'undefined' || value === null) {
            return;
        }
        model[key] = Array.isArray(value) ? [...value] : value;
    }
}
//# sourceMappingURL=base-entity.contract.js.map