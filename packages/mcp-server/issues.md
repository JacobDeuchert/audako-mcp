# MCP Server - Code Review Issues

## Duplicate Code

### 1. `isRecord()` defined 4 times

The same function is implemented independently in four files:

- `src/tools/helpers.ts:42` (exported)
- `src/services/error-details.ts:14` (private)
- `src/services/session-events.ts:52` (private)
- `src/services/session-info.ts:15` (private)

**Recommendation:** Consolidate into the existing export in `helpers.ts` and import where needed.

### 2. `BridgeErrorResponse` interface + `isBridgeErrorResponse()` type guard duplicated

Defined identically in two files:

- `src/services/session-info.ts:10-13` and `:19-21`
- `src/services/session-events.ts:3-6` and `:56-58`

**Recommendation:** Extract to a shared module (e.g. `bridge-types.ts`) or export from `session-info.ts`.

### 3. `resolveBridgeUrl()` duplicated

Identical function in:

- `src/services/session-info.ts:27-29`
- `src/services/session-events.ts:105-107`

Both do `process.env.AUDAKO_BRIDGE_URL?.replace(/\/+$/, '') ?? 'http://127.0.0.1:3000'`.

**Recommendation:** Extract to a shared module and import in both files.

### 4. `normalizeGroupPath()` / `normalizePathIds()` — near-identical logic

- `src/services/context-resolvers.ts:5-18` — `normalizeGroupPath()`
- `src/tools/entity-tools/get-group-path.tool.ts:10-20` — `normalizePathIds()`

Both filter an array of path IDs and ensure the target `groupId` is at the end. Functionally equivalent.

**Recommendation:** Consolidate into a single shared utility function.

### 5. `getDtoFieldName()` and `setModelValueIfDefined()` duplicated across contracts

- `GroupEntityContract` defines these at `group.contract.ts:251` and `:255`
- `SignalEntityContract` defines identical copies at `signal.contract.ts:453` and `:473`

**Recommendation:** Lift into `BaseEntityContract` as protected methods.

---

## Unused Code

### 6. `resolveDataSourceFromContext()` — exported but never called

- Defined and exported at `src/services/context-resolvers.ts:50`
- Not imported or referenced anywhere else in the codebase
- The private helpers `normalizeGroupPath()` and `resolveDataSourceName()` exist only to support this dead function

**Recommendation:** Remove or mark as planned for future use.

### 7. `_selectedTenant` field — declared but never read or written

- `src/services/audako-services.ts:42`: `private _selectedTenant: TenantView | undefined;`
- No getter, no setter, no assignment anywhere.

**Recommendation:** Remove the dead field.

### 8. `dataSourceService` — initialized but never used

- `src/services/audako-services.ts:47,87,128-133`
- No tool or service ever calls `audakoServices.dataSourceService`
- `context-resolvers.ts` queries data sources via `entityService.queryConfiguration`, not `dataSourceService`

**Recommendation:** Remove or defer initialization until actually needed.

### 9. `toOptionalTrimmedString()` — exported but only used internally

- `src/tools/helpers.ts:46`: exported function
- Only called by `getRecordStringValue()` at line 59 of the same file. No external consumers.

**Recommendation:** Remove the export (keep as a private helper) or leave as-is if external use is planned.

### 10. `axios` import for side-effect configuration only

- `src/services/audako-services.ts:9-17`: imports `axios` and `https` solely to set `axios.defaults.httpsAgent`
- The MCP server itself uses `fetch()` for all its HTTP calls (session-info, session-events)
- This global configuration is presumably for `audako-core` services, but if `audako-core` uses its own axios instance the global config may not be effective.

**Recommendation:** Verify that this global configuration actually reaches `audako-core`'s HTTP layer. If not, remove it.

---

## Potential Issues

### 11. `get-group-path.tool.ts` — unsafe cast to check optional method

- `src/tools/entity-tools/get-group-path.tool.ts:22-40`
- Casts `tenantService` to a hand-written `TenantServiceWithEntityLookup` interface and checks at runtime if `getTenantViewForEntityId` exists
- No compile-time safety if `audako-core` removes or renames this method

**Recommendation:** Add the method to `audako-core`'s type definitions, or implement a proper fallback instead of casting.

### 12. `docs-resources.ts` — path traversal vulnerability

- `src/tools/docs-resources.ts:43`: `readFile(join(docsDir, filename as string), 'utf-8')`
- The `filename` parameter comes from the URI template with no sanitization
- A malicious client could pass `../../.env` or similar to read arbitrary files

**Recommendation:** Validate that the resolved path stays within `docsDir`:
```ts
const resolved = resolve(docsDir, filename);
if (!resolved.startsWith(resolve(docsDir))) {
  throw new Error('Invalid filename');
}
```

### 13. `query-entities.tool.ts` — non-null assertion on `resolvedScopeId`

- `src/tools/entity-tools/query-entities.tool.ts:107`: `resolvedScopeId!`
- Logically safe (the guard at line 88 would have returned), but bypasses TypeScript's safety

**Recommendation:** Restructure control flow to avoid the `!` assertion.

### 14. `base-entity.contract.ts` — `getDefinition()` uses `entityType` not `key` for the `key` field

- `src/entity-type-definitions/base-entity.contract.ts:47`: `key: this.entityType`
- Sets the definition's `key` to the `EntityType` enum value rather than the contract's `key` property
- Currently works because the values happen to match, but is fragile

**Recommendation:** Change to `key: this.key` to match the intended semantics.

### 15. Logger `writeLog` silently swallows all errors

- `src/services/logger.ts:113-116`: the `catch` block is completely empty
- A logger that silently fails could mask serious issues (disk full, permissions, etc.)

**Recommendation:** Consider writing to `stderr` as a last-resort fallback.

### 16. `defineTool()` is an identity function with no documentation

- `src/tools/registry.ts:72-74`: returns its argument unchanged
- Exists for type inference, which is valid, but can be confusing without context

**Recommendation:** Add a comment explaining its purpose as a type-inference helper.

---

## Style / Consistency

### 17. Inconsistent error handling pattern across tools

Most tools use `error instanceof Error ? error.message : String(error)` inline, but `error-details.ts` provides `toErrorLogDetails()` which does the same (and more). Only `create-entity` and `update-entity` use `toErrorLogDetails()`. Other tools do the manual inline pattern.

**Recommendation:** Standardize on `toErrorLogDetails()` across all tools.

### 18. `get-entity-name.tool.ts` has its own entity type resolution

- `src/tools/entity-tools/get-entity-name.tool.ts:8-13`: uses `Object.values(EntityType)` for case-insensitive matching
- Separate from the contract-based resolution in `entity-type-definitions/index.ts:27-34`
- `get-entity-name` supports all `EntityType` values (including ones without contracts), while other tools only support contracted types

**Recommendation:** Document the intentional divergence, or unify the resolution logic.
