import {
  BitSelectConversionTypes,
  EntityType,
  Field,
  Signal,
  SignalAnalogSettings,
  SignalCounterSettings,
  SignalDigitalSettings,
  SignalRecordingSettings,
  SignalType,
} from "audako-core";
import { z } from "zod";
import { BaseEntityContract } from "./base-entity.contract.js";
import { EntityContractContext } from "./types.js";

const signalCreateSchema = z
  .object({
    name: z.string().describe("Name of the signal"),
    description: z.string().optional().describe("Description of the signal"),
    groupId: z
      .string()
      .optional()
      .describe("Parent group ID (defaults to selected tenant root when omitted)"),
    type: z.nativeEnum(SignalType).describe("Signal type"),
    alias: z.string().optional().describe("Alias name"),
    dataConnectionId: z
      .string()
      .optional()
      .describe("Data connection ID (required by backend for physical signals)"),
    address: z.string().optional().describe("Address for data acquisition"),
    minValue: z.number().optional().describe("Analog minimum value"),
    maxValue: z.number().optional().describe("Analog/counter maximum value"),
    defaultValue: z.number().optional().describe("Analog default value"),
    decimalPlaces: z.number().optional().describe("Number of decimal places"),
    unit: z.string().optional().describe("Unit of measurement"),
    factor: z.number().optional().describe("Multiplication factor"),
    offset: z.number().optional().describe("Offset value"),
    digitalTrueCaption: z
      .string()
      .optional()
      .describe("Caption when digital value is true"),
    digitalFalseCaption: z
      .string()
      .optional()
      .describe("Caption when digital value is false"),
    digitalTrueColor: z
      .string()
      .optional()
      .describe("Color when digital value is true"),
    digitalFalseColor: z
      .string()
      .optional()
      .describe("Color when digital value is false"),
    invert: z.boolean().optional().describe("Invert digital value"),
    bitSelect: z.number().optional().describe("Bit position to select"),
    bitSelectConversion: z
      .nativeEnum(BitSelectConversionTypes)
      .optional()
      .describe("Bit select conversion type"),
    offsetAutomatic: z.boolean().optional().describe("Counter automatic offset"),
    offsetDetection: z.boolean().optional().describe("Counter offset detection"),
    recordingInterval: z
      .number()
      .optional()
      .describe("Recording interval in seconds"),
  })
  .strict();

const signalUpdateSchema = signalCreateSchema.partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: "At least one field must be provided in 'changes'.",
  },
);

type SignalCreatePayload = z.infer<typeof signalCreateSchema>;
type SignalUpdatePayload = z.infer<typeof signalUpdateSchema>;

type SignalModel = Partial<SignalCreatePayload> & {
  id?: string;
  path?: string[];
};

class SignalEntityContract extends BaseEntityContract<
  Signal,
  SignalCreatePayload,
  SignalUpdatePayload
