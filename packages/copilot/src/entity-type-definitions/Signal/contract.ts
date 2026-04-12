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
import { registerType, resolveType } from '../../services/type-registry.js';
import {
  ConfigurationEntityContract,
  type ConfigurationEntityModel,
  configurationEntityFieldDefinitions,
} from '../base-entity.contract.js';
import { registerContract } from '../contract-registry.js';
import type {
  EntityContractContext,
  EntityFieldDefinition,
  EntityTypeDefinition,
  SettingsTypeDefinition,
} from '../types.js';
import { buildNestedEntitySchema } from '../zod-utils.js';
// Side-effect imports to trigger settings type self-registration
import './settings/analog.settings.js';
import './settings/counter.settings.js';
import './settings/digital.settings.js';
import './settings/universal.settings.js';

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
      'Data connection ID (required by backend for online signals). Use query_entities with entityType "DataConnection" to find available connections. Set to "virtual" when the user specifically asks for virtual signals.',
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

const signalTypeDefinition: EntityTypeDefinition = {
  key: 'Signal',
  entityType: EntityType.Signal,
  description: 'Audako signal configuration entity',
  fields: signalFieldDefinitions,
};

const signalCreateSchema = buildNestedEntitySchema(signalTypeDefinition, 'create');

const signalUpdateSchema = buildNestedEntitySchema(signalTypeDefinition, 'update').refine(
  (value: Record<string, unknown>) => Object.keys(value).length > 0,
  {
    message: "At least one field must be provided in 'changes'.",
  },
);

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
  public override readonly extendedInfo = 'Signal/signal.md';

  protected readonly createSchema = signalCreateSchema;
  protected readonly updateSchema = signalUpdateSchema;
  protected readonly fieldDefinitions: SignalContractFieldDefinition[] = signalFieldDefinitions;

  protected fromCreatePayload(
    payload: SignalCreatePayload,
    context?: EntityContractContext,
  ): Signal {
    const settings = payload.settings;
    const model: SignalModel = { ...payload };
    delete model.settings;

    if (model.dataConnectionId === 'virtual') {
      model.dataConnectionId = null;
    }

    model.settings = this.toRecord(settings);

    this.applyConfigurationEntityContext(model, context);

    return this.toSignal(model);
  }

  protected fromUpdatedPayload(
    existingEntity: Signal,
    changes: SignalUpdatePayload,
    context?: EntityContractContext,
  ): Signal {
    const model = this.toSignalModel(existingEntity);
    const settings = changes.settings;
    const changesWithoutSettings = { ...changes };
    delete changesWithoutSettings.settings;

    Object.assign(model, changesWithoutSettings);

    if (model.dataConnectionId === 'virtual') {
      model.dataConnectionId = null;
    }

    const newSettings = this.toRecord(settings);
    if (newSettings) {
      model.settings = {
        ...(this.toRecord(model.settings) ?? {}),
        ...newSettings,
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
      if (!field.entityPath || field.type === 'polymorphic') {
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

  private getSettingsFieldDefinition(): SignalContractFieldDefinition {
    const field = this.fieldDefinitions.find(f => f.key === 'settings');
    if (!field) {
      throw new Error('Settings field definition not found');
    }
    return field as SignalContractFieldDefinition;
  }

  private getSettingsTypeDefinitionForSignalType(signalType: SignalType): SettingsTypeDefinition {
    const settingsField = this.getSettingsFieldDefinition();
    if (!settingsField.polymorphic) {
      throw new Error('Settings field is not polymorphic');
    }

    const settingsTypeKey = settingsField.polymorphic.mapping[signalType];
    if (!settingsTypeKey) {
      throw new Error(`No settings type mapping found for signal type '${signalType}'.`);
    }

    const definition = resolveType(settingsTypeKey);
    if (!definition || 'entityType' in definition) {
      throw new Error(`Settings type '${settingsTypeKey}' not found in type registry.`);
    }

    return definition as SettingsTypeDefinition;
  }

  private toRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }
}

export const signalEntityContract = new SignalEntityContract();

registerType(signalEntityContract.getDefinition());
registerContract(signalEntityContract);
