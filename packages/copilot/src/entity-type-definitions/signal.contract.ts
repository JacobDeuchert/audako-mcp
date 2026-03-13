import {
  SignalAnalogSettings as CoreSignalAnalogSettings,
  SignalCounterSettings as CoreSignalCounterSettings,
  SignalDigitalSettings as CoreSignalDigitalSettings,
  EntityType,
  EntityUtils,
  Signal,
  SignalRecordingSettings,
  SignalType,
} from 'audako-core';
import type { z } from 'zod';
import {
  ConfigurationEntityContract,
  type ConfigurationEntityModel,
  configurationEntityFieldDefinitions,
} from './base-entity.contract.js';
import { SignalAnalogSettings } from './settings-types/signal-analog.settings.js';
import { SignalCounterSettings } from './settings-types/signal-counter.settings.js';
import { SignalDigitalSettings } from './settings-types/signal-digital.settings.js';
import { SignalUniversalSettings } from './settings-types/signal-universal.settings.js';
import type {
  EntityContractContext,
  EntityFieldDefinition,
  EntityTypeDefinition,
  SettingsFieldDefinition,
  SettingsTypeDefinition,
} from './types.js';
import { buildZodSchemaFromFieldDefinitions } from './zod-utils.js';

const signalTypeEnumValues = Object.values(SignalType).filter(
  value => typeof value === 'string',
) as string[];

type SignalContractFieldDefinition = EntityFieldDefinition & {
  isEntityField?: boolean;
};

const signalFieldDefinitions: SignalContractFieldDefinition[] = [
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
    description:
      'Data connection ID (required by backend for online signals). Should always be provided, when user specifically asks for virtual signals set it to "virtual". If set to "context" the system will try to find a suitable data connection based on session info.',
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
];

const signalTypeToSettingsType: Record<SignalType, string> = {
  [SignalType.AnalogInput]: 'SignalAnalogSettings',
  [SignalType.AnalogInOut]: 'SignalAnalogSettings',
  [SignalType.DigitalInput]: 'SignalDigitalSettings',
  [SignalType.DigitalInOut]: 'SignalDigitalSettings',
  [SignalType.Counter]: 'SignalCounterSettings',
  [SignalType.UniversalInput]: 'SignalUniversalSettings',
  [SignalType.UniversalInOut]: 'SignalUniversalSettings',
};

const signalSettingsTypes: SettingsTypeDefinition[] = [
  SignalAnalogSettings,
  SignalDigitalSettings,
  SignalCounterSettings,
  SignalUniversalSettings,
];

const knownSignalBaseFields = new Set<string>([
  ...signalFieldDefinitions.map(field => field.dtoName ?? field.key),
  'settings',
]);

const knownSignalSettingsFields = new Set<string>(
  signalSettingsTypes.flatMap(settingsType =>
    settingsType.fields.map(field => field.dtoName ?? field.key),
  ),
);

const signalCreateSchema = buildZodSchemaFromFieldDefinitions(signalFieldDefinitions, 'create');

const signalUpdateSchema = buildZodSchemaFromFieldDefinitions(
  signalFieldDefinitions,
  'update',
).refine(value => Object.keys(value).length > 0, {
  message: "At least one field must be provided in 'changes'.",
});

type SignalCreatePayload = z.infer<typeof signalCreateSchema>;
type SignalUpdatePayload = z.infer<typeof signalUpdateSchema>;

type SignalModel = ConfigurationEntityModel &
  Partial<SignalCreatePayload> & {
    settings?: Record<string, unknown>;
  };

class SignalEntityContract extends ConfigurationEntityContract<
  Signal,
  SignalCreatePayload,
  SignalUpdatePayload
