import { registerType } from '../../../services/type-registry.js';
const counterFields = [
    {
        key: 'maxValue',
        type: 'number',
        description: 'Counter maximum value',
        entityPath: 'Settings.MaxValue',
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
    {
        key: 'offsetAutomatic',
        type: 'boolean',
        description: 'Automatic offset detection',
        entityPath: 'Settings.OffsetAutomatic',
    },
    {
        key: 'offsetDetection',
        type: 'number',
        description: 'Offset detection threshold',
        entityPath: 'Settings.OffsetDetection',
    },
];
export const SignalCounterSettings = {
    key: 'SignalCounterSettings',
    description: 'Configuration settings for counter signals',
    fields: counterFields,
};
registerType(SignalCounterSettings);
//# sourceMappingURL=counter.settings.js.map