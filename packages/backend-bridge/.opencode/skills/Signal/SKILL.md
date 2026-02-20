---
name: Signal
description: Explains the concept of signals in Audako and how they are used to capture time-series data.
---

A Signal in audako represents a single time-series data stream coming from a sensor or other data sources. There are so
called "online" signals and "virtual" signals. Online signals have a Data connection ID that links them to a specific
PLC endpoint e.g. a Siemens S7 connection, Modbus connection, or OPC UA connection. An online signal also has an address
that specifies where to read the signal value from within the PLC data structure. Virtual signals do not have a data
connection or address and are typically used for calculated values, aggregations of multiple signals or manual input
values.

## Signal types

There are seven different signal types in audako:

- DigitalInput: represents a binary signal that can be either true (1) or false (0).
- DigitalInOut: represents a binary signal that can be either true (1) or false (0) and can also be written to.
- AnalogInput: represents a continuous signal that can take any value within a specified range.
- AnalogInOut: represents a continuous signal that can take any value within a specified range and can also be written
  to.
- Counter: represents a signal that counts impulses or continuous values like a gas meter.
- UniversalInput: represents a signal that can be any value and is typically used for string values or other non-numeric
  data.
- UniversalInOut: represents a signal that can be any value and can also be written to