> {
  public readonly key = 'Signal';
  public readonly aliases = ['signal'];
  public readonly entityType = EntityType.Signal;
  public readonly description = 'Audako signal configuration entity';
  public readonly examples = {
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

  protected readonly createSchema = signalCreateSchema;
  protected readonly updateSchema = signalUpdateSchema;
  protected readonly fieldDefinitions: SignalContractFieldDefinition[] = signalFieldDefinitions;

  public override getDefinition(): EntityTypeDefinition {
    const definition = super.getDefinition();
    definition.settingsDiscriminatorField = 'type';
    definition.settingsPayloadField = 'settings';
    definition.typeMapping = { ...signalTypeToSettingsType };
    definition.settingsTypes = signalSettingsTypes;
    return definition;
  }

  protected fromCreatePayload(
    payload: SignalCreatePayload,
    context?: EntityContractContext,
  ): Signal {
    this.assertNoFlatSettingsFields(payload);

    const settings = this.extractPayloadSettings(payload);
    const model: SignalModel = { ...payload };
    delete model.settings;

    const signalType = this.resolveSignalType(model.type);
    const settingsDefinition = this.getSettingsTypeDefinitionForSignalType(signalType);
    model.settings = this.validateAndNormalizeSettings(settings, settingsDefinition, signalType);

    this.applyConfigurationEntityContext(model, context);

    return this.toSignal(model);
  }

  protected fromUpdatedPayload(
    existingEntity: Signal,
    changes: SignalUpdatePayload,
    context?: EntityContractContext,
  ): Signal {
    this.assertNoFlatSettingsFields(changes);

    const model = this.toSignalModel(existingEntity);
    const settings = this.extractPayloadSettings(changes);
    const changesWithoutSettings = { ...changes };
    delete changesWithoutSettings.settings;

    Object.assign(model, changesWithoutSettings);

    const signalType = this.resolveSignalType(model.type);
    const settingsDefinition = this.getSettingsTypeDefinitionForSignalType(signalType);
    const normalizedSettings = this.validateAndNormalizeSettings(
      settings,
      settingsDefinition,
      signalType,
    );

    if (normalizedSettings) {
      model.settings = {
        ...(this.toRecord(model.settings) ?? {}),
        ...normalizedSettings,
      };
    }

    this.applyConfigurationEntityContext(model, context);

    return this.toSignal(model);
  }

  public toPayload(entity: Signal): Record<string, unknown> {
    return this.toSignalModel(entity);
  }

  private toSignalModel(signal: Signal): SignalModel {
    const model: SignalModel = {};

    this.setBaseEntityModelProperties(model, signal);
    const _currentSignalType = signal.Type?.Value;

    for (const field of this.fieldDefinitions) {
      if (!field.entityPath) {
        continue;
      }

      const value = EntityUtils.getPropertyValue<Signal, unknown>(
        signal,
        field.entityPath,
        field.isEntityField,
      );
      this.setModelValueIfDefined(model, this.getDtoFieldName(field), value);
    }

    const signalType = typeof model.type === 'string' ? model.type : undefined;
    if (!signalType || !signalTypeEnumValues.includes(signalType)) {
      return model;
    }

    const settingsTypeDefinition = this.getSettingsTypeDefinitionForSignalType(
      signalType as SignalType,
    );
    const settings: Record<string, unknown> = {};

    for (const field of settingsTypeDefinition.fields) {
      if (!field.entityPath) {
        continue;
      }

      const value = EntityUtils.getPropertyValue<Signal, unknown>(signal, field.entityPath, true);
      this.setModelValueIfDefined(settings, field.dtoName ?? field.key, value);
    }

    if (Object.keys(settings).length > 0) {
      model.settings = settings;
    }

    return model;
  }

  private toSignal(model: SignalModel): Signal {
    const signal = new Signal();
    const signalType = this.resolveSignalType(model.type);

    this.applyBaseEntityProperties(signal, model);

    signal.Settings = this.createSignalSettings(model.type);
    signal.RecordingSettings = new SignalRecordingSettings();

    const modelValues = model as Record<string, unknown>;

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

  private createSignalSettings(
    signalTypeValue: unknown,
  ): CoreSignalAnalogSettings | CoreSignalDigitalSettings | CoreSignalCounterSettings {
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

  private resolveSignalType(value: unknown): SignalType {
    const signalType = typeof value === 'string' ? value : undefined;
    if (!signalType) {
      throw new Error('Signal payload is missing required field "type".');
    }

    if (!signalTypeEnumValues.includes(signalType)) {
      throw new Error(
        `Invalid signal type '${signalType}'. Supported signal types: ${signalTypeEnumValues.join(', ')}.`,
      );
    }

    return signalType as SignalType;
  }

  private getSettingsTypeDefinitionForSignalType(signalType: SignalType): SettingsTypeDefinition {
    const settingsTypeKey = signalTypeToSettingsType[signalType];
    const definition = signalSettingsTypes.find(
      settingsType => settingsType.key === settingsTypeKey,
    );
    if (!definition) {
      throw new Error(
        `No settings type definition found for signal type '${signalType}' (expected '${settingsTypeKey}').`,
      );
    }

    return definition;
  }

  private validateAndNormalizeSettings(
    settingsValue: unknown,
    settingsTypeDefinition: SettingsTypeDefinition,
    signalType: SignalType,
  ): Record<string, unknown> | undefined {
    if (typeof settingsValue === 'undefined') {
      return undefined;
    }

    const settings = this.toRecord(settingsValue);
    if (!settings) {
      throw new Error(
        `Invalid settings payload for signal type '${signalType}'. Field 'settings' must be an object.`,
      );
    }

    const allowedFields = settingsTypeDefinition.fields.map(field => field.dtoName ?? field.key);
    const allowedFieldSet = new Set(allowedFields);
    const providedFields = Object.keys(settings);
    const unknownFields = providedFields.filter(field => !allowedFieldSet.has(field));

    if (unknownFields.length > 0) {
      throw new Error(
        `Unknown settings fields for signal type '${signalType}': ${unknownFields.join(', ')}. ` +
          `Allowed fields: ${allowedFields.join(', ')}.`,
      );
    }

    const normalizedSettings: Record<string, unknown> = {};
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

  private assertSettingsFieldValueType(
    signalType: SignalType,
    field: SettingsFieldDefinition,
    value: unknown,
    fieldName: string,
  ): void {
    switch (field.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(
            `Invalid settings.${fieldName} for signal type '${signalType}': expected string, received ${typeof value}.`,
          );
        }
        return;
      case 'number':
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new Error(
            `Invalid settings.${fieldName} for signal type '${signalType}': expected number, received ${typeof value}.`,
          );
        }
        return;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(
            `Invalid settings.${fieldName} for signal type '${signalType}': expected boolean, received ${typeof value}.`,
          );
        }
        return;
      case 'enum': {
        const enumValues = field.enumValues ?? [];
        if (typeof value !== 'string' || !enumValues.includes(value)) {
          throw new Error(
            `Invalid settings.${fieldName} for signal type '${signalType}': expected one of ${enumValues.join(', ')}.`,
          );
        }
        return;
      }
      default:
        throw new Error(
          `Unsupported settings field type '${String(field.type)}' for settings.${fieldName}.`,
        );
    }
  }

  private assertNoFlatSettingsFields(payload: Record<string, unknown>): void {
    const flatSettingsFields = Object.keys(payload).filter(
      key => !knownSignalBaseFields.has(key) && knownSignalSettingsFields.has(key),
    );

    if (flatSettingsFields.length === 0) {
      return;
    }

    throw new Error(
      `Signal settings must be nested under 'settings'. Move these fields under settings: ${flatSettingsFields.join(', ')}.`,
    );
  }

  private extractPayloadSettings(payload: Record<string, unknown>): unknown {
    return payload.settings;
  }

  private toRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }
}

export const signalEntityContract = new SignalEntityContract();
