import { registerType } from '../../../services/type-registry.js';
const universalFields = [];
export const SignalUniversalSettings = {
    key: 'SignalUniversalSettings',
    description: 'Configuration settings for universal signals (no configurable fields - defaults are applied automatically)',
    fields: universalFields,
};
registerType(SignalUniversalSettings);
//# sourceMappingURL=universal.settings.js.map