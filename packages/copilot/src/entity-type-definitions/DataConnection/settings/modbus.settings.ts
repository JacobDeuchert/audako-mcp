import { registerType } from '../../../services/type-registry.js';
import type { SettingsFieldDefinition, SettingsTypeDefinition } from '../../types.js';

const modbusFields: SettingsFieldDefinition[] = [
  {
    key: 'host',
    type: 'string',
    description: 'Modbus host name or IP address.',
    entityPath: 'Settings.Host',
  },
  {
    key: 'port',
    type: 'number',
    description: 'Modbus TCP port.',
    entityPath: 'Settings.Port',
    defaultValue: 502,
  },
  {
    key: 'unitId',
    type: 'number',
    description: 'Modbus unit identifier.',
    entityPath: 'Settings.UnitId',
    defaultValue: 1,
  },
  {
    key: 'timeout',
    type: 'number',
    description: 'Request timeout in milliseconds.',
    entityPath: 'Settings.Timeout',
    defaultValue: 5000,
  },
];

export const DataConnectionModbusSettings: SettingsTypeDefinition = {
  key: 'DataConnectionModbusSettings',
  description: 'Configuration settings for Modbus data connections',
  fields: modbusFields,
};

registerType(DataConnectionModbusSettings);
