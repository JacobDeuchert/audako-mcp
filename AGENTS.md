# AGENTS.md

Repository-level guidance for coding agents in `audako-mcp-gateway`.

This root file focuses on how workspaces interact.
Package-specific build/test/style guidance lives in:

- `packages/backend-bridge/AGENTS.md`
- `packages/chat-ui/AGENTS.md`
- `packages/mcp-server/AGENTS.md`

When working inside a package, follow that package AGENTS file first.

## Development Phase

**This project is in active, high-speed development.**

- Backwards compatibility is not a priority — breaking changes are fine when there is a good reason.
- Conservative "safe" approaches are discouraged; prefer clean solutions over cautious ones.
- Bigger rewrites and structural changes are welcome when the current design is suboptimal.
- Do not add deprecation shims, legacy fallbacks, or migration layers unless explicitly asked.
- Move fast. Don't preserve old patterns out of habit.

## Monorepo Topology

- Package manager: npm workspaces (`packages/*`).
- Runtime pieces:
  - `@audako/chat-ui` (`packages/chat-ui`): embeddable Svelte 5 chat widget.
  - `@audako/backend-bridge` (`packages/backend-bridge`): HTTP bridge that provisions OpenCode sessions.
  - `audako-ai` (`packages/mcp-server`): MCP server process exposing Audako tools.
  - `@audako/contracts` (`packages/contracts`): shared TypeScript types and type guards used by both bridge and mcp-server.

## Cross-Package Interaction Model

### 1) UI → bridge provisioning flow
- A host app embeds `@audako/chat-ui` and uses `OpenCodeAdapter`.
- The host calls `backend-bridge` `POST /api/session/bootstrap` with SCADA credentials.
- Bridge returns/reuses an OpenCode URL + `sessionId` + `websocketUrl`.
- The UI/host points adapter traffic to that OpenCode instance via the returned `opencodeUrl`.

### 2) bridge → mcp-server process boot
- Bridge creates OpenCode servers via `OpencodeFactory` using `@opencode-ai/sdk/v2`.
- The OpenCode agent is named `"audako"` and only has `audako-mcp*` tools enabled (all built-in tools are disabled).
- Bridge launches `mcp-server/dist/index.js` as a local MCP process (`type: "local"`).
- Bridge injects required env vars into MCP process:
  - `AUDAKO_SYSTEM_URL` — SCADA backend URL
  - `AUDAKO_TOKEN` — SCADA access token
  - `AUDAKO_SESSION_ID` — bridge session ID
  - `AUDAKO_BRIDGE_URL` — internal bridge URL (e.g. `http://127.0.0.1:3000`)
  - `AUDAKO_BRIDGE_SESSION_TOKEN` — per-session token for MCP → bridge auth
  - `AUDAKO_MUTATION_DELAY_MS` — optional delay before mutation operations (default `150`)
- Agent system prompt is loaded from `.opencode/prompts/scada-agent.md` at bridge startup.

### 3) mcp-server → bridge session context lookup
- MCP tools read live session context from bridge endpoint:
  - `GET /api/session/:sessionId/info`
- Context used for scoped tool behavior: `tenantId`, `groupId`, `entityType`, `app`.
- On failures, tools return recoverable MCP errors (not crash the process).

### 4) host/UI → bridge context updates
- Host app updates client location context via:
  - `PUT /api/session/:sessionId/info`
- This enables location-aware MCP behavior without recreating sessions.

### 5) mcp-server → bridge event push
- MCP tools push domain events (entity created/updated) and interactive requests (question prompts) via:
  - `POST /api/session/:sessionId/events` — fire-and-forget push
  - `POST /api/session/:sessionId/events/request` — push and wait for user response (long-poll + polling fallback)
- The bridge fans events to WebSocket subscribers on that session.

## Coupling and Build Dependencies

- `backend-bridge` has a runtime dependency on built MCP output:
  - `packages/mcp-server/dist/index.js`
- `packages/contracts` is a shared dependency used by both bridge and mcp-server.
- For local end-to-end testing/builds, build in this order:
  1. `npm run build --workspace @audako/contracts`
  2. `npm run build --workspace audako-ai`
  3. `npm run build --workspace @audako/backend-bridge`
- If MCP tools/resources change, rebuild `audako-ai` before validating bridge flows.

## Integration Modes

- Full Audako flow: host app + `chat-ui` + `backend-bridge` + `mcp-server`.
- UI-only flow: `chat-ui` can use `OpenAIAdapter` or `MockAdapter` without bridge/MCP.
- Bridge-only maintenance: bridge can be exercised by API clients without `chat-ui`.

## Shared Cross-Package Contracts

- `sessionId` is the principal key linking bridge and MCP context.
- Bridge session schema fields: `tenantId`, `groupId`, `entityType`, `app`, `updatedAt`.
- `@audako/contracts` owns shared event payload types and type guards — changes there affect both bridge and mcp-server.
- Tool names in MCP must be unique; bridge/OpenCode assume stable registration.

## Change Impact Guidance

- Changing bridge session endpoint payloads affects `mcp-server` tools and `@audako/contracts`.
- Changing MCP env variable names requires bridge `OpencodeFactory` updates.
- Adding new env vars to the MCP process requires updating `opencode-factory.ts` and this doc.
- Changing OpenCode adapter expectations may affect host integrations and chat-ui docs.
- Before refactors, trace call chain across all three workspaces.

## Environment and Secrets Boundaries

- Root `.env.example` documents baseline MCP auth settings.
- `packages/backend-bridge/.env.example` documents bridge/OpenCode config.
- Never commit real secrets; `.env*` files are gitignored.
- Prefer explicit startup validation for any new required env vars.

## Root Commands (Orchestration)

- Install all workspaces: `npm install`
- Build all workspaces: `npm run build`
- Run all dev scripts: `npm run dev`
- Run all test scripts: `npm run test`
- Format code with Biome: `npx biome format --write .`

For package-specific commands and test workflows, see each package AGENTS file.