> {
  public readonly key = "Signal";
  public readonly aliases = ["signal"];
  public readonly entityType = EntityType.Signal;
  public readonly description = "Audako signal configuration entity";
  public readonly examples = {
    create: {
      name: "Boiler Temperature",
      type: SignalType.AnalogInput,
      address: "40001",
      minValue: 0,
      maxValue: 150,
      unit: "C",
      decimalPlaces: 1,
      dataConnectionId: "connection-id",
      recordingInterval: 5,
    },
    update: {
      description: "Updated signal description",
      maxValue: 200,
      recordingInterval: 10,
    },
  };

  protected readonly createSchema = signalCreateSchema;
  protected readonly updateSchema = signalUpdateSchema;
  protected readonly appliesTo: Record<string, string[]> = {
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

  protected fromCreatePayload(
    payload: SignalCreatePayload,
    context?: EntityContractContext,
  ): Signal {
    const model: SignalModel = { ...payload };

    if (!model.groupId && context?.tenantRootGroupId) {
      model.groupId = context.tenantRootGroupId;
    }

    return this.toSignal(model);
  }

  protected fromUpdatedPayload(
    existingEntity: Signal,
    changes: SignalUpdatePayload,
    context?: EntityContractContext,
  ): Signal {
    const model = this.toSignalModel(existingEntity);
    Object.assign(model, changes);

    if (!model.groupId && context?.tenantRootGroupId) {
      model.groupId = context.tenantRootGroupId;
    }

    return this.toSignal(model);
  }

  public toPayload(entity: Signal): Record<string, unknown> {
    return this.toSignalModel(entity);
  }

  private toSignalModel(signal: Signal): SignalModel {
    const model: SignalModel = {};

    this.setIfDefined(model, "id", signal.Id);
    this.setIfDefined(model, "path", signal.Path ? [...signal.Path] : undefined);
    this.setIfDefined(model, "name", signal.Name?.Value);
    this.setIfDefined(model, "description", signal.Description?.Value);
    this.setIfDefined(model, "groupId", signal.GroupId);
    this.setIfDefined(model, "type", signal.Type?.Value);
    this.setIfDefined(model, "alias", signal.Alias?.Value);
    this.setIfDefined(model, "dataConnectionId", signal.DataConnectionId?.Value);
    this.setIfDefined(model, "address", signal.Address?.Value);

    const settings = signal.Settings;
    if (settings instanceof SignalAnalogSettings) {
      this.setIfDefined(model, "minValue", settings.MinValue?.Value);
      this.setIfDefined(model, "maxValue", settings.MaxValue?.Value);
      this.setIfDefined(model, "defaultValue", settings.DefaultValue?.Value);
      this.setIfDefined(model, "decimalPlaces", settings.DecimalPlaces?.Value);
      this.setIfDefined(model, "unit", settings.Unit?.Value);
      this.setIfDefined(model, "factor", settings.Factor?.Value);
      this.setIfDefined(model, "offset", settings.Offset?.Value);
    } else if (settings instanceof SignalDigitalSettings) {
      this.setIfDefined(model, "digitalTrueColor", settings.DigitalTrueColor?.Value);
      this.setIfDefined(
        model,
        "digitalTrueCaption",
        settings.DigitalTrueCaption?.Value,
      );
      this.setIfDefined(
        model,
        "digitalFalseColor",
        settings.DigitalFalseColor?.Value,
      );
      this.setIfDefined(
        model,
        "digitalFalseCaption",
        settings.DigitalFalseCaption?.Value,
      );
      this.setIfDefined(model, "invert", settings.Invert?.Value);
      this.setIfDefined(model, "bitSelect", settings.BitSelect?.Value);
      this.setIfDefined(
        model,
        "bitSelectConversion",
        settings.BitSelectConversion?.Value,
      );
    } else if (settings instanceof SignalCounterSettings) {
      this.setIfDefined(model, "maxValue", settings.MaxValue?.Value);
      this.setIfDefined(model, "decimalPlaces", settings.DecimalPlaces?.Value);
      this.setIfDefined(model, "unit", settings.Unit?.Value);
      this.setIfDefined(model, "factor", settings.Factor?.Value);
      this.setIfDefined(model, "offset", settings.Offset?.Value);
      this.setIfDefined(model, "offsetAutomatic", settings.OffsetAutomatic?.Value);
      this.setIfDefined(model, "offsetDetection", settings.OffsetDetection?.Value);
    }

    this.setIfDefined(
      model,
      "recordingInterval",
      signal.RecordingSettings?.Interval?.Value,
    );

    return model;
  }

  private toSignal(model: SignalModel): Signal {
    const signal = new Signal();

    if (typeof model.id !== "undefined") signal.Id = model.id;
    if (typeof model.path !== "undefined") signal.Path = [...model.path];
    this.setFieldIfDefined(signal, "Name", model.name);
    this.setFieldIfDefined(signal, "Description", model.description);
    if (typeof model.groupId !== "undefined") signal.GroupId = model.groupId;

    this.setFieldIfDefined(signal, "Type", model.type);
    this.setFieldIfDefined(signal, "Alias", model.alias);
    this.setFieldIfDefined(signal, "DataConnectionId", model.dataConnectionId);
    this.setFieldIfDefined(signal, "Address", model.address);

    signal.Settings = this.createSignalSettings(model);

    const recordingSettings = new SignalRecordingSettings();
    if (typeof model.recordingInterval !== "undefined") {
      recordingSettings.Interval = new Field(model.recordingInterval);
    }
    signal.RecordingSettings = recordingSettings;

    return signal;
  }

  private createSignalSettings(
    model: SignalModel,
  ): SignalAnalogSettings | SignalDigitalSettings | SignalCounterSettings {
    const type = model.type ?? SignalType.AnalogInput;

    if (type === SignalType.DigitalInput || type === SignalType.DigitalInOut) {
      const settings = new SignalDigitalSettings();
      this.setFieldIfDefined(settings, "DigitalTrueColor", model.digitalTrueColor);
      this.setFieldIfDefined(settings, "DigitalTrueCaption", model.digitalTrueCaption);
      this.setFieldIfDefined(settings, "DigitalFalseColor", model.digitalFalseColor);
      this.setFieldIfDefined(settings, "DigitalFalseCaption", model.digitalFalseCaption);
      this.setFieldIfDefined(settings, "Invert", model.invert);
      this.setFieldIfDefined(settings, "BitSelect", model.bitSelect);
      this.setFieldIfDefined(settings, "BitSelectConversion", model.bitSelectConversion);
      return settings;
    }

    if (type === SignalType.Counter) {
      const settings = new SignalCounterSettings();
      this.setFieldIfDefined(settings, "MaxValue", model.maxValue);
      this.setFieldIfDefined(settings, "DecimalPlaces", model.decimalPlaces);
      this.setFieldIfDefined(settings, "Unit", model.unit);
      this.setFieldIfDefined(settings, "Factor", model.factor);
      this.setFieldIfDefined(settings, "Offset", model.offset);
      this.setFieldIfDefined(settings, "OffsetAutomatic", model.offsetAutomatic);
      this.setFieldIfDefined(settings, "OffsetDetection", model.offsetDetection);
      return settings;
    }

    const settings = new SignalAnalogSettings();
    this.setFieldIfDefined(settings, "MinValue", model.minValue);
    this.setFieldIfDefined(settings, "MaxValue", model.maxValue);
    this.setFieldIfDefined(settings, "DefaultValue", model.defaultValue);
    this.setFieldIfDefined(settings, "DecimalPlaces", model.decimalPlaces);
    this.setFieldIfDefined(settings, "Unit", model.unit);
    this.setFieldIfDefined(settings, "Factor", model.factor);
    this.setFieldIfDefined(settings, "Offset", model.offset);
    return settings;
  }

  private setIfDefined<K extends keyof SignalModel>(
    target: SignalModel,
    key: K,
    value: SignalModel[K],
  ): void {
    if (typeof value !== "undefined") {
      target[key] = value;
    }
  }

  private setFieldIfDefined<Target, K extends keyof Target, Value>(
    target: Target,
    key: K,
    value: Value,
  ): void {
    if (typeof value !== "undefined") {
      (target[key] as Field<Value> | undefined) = new Field(value);
    }
  }
}

export const signalEntityContract = new SignalEntityContract();
