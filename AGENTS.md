# AGENTS.md

Repository-level guidance for coding agents in `audako-mcp-gateway`.

This root file focuses on how workspaces interact.
Package-specific build/test/style guidance lives in:

- `packages/backend-bridge/AGENTS.md`
- `packages/chat-ui/AGENTS.md`
- `packages/mcp-server/AGENTS.md`

When working inside a package, follow that package AGENTS file first.

## Monorepo Topology
- Package manager: npm workspaces (`packages/*`).
- Runtime pieces:
  - `@audako/chat-ui`: embeddable Svelte chat widget.
  - `@audako/backend-bridge`: HTTP bridge that provisions OpenCode sessions.
  - `audako-ai` (`mcp-server`): MCP server process exposing Audako tools.

## Cross-Package Interaction Model

### 1) UI -> bridge provisioning flow
- A host app embeds `@audako/chat-ui` and typically uses `OpenCodeAdapter`.
- The host calls `backend-bridge` `POST /api/session/bootstrap` with SCADA credentials.
- Bridge returns/reuses an OpenCode URL + `sessionId`.
- The UI/host then points adapter traffic to that OpenCode instance.

### 2) bridge -> mcp-server process boot
- Bridge creates OpenCode servers and configures MCP integration.
- Bridge launches `mcp-server/dist/index.js` as a local MCP process.
- Bridge injects required env vars into MCP process:
  - `AUDAKO_SYSTEM_URL`
  - `AUDAKO_TOKEN`
  - `AUDAKO_SESSION_ID`
  - `AUDAKO_BRIDGE_URL`

### 3) mcp-server -> bridge session context lookup
- MCP tools read live session context from bridge endpoint:
  - `GET /api/session/:sessionId/info`
- Context is used for scoped tool behavior (tenant/group/entity/app).
- On failures, tools should return recoverable MCP errors (not crash process).

### 4) host/UI -> bridge context updates
- Host app updates client location context via:
  - `PUT /api/session/:sessionId/info`
- This enables location-aware MCP behavior without recreating sessions.

## Coupling and Build Dependencies
- `backend-bridge` has a runtime dependency on built MCP output:
  - `packages/mcp-server/dist/index.js`
- For local end-to-end testing/builds, build in this order:
  - `npm run build --workspace audako-ai`
  - `npm run build --workspace @audako/backend-bridge`
- If MCP tools/resources change, rebuild `audako-ai` before validating bridge flows.

## Integration Modes
- Full Audako flow: host app + `chat-ui` + `backend-bridge` + `mcp-server`.
- UI-only flow: `chat-ui` can use `OpenAIAdapter` or `MockAdapter` without bridge/MCP.
- Bridge-only maintenance: bridge can be exercised by API clients without `chat-ui`.

## Shared Cross-Package Contracts
- `sessionId` is the principal key linking bridge and MCP context.
- Bridge session schema fields currently include:
  - `tenantId`, `groupId`, `entityType`, `app`, `updatedAt`
- Keep compatibility when changing response/request shapes on session endpoints.
- Tool names in MCP must be unique; bridge/OpenCode assume stable registration.

## Change Impact Guidance
- Changing bridge session endpoint payloads likely affects `mcp-server` tools.
- Changing MCP env variable names requires bridge factory updates.
- Changing OpenCode adapter expectations may affect host integrations and chat-ui docs.
- Before refactors, trace call chain across all three workspaces.

## Environment and Secrets Boundaries
- Root `.env.example` documents baseline MCP auth settings.
- `packages/backend-bridge/.env.example` documents bridge/OpenCode config.
- Never commit real secrets; `.env*` files are ignored.
- Prefer explicit startup validation for any new required env vars.

## Root Commands (Orchestration)
- Install all workspaces: `npm install`
- Build all workspaces: `npm run build`
- Run all dev scripts: `npm run dev`
- Run all test scripts exposed by workspaces: `npm run test`
- Format code with Biome: `npx biome format --write .`

For package-specific commands and test workflows, use each package AGENTS file.
