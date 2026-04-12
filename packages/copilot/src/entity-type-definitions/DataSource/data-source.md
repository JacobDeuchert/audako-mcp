A DataSource in audako represents the runtime endpoint or driver instance that connects the platform to an external data provider or edge system. It defines the source-side connection details that data acquisition components use to reach devices, gateways, or adapter services.

## Data source types

There are three data source types in audako:

- EdgeGateway: represents an edge gateway instance that connects audako to field devices or local infrastructure.
- DataAdapter: represents an adapter service that translates data from an external system into audako's expected format.
- SmartDevice: represents a directly connected smart device that can expose its own data without an intermediate gateway.

Use the `type` field to choose the correct integration model for the source you are creating.
