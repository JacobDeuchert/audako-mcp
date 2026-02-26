# AGENTS.md - @audako/backend-bridge

Package-level guidance for coding agents working in `packages/backend-bridge`.

## Development Phase

**High-speed development. Bigger rewrites welcome. No backwards compatibility obligation.**
Prefer clean solutions; avoid conservative patches that preserve bad structure.

## Role in the System

- Provisions and reuses OpenCode server instances per SCADA credential pair.
- Stores in-memory session context keyed by `sessionId`.
- Launches `packages/mcp-server/dist/index.js` as a local MCP process via OpenCode config.
- Bridges host/UI context updates to MCP tools via session info endpoints.
- Fans session events (domain events, question prompts) to WebSocket subscribers.

## Source Structure

```
src/
  index.ts              — Entry point: builds app, registers routes, starts server, starts cleanup task
  server.ts             — Fastify app factory with plugins (CORS, JSON schema, pino logger)
  utils.ts              — getErrorMessage() utility
  config/               — App config loaded from env (PORT, OPENCODE_*, DEFAULT_MODEL, etc.)
  types/                — Shared TypeScript types: OpencodeRuntime, ServerRegistryEntry,
                          SessionInfo, SessionInfoFields
  routes/
    health.routes.ts    — GET /health — service health and capacity snapshot
    session.routes.ts   — All /api/session/* routes; orchestrates registry + event hubs
  services/
    opencode-factory.ts — Creates OpenCode server instances via @opencode-ai/sdk/v2.
                          Loads agent system prompt from .opencode/prompts/scada-agent.md.
                          Injects all AUDAKO_* env vars into the MCP process.
    server-registry.ts  — ServerRegistry: in-memory map of active OpenCode runtimes keyed by
                          SHA-256(scadaUrl + accessToken). Handles port allocation, session
                          token generation/verification, idle cleanup, concurrent request coalescing.
    session-event-hub.ts — Per-session WebSocket fanout: snapshot on connect, push events to
                           all subscribers, heartbeat, stale socket cleanup.
    session-request-hub.ts — Request/response event broker: long-poll support (202 pending response),
                              polling status endpoint, timeout management.
    auth-validator.ts   — Validates AUDAKO_BRIDGE_SESSION_TOKEN on MCP → bridge requests.
    session-auth.ts     — Session-scoped auth middleware used by MCP-facing routes.
    port-allocator.ts   — Manages the pool of ports available for OpenCode server instances.
```

## Key Endpoints

- `POST /api/session/bootstrap`
  - Input: `scadaUrl`, `accessToken`, optional `model`, optional `sessionInfo`.
  - Output: `opencodeUrl`, `websocketUrl`, `sessionId`, `isNew`, `scadaUrl`, `sessionInfo`.
- `GET /api/session/:sessionId/ws`
  - Session-scoped WebSocket stream — sends `session.snapshot` on connect, then pushed events.
- `PUT /api/session/:sessionId/info`
  - Updates `tenantId`, `groupId`, `entityType`, `app`. Broadcasts `session.info.updated`.
- `GET /api/session/:sessionId/info`
  - Returns current session context; consumed by `mcp-server` tools.
- `POST /api/session/:sessionId/events`
  - Fire-and-forget push to WebSocket subscribers. Returns `{ deliveredTo: N }`.
- `POST /api/session/:sessionId/events/request`
  - Push event and block until response. Supports `longPollMs` for a held connection.
  - Returns `202` with `{ requestId }` if long-poll window expires before response.
- `GET /api/session/:sessionId/events/request/:requestId/status`
  - Poll for response after a 202. Returns `{ status: 'pending' | 'resolved' | 'expired', response? }`.
- `POST /api/session/:sessionId/events/request/:requestId/response`
  - Resolves a pending request event from the UI side.
- `GET /api/session/servers`
  - Debug view of active server mappings.
- `GET /health`
  - Bridge health and port/capacity status.

## Session Lifecycle and Server Reuse

