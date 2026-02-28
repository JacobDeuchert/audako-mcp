# AGENTS.md

Repository-level guidance for coding agents in `audako-mcp-gateway`.

This root file focuses on how workspaces interact.
Package-specific build/test/style guidance lives in:


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
  - `@audako/copilot` (`packages/copilot`): LLM-based task automation and reasoning engine.
  - `@audako/contracts` (`packages/contracts`): shared TypeScript types and type guards.

## Integration Model

- Host app embeds `@audako/chat-ui` and connects via a `ChatAdapter` (e.g. `WebSocketAdapter`).
- `WebSocketAdapter` connects to copilot backend HTTP endpoints.
- Copilot backend runs independently and exposes tools via API.
- Chat-ui and copilot communicate via JSON payloads over HTTP/WebSocket.

## Coupling and Build Dependencies

- `@audako/contracts` is a shared dependency used by chat-ui and copilot.
- For local end-to-end testing/builds, build in this order:
  1. `npm run build --workspace @audako/contracts`
  2. `npm run build --workspace @audako/copilot`
  3. `npm run build --workspace @audako/chat-ui`
- If copilot tools change, rebuild copilot before validating chat-ui integration.

## Integration Modes

- Full Audako flow: host app + `chat-ui` + copilot backend.
- UI-only flow: `chat-ui` can use `MockAdapter` or `WebSocketAdapter` without backend.
- Copilot-only mode: copilot can be used as a standalone backend via HTTP API.

## Shared Cross-Package Contracts

- `@audako/contracts` owns shared event payload types and type guards — changes there affect both chat-ui and copilot.
- Chat-ui adapters implement `ChatAdapter` interface from contracts.
- Copilot tools are defined in copilot package and exposed via HTTP API.

## Change Impact Guidance

- Changing copilot API response types affects `@audako/contracts` and chat-ui adapters.
- Changing contract types requires updates in both chat-ui and copilot.
- Before major refactors, trace dependencies between copilot, chat-ui, and contracts.

## Environment and Secrets Boundaries

- Root `.env.example` documents baseline copilot configuration.
- Never commit real secrets; `.env*` files are gitignored.
- Prefer explicit startup validation for any new required env vars.

## Root Commands (Orchestration)

- Install all workspaces: `npm install`
- Build all workspaces: `npm run build`
- Run all dev scripts: `npm run dev`
- Run all test scripts: `npm run test`
- Format code with Biome: `npx biome format --write .`

For package-specific commands and test workflows, see each package AGENTS file.
