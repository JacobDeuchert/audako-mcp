import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BitSelectConversionTypes, SignalType } from "audako-core";
import { SignalDTO } from "../dtos/Signal.dto.js";

export function registerCreateSignalTool(server: McpServer) {
  server.registerTool(
    "create-signal",
    {
      description: "Create a new signal configuration for data acquisition",
      inputSchema: {
        // Common properties
        name: z.string().describe("Name of the signal"),
        description: z.string().optional().describe("Description of the signal"),
        groupId: z.string().optional().describe("ID of the parent group"),
        type: z
          .enum([
            SignalType.AnalogInput,
            SignalType.AnalogInOut,
            SignalType.DigitalInput,
            SignalType.DigitalInOut,
            SignalType.Counter,
          ])
          .describe("Type of signal"),
        alias: z.string().optional().describe("Alias name for the signal"),
        dataConnectionId: z.string().optional().describe("ID of the data connection"),
        address: z.string().optional().describe("Address for data acquisition"),

        // Analog settings (AnalogInput, AnalogInOut)
        minValue: z.number().optional().describe("Analog: minimum value"),
        maxValue: z.number().optional().describe("Analog/Counter: maximum value"),
        defaultValue: z.number().optional().describe("Analog: default value"),
        decimalPlaces: z.number().optional().describe("Analog/Counter: number of decimal places"),
        unit: z.string().optional().describe("Analog/Counter: unit of measurement (e.g., '°C', 'kWh')"),
        factor: z.number().optional().describe("Analog/Counter: multiplication factor"),
        offset: z.number().optional().describe("Analog/Counter: offset value"),

        // Digital settings (DigitalInput, DigitalInOut)
        digitalTrueCaption: z.string().optional().describe("Digital: label when value is true (e.g., 'On', 'Open')"),
        digitalFalseCaption: z.string().optional().describe("Digital: label when value is false (e.g., 'Off', 'Closed')"),
        digitalTrueColor: z.string().optional().describe("Digital: color when true (hex code)"),
        digitalFalseColor: z.string().optional().describe("Digital: color when false (hex code)"),
        invert: z.boolean().optional().describe("Digital: invert the signal value"),
        bitSelect: z.number().optional().describe("Digital: bit position to select from value"),
        bitSelectConversion: z
          .enum([
            BitSelectConversionTypes.None,
            BitSelectConversionTypes.SByte,
            BitSelectConversionTypes.Short,
            BitSelectConversionTypes.Int,
          ])
          .optional()
          .describe("Digital: bit select conversion type"),

        // Counter settings
        offsetAutomatic: z.boolean().optional().describe("Counter: enable automatic offset"),
        offsetDetection: z.boolean().optional().describe("Counter: enable offset detection"),

        // Recording settings
        recordingInterval: z.number().optional().describe("Recording interval in seconds"),
      },
    },
    async (params) => {
      const dto = new SignalDTO();

      // Map all params to DTO
      dto.name = params.name;
      dto.description = params.description;
      dto.groupId = params.groupId;
      dto.type = params.type;
      dto.alias = params.alias;
      dto.dataConnectionId = params.dataConnectionId;
      dto.address = params.address;

      // Analog settings
      dto.minValue = params.minValue;
      dto.maxValue = params.maxValue;
      dto.defaultValue = params.defaultValue;
      dto.decimalPlaces = params.decimalPlaces;
      dto.unit = params.unit;
      dto.factor = params.factor;
      dto.offset = params.offset;

      // Digital settings
      dto.digitalTrueCaption = params.digitalTrueCaption;
      dto.digitalFalseCaption = params.digitalFalseCaption;
      dto.digitalTrueColor = params.digitalTrueColor;
      dto.digitalFalseColor = params.digitalFalseColor;
      dto.invert = params.invert;
      dto.bitSelect = params.bitSelect;
      dto.bitSelectConversion = params.bitSelectConversion;

      // Counter settings
      dto.offsetAutomatic = params.offsetAutomatic;
      dto.offsetDetection = params.offsetDetection;

      // Recording settings
      dto.recordingInterval = params.recordingInterval;

      // Convert to Signal entity
      const signal = dto.toSignal();

      // TODO: Save signal to backend API
      // For now, return the created signal data
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(SignalDTO.fromSignal(signal), null, 2),
          },
        ],
      };
    }
  );
}
