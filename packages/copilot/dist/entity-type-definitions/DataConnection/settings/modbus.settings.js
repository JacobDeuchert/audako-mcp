import { registerType } from '../../../services/type-registry.js';
const modbusFields = [
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
    },
    {
        key: 'unitId',
        type: 'number',
        description: 'Modbus unit identifier.',
        entityPath: 'Settings.UnitId',
    },
    {
        key: 'timeout',
        type: 'number',
        description: 'Request timeout in milliseconds.',
        entityPath: 'Settings.Timeout',
    },
];
export const DataConnectionModbusSettings = {
    key: 'DataConnectionModbusSettings',
    description: 'Configuration settings for Modbus data connections',
    fields: modbusFields,
};
registerType(DataConnectionModbusSettings);
//# sourceMappingURL=modbus.settings.js.map