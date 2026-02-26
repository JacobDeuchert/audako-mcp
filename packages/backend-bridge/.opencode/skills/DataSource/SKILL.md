---
name: DataSource
description: Explains the concept of data sources in audako scada platform.
---

In the audako scada platform, a data source represents a decive or a piece of sotware that connects to the audako mqtt broker and acquires data.
Each data source can have multiple data connections, such as Modbus, OPC UA, MQTT, etc., which allow it to acquire data from various devices and software. 

Curently there are 3 types of data sources in audako:
- EdgeGateway: (default )edge device that connects to local PLCs and acquires data using protocols like Modbus and OPC UA
- DataAdapter: software module that runs in the cloud and provides APIs for sensor devices
- SmartDevice: (not used) small sensor device sending data directly to the audako MQTT broker


# EdgeGateway 
Edge gateways have following data connections:
-S7,
-OpcUa,
-Modbus,
-Universal,
-Simulation,
-Knx,
-Iot2000Module,
-ModemInfo,
-IEC104,
-BACnet,
-EhWebserver,
-Snmp,
-Mqtt,
-OneWire,
-MeterBus

# DataAdapter
Data adatapters have following data connections:
-MtmAdapter,
-FtpParser,
-CsvImporter,
-YDOCDataLogger,
-OTTDataLogger,
-TeltonikaGPSTracker,
-LoRaWAN,