- Sessions are keyed by `SHA-256(scadaUrl + accessToken)`.
- Concurrent bootstrap requests for the same credentials are **coalesced** — only one server is created.
- Each session gets a unique `bridgeSessionToken` (64-char random hex). Only the SHA-256 hash is stored; the plaintext is returned once in the bootstrap response and injected into the MCP process env.
- Token verification uses `timingSafeEqual` to prevent timing attacks.
- Idle servers are cleaned up after `OPENCODE_IDLE_TIMEOUT` ms (default 1 hour). Cleanup runs every 15 minutes.
- Port allocation retries on `EADDRINUSE`; ports outside the allocator pool that are in use are skipped.

## OpenCode Agent Configuration

Defined in `opencode-factory.ts`:

- Agent name: `"audako"`, mode: `"primary"`.
- All built-in OpenCode tools are explicitly disabled (`bash`, `edit`, `write`, `read`, `grep`, `glob`, `list`, `lsp`, `patch`, `apply_patch`, `webfetch`, `websearch`, `task`, `todowrite`).
- Only `audako-mcp*` tools are enabled.
- MCP process launched as `type: "local"` with `command: ["node", "<mcp-server dist path>"]`.
- System prompt loaded from `.opencode/prompts/scada-agent.md` at startup (read once, cached).

## WebSocket Event Envelope

All WebSocket events:

```json
{ "type": "...", "sessionId": "...", "timestamp": "...", "payload": {} }
```

Event types:
- `session.snapshot` — sent on WS connect
- `session.info.updated` — after PUT /info
- `session.closed` — server removed
- `entity.created` / `entity.updated` — domain events from MCP tools
- `hub.request` — interactive prompt pushed by mutation tools / `ask-question`

## Build, Run, Lint, Test

- Dev (watch): `npm run dev --workspace @audako/backend-bridge`
- Build: `npm run build --workspace @audako/backend-bridge`
- Start: `npm run start --workspace @audako/backend-bridge`
- Lint: `npm run lint --workspace @audako/backend-bridge`
- Format: `npm run format --workspace @audako/backend-bridge`
- Test (Vitest): `npm run test --workspace @audako/backend-bridge`

## Single-Test Workflows (Vitest)

- Run one file: `npm run test --workspace @audako/backend-bridge -- src/path/to/file.test.ts`
- Run by name: `npm run test --workspace @audako/backend-bridge -- -t "test name fragment"`
- Run file + name: `npm run test --workspace @audako/backend-bridge -- src/path/to/file.test.ts -t "case"`

## Local E2E Dependency

Bridge depends on built MCP output at runtime:

```bash
npm run build --workspace audako-ai && npm run build --workspace @audako/backend-bridge
```

## Environment Variables

Copy `.env.example` to `.env` for local runs.

| Variable | Purpose |
|---|---|
| `PORT` | HTTP listen port (default `3000`) |
| `HOST` | Bind address (default `0.0.0.0`) |
| `BACKEND_BRIDGE_INTERNAL_URL` | URL the MCP process uses to reach the bridge |
| `BACKEND_BRIDGE_PUBLIC_URL` | Optional public/proxied URL for `websocketUrl` in bootstrap response |
| `OPENCODE_BASE_PORT` | Start of OpenCode server port range |
| `OPENCODE_MAX_PORT` | End of port range |
| `OPENCODE_MAX_SERVERS` | Max concurrent OpenCode runtimes |
| `OPENCODE_IDLE_TIMEOUT` | Idle TTL in ms before a server is cleaned up |
| `OPENCODE_CLEANUP_INTERVAL` | How often to run idle cleanup (ms) |
| `OPENCODE_CORS_ORIGINS` | Comma-separated allowed CORS origins for OpenCode |
| `DEFAULT_MODEL` | Default model string for OpenCode agent |
| `LOG_LEVEL` | Pino log level |

## Code Style

- TypeScript + ESM. Use `.js` suffix for local imports.
- Route type annotations: explicit `Body`, `Params`, `Reply` generics.
- `import type` for type-only imports.
- Structured logging with `pino`; never log plaintext access tokens or session tokens.
- Normalize unknown errors: `error instanceof Error ? error.message : String(error)`.

## Safety Notes

- Never log plaintext access tokens or bridge session tokens.
- `sessionId` is the cross-package link key — keep its handling stable.
- New MCP env vars require updates to `opencode-factory.ts` and root `AGENTS.md`.
