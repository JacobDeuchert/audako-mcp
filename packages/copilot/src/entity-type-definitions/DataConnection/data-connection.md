A DataConnection in audako represents the protocol-specific connection used to read and write live values. It sits between signals and a data source: signals reference a data connection, and the data connection contains the protocol and connection settings needed to reach the target system.

## Supported connection types

This contract currently includes settings guidance for these data connection types:

- Modbus: use this for Modbus TCP style integrations.
- OpcUa: use this for OPC UA server integrations.

Always set the `type` field first. The available `settings` fields depend on that type.

## Settings rules

- For `type: Modbus`, provide Modbus connection settings such as host, port, unit ID, and timeout.
- For `type: OpcUa`, provide OPC UA endpoint and security settings such as URL, security policy, security mode, authentication, and timing values.
- Do not mix settings from different connection types in the same payload.
