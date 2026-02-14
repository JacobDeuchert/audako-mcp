# Backend Bridge

A Node.js service that dynamically creates and manages OpenCode server instances for SCADA systems. When a chat UI connects with SCADA credentials, it returns a URL to a dedicated OpenCode server configured with custom SCADA-specific MCP server and agent.

## Features

- **Dynamic Server Creation**: Creates dedicated OpenCode server instances per SCADA system
- **Server Reuse**: Same credentials always return the same server instance
- **Resource Management**: Automatic cleanup of idle servers (1 hour timeout)
- **Port Management**: Dynamic port allocation from a configurable pool (30000-31000)
- **Capacity Control**: Maximum 50 concurrent servers (configurable)
- **Custom Agent**: SCADA-optimized primary agent with specialized prompts
- **MCP Integration**: Pre-configured MCP server with SCADA credentials
- **Session Context**: Per-server session IDs with updateable tenant/group/entity context

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

Key configuration options:

- `PORT`: Backend bridge API port (default: 3000)
- `BACKEND_BRIDGE_INTERNAL_URL`: Internal URL used by MCP to query session context (default: `http://127.0.0.1:${PORT}`)
- `OPENCODE_BASE_PORT`: Starting port for OpenCode instances (default: 30000)
- `OPENCODE_MAX_PORT`: Maximum port for OpenCode instances (default: 31000)
- `OPENCODE_MAX_SERVERS`: Maximum concurrent servers (default: 50)
- `OPENCODE_IDLE_TIMEOUT`: Idle timeout in ms (default: 3600000 - 1 hour)

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### Create/Get OpenCode Server

**POST** `/api/opencode/create`

Creates a new OpenCode server instance or returns an existing one for the given SCADA credentials.

Request:

```json
{
  "scadaUrl": "https://scada.example.com",
  "accessToken": "Bearer xxx...",
  "model": "anthropic/claude-sonnet-4-20250514"
}
```

Response (New):

```json
{
  "opencodeUrl": "http://localhost:30001",
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "isNew": true,
  "scadaUrl": "https://scada.example.com"
}
```

Response (Existing):

````json
{
  "opencodeUrl": "http://localhost:30001",
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "isNew": false,
  "scadaUrl": "https://scada.example.com"
}

### Update Session Context

**PUT** `/api/opencode/sessions/:sessionId/info`

Updates location-aware session context used by MCP tools. `tenantId`, `groupId`, `entityType`, and `app` are optional.

Request:
```json
{
  "tenantId": "tenant-123",
  "groupId": "group-456",
  "entityType": "signal",
  "app": "designer"
}
````

Response:

```json
{
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "tenantId": "tenant-123",
  "groupId": "group-456",
  "entityType": "signal",
  "app": "designer",
  "updatedAt": "2026-02-12T10:30:00.000Z"
}
```

### Get Session Context

**GET** `/api/opencode/sessions/:sessionId/info`

Returns the current session context for MCP lookups.

````

### Health Check

**GET** `/health`

Returns server status and metrics.

Response:
```json
{
  "status": "ok",
  "activeServers": 12,
  "maxServers": 50,
  "availablePorts": 988
}
````

### List Active Servers

**GET** `/api/opencode/servers`

Returns list of active OpenCode servers (for debugging).

Response:

```json
{
  "servers": [
    {
      "scadaUrl": "https://scada.example.com",
      "opencodeUrl": "http://localhost:30001",
      "port": 30001,
      "createdAt": "2024-12-07T10:00:00Z",
      "lastAccessedAt": "2024-12-07T10:45:00Z",
      "idleMinutes": 15
    }
  ]
}
```

## Architecture

```
Chat UI → Backend Bridge → OpenCode Server Instance ← MCP Server (Audako SCADA)
          (HTTP/REST)        (per SCADA system)        (stdio transport)
```

### Components

1. **Backend Bridge API** (Fastify)
   - REST endpoints for server management
   - No authentication required (trusts chat UI)

2. **Server Registry**
   - Maps `(scadaUrl, accessToken)` to OpenCode server instances
   - Ensures one server per unique SCADA connection
   - Auto-cleanup of idle servers

3. **OpenCode Server Instances**
   - Created using `@opencode-ai/sdk`
   - Each runs on a unique port (30000-31000)
   - Pre-configured with SCADA-specific agent and MCP server

4. **MCP Server Integration**
   - Each OpenCode instance spawns its own MCP server process
   - MCP server initialized with SCADA credentials
   - Communicates via stdio transport

## Security

- Access tokens are hashed (SHA-256) for registry lookups
- Tokens never logged in plaintext
- Tokens stored only in memory (not persisted)
- OpenCode servers bind to localhost only (127.0.0.1)
- CORS enabled (configure origins as needed)

## Development

### Project Structure

```
packages/backend-bridge/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── server.ts                # Fastify server setup
│   ├── routes/
│   │   ├── opencode.routes.ts  # OpenCode endpoints
│   │   └── health.routes.ts    # Health check
│   ├── services/
│   │   ├── server-registry.ts  # Server registry management
│   │   ├── port-allocator.ts   # Port management
│   │   └── opencode-factory.ts # OpenCode server creation
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── config/
│       └── index.ts            # Configuration management
├── prompts/
│   └── scada-agent.md          # Custom agent prompt
├── package.json
├── tsconfig.json
└── PLAN.md
```

### Next Steps

See [PLAN.md](./PLAN.md) for detailed implementation plan and progress tracking.

Remaining tasks:

- Test OpenCode server creation with SDK
- Test MCP server connectivity
- Write integration tests
- Complete API documentation
- Create deployment guide

## License

Private - Audako
