import { registerSettingsType } from '../type-registry.js';
const universalFields = [
    {
        key: 'maxValue',
        type: 'number',
        description: 'Maximum value',
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
];
export const SignalUniversalSettings = {
    key: 'SignalUniversalSettings',
    description: 'Configuration settings for universal signals',
    fields: universalFields,
    example: {
        maxValue: 100,
        unit: 'units',
    },
};
registerSettingsType(SignalUniversalSettings);
//# sourceMappingURL=signal-universal.settings.js.map