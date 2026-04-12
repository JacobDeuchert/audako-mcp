import {
  DataConnectionOpcUaSecurityAuthentication,
  DataConnectionOpcUaSecurityMode,
  DataConnectionOpcUaSecurityPolicy,
  DataConnectionOpcUaStringEncoding,
} from 'audako-core';
import { registerType } from '../../../services/type-registry.js';
import type { SettingsFieldDefinition, SettingsTypeDefinition } from '../../types.js';

const securityPolicyEnumValues = Object.values(DataConnectionOpcUaSecurityPolicy).filter(
  value => typeof value === 'string',
) as string[];

const securityModeEnumValues = Object.values(DataConnectionOpcUaSecurityMode).filter(
  value => typeof value === 'string',
) as string[];

const securityAuthenticationEnumValues = Object.values(
  DataConnectionOpcUaSecurityAuthentication,
).filter(value => typeof value === 'string') as string[];

const stringEncodingEnumValues = Object.values(DataConnectionOpcUaStringEncoding).filter(
  value => typeof value === 'string',
) as string[];

const opcUaFields: SettingsFieldDefinition[] = [
  {
    key: 'url',
    type: 'string',
    description: 'OPC UA server endpoint URL.',
    entityPath: 'Settings.Url',
  },
  {
    key: 'securityPolicy',
    type: 'enum',
    description: 'OPC UA security policy.',
    entityPath: 'Settings.SecurityPolicy',
    enumValues: securityPolicyEnumValues,
  },
  {
    key: 'securityMode',
    type: 'enum',
    description: 'OPC UA security mode.',
    entityPath: 'Settings.SecurityMode',
    enumValues: securityModeEnumValues,
  },
  {
    key: 'securityAuthentication',
    type: 'enum',
    description: 'OPC UA authentication mechanism.',
    entityPath: 'Settings.SecurityAuthentication',
    enumValues: securityAuthenticationEnumValues,
  },
  {
    key: 'username',
    type: 'string',
    description: 'Username used for credential-based authentication.',
    entityPath: 'Settings.Username',
  },
  {
    key: 'password',
    type: 'string',
    description: 'Password used for credential-based authentication.',
    entityPath: 'Settings.Password',
  },
  {
    key: 'certificate',
    type: 'string',
    description: 'Client certificate content or reference.',
    entityPath: 'Settings.Certificate',
  },
  {
    key: 'privateKey',
    type: 'string',
    description: 'Client private key content or reference.',
    entityPath: 'Settings.PrivateKey',
  },
  {
    key: 'publishingInterval',
    type: 'number',
    description: 'Publishing interval in milliseconds.',
    entityPath: 'Settings.PublishingInterval',
  },
  {
    key: 'samplingInterval',
    type: 'number',
    description: 'Sampling interval in milliseconds.',
    entityPath: 'Settings.SamplingInterval',
  },
  {
    key: 'queueSize',
    type: 'number',
    description: 'Subscription queue size.',
    entityPath: 'Settings.QueueSize',
  },
  {
    key: 'timeout',
    type: 'number',
    description: 'Connection timeout in milliseconds.',
    entityPath: 'Settings.Timeout',
  },
  {
    key: 'stringEncoding',
    type: 'enum',
    description: 'String encoding used by the OPC UA connection.',
    entityPath: 'Settings.StringEncoding',
    enumValues: stringEncodingEnumValues,
  },
];

export const DataConnectionOpcUaSettings: SettingsTypeDefinition = {
  key: 'DataConnectionOpcUaSettings',
  description: 'Configuration settings for OPC UA data connections',
  fields: opcUaFields,
};

registerType(DataConnectionOpcUaSettings);
