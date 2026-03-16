import { SignalAnalogSettings as CoreSignalAnalogSettings, SignalCounterSettings as CoreSignalCounterSettings, SignalDigitalSettings as CoreSignalDigitalSettings, EntityType, EntityUtils, Signal, SignalRecordingSettings, SignalType, } from 'audako-core';
import { registerType } from '../../services/type-registry.js';
import { ConfigurationEntityContract, configurationEntityFieldDefinitions, } from '../base-entity.contract.js';
import { registerContract } from '../contract-registry.js';
import { buildNestedEntitySchema } from '../zod-utils.js';
import { SignalAnalogSettings } from './settings/analog.settings.js';
import { SignalCounterSettings } from './settings/counter.settings.js';
import { SignalDigitalSettings } from './settings/digital.settings.js';
import { SignalUniversalSettings } from './settings/universal.settings.js';
const signalTypeEnumValues = Object.values(SignalType).filter(value => typeof value === 'string');
const signalFieldDefinitions = [
    ...configurationEntityFieldDefinitions,
    {
        key: 'type',
        dtoName: 'type',
        description: 'Signal type',
        type: 'enum',
        enumValues: signalTypeEnumValues,
        entityPath: 'Type',
        isEntityField: true,
        requiredOnCreate: true,
    },
    {
        key: 'alias',
        dtoName: 'alias',
        description: 'Alias name',
        type: 'string',
        entityPath: 'Alias',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'dataConnectionId',
        dtoName: 'dataConnectionId',
        description: 'Data connection ID (required by backend for online signals). Should always be provided, when user specifically asks for virtual signals set it to "virtual". If set to "context" the system will try to find a suitable data connection based on session info.',
        type: 'string',
        entityPath: 'DataConnectionId',
        isEntityField: true,
        requiredOnCreate: true,
    },
    {
        key: 'address',
        dtoName: 'address',
        description: 'Address for data acquisition',
        type: 'string',
        entityPath: 'Address',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'recordingInterval',
        dtoName: 'recordingInterval',
        description: 'Recording interval in seconds',
        type: 'number',
        entityPath: 'RecordingSettings.Interval',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'settings',
        dtoName: 'settings',
        description: 'Signal-specific settings based on signal type',
        type: 'polymorphic',
        entityPath: 'Settings',
        isEntityField: true,
        requiredOnCreate: false,
        polymorphic: {
            discriminatorField: 'type',
            mapping: {
                [SignalType.AnalogInput]: 'SignalAnalogSettings',
                [SignalType.AnalogInOut]: 'SignalAnalogSettings',
                [SignalType.DigitalInput]: 'SignalDigitalSettings',
                [SignalType.DigitalInOut]: 'SignalDigitalSettings',
                [SignalType.Counter]: 'SignalCounterSettings',
                [SignalType.UniversalInput]: 'SignalUniversalSettings',
                [SignalType.UniversalInOut]: 'SignalUniversalSettings',
            },
        },
    },
];
const knownSignalBaseFields = new Set(signalFieldDefinitions.map(field => field.dtoName ?? field.key));
const knownSignalSettingsFields = new Set([
    SignalAnalogSettings,
    SignalDigitalSettings,
    SignalCounterSettings,
    SignalUniversalSettings,
].flatMap(settingsType => settingsType.fields.map(field => field.dtoName ?? field.key)));
const signalTypeDefinition = {
    key: 'Signal',
    entityType: EntityType.Signal,
    description: 'Audako signal configuration entity',
    fields: signalFieldDefinitions,
};
const signalCreateSchema = buildNestedEntitySchema(signalTypeDefinition, 'create');
const signalUpdateSchema = buildNestedEntitySchema(signalTypeDefinition, 'update').refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided in 'changes'.",
});
class SignalEntityContract extends ConfigurationEntityContract {
    key = 'Signal';
    aliases = ['signal'];
    entityType = EntityType.Signal;
    description = 'Audako signal configuration entity';
    examples = {
        create: {
            type: SignalType.AnalogInput,
            address: '40001',
            settings: {
                minValue: 0,
                maxValue: 150,
                unit: 'C',
                decimalPlaces: 1,
            },
            dataConnectionId: 'connection-id',
            recordingInterval: 5,
        },
        update: {
            settings: {
                maxValue: 200,
            },
            recordingInterval: 10,
        },
    };
    extendedInfo = 'Signal/signal.md';
    createSchema = signalCreateSchema;
    updateSchema = signalUpdateSchema;
    fieldDefinitions = signalFieldDefinitions;
    getDefinition() {
        return super.getDefinition();
    }
    fromCreatePayload(payload, context) {
        const settings = payload.settings;
        const model = { ...payload };
        delete model.settings;
        if (model.dataConnectionId === 'virtual') {
            model.dataConnectionId = null;
        }
        const signalType = this.resolveSignalType(model.type);
        const settingsDefinition = this.getSettingsTypeDefinitionForSignalType(signalType);
        model.settings = this.validateAndNormalizeSettings(settings, settingsDefinition, signalType);
        this.applyConfigurationEntityContext(model, context);
        return this.toSignal(model);
    }
    fromUpdatedPayload(existingEntity, changes, context) {
        const model = this.toSignalModel(existingEntity);
        const settings = changes.settings;
        const changesWithoutSettings = { ...changes };
        delete changesWithoutSettings.settings;
        Object.assign(model, changesWithoutSettings);
        if (model.dataConnectionId === 'virtual') {
            model.dataConnectionId = null;
        }
        const signalType = this.resolveSignalType(model.type);
        const settingsDefinition = this.getSettingsTypeDefinitionForSignalType(signalType);
        const normalizedSettings = this.validateAndNormalizeSettings(settings, settingsDefinition, signalType);
        if (normalizedSettings) {
            model.settings = {
                ...(this.toRecord(model.settings) ?? {}),
                ...normalizedSettings,
            };
        }
        this.applyConfigurationEntityContext(model, context);
        return this.toSignal(model);
    }
    toPayload(entity) {
        return this.toSignalModel(entity);
    }
    toSignalModel(signal) {
        const model = {};
        this.setBaseEntityModelProperties(model, signal);
        const _currentSignalType = signal.Type?.Value;
        for (const field of this.fieldDefinitions) {
            if (!field.entityPath) {
                continue;
            }
            const value = EntityUtils.getPropertyValue(signal, field.entityPath, field.isEntityField);
            this.setModelValueIfDefined(model, this.getDtoFieldName(field), value);
        }
        const signalType = typeof model.type === 'string' ? model.type : undefined;
        if (!signalType || !signalTypeEnumValues.includes(signalType)) {
            return model;
        }
        const settingsTypeDefinition = this.getSettingsTypeDefinitionForSignalType(signalType);
        const settings = {};
        for (const field of settingsTypeDefinition.fields) {
            if (!field.entityPath) {
                continue;
            }
            const value = EntityUtils.getPropertyValue(signal, field.entityPath, true);
            this.setModelValueIfDefined(settings, field.dtoName ?? field.key, value);
        }
        if (Object.keys(settings).length > 0) {
            model.settings = settings;
        }
        return model;
    }
    toSignal(model) {
        const signal = new Signal();
        const signalType = this.resolveSignalType(model.type);
        this.applyBaseEntityProperties(signal, model);
        signal.Settings = this.createSignalSettings(model.type);
        signal.RecordingSettings = new SignalRecordingSettings();
        const modelValues = model;
        for (const field of this.fieldDefinitions) {
            if (!field.entityPath) {
                continue;
            }
            const dtoFieldName = this.getDtoFieldName(field);
            const value = modelValues[dtoFieldName];
            if (typeof value === 'undefined') {
                continue;
            }
            EntityUtils.setPropertyValue(signal, field.entityPath, value, field.isEntityField);
        }
        const settingsTypeDefinition = this.getSettingsTypeDefinitionForSignalType(signalType);
        const settings = this.toRecord(model.settings);
        if (!settings) {
            return signal;
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
            EntityUtils.setPropertyValue(signal, field.entityPath, value, true);
        }
        return signal;
    }
    createSignalSettings(signalTypeValue) {
        const signalType = this.resolveSignalType(signalTypeValue);
        switch (signalType) {
            case SignalType.AnalogInput:
                return new CoreSignalAnalogSettings();
            case SignalType.AnalogInOut:
                return new CoreSignalAnalogSettings();
            case SignalType.DigitalInput:
                return new CoreSignalDigitalSettings();
            case SignalType.DigitalInOut:
                return new CoreSignalDigitalSettings();
            case SignalType.Counter:
                return new CoreSignalCounterSettings();
            case SignalType.UniversalInput:
                return new CoreSignalAnalogSettings();
            case SignalType.UniversalInOut:
                return new CoreSignalAnalogSettings();
            default:
                throw new Error(`Unsupported signal type '${String(signalType)}'.`);
        }
    }
    resolveSignalType(value) {
        const signalType = typeof value === 'string' ? value : undefined;
        if (!signalType) {
            throw new Error('Signal payload is missing required field "type".');
        }
        if (!signalTypeEnumValues.includes(signalType)) {
            throw new Error(`Invalid signal type '${signalType}'. Supported signal types: ${signalTypeEnumValues.join(', ')}.`);
        }
        return signalType;
    }
    getSettingsFieldDefinition() {
        const field = this.fieldDefinitions.find(f => f.key === 'settings');
        if (!field) {
            throw new Error('Settings field definition not found');
        }
        return field;
    }
    getSettingsTypeDefinitionForSignalType(signalType) {
        const settingsField = this.getSettingsFieldDefinition();
        if (!settingsField.polymorphic) {
            throw new Error('Settings field is not polymorphic');
        }
        const settingsTypeKey = settingsField.polymorphic.mapping[signalType];
        if (!settingsTypeKey) {
            throw new Error(`No settings type mapping found for signal type '${signalType}'.`);
        }
        const allSettingsTypes = [
            SignalAnalogSettings,
            SignalDigitalSettings,
            SignalCounterSettings,
            SignalUniversalSettings,
        ];
        const definition = allSettingsTypes.find(settingsType => settingsType.key === settingsTypeKey);
        if (!definition) {
            throw new Error(`No settings type definition found for signal type '${signalType}' (expected '${settingsTypeKey}').`);
        }
        return definition;
    }
    validateAndNormalizeSettings(settingsValue, settingsTypeDefinition, signalType) {
        if (typeof settingsValue === 'undefined' || settingsValue === null) {
            return undefined;
        }
        const settings = this.toRecord(settingsValue);
        if (!settings) {
            throw new Error(`Invalid settings payload for signal type '${signalType}'. Field 'settings' must be an object.`);
        }
        const allowedFields = settingsTypeDefinition.fields.map(field => field.dtoName ?? field.key);
        const allowedFieldSet = new Set(allowedFields);
        const providedFields = Object.keys(settings);
        const unknownFields = providedFields.filter(field => !allowedFieldSet.has(field));
        if (unknownFields.length > 0) {
            throw new Error(`Unknown settings fields for signal type '${signalType}': ${unknownFields.join(', ')}. ` +
                `Allowed fields: ${allowedFields.join(', ')}.`);
        }
        const normalizedSettings = {};
        for (const field of settingsTypeDefinition.fields) {
            const dtoFieldName = field.dtoName ?? field.key;
            if (!(dtoFieldName in settings)) {
                continue;
            }
            const value = settings[dtoFieldName];
            this.assertSettingsFieldValueType(signalType, field, value, dtoFieldName);
            normalizedSettings[dtoFieldName] = value;
        }
        return normalizedSettings;
    }
    assertSettingsFieldValueType(signalType, field, value, fieldName) {
        switch (field.type) {
            case 'string':
                if (typeof value !== 'string') {
                    throw new Error(`Invalid settings.${fieldName} for signal type '${signalType}': expected string, received ${typeof value}.`);
                }
                return;
            case 'number':
                if (typeof value !== 'number' || Number.isNaN(value)) {
                    throw new Error(`Invalid settings.${fieldName} for signal type '${signalType}': expected number, received ${typeof value}.`);
                }
                return;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    throw new Error(`Invalid settings.${fieldName} for signal type '${signalType}': expected boolean, received ${typeof value}.`);
                }
                return;
            case 'enum': {
                const enumValues = field.enumValues ?? [];
                if (typeof value !== 'string' || !enumValues.includes(value)) {
                    throw new Error(`Invalid settings.${fieldName} for signal type '${signalType}': expected one of ${enumValues.join(', ')}.`);
                }
                return;
            }
            default:
                throw new Error(`Unsupported settings field type '${String(field.type)}' for settings.${fieldName}.`);
        }
    }
    toRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return undefined;
        }
        return value;
    }
}
export const signalEntityContract = new SignalEntityContract();
registerType(signalEntityContract.getDefinition());
registerContract(signalEntityContract);
//# sourceMappingURL=contract.js.map