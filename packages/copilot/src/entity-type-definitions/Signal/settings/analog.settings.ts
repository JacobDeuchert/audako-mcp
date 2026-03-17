import { registerType } from '../../../services/type-registry.js';
import type { SettingsFieldDefinition, SettingsTypeDefinition } from '../../types.js';

const analogFields: SettingsFieldDefinition[] = [
  {
    key: 'minValue',
    type: 'number',
    description: 'Analog minimum value',
    entityPath: 'Settings.MinValue',
  },
  {
    key: 'maxValue',
    type: 'number',
    description: 'Analog maximum value',
    entityPath: 'Settings.MaxValue',
  },
  {
    key: 'defaultValue',
    type: 'number',
    description: 'Analog default value',
    entityPath: 'Settings.DefaultValue',
  },
  {
    key: 'decimalPlaces',
    type: 'number',
    description: 'Number of decimal places',
    entityPath: 'Settings.DecimalPlaces',
  },
  {
    key: 'unit',
    type: 'string',
    description: 'Unit of measurement',
    entityPath: 'Settings.Unit',
  },
  {
    key: 'factor',
    type: 'number',
    description: 'Scaling factor',
    entityPath: 'Settings.Factor',
  },
  {
    key: 'offset',
    type: 'number',
    description: 'Scaling offset',
    entityPath: 'Settings.Offset',
  },
];

export const SignalAnalogSettings: SettingsTypeDefinition = {
  key: 'SignalAnalogSettings',
  description: 'Configuration settings for analog signals',
  fields: analogFields,
};

registerType(SignalAnalogSettings);
