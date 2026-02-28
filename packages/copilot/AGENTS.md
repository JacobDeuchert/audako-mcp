# AGENTS.md - @audako/copilot

Package-level guidance for coding agents working in `packages/copilot`.

## Role in the System

- LLM-based task automation engine.
- Runs a `pi-agent-core` Agent per session.
- Exposes a Fastify-based HTTP and WebSocket API for `@audako/chat-ui` integration.
- Orchestrates tools for SCADA entity management and data querying.

## Source Structure

```
src/
  index.ts              — Entry point
  server.ts             — Fastify server factory; integrates WebSocket and routes
  agent/
    agent-factory.ts    — createSessionAgent() factory; configures pi-agent-core
    ws-event-bridge.ts  — Maps pi-agent events to standardized WebSocket event envelopes
  config/
    index.ts            — App configuration, environment variable loading, and logger factory
  routes/
    health.routes.ts    — GET /health
    session.routes.ts   — All /api/session/* routes (bootstrap, WS, info, events)
  services/
    session-registry.ts — Session lifecycle management and agent provisioning
    session-event-hub.ts — Per-session WebSocket fanout and subscription management
    session-request-hub.ts — Request/response event broker for interactive turns
    tool-request-hub.ts — Tool-level request hub (wraps session-request-hub)
    audako-services.ts  — SCADA HTTP service factory
    session-context.ts  — Session state (tenantId, groupId, etc.)
    mutation-throttle.ts — Throttle between entity mutations
    mutation-permissions.ts — Permission checking for mutations
    mutation-scope-guard.ts — Scope validation for entity operations
    auth-validator.ts   — Upstream SCADA token validation
    session-auth.ts     — Internal session token validation middleware
  tools/                — Agent tool implementations
    read-only-tools.ts  — Entity querying and metadata tools
    mutation-tools.ts   — Entity creation, update, and movement tools
    ask-question.ts     — Interactive user prompting tool
  entity-type-definitions/ — Entity type schemas and contract definitions
```

## Key Endpoints

- `POST /api/session/bootstrap` — Create/reuse session. Returns `sessionId`, `websocketUrl`, and `bridgeSessionToken`.
- `GET /api/session/:sessionId/ws` — WebSocket endpoint for agent streaming and user interaction.
- `PUT /api/session/:sessionId/info` — Update session context (tenant, group, app).
- `GET /api/session/:sessionId/info` — Retrieve current session context.
- `POST /api/session/:sessionId/events` — Push an event to all WebSocket subscribers.
- `POST /api/session/:sessionId/events/request` — Push a request event and wait for a response.
- `POST /api/session/:sessionId/events/request/:requestId/response` — Resolve a pending request from the client.
- `GET /health` — Simple health check.

## WebSocket Event Types

Standardized envelopes mapped by `ws-event-bridge.ts`:

- `agent.text_delta` — Streaming text chunk from the assistant.
- `agent.turn_start` — New agent turn has started.
- `agent.turn_end` — Agent turn is complete.
- `agent.tool_start` — Tool invocation has started.
- `agent.tool_end` — Tool invocation has finished (includes output).
- `agent.error` — Agent encountered a runtime error.
- `hub.request` — Interactive question prompt (e.g., from `ask-question` tool).

## Configuration (Environment Variables)

- `PORT` — Server port (default: 3001).
- `HOST` — Server host (default: 0.0.0.0).
- `CORS_ORIGINS` — Comma-separated list of allowed origins.
- `SESSION_IDLE_TIMEOUT` — Session expiration in milliseconds.
- `LLM_PROVIDER` — LLM provider (e.g., `anthropic`).
- `LLM_MODEL_NAME` — Model identifier.
- `MUTATION_DELAY_MS` — Artificial delay between mutations.
- `QUESTION_TIMEOUT_MS` — Timeout for interactive questions.
- `LOG_LEVEL` — Pino logging level (default: `info`).

## Build, Run, Test

- Dev: `npm run dev --workspace @audako/copilot`
- Build: `npm run build --workspace @audako/copilot`
- Test: `npm run test --workspace @audako/copilot`
- Single test: `npm run test --workspace @audako/copilot -- src/path/to/file.test.ts`

## Code Style

- Fastify + TypeScript.
- Strict session isolation — use `SessionRegistry` to access session-specific instances.
- Error handling: use `logger.error` for system issues; return clean JSON errors for clients.
- `import type` for type-only imports.
