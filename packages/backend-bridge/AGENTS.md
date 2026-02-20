# AGENTS.md - @audako/backend-bridge

Package-level guidance for coding agents working in `packages/backend-bridge`.

## Role in the System
- Exposes HTTP APIs for provisioning/reusing OpenCode servers.
- Stores in-memory session context keyed by `sessionId`.
- Launches `packages/mcp-server/dist/index.js` as MCP process through OpenCode config.
- Bridges host/UI context updates to MCP tools via session info endpoints.

## Key Endpoints
- `POST /api/session/bootstrap`
  - Input: `scadaUrl`, `accessToken`, optional `model`, optional `sessionInfo`.
  - Output: `opencodeUrl`, `websocketUrl`, `sessionId`, `isNew`, `scadaUrl`, `sessionInfo`.
- `GET /api/session/:sessionId/ws`
  - Session-scoped websocket stream with snapshot + pushed events.
- `PUT /api/session/:sessionId/info`
  - Updates optional `tenantId`, `groupId`, `entityType`, `app`.
- `GET /api/session/:sessionId/info`
  - Returns current session context used by `mcp-server`.
- `POST /api/session/:sessionId/events`
  - Pushes generic events to websocket subscribers.
- `POST /api/session/:sessionId/events/request`
  - Pushes an event and waits for a correlated response.
- `POST /api/session/:sessionId/events/request/:requestId/response`
  - Resolves a pending request event.
- `GET /api/session/servers`
  - Debug view of active server mappings.
- `GET /health`
  - Bridge health and port/capacity status.

## Build, Run, Lint, Test
- Dev (watch): `npm run dev --workspace @audako/backend-bridge`
- Build: `npm run build --workspace @audako/backend-bridge`
- Start built app: `npm run start --workspace @audako/backend-bridge`
- Lint: `npm run lint --workspace @audako/backend-bridge`
- Format TS: `npm run format --workspace @audako/backend-bridge`
- Test (Vitest): `npm run test --workspace @audako/backend-bridge`

## Single-Test Workflows (Vitest)
- Run one file:
  - `npm run test --workspace @audako/backend-bridge -- src/path/to/file.test.ts`
- Run by test name:
  - `npm run test --workspace @audako/backend-bridge -- -t "test name fragment"`
- Run file + test name:
  - `npm run test --workspace @audako/backend-bridge -- src/path/to/file.test.ts -t "specific case"`

## Local E2E Dependency
- Bridge depends on built MCP output at runtime.
- Build MCP first when validating provisioning flows:
  - `npm run build --workspace audako-ai && npm run build --workspace @audako/backend-bridge`

## Environment
- Copy package env template when running locally:
  - `cp packages/backend-bridge/.env.example packages/backend-bridge/.env`
- Important variables:
  - `PORT`, `HOST`, `BACKEND_BRIDGE_INTERNAL_URL`, `BACKEND_BRIDGE_PUBLIC_URL`
  - `OPENCODE_BASE_PORT`, `OPENCODE_MAX_PORT`, `OPENCODE_MAX_SERVERS`
  - `OPENCODE_IDLE_TIMEOUT`, `OPENCODE_CLEANUP_INTERVAL`, `OPENCODE_CORS_ORIGINS`
  - `DEFAULT_MODEL`, `LOG_LEVEL`

## Code Style and Patterns
- TypeScript + ESM; keep strict typing.
- Use `.js` suffix for local imports in TS source.
- Keep route typings explicit (`Body`, `Params`, `Reply`).
- Prefer `import type` for type-only imports.
- Use structured logging with `pino` and avoid logging secrets.
- Normalize unknown errors: `error instanceof Error ? error.message : String(error)`.
- Preserve existing style of touched file (quote style may differ by file).

## Safety Notes
- Never log plaintext access tokens.
- Keep `sessionId` handling stable; it is the cross-package link key.
- Preserve response schema compatibility for session endpoints.
- Avoid changing MCP env var names without coordinated `mcp-server` updates.
