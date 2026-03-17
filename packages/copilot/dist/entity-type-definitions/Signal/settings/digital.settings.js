import { registerType } from '../../../services/type-registry.js';
export const SignalDigitalSettings = {
    key: 'SignalDigitalSettings',
    description: 'Settings for digital signal types (DigitalInput, DigitalInOut)',
    fields: [
        {
            key: 'digitalTrueCaption',
            type: 'string',
            description: 'Caption for true state',
            entityPath: 'Settings.DigitalTrueCaption',
        },
        {
            key: 'digitalFalseCaption',
            type: 'string',
            description: 'Caption for false state',
            entityPath: 'Settings.DigitalFalseCaption',
        },
        {
            key: 'digitalTrueColor',
            type: 'string',
            description: 'Color for true state',
            entityPath: 'Settings.DigitalTrueColor',
        },
        {
            key: 'digitalFalseColor',
            type: 'string',
            description: 'Color for false state',
            entityPath: 'Settings.DigitalFalseColor',
        },
        {
            key: 'invert',
            type: 'boolean',
            description: 'Invert the digital signal',
            entityPath: 'Settings.Invert',
        },
        {
            key: 'bitSelect',
            type: 'number',
            description: 'Bit position to select',
            entityPath: 'Settings.BitSelect',
        },
        {
            key: 'bitSelectConversion',
            type: 'enum',
            description: 'Bit select conversion type',
            entityPath: 'Settings.BitSelectConversion',
            enumValues: ['Sint', 'Int', 'Dint', 'Real'],
        },
    ],
};
registerType(SignalDigitalSettings);
//# sourceMappingURL=digital.settings.js.map