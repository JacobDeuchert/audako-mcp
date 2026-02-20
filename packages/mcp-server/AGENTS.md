# AGENTS.md - audako-ai (mcp-server)

Package-level guidance for coding agents working in `packages/mcp-server`.

## Role in the System
- Implements Audako MCP server process (`dist/index.js`).
- Is launched by `backend-bridge` as a local MCP process inside OpenCode configuration.
- Reads runtime env from bridge-provisioned process environment:
  - `AUDAKO_SYSTEM_URL`
  - `AUDAKO_TOKEN`
  - `AUDAKO_SESSION_ID`
  - `AUDAKO_BRIDGE_URL`
- Fetches live session context from bridge endpoint:
  - `GET /api/session/:sessionId/info`

## Build, Run, Test
- Build (`clean + tsc + copy docs`): `npm run build --workspace audako-ai`
- Dev watch: `npm run dev --workspace audako-ai`
- Start built server: `npm run start --workspace audako-ai`
- Manual inspector test flow: `npm run test --workspace audako-ai`

## Testing Status
- Current `test` script launches MCP Inspector (manual/integration validation).
- No dedicated unit test runner or single-test command exists yet.

## Tool Registration Architecture
- Tool modules export `toolDefinitions` arrays.
- Auto-discovery/registration is handled by `src/tools/auto-register.ts`.
- Tool filenames follow `*.tool.ts` convention.
- Tool names must remain unique; duplicates fail startup.

## Resource Architecture
- Documentation files are copied to `dist/docs` during build.
- Resources:
  - `docs://index` lists available markdown docs.
  - `docs://files/{filename}` serves individual docs.

## Code Style and Patterns
- TypeScript + Node ESM.
- Use `.js` suffix for local imports.
- Preserve existing package style: double quotes + trailing commas.
- Prefer `import type` for type-only usage.
- Keep tool responses MCP-compatible (`content` payloads, optional `isError`).
- For recoverable failures, return structured error responses instead of crashing.
- Normalize unknown errors with `error instanceof Error ? error.message : String(error)`.

## Logging and Transport Safety
- Use package logger (`src/services/logger.ts`) for diagnostics.
- Keep stdout/stderr output minimal to avoid interfering with stdio transport.
- If adding logs, ensure they do not expose secrets or tokens.

## Integration Safety
- Preserve bridge session payload compatibility (`tenantId`, `groupId`, `entityType`, `app`, `updatedAt`).
- Any change to expected bridge response fields must be coordinated with `backend-bridge`.
- If adding required env vars, update bridge process bootstrap and docs in lockstep.
