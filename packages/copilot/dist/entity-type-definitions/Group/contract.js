import { EntityType, EntityUtils, Field, Group } from 'audako-core';
import { registerType } from '../../services/type-registry.js';
import { ConfigurationEntityContract, configurationEntityFieldDefinitions, } from '../base-entity.contract.js';
import { registerContract } from '../contract-registry.js';
import { buildZodSchemaFromFieldDefinitions } from '../zod-utils.js';
const DEFAULT_GROUP_TYPE = 'Default';
const groupFieldDefinitions = [
    ...configurationEntityFieldDefinitions,
    {
        key: 'type',
        dtoName: 'type',
        description: 'Can be set to Default or DigitalTwin. DigitalTwins are for maintenance objects. Set to default if asked otherwise.',
        type: 'string',
        entityPath: 'Type',
        requiredOnCreate: false,
    },
    {
        key: 'isEntryPoint',
        dtoName: 'isEntryPoint',
        description: 'Whether this group is an entry point',
        type: 'boolean',
        entityPath: 'IsEntryPoint',
        requiredOnCreate: false,
    },
    {
        key: 'icon',
        dtoName: 'icon',
        description: 'Icon key stored in AdditionalFields.Icon',
        type: 'string',
        entityPath: 'AdditionalFields.Icon',
        additionalFieldKey: 'Icon',
        requiredOnCreate: false,
    },
    {
        key: 'position',
        dtoName: 'position',
        description: 'Position value stored in AdditionalFields.Position',
        type: 'string',
        entityPath: 'AdditionalFields.Position',
        additionalFieldKey: 'Position',
        requiredOnCreate: false,
    },
];
const groupCreateSchema = buildZodSchemaFromFieldDefinitions(groupFieldDefinitions, 'create');
const groupUpdateSchema = buildZodSchemaFromFieldDefinitions(groupFieldDefinitions, 'update').refine(value => Object.keys(value).length > 0, {
    message: "At least one field must be provided in 'changes'.",
});
class GroupEntityContract extends ConfigurationEntityContract {
    key = 'Group';
    aliases = ['group'];
    entityType = EntityType.Group;
    description = 'Audako group configuration entity';
    examples = {
        create: {
            type: DEFAULT_GROUP_TYPE,
            icon: 'mat-alarm',
        },
        update: {
            icon: 'mat-folder',
        },
    };
    extendedInfo = undefined;
    createSchema = groupCreateSchema;
    updateSchema = groupUpdateSchema;
    fieldDefinitions = groupFieldDefinitions;
    fromCreatePayload(payload, context) {
        const model = { ...payload };
        this.applyConfigurationEntityContext(model, context);
        if (!model.type) {
            model.type = DEFAULT_GROUP_TYPE;
        }
        return this.toGroup(model);
    }
    fromUpdatedPayload(existingEntity, changes, context) {
        const model = this.toGroupModel(existingEntity);
        Object.assign(model, changes);
        this.applyConfigurationEntityContext(model, context);
        if (!model.type) {
            model.type = DEFAULT_GROUP_TYPE;
        }
        return this.toGroup(model, existingEntity);
    }
    toPayload(entity) {
        return this.toGroupModel(entity);
    }
    toGroupModel(group) {
        const model = {};
        this.setBaseEntityModelProperties(model, group);
        for (const field of this.fieldDefinitions) {
            const dtoFieldName = this.getDtoFieldName(field);
            const value = this.getGroupFieldValue(group, field);
            this.setModelValueIfDefined(model, dtoFieldName, value);
        }
        return model;
    }
    toGroup(model, baseGroup) {
        const group = baseGroup ? this.cloneGroup(baseGroup) : new Group();
        const modelValues = model;
        this.applyBaseEntityProperties(group, model);
        for (const field of this.fieldDefinitions) {
            const dtoFieldName = this.getDtoFieldName(field);
            const value = modelValues[dtoFieldName];
            if (typeof value === 'undefined') {
                continue;
            }
            if (field.additionalFieldKey) {
                this.setAdditionalFieldValue(group, field.additionalFieldKey, value);
                continue;
            }
            if (!field.entityPath) {
                continue;
            }
            EntityUtils.setPropertyValue(group, field.entityPath, value, field.isEntityField);
        }
        return group;
    }
    getGroupFieldValue(group, field) {
        if (field.additionalFieldKey) {
            return this.getAdditionalFieldValue(group, field.additionalFieldKey);
        }
        if (!field.entityPath) {
            return undefined;
        }
        return EntityUtils.getPropertyValue(group, field.entityPath, field.isEntityField);
    }
    getAdditionalFieldValue(group, key) {
        const value = group.AdditionalFields?.[key]?.Value;
        if (typeof value === 'undefined' || value === null) {
            return undefined;
        }
        return value;
    }
    setAdditionalFieldValue(group, key, value) {
        if (typeof value === 'undefined' || value === null) {
            return;
        }
        group.AdditionalFields = group.AdditionalFields ?? {};
        group.AdditionalFields[key] = new Field(String(value));
    }
    cloneGroup(group) {
        const cloned = new Group();
        Object.assign(cloned, group);
        cloned.Path = Array.isArray(group.Path) ? [...group.Path] : [];
        cloned.AdditionalFields = {
            ...(group.AdditionalFields ?? {}),
        };
        return cloned;
    }
}
export const groupEntityContract = new GroupEntityContract();
registerType(groupEntityContract.getDefinition());
registerContract(groupEntityContract);
//# sourceMappingURL=contract.js.map