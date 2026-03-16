import { registerType } from '../../../services/type-registry.js';
import type { SettingsFieldDefinition, SettingsTypeDefinition } from '../../types.js';

const universalFields: SettingsFieldDefinition[] = [];

export const SignalUniversalSettings: SettingsTypeDefinition = {
  key: 'SignalUniversalSettings',
  description:
    'Configuration settings for universal signals (no configurable fields - defaults are applied automatically)',
  fields: universalFields,
  example: {},
};

registerType(SignalUniversalSettings);
