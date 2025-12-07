import {
  BitSelectConversionTypes,
  Field,
  Signal,
  SignalAnalogSettings,
  SignalCounterSettings,
  SignalDigitalSettings,
  SignalRecordingSettings,
  SignalType,
} from "audako-core";
import { ConfigurationEntityDTO } from "./ConfigurationEntity.dto.js";

export class SignalDTO extends ConfigurationEntityDTO {
  // Signal properties
  public type?: SignalType;
  public alias?: string;
  public dataConnectionId?: string;
  public address?: string;

  // Analog settings (AnalogInput, AnalogInOut)
  public minValue?: number;
  public maxValue?: number;
  public defaultValue?: number;
  public decimalPlaces?: number;
  public unit?: string;
  public factor?: number;
  public offset?: number;

  // Digital settings (DigitalInput, DigitalInOut)
  public digitalTrueColor?: string;
  public digitalTrueCaption?: string;
  public digitalFalseColor?: string;
  public digitalFalseCaption?: string;
  public invert?: boolean;
  public bitSelect?: number;
  public bitSelectConversion?: BitSelectConversionTypes;

  // Counter settings (Counter)
  public offsetAutomatic?: boolean;
  public offsetDetection?: boolean;
  // Note: Counter also uses maxValue, decimalPlaces, unit, factor, offset from analog

  // Recording settings
  public recordingInterval?: number;

  public static fromSignal(signal: Signal): SignalDTO {
    const dto = ConfigurationEntityDTO.fromEntity(signal, new SignalDTO());

    dto.type = signal.Type?.Value;
    dto.alias = signal.Alias?.Value;
    dto.dataConnectionId = signal.DataConnectionId?.Value;
    dto.address = signal.Address?.Value;

    // Extract settings based on type
    const settings = signal.Settings;
    if (settings instanceof SignalAnalogSettings) {
      dto.minValue = settings.MinValue?.Value;
      dto.maxValue = settings.MaxValue?.Value;
      dto.defaultValue = settings.DefaultValue?.Value;
      dto.decimalPlaces = settings.DecimalPlaces?.Value;
      dto.unit = settings.Unit?.Value;
      dto.factor = settings.Factor?.Value;
      dto.offset = settings.Offset?.Value;
    } else if (settings instanceof SignalDigitalSettings) {
      dto.digitalTrueColor = settings.DigitalTrueColor?.Value;
      dto.digitalTrueCaption = settings.DigitalTrueCaption?.Value;
      dto.digitalFalseColor = settings.DigitalFalseColor?.Value;
      dto.digitalFalseCaption = settings.DigitalFalseCaption?.Value;
      dto.invert = settings.Invert?.Value;
      dto.bitSelect = settings.BitSelect?.Value;
      dto.bitSelectConversion = settings.BitSelectConversion?.Value;
    } else if (settings instanceof SignalCounterSettings) {
      dto.maxValue = settings.MaxValue?.Value;
      dto.decimalPlaces = settings.DecimalPlaces?.Value;
      dto.unit = settings.Unit?.Value;
      dto.factor = settings.Factor?.Value;
      dto.offset = settings.Offset?.Value;
      dto.offsetAutomatic = settings.OffsetAutomatic?.Value;
      dto.offsetDetection = settings.OffsetDetection?.Value;
    }

    dto.recordingInterval = signal.RecordingSettings?.Interval?.Value;

    return dto;
  }

  public toSignal(): Signal {
    const signal = new Signal();

    this.applyToEntity(signal);

    if (this.type !== undefined) signal.Type = new Field(this.type);
    if (this.alias !== undefined) signal.Alias = new Field(this.alias);
    if (this.dataConnectionId !== undefined) signal.DataConnectionId = new Field(this.dataConnectionId);
    if (this.address !== undefined) signal.Address = new Field(this.address);

    // Create settings based on type
    signal.Settings = this.createSettings();

    // Create new recording settings instance
    const recordingSettings = new SignalRecordingSettings();
    if (this.recordingInterval !== undefined) {
      recordingSettings.Interval = new Field(this.recordingInterval);
    }
    signal.RecordingSettings = recordingSettings;

    return signal;
  }

  private createSettings() {
    const type = this.type ?? SignalType.AnalogInput;

    if (type === SignalType.DigitalInput || type === SignalType.DigitalInOut) {
      const settings = new SignalDigitalSettings();
      if (this.digitalTrueColor !== undefined) settings.DigitalTrueColor = new Field(this.digitalTrueColor);
      if (this.digitalTrueCaption !== undefined) settings.DigitalTrueCaption = new Field(this.digitalTrueCaption);
      if (this.digitalFalseColor !== undefined) settings.DigitalFalseColor = new Field(this.digitalFalseColor);
      if (this.digitalFalseCaption !== undefined) settings.DigitalFalseCaption = new Field(this.digitalFalseCaption);
      if (this.invert !== undefined) settings.Invert = new Field(this.invert);
      if (this.bitSelect !== undefined) settings.BitSelect = new Field(this.bitSelect);
      if (this.bitSelectConversion !== undefined) settings.BitSelectConversion = new Field(this.bitSelectConversion);
      return settings;
    }

    if (type === SignalType.Counter) {
      const settings = new SignalCounterSettings();
      if (this.maxValue !== undefined) settings.MaxValue = new Field(this.maxValue);
      if (this.decimalPlaces !== undefined) settings.DecimalPlaces = new Field(this.decimalPlaces);
      if (this.unit !== undefined) settings.Unit = new Field(this.unit);
      if (this.factor !== undefined) settings.Factor = new Field(this.factor);
      if (this.offset !== undefined) settings.Offset = new Field(this.offset);
      if (this.offsetAutomatic !== undefined) settings.OffsetAutomatic = new Field(this.offsetAutomatic);
      if (this.offsetDetection !== undefined) settings.OffsetDetection = new Field(this.offsetDetection);
      return settings;
    }

    // Default: Analog settings
    const settings = new SignalAnalogSettings();
    if (this.minValue !== undefined) settings.MinValue = new Field(this.minValue);
    if (this.maxValue !== undefined) settings.MaxValue = new Field(this.maxValue);
    if (this.defaultValue !== undefined) settings.DefaultValue = new Field(this.defaultValue);
    if (this.decimalPlaces !== undefined) settings.DecimalPlaces = new Field(this.decimalPlaces);
    if (this.unit !== undefined) settings.Unit = new Field(this.unit);
    if (this.factor !== undefined) settings.Factor = new Field(this.factor);
    if (this.offset !== undefined) settings.Offset = new Field(this.offset);
    return settings;
  }
}
