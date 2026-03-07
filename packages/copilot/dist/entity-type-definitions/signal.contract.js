import { BitSelectConversionTypes, EntityType, EntityUtils, Signal, SignalAnalogSettings, SignalCounterSettings, SignalDigitalSettings, SignalRecordingSettings, SignalType, } from 'audako-core';
import { ConfigurationEntityContract, configurationEntityFieldDefinitions, } from './base-entity.contract.js';
import { buildZodSchemaFromFieldDefinitions } from './zod-utils.js';
const signalTypeEnumValues = Object.values(SignalType).filter(value => typeof value === 'string');
const bitSelectConversionEnumValues = Object.values(BitSelectConversionTypes).filter(value => typeof value === 'string');
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
        key: 'minValue',
        dtoName: 'minValue',
        description: 'Analog minimum value',
        type: 'number',
        entityPath: 'Settings.MinValue',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'maxValue',
        dtoName: 'maxValue',
        description: 'Analog/counter maximum value',
        type: 'number',
        entityPath: 'Settings.MaxValue',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'defaultValue',
        dtoName: 'defaultValue',
        description: 'Analog default value',
        type: 'number',
        entityPath: 'Settings.DefaultValue',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'decimalPlaces',
        dtoName: 'decimalPlaces',
        description: 'Number of decimal places',
        type: 'number',
        entityPath: 'Settings.DecimalPlaces',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'unit',
        dtoName: 'unit',
        description: 'Unit of measurement',
        type: 'string',
        entityPath: 'Settings.Unit',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'factor',
        dtoName: 'factor',
        description: 'Multiplication factor',
        type: 'number',
        entityPath: 'Settings.Factor',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'offset',
        dtoName: 'offset',
        description: 'Offset value',
        type: 'number',
        entityPath: 'Settings.Offset',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'digitalTrueCaption',
        dtoName: 'digitalTrueCaption',
        description: 'Caption when digital value is true',
        type: 'string',
        entityPath: 'Settings.DigitalTrueCaption',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'digitalFalseCaption',
        dtoName: 'digitalFalseCaption',
        description: 'Caption when digital value is false',
        type: 'string',
        entityPath: 'Settings.DigitalFalseCaption',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'digitalTrueColor',
        dtoName: 'digitalTrueColor',
        description: 'Color when digital value is true',
        type: 'string',
        entityPath: 'Settings.DigitalTrueColor',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'digitalFalseColor',
        dtoName: 'digitalFalseColor',
        description: 'Color when digital value is false',
        type: 'string',
        entityPath: 'Settings.DigitalFalseColor',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'invert',
        dtoName: 'invert',
        description: 'Invert digital value',
        type: 'boolean',
        entityPath: 'Settings.Invert',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'bitSelect',
        dtoName: 'bitSelect',
        description: 'Bit position to select',
        type: 'number',
        entityPath: 'Settings.BitSelect',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'bitSelectConversion',
        dtoName: 'bitSelectConversion',
        description: 'Bit select conversion type',
        type: 'enum',
        enumValues: bitSelectConversionEnumValues,
        entityPath: 'Settings.BitSelectConversion',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'offsetAutomatic',
        dtoName: 'offsetAutomatic',
        description: 'Counter automatic offset',
        type: 'boolean',
        entityPath: 'Settings.OffsetAutomatic',
        isEntityField: true,
        requiredOnCreate: false,
    },
    {
        key: 'offsetDetection',
        dtoName: 'offsetDetection',
        description: 'Counter offset detection',
        type: 'boolean',
        entityPath: 'Settings.OffsetDetection',
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
];
const signalCreateSchema = buildZodSchemaFromFieldDefinitions(signalFieldDefinitions, 'create');
const signalUpdateSchema = buildZodSchemaFromFieldDefinitions(signalFieldDefinitions, 'update').refine(value => Object.keys(value).length > 0, {
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
            minValue: 0,
            maxValue: 150,
            unit: 'C',
            decimalPlaces: 1,
            dataConnectionId: 'connection-id',
            recordingInterval: 5,
        },
        update: {
            maxValue: 200,
            recordingInterval: 10,
        },
    };
    createSchema = signalCreateSchema;
    updateSchema = signalUpdateSchema;
    fieldDefinitions = signalFieldDefinitions;
    appliesTo = {
        minValue: [SignalType.AnalogInput, SignalType.AnalogInOut],
        maxValue: [
            SignalType.AnalogInput,
            SignalType.AnalogInOut,
            SignalType.Counter,
            SignalType.UniversalInput,
            SignalType.UniversalInOut,
        ],
        defaultValue: [SignalType.AnalogInput, SignalType.AnalogInOut],
        decimalPlaces: [
            SignalType.AnalogInput,
            SignalType.AnalogInOut,
            SignalType.Counter,
            SignalType.UniversalInput,
            SignalType.UniversalInOut,
        ],
        unit: [
            SignalType.AnalogInput,
            SignalType.AnalogInOut,
            SignalType.Counter,
            SignalType.UniversalInput,
            SignalType.UniversalInOut,
        ],
        factor: [
            SignalType.AnalogInput,
            SignalType.AnalogInOut,
            SignalType.Counter,
            SignalType.UniversalInput,
            SignalType.UniversalInOut,
        ],
        offset: [
            SignalType.AnalogInput,
            SignalType.AnalogInOut,
            SignalType.Counter,
            SignalType.UniversalInput,
            SignalType.UniversalInOut,
        ],
        digitalTrueCaption: [SignalType.DigitalInput, SignalType.DigitalInOut],
        digitalFalseCaption: [SignalType.DigitalInput, SignalType.DigitalInOut],
        digitalTrueColor: [SignalType.DigitalInput, SignalType.DigitalInOut],
        digitalFalseColor: [SignalType.DigitalInput, SignalType.DigitalInOut],
        invert: [SignalType.DigitalInput, SignalType.DigitalInOut],
        bitSelect: [SignalType.DigitalInput, SignalType.DigitalInOut],
        bitSelectConversion: [SignalType.DigitalInput, SignalType.DigitalInOut],
        offsetAutomatic: [SignalType.Counter],
        offsetDetection: [SignalType.Counter],
    };
    fromCreatePayload(payload, context) {
        const model = { ...payload };
        this.applyConfigurationEntityContext(model, context);
        return this.toSignal(model);
    }
    fromUpdatedPayload(existingEntity, changes, context) {
        const model = this.toSignalModel(existingEntity);
        Object.assign(model, changes);
        this.applyConfigurationEntityContext(model, context);
        return this.toSignal(model);
    }
    toPayload(entity) {
        return this.toSignalModel(entity);
    }
    toSignalModel(signal) {
        const model = {};
        this.setBaseEntityModelProperties(model, signal);
        const signalType = signal.Type?.Value;
        for (const field of this.fieldDefinitions) {
            if (!field.entityPath || !this.isApplicableForSignalType(field, signalType)) {
                continue;
            }
            const value = EntityUtils.getPropertyValue(signal, field.entityPath, field.isEntityField);
            this.setModelValueIfDefined(model, this.getDtoFieldName(field), value);
        }
        return model;
    }
    toSignal(model) {
        const signal = new Signal();
        this.applyBaseEntityProperties(signal, model);
        signal.Settings = this.createSignalSettings(model);
        signal.RecordingSettings = new SignalRecordingSettings();
        const signalType = model.type ?? SignalType.AnalogInput;
        const modelValues = model;
        for (const field of this.fieldDefinitions) {
            if (!field.entityPath || !this.isApplicableForSignalType(field, signalType)) {
                continue;
            }
            const dtoFieldName = this.getDtoFieldName(field);
            const value = modelValues[dtoFieldName];
            if (typeof value === 'undefined') {
                continue;
            }
            EntityUtils.setPropertyValue(signal, field.entityPath, value, field.isEntityField);
        }
        return signal;
    }
    createSignalSettings(model) {
        const type = model.type ?? SignalType.AnalogInput;
        if (type === SignalType.DigitalInput || type === SignalType.DigitalInOut) {
            return new SignalDigitalSettings();
        }
        if (type === SignalType.Counter) {
            return new SignalCounterSettings();
        }
        return new SignalAnalogSettings();
    }
    isApplicableForSignalType(field, signalType) {
        const appliesTo = field.appliesTo ?? this.appliesTo[field.key];
        if (!appliesTo || appliesTo.length === 0) {
            return true;
        }
        if (!signalType) {
            return false;
        }
        return appliesTo.includes(signalType);
    }
}
export const signalEntityContract = new SignalEntityContract();
//# sourceMappingURL=signal.contract.js.map