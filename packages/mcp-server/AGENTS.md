# AGENTS.md - audako-ai (mcp-server)

Package-level guidance for coding agents working in `packages/mcp-server`.

## Development Phase

**High-speed development. Bigger rewrites welcome. No backwards compatibility obligation.**
Prefer clean solutions; avoid conservative patches that preserve bad structure.

## Role in the System

- Implements the Audako MCP server process (`dist/index.js`).
- Launched by `backend-bridge` as a local MCP process inside the OpenCode agent config.
- All built-in OpenCode tools are disabled; only `audako-mcp*` tools are exposed to the agent.
- Reads runtime env injected by the bridge at process startup.

## Environment Variables

All injected by bridge at launch — no `.env` file needed:

| Variable | Required | Purpose |
|---|---|---|
| `AUDAKO_SYSTEM_URL` | ✅ | SCADA backend URL |
| `AUDAKO_TOKEN` | ✅ | SCADA access token |
| `AUDAKO_SESSION_ID` | ✅ | Bridge session ID for context lookups |
| `AUDAKO_BRIDGE_URL` | ✅ | Internal bridge base URL (default: `http://127.0.0.1:3000`) |
| `AUDAKO_BRIDGE_SESSION_TOKEN` | ✅ | Per-session token sent as `Authorization: Bearer` on all bridge requests |
| `AUDAKO_MUTATION_DELAY_MS` | ➖ | Pre-mutation sleep (default `150`ms) — prevents race conditions |

## Build, Run, Test

- Build (`clean + tsc + copy docs`): `npm run build --workspace audako-ai`
- Dev watch: `npm run dev --workspace audako-ai`
- Start built server: `npm run start --workspace audako-ai`
- Manual inspector test: `npm run test --workspace audako-ai`

## Testing Status

- `test` script opens MCP Inspector for manual/integration validation.
- No unit test runner exists yet.

## Source Structure

```
src/
  index.ts                      — Entry point: initialize services, register tools/resources, start server
  services/
    audako-services.ts          — Singleton (AudakoServices) wrapping EntityHttpService, TenantHttpService,
                                  DataSourceHttpService from audako-core. Call audakoServices.initialize()
                                  once at startup; access via audakoServices.entityService etc.
    bridge-client.ts            — HTTP client for all bridge communication. Provides bridgeRequest(),
                                  URL builders (getSessionInfoEndpoint, getSessionEventsEndpoint, etc.),
                                  and auth header injection via AUDAKO_BRIDGE_SESSION_TOKEN.
    context-resolvers.ts        — Higher-level resolvers: resolveTenantFromSessionInfo() fetches
                                  session → tenant in one call; resolveDataSourceFromContext() walks
                                  the group path to find a data source.
    error-details.ts            — toErrorLogDetails(error) normalizes unknown errors for structured logging.
    logger.ts                   — Pino-based logger; use logger.info/warn/error/debug/trace.
    mutation-permissions.ts     — In-memory permission store for session-scoped grants keyed by
                                  tool + generic context entries (for example groupId).
    inline-mutation-permissions.ts — Shared inline permission flow for out-of-context mutations,
                                     including prompt handling and decision resolution.
    mutation-scope-guard.ts     — evaluateMutationScope() checks if targetGroupId is within the
                                  contextGroupId group hierarchy. Returns allowed/blocked with reason.
                                  buildOutOfContextMutationErrorPayload() builds fail-fast payloads when
                                  interactive prompting is disabled.
    session-events.ts           — publishSessionEvent() fires domain events (entity.created, entity.updated)
                                  to bridge. requestSessionEvent() / requestQuestionAnswer() sends a
                                  request event and blocks until user responds, using long-poll with
                                  polling fallback (120s long-poll window, 3s poll interval).
    session-id.ts               — getSessionId() / resolveSessionId() read AUDAKO_SESSION_ID from env.
    session-info.ts             — fetchSessionInfo() → GET /api/session/:id/info on the bridge.
                                  Returns { sessionId, tenantId, groupId, entityType, app }.
  entity-type-definitions/
    types.ts                    — Core types: EntityTypeDefinition, EntityFieldDefinition,
                                  EntityContractContext, EntityTypeExamples.
    base-entity.contract.ts     — Abstract EntityTypeContract base: validate(), fromPayload(),
                                  toPayload(), applyUpdate(). All contracts extend this.
    signal.contract.ts          — Signal entity contract (fields, validation, payload mapping).
    group.contract.ts           — Group entity contract.
    index.ts                    — Registry: resolveEntityTypeContract(name), getSupportedEntityTypeNames().
    zod-utils.ts                — Shared Zod helpers for contract field validation.
  tools/
    registry.ts                 — defineTool() wrapper; handles input schema → Zod and MCP registration.
    auto-register.ts            — Discovers all *.tool.ts files and registers their toolDefinitions.
    helpers.ts                  — Shared tool response builders: toTextResponse(), toErrorResponse(),
                                  isRecord(), getRecordStringValue(), normalizeOptionalString(), etc.
    docs-resources.ts           — MCP resource handlers: docs://index and docs://files/{filename}.
    ask-question.tool.ts        — Sends a question.ask event to the bridge and returns the user's answer.
    get-session-info.tool.ts    — Returns current session context (tenantId, groupId, etc.) to agent.
    entity-tools/
      list-entity-types.tool.ts     — Lists all registered entity type names.
      get-entity-definition.tool.ts — Returns field definitions and examples for an entity type.
      get-entity-name.tool.ts       — Looks up an entity's name by ID.
      get-group-path.tool.ts        — Returns the ancestor group path for a group ID.
      query-entities.tool.ts        — Queries entities with filtering; read-only, no permission checks.
      create-entity.tool.ts         — Creates an entity; enforces scope guard + userHasPermission().
      update-entity.tool.ts         — Updates an entity; enforces scope guard + userHasPermission().
```

