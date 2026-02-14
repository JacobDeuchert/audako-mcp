# Getting Started with Audako MCP Server

This MCP (Model Context Protocol) server enables Claude (via OpenCode or Claude Code) to interact with the Audako system for data acquisition and signal management.

## Overview

The Audako MCP Server provides tools to:
- List and select tenants in your Audako system
- Create signal configurations for data acquisition (analog, digital, and counter signals)
- Access documentation resources

## Prerequisites

- Node.js >= 18.0.0
- Access to an Audako system instance
- Audako API token

## Installation

### Option 1: Install from npm (if published)

```bash
npm install -g audako-ai
```

### Option 2: Install from local development

```bash
cd /path/to/audako-mcp-gateway/packages/mcp-server
npm install
npm run build
npm link
```

## Configuration

### Environment Variables

Create a `.env` file or set the following environment variables:

```bash
AUDAKO_SYSTEM_URL=https://your-audako-instance.com
AUDAKO_TOKEN=your-api-token-here

# Optional logging configuration
# Default: ./logs/audako-mcp-YYYY-MM-DD.log
AUDAKO_LOG_DIR=./logs
AUDAKO_LOG_FILE=audako-mcp.log

# Optional log level (DEBUG, INFO, WARN, ERROR)
AUDAKO_LOG_LEVEL=INFO
```

### Configure for OpenCode or Claude Code

Add the Audako MCP server to your MCP configuration file:

#### For OpenCode/Claude Code

Edit your MCP settings file (typically at `~/.config/claude/mcp.json` or similar):

