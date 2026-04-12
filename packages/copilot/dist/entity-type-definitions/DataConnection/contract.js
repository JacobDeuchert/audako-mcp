import { DataConnectionOpcUaSettings as CoreDataConnectionOpcUaSettings, DataConnection, DataConnectionType, EntityType, EntityUtils, Field, } from 'audako-core';
import { registerType, resolveType } from '../../services/type-registry.js';
import { ConfigurationEntityContract, configurationEntityFieldDefinitions, } from '../base-entity.contract.js';
import { registerContract } from '../contract-registry.js';
import { buildNestedEntitySchema } from '../zod-utils.js';
import './settings/modbus.settings.js';
import './settings/opcua.settings.js';
const dataConnectionTypeEnumValues = Object.values(DataConnectionType).filter(value => typeof value === 'string');
class DataConnectionModbusSettings extends class {
    _t = 'DataConnectionModbusSettings';
    Host = new Field();
    Port = new Field();
    UnitId = new Field();
    Timeout = new Field();
} {
}
const dataConnectionFieldDefinitions = [
    ...configurationEntityFieldDefinitions,
    {
        key: 'dataSourceId',
        dtoName: 'dataSourceId',
        description: 'Data source ID that owns this data connection.',
        type: 'string',
        entityPath: 'DataSourceId',
        isEntityField: true,
        requiredOnCreate: true,
    },
    {
        key: 'type',
        dtoName: 'type',
        description: 'Data connection protocol type.',
        type: 'enum',
        enumValues: dataConnectionTypeEnumValues,
        entityPath: 'Type',
        isEntityField: true,
        requiredOnCreate: true,
    },
    {
        key: 'settings',
        dtoName: 'settings',
        description: 'Protocol-specific settings based on data connection type.',
        type: 'polymorphic',
        entityPath: 'Settings',
        isEntityField: true,
        requiredOnCreate: false,
        polymorphic: {
            discriminatorField: 'type',
            mapping: {
                [DataConnectionType.Modbus]: 'DataConnectionModbusSettings',
                [DataConnectionType.OpcUa]: 'DataConnectionOpcUaSettings',
            },
        },
    },
];
const dataConnectionTypeDefinition = {
    key: 'DataConnection',
    entityType: EntityType.DataConnection,
    description: 'Audako data connection configuration entity',
    fields: dataConnectionFieldDefinitions,
    extendedInfo: 'DataConnection/data-connection.md',
};
const dataConnectionCreateSchema = buildNestedEntitySchema(dataConnectionTypeDefinition, 'create');
const dataConnectionUpdateSchema = buildNestedEntitySchema(dataConnectionTypeDefinition, 'update').refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided in 'changes'.",
});
class DataConnectionEntityContract extends ConfigurationEntityContract {
    key = 'DataConnection';
    aliases = ['dataConnection', 'data-connection'];
    entityType = EntityType.DataConnection;
    description = 'Audako data connection configuration entity';
    extendedInfo = 'DataConnection/data-connection.md';
    createSchema = dataConnectionCreateSchema;
    updateSchema = dataConnectionUpdateSchema;
    fieldDefinitions = dataConnectionFieldDefinitions;
    fromCreatePayload(payload, context) {
        const settings = payload.settings;
        const model = { ...payload };
        delete model.settings;
        model.settings = this.toRecord(settings);
        this.applyConfigurationEntityContext(model, context);
        return this.toDataConnection(model);
    }
    fromUpdatedPayload(existingEntity, changes, context) {
        const model = this.toDataConnectionModel(existingEntity);
        const settings = changes.settings;
        const changesWithoutSettings = { ...changes };
        delete changesWithoutSettings.settings;
        Object.assign(model, changesWithoutSettings);
        const newSettings = this.toRecord(settings);
        if (newSettings) {
            model.settings = {
                ...(this.toRecord(model.settings) ?? {}),
                ...newSettings,
            };
        }
        this.applyConfigurationEntityContext(model, context);
        return this.toDataConnection(model);
    }
    toPayload(entity) {
        return this.toDataConnectionModel(entity);
    }
    toDataConnectionModel(dataConnection) {
        const model = {};
        this.setBaseEntityModelProperties(model, dataConnection);
        for (const field of this.fieldDefinitions) {
            if (!field.entityPath) {
                continue;
            }
            const value = EntityUtils.getPropertyValue(dataConnection, field.entityPath, field.isEntityField);
            this.setModelValueIfDefined(model, this.getDtoFieldName(field), value);
        }
        const dataConnectionType = typeof model.type === 'string' ? model.type : undefined;
        if (!dataConnectionType || !dataConnectionTypeEnumValues.includes(dataConnectionType)) {
            return model;
        }
        const settingsTypeDefinition = this.getSettingsTypeDefinitionForDataConnectionType(dataConnectionType);
        const settings = {};
        for (const field of settingsTypeDefinition.fields) {
            if (!field.entityPath) {
                continue;
            }
            const value = EntityUtils.getPropertyValue(dataConnection, field.entityPath, true);
            this.setModelValueIfDefined(settings, field.dtoName ?? field.key, value);
        }
        if (Object.keys(settings).length > 0) {
            model.settings = settings;
        }
        return model;
    }
    toDataConnection(model) {
        const dataConnection = new DataConnection();
        const dataConnectionType = this.resolveDataConnectionType(model.type);
        this.applyBaseEntityProperties(dataConnection, model);
        dataConnection.Settings = this.createDataConnectionSettings(model.type);
        const modelValues = model;
        for (const field of this.fieldDefinitions) {
            if (!field.entityPath || field.type === 'polymorphic') {
                continue;
            }
            const dtoFieldName = this.getDtoFieldName(field);
            const value = modelValues[dtoFieldName];
            if (typeof value === 'undefined') {
                continue;
            }
            EntityUtils.setPropertyValue(dataConnection, field.entityPath, value, field.isEntityField);
        }
        const settingsTypeDefinition = this.getSettingsTypeDefinitionForDataConnectionType(dataConnectionType);
        const settings = this.toRecord(model.settings);
        if (!settings) {
            return dataConnection;
        }
        for (const field of settingsTypeDefinition.fields) {
            if (!field.entityPath) {
                continue;
            }
            const dtoFieldName = field.dtoName ?? field.key;
            const value = settings[dtoFieldName];
            if (typeof value === 'undefined') {
                continue;
            }
            EntityUtils.setPropertyValue(dataConnection, field.entityPath, value, true);
        }
        return dataConnection;
    }
    createDataConnectionSettings(typeValue) {
        const dataConnectionType = this.resolveDataConnectionType(typeValue);
        switch (dataConnectionType) {
            case DataConnectionType.Modbus:
                return new DataConnectionModbusSettings();
            case DataConnectionType.OpcUa:
                return new CoreDataConnectionOpcUaSettings();
            default:
                throw new Error(`Unsupported data connection type '${String(dataConnectionType)}' for settings handling.`);
        }
    }
    resolveDataConnectionType(value) {
        const dataConnectionType = typeof value === 'string' ? value : undefined;
        if (!dataConnectionType) {
            throw new Error('DataConnection payload is missing required field "type".');
        }
        if (!dataConnectionTypeEnumValues.includes(dataConnectionType)) {
            throw new Error(`Invalid data connection type '${dataConnectionType}'. Supported data connection types: ${dataConnectionTypeEnumValues.join(', ')}.`);
        }
        return dataConnectionType;
    }
    getSettingsFieldDefinition() {
        const field = this.fieldDefinitions.find(f => f.key === 'settings');
        if (!field) {
            throw new Error('Settings field definition not found');
        }
        return field;
    }
    getSettingsTypeDefinitionForDataConnectionType(dataConnectionType) {
        const settingsField = this.getSettingsFieldDefinition();
        if (!settingsField.polymorphic) {
            throw new Error('Settings field is not polymorphic');
        }
        const settingsTypeKey = settingsField.polymorphic.mapping[dataConnectionType];
        if (!settingsTypeKey) {
            throw new Error(`No settings type mapping found for data connection type '${dataConnectionType}'.`);
        }
        const definition = resolveType(settingsTypeKey);
        if (!definition || 'entityType' in definition) {
            throw new Error(`Settings type '${settingsTypeKey}' not found in type registry.`);
        }
        return definition;
    }
    toRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return undefined;
        }
        return value;
    }
}
export const dataConnectionEntityContract = new DataConnectionEntityContract();
registerType(dataConnectionEntityContract.getDefinition());
registerContract(dataConnectionEntityContract);
//# sourceMappingURL=contract.js.map