## Tool Registration

- Tool modules export a `toolDefinitions` array.
- `auto-register.ts` discovers all `*.tool.ts` files automatically at startup.
- Tool names must be unique; duplicates cause a startup failure.
- Use `defineTool()` from `registry.ts` — do not register tools manually.

## Adding a New Entity Type

1. Create `src/entity-type-definitions/<type>.contract.ts` extending `EntityTypeContract`.
2. Register it in `src/entity-type-definitions/index.ts`.
3. Add a docs markdown file if relevant and rebuild (`npm run build`).

## Adding a New Tool

1. Create `src/tools/<name>.tool.ts` (or under `entity-tools/` if entity-scoped).
2. Export `toolDefinitions` array using `defineTool()`.
3. Auto-register picks it up — no further wiring needed.

## Permission System

Mutation tools (`create-entity`, `update-entity`) enforce a two-stage gate:

1. **Scope guard** (`evaluateMutationScope`): checks if the entity's target group is within the session's context group hierarchy.
2. **Permission gate** (`userHasPermission`): checks session-scoped grant for the current tool+context.
3. **Inline prompt** (in mutation tools): when out of context and `permissionMode="interactive"`, tools ask the user directly via the bridge question flow and continue/deny in the same call.

## Session Event System

- **Fire-and-forget**: `publishEntityCreatedEvent()` / `publishEntityUpdatedEvent()` — POST to bridge, non-blocking.
- **Request/response**: `requestQuestionAnswer(question)` — blocks the tool handler until the user responds via the UI. Uses long-poll (120s window) with automatic 3s-interval polling fallback for long-running questions (up to 10 minutes).

## Code Style

- TypeScript + Node ESM. Use `.js` suffix for all local imports.
- Double quotes + trailing commas (match existing files).
- `import type` for type-only imports.
- Tool responses: `content` array payloads, optional `isError: true`.
- For recoverable tool failures, return `toErrorResponse(...)` — do not throw.
- Normalize unknown errors: `error instanceof Error ? error.message : String(error)`.

## Logging

- Use `logger` from `src/services/logger.ts` for all diagnostics.
- Keep stdout/stderr clean — the process communicates over stdio MCP transport.
- Never log SCADA tokens or bridge session tokens.

## Integration Safety

- Session payload fields (`tenantId`, `groupId`, `entityType`, `app`, `updatedAt`) must stay compatible with bridge.
- Any change to bridge response fields must be coordinated with `backend-bridge` and `@audako/contracts`.
- New required env vars require updates to `opencode-factory.ts` and root `AGENTS.md`.
