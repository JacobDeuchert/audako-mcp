# Backend Bridge

Backend Bridge provisions and reuses OpenCode servers for SCADA sessions, stores in-memory session context, and exposes a session-scoped WebSocket event channel.

## Features

- Session bootstrap API with one-call connection metadata (`opencodeUrl`, `websocketUrl`, `sessionId`)
- Deterministic server reuse for the same `(scadaUrl, accessToken)` pair
- Session context storage (`tenantId`, `groupId`, `entityType`, `app`)
- Session-scoped WebSocket subscriptions with snapshot + pushed events
- Generic server-side push endpoint for session event fanout
- Request/response session events for interactive hub flows (for example question prompts)
- Idle server cleanup with automatic resource release

## Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Important variables:

- `PORT` (default: `3000`)
- `HOST` (default: `0.0.0.0`)
- `BACKEND_BRIDGE_INTERNAL_URL` (used by MCP process callbacks)
- `BACKEND_BRIDGE_PUBLIC_URL` (optional public/proxied URL used to build `websocketUrl`)
- `OPENCODE_BASE_PORT`, `OPENCODE_MAX_PORT`
- `OPENCODE_MAX_SERVERS`
- `OPENCODE_IDLE_TIMEOUT`, `OPENCODE_CLEANUP_INTERVAL`
- `OPENCODE_CORS_ORIGINS`
- `DEFAULT_MODEL`, `LOG_LEVEL`

## API

### POST `/api/session/bootstrap`

Create or reuse an OpenCode session server.

Request body:

```json
{
  "scadaUrl": "https://scada.example.com",
  "accessToken": "Bearer xxx...",
  "model": "anthropic/claude-sonnet-4-20250514",
  "sessionInfo": {
    "tenantId": "tenant-123",
    "groupId": "group-456",
    "entityType": "signal",
    "app": "designer"
  }
}
```

Response:

```json
{
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "isNew": true,
  "scadaUrl": "https://scada.example.com",
  "opencodeUrl": "http://localhost:30001",
  "websocketUrl": "ws://bridge.example.com/api/session/0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f/ws",
  "sessionInfo": {
    "tenantId": "tenant-123",
    "groupId": "group-456",
    "entityType": "signal",
    "app": "designer",
    "updatedAt": "2026-02-15T10:30:00.000Z"
  }
}
```

### GET `/api/session/:sessionId/ws`

Open session-scoped WebSocket connection.

- Sends `session.snapshot` immediately on connect.
- Emits pushed events (`session.info.updated`, `session.event`, `session.closed`).
- Supports heartbeat (`ping`/`pong`) and stale socket cleanup.

### PUT `/api/session/:sessionId/info`

Update session context used by MCP tools.

Request body:

```json
{
  "tenantId": "tenant-123",
  "groupId": "group-456",
  "entityType": "signal",
  "app": "designer"
}
```

Response:

```json
{
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "tenantId": "tenant-123",
  "groupId": "group-456",
  "entityType": "signal",
  "app": "designer",
  "updatedAt": "2026-02-15T10:30:00.000Z"
}
```

Also broadcasts `session.info.updated` to subscribers on that session.

### GET `/api/session/:sessionId/info`

Fetch current session context (used by MCP server process).

### POST `/api/session/:sessionId/events`

Publish a session event to WebSocket subscribers.

Request body:

```json
{
  "type": "ui.notification",
  "payload": {
    "level": "info",
    "message": "Background sync completed"
  }
}
```

Response:

```json
{
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "deliveredTo": 2
}
```

### POST `/api/session/:sessionId/events/request`

Publish a session event and wait for a correlated response.

Request body:

```json
{
  "type": "question.ask",
  "payload": {
    "text": "Which response style should I use?",
    "options": [
      { "label": "Concise", "value": "concise" },
      { "label": "Detailed", "value": "detailed" }
    ],
    "allowMultiple": false
  },
  "timeoutMs": 180000
}
```

Response:

```json
{
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "requestId": "f2bc1589-2d2d-4a30-9600-7c1fc7f4fe06",
  "response": ["concise"],
  "respondedAt": "2026-02-16T12:01:00.000Z"
}
```

Notes:

- `timeoutMs` defaults to `180000` (3 minutes).
- Values are clamped between `1000` and `180000`.
- Returns `503` if no active websocket subscribers are available.
- Returns `504` if no response is received before timeout.

### POST `/api/session/:sessionId/events/request/:requestId/response`

Resolve a pending request event.

Request body:

```json
{
  "response": ["concise"]
}
```

Response:

```json
{
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "requestId": "f2bc1589-2d2d-4a30-9600-7c1fc7f4fe06",
  "resolved": true
}
```

### GET `/api/session/servers`

Debug endpoint to list active OpenCode server mappings.

### GET `/health`

Service health and capacity snapshot.

## Event Envelope

All WebSocket events follow this envelope:

```json
{
  "type": "session.snapshot",
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "timestamp": "2026-02-15T10:30:00.000Z",
  "payload": {}
}
```

Common event types:

- `session.snapshot`
- `session.info.updated`
- `session.event`
- `session.closed`

Domain events emitted by the MCP server are delivered through `session.event` and exposed as `payload.type` values. Current domain event types:

- `entity.created`
- `entity.updated`
- `hub.request` (bridge-generated request/response prompt event)

Example websocket message for an entity domain event:

```json
{
  "type": "session.event",
  "sessionId": "0f25459a-4f7f-4f0f-b4f2-12d2c73c6a4f",
  "timestamp": "2026-02-15T10:30:00.000Z",
  "payload": {
    "type": "entity.updated",
    "payload": {
      "entityType": "Signal",
      "entityId": "signal-123",
      "tenantId": "tenant-123",
      "groupId": "group-456",
      "changedFields": ["name", "description"],
      "sourceTool": "update-entity",
      "timestamp": "2026-02-15T10:30:00.000Z"
    }
  }
}
```

## Development

```bash
npm run dev --workspace @audako/backend-bridge
```

Build:

```bash
npm run build --workspace @audako/backend-bridge
```

Full local integration build order:

```bash
npm run build --workspace audako-ai
npm run build --workspace @audako/backend-bridge
```

## Notes

- Legacy `/api/opencode/*` routes are removed.
- Access tokens are stored in memory and never logged in plaintext.