```json
{
  "mcpServers": {
    "audako": {
      "command": "audako-ai",
      "env": {
        "AUDAKO_SYSTEM_URL": "https://your-audako-instance.com",
        "AUDAKO_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

#### Alternative: Using Node directly

If you haven't installed globally, you can reference the built script directly:

```json
{
  "mcpServers": {
    "audako": {
      "command": "node",
      "args": ["/path/to/audako-mcp-gateway/packages/mcp-server/dist/index.js"],
      "env": {
        "AUDAKO_SYSTEM_URL": "https://your-audako-instance.com",
        "AUDAKO_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### Restart OpenCode/Claude Code

After adding the configuration, restart your OpenCode or Claude Code instance to load the MCP server.

## Usage

Once configured, you can interact with the Audako system through natural language commands in OpenCode/Claude Code.

### Basic Workflow

1. **List available tenants:**
   ```
   List all available tenants in Audako
   ```

2. **Select a tenant to work with:**
   ```
   Select the tenant named "Production Plant"
   ```
   or
   ```
   Select tenant with ID abc-123-def
   ```

3. **Create signals:**
   ```
   Create an analog input signal named "Temperature Sensor 1" 
   with range 0-100°C at address "40001"
   ```

### Available Tools

The MCP server provides the following tools that Claude can use:

#### 1. list-tenants
Lists available tenants in your Audako system.

**Parameters:**
- `parentTenantId` (optional): Get child tenants of a specific parent

**Example usage:**
```
Show me all top-level tenants
```

#### 2. select-tenant
Selects a tenant for all subsequent operations.

**Parameters:**
- `tenantId` (optional): ID of the tenant
- `tenantName` (optional): Name of the tenant (will search for matches)

**Example usage:**
```
Select the "Factory Floor" tenant
```

**Important:** You must select a tenant before performing any signal operations.

#### 3. get-selected-tenant
Shows which tenant is currently selected.

**Example usage:**
```
Which tenant am I currently working with?
```

#### 4. create-signal
Creates a new signal configuration for data acquisition.

**Common Parameters:**
- `name`: Name of the signal (required)
- `type`: Signal type (required) - one of:
  - `AnalogInput`: Read-only analog signal
  - `AnalogInOut`: Read/write analog signal
  - `DigitalInput`: Read-only digital signal
  - `DigitalInOut`: Read/write digital signal
  - `Counter`: Counter signal
- `description`: Description of the signal
- `groupId`: Parent group ID (uses tenant root if not provided)
- `alias`: Alias name for the signal
- `dataConnectionId`: ID of the data connection (required for physical signals)
- `address`: Address for data acquisition (virtual if not provided)

**Analog Signal Parameters:**
- `minValue`: Minimum value
- `maxValue`: Maximum value
- `defaultValue`: Default value
- `decimalPlaces`: Number of decimal places
- `unit`: Unit of measurement (e.g., '°C', 'kWh', 'bar')
- `factor`: Multiplication factor
- `offset`: Offset value

**Digital Signal Parameters:**
- `digitalTrueCaption`: Label when value is true (e.g., 'On', 'Open')
- `digitalFalseCaption`: Label when value is false (e.g., 'Off', 'Closed')
- `digitalTrueColor`: Color when true (hex code)
- `digitalFalseColor`: Color when false (hex code)
- `invert`: Invert the signal value
- `bitSelect`: Bit position to select from value
- `bitSelectConversion`: Bit select conversion type

**Counter Signal Parameters:**
- `maxValue`: Maximum counter value
- `decimalPlaces`: Number of decimal places
- `unit`: Unit of measurement
- `factor`: Multiplication factor
- `offset`: Offset value
- `offsetAutomatic`: Enable automatic offset
- `offsetDetection`: Enable offset detection

**Recording Settings:**
- `recordingInterval`: Recording interval in seconds

**Example usage:**
```
Create an analog input temperature signal:
- Name: "Boiler Temperature"
- Address: "40001"
- Range: 0 to 150
- Unit: °C
- Decimal places: 1
- Data connection ID: "conn-123"
```

### Example Conversations

#### Example 1: Setting up a temperature sensor

```
You: I need to create a temperature sensor for my boiler

Claude: I'll help you create a temperature sensor. First, let me list the available 
tenants so we can select the right one.

[Claude uses list-tenants tool]

Claude: I found these tenants:
1. Production Plant (id: abc-123)
2. Test Environment (id: def-456)

Which tenant should we use?

You: Use the Production Plant

Claude: [Selects Production Plant tenant]
Perfect! Now let's create the temperature sensor. I'll need a few details:
- What's the address for this sensor?
- What's the temperature range?
- Which data connection should we use?

You: Address is 40001, range is 0 to 150 degrees Celsius, 
use data connection "modbus-boiler-1"

Claude: [Creates signal with appropriate parameters]
I've successfully created the "Boiler Temperature" signal with:
- Type: Analog Input
- Address: 40001
- Range: 0-150°C
- Data Connection: modbus-boiler-1
- Decimal places: 1
```

#### Example 2: Creating a digital valve control

```
You: Create a digital signal for a valve control at address 00001

Claude: [Checks selected tenant, lists tenants if none selected]
[After tenant selection]

I'll create a digital signal for valve control. 

Claude: [Creates signal]
I've created a "Valve Control" signal:
- Type: Digital In/Out (for read/write capability)
- Address: 00001
- True state: "Open"
- False state: "Closed"
```

## Resources

The MCP server also provides access to documentation resources:

- `docs://index`: Lists all available documentation files
- `docs://files/{filename}`: Access specific documentation files

## Troubleshooting

### Connection Issues

If Claude reports connection errors:

1. Verify `AUDAKO_SYSTEM_URL` is correct and accessible
2. Check that `AUDAKO_TOKEN` is valid and not expired
3. Ensure the Audako system is running and network accessible

### Tenant Selection Required

If you see "No tenant selected" errors:
- Always use `select-tenant` or `list-tenants` before creating signals
- Claude will automatically prompt you to select a tenant if needed

### Signal Creation Fails

Common issues:
- Missing required `dataConnectionId` for physical signals with an address
- Invalid signal type for the parameters provided
- Incorrect address format for the data connection type

## Development

### Testing the Server

You can test the MCP server using the MCP Inspector:

```bash
npm run test
```

This launches the MCP Inspector tool where you can manually test the server's tools.

### Building

```bash
npm run build
```

### Watching for Changes

```bash
npm run dev
```

## Support

For issues, questions, or contributions, please refer to the main repository documentation.
