# Programmatic Tool Calling Proposal

## Decision

Add a programmatic execution layer to `@audako/copilot`, but do not start with a general-purpose TypeScript REPL.

The right first step for this codebase is a schema-validated batch/entity templating tool that expands many creates or updates server-side while reusing the existing tool layer and session-scoped Audako services.

If that still leaves too much token churn, the second step should be a constrained workflow runner.

## Why This Fits The Current Architecture

The current copilot is already built around typed tool execution and structured entity contracts:

- `src/agent/agent-factory.ts` builds one agent per session and injects typed tools.
- `src/tools/create-entity.ts`, `src/tools/update-entity.ts`, and `src/tools/move-entity.ts` already enforce validation, permissions, and event publishing.
- `src/entity-type-definitions/base-entity.contract.ts` and `src/entity-type-definitions/signal.contract.ts` already centralize entity shape rules and payload normalization.
- `src/agent/ws-event-bridge.ts` already exposes tool start/end and turn events for observability.

This means the repository already has most of the important safety rails. What it does not have is a way for the model to perform deterministic multi-step structured work without repeatedly serializing every intermediate result through natural-language reasoning.

## What Problem This Solves

For heavy entity generation, the current loop forces the model to:

1. think in natural language,
2. emit one tool call at a time,
3. re-read large JSON payloads between calls,
4. reconstruct working state from conversation history.

That is expensive in tokens and fragile when the payloads get large.

A programmatic runner can improve this by:

- keeping intermediate structured state out of the chat transcript,
- letting the model transform arrays and maps locally,
- making repetitive entity generation more deterministic,
- reducing prompt bloat from repeated schema and payload restatement,
- enabling retries, batching, and validation as code instead of prose.

## Why Not A Raw TypeScript REPL First

A free-form TS REPL would help flexibility, but it creates avoidable problems in this project:

- much larger security surface,
- harder approval boundaries for mutations,
- harder to replay and debug agent behavior,
- harder to guarantee event-level observability,
- risk that generated code bypasses validation and permission checks,
- risk that generated code couples directly to low-level service APIs instead of stable copilot tools.

In this repo, the existing mutation tools are the safety boundary. A full REPL should not be allowed to sidestep them.

## Recommended First Version

Build a `batch_mutate_entities` capability before building a general workflow runtime.

Example shape:

```ts
type BatchMutateEntitiesInput = {
  mode: 'create' | 'update';
  entityType: string;
  common?: Record<string, unknown>;
  items: Array<{
    itemKey?: string;
    overrides?: Record<string, unknown>;
    targetEntityId?: string;
  }>;
  options?: {
    dryRun?: boolean;
    onError?: 'stop' | 'continue';
    maxItems?: number;
    dedupeBy?: string[];
    nameTemplate?: string;
  };
};
```

This is programmatic enough to remove huge amounts of repeated prompt payload, but narrow enough to stay deterministic and easy to audit.

The server should:

- merge `common` with each item,
- support a small set of deterministic templates and sequence expansion without `eval`,
- validate each expanded payload through the existing entity contract,
- run the existing permission, throttling, and event flows per item,
- return a compact summary instead of large per-item transcripts.

## Recommended Second Version

Build a `workflow_runner` capability with these properties:

### Input Model

The LLM generates a structured workflow program, not arbitrary code.

Example shape:

```ts
type WorkflowProgram = {
  steps: Array<
    | { type: 'query'; tool: 'query_entities'; input: Record<string, unknown>; saveAs: string }
    | { type: 'map'; source: string; saveAs: string; transform: string }
    | { type: 'filter'; source: string; saveAs: string; predicate: string }
    | { type: 'create'; tool: 'create_entity'; input: Record<string, unknown> | string }
    | { type: 'update'; tool: 'update_entity'; input: Record<string, unknown> | string }
    | { type: 'move'; tool: 'move_entity'; input: Record<string, unknown> | string }
    | { type: 'assert'; expression: string; message: string }
  >;
};
```

`transform`, `predicate`, and `expression` should run in a tiny sandbox over plain JSON values only. They should not receive Node globals, imports, filesystem access, network access, timers, or process access.

### Runtime Rules

- execute inside the existing session,
- expose only approved tool adapters,
- keep all mutations routed through existing tool implementations,
- cap step count, runtime, memory, and result size,
- require explicit save/load of intermediate values,
- record per-step events for start, end, duration, and failure,
- stop on first mutation error unless the workflow explicitly handles it.

### Safety Rules

- no arbitrary package imports,
- no direct `audako-core` mutation access from generated logic,
- no network access beyond existing approved tools,
- no filesystem access,
- no eval of unrestricted user text,
- no bypass of `PermissionService`, schema validation, or mutation throttling.

### Sandbox Choice

If the project later expands from a structured workflow language into generated code execution, use one of these approaches:

- strong isolation for untrusted generated code via a microVM-based sandbox,
- `isolated-vm` for tightly scoped in-process execution with strict memory and time limits.

Do not build this on `vm2`, and do not rely on the default Node.js `vm` module as the main security boundary.

For this repo specifically, `isolated-vm` is the only in-process code execution option worth considering.

But the isolate must never receive:

- raw `AudakoServices`,
- raw session tokens,
- direct network primitives,
- raw `AgentTool` instances,
- mutable host objects.

It should only receive a tiny frozen tool bridge whose methods proxy back into host-side validated tool adapters.

### Tool-Only Isolate Model

If a code-based PTC is added, the execution model should look like this:

1. the main agent emits a small program,
2. host code parses and validates the program envelope,
3. host code creates an isolate with hard limits,
4. the isolate receives only a frozen `tools` object,
5. each `tools.<name>()` call returns JSON-shaped data copied across the boundary,
6. all real work still happens in host-side adapters that reuse existing validation and permissions.

That keeps the isolate as an orchestration runtime, not as the place where Audako mutations actually happen.

Example model:

```ts
type ProgramRuntimeApi = {
  tools: {
    query_entities(input: Record<string, unknown>): Promise<Record<string, unknown>>;
    get_type_definition(input: Record<string, unknown>): Promise<Record<string, unknown>>;
    create_entity(input: Record<string, unknown>): Promise<Record<string, unknown>>;
    update_entity(input: Record<string, unknown>): Promise<Record<string, unknown>>;
    move_entity(input: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
};
```

The isolate should never be able to import modules or instantiate backend clients. It only orchestrates approved tool calls.

### TypeScript vs JavaScript

`isolated-vm` executes JavaScript, not TypeScript.

So if you want a "TypeScript REPL" experience, treat TypeScript as an authoring aid, not as the runtime boundary:

- provide ambient `.d.ts`-style tool signatures to the model,
- optionally transpile a restricted TS subset to JS before execution,
- reject imports, exports, filesystem access, and arbitrary global usage before execution.

For an initial version, plain JavaScript with strong typed examples is simpler and safer than full TS transpilation.

### Operational Cost

`isolated-vm` is a native addon, so adopting it also means owning:

- Node-version compatibility checks,
- CI and deployment support for native builds,
- explicit cleanup of isolates and copied values,
- process-level handling for catastrophic isolate failures.

It is also worth treating `isolated-vm` as a stable-but-low-level dependency rather than a fast-moving platform feature. If PTC becomes a core path, put the isolate runtime behind a worker-process boundary so a bad isolate does not take down the main copilot process.

That is still acceptable if code-based PTC becomes necessary, but it should be treated as infrastructure work, not just a feature toggle.

## Suggested Architecture

### 0. Default Agent Plus PTC Specialist

The best operating model for this repo is a hybrid:

- the default session agent keeps working exactly as it does now for normal chat and ordinary tool use,
- when the task is large, repetitive, or strongly structured, the default agent delegates to a PTC-capable specialist,
- the specialist executes against the same session context and approved tool boundary, then returns a compact result to the main agent.

This fits the current runtime better than making every turn code-capable.

Why this split is good here:

- `SessionRegistry` currently stores one primary agent per session,
- ordinary tasks should stay cheap and simple,
- PTC carries extra execution, observability, and safety overhead,
- heavy entity generation is the exception case, not the default interaction model.

In practice, the PTC specialist should start as an ephemeral per-invocation runtime, not a second long-lived conversational agent stored in session state.

### Delegation Contract

The main agent should delegate only when it detects work such as:

- many similar entity creates or updates,
- repeated transformations over large query results,
- structured fan-out or templated expansion,
- high risk of token waste from repeating large JSON payloads.

The handoff payload should be explicit and minimal:

- user goal,
- current session context,
- allowed tool list,
- execution limits,
- expected result shape,
- whether mutations are allowed.

The specialist should return:

- summary of what it did,
- compact machine-readable result,
- first failures or representative failures,
- any follow-up questions needed by the main agent.

### 1. Keep The Existing Tool Layer As The Execution Boundary

Wrap the current tools in program-safe adapters instead of exposing raw services first.

That preserves:

- schema validation,
- permission prompts,
- mutation throttling,
- websocket event publishing,
- one stable contract for both chat-driven and program-driven execution.

The immediate batch tool should internally reuse the same create/update/move tool logic or the same lower-level validation and permission primitives those tools rely on.

If PTC is added, introduce a host-side `ProgrammaticTool` registry that both the isolate runner and the `AgentTool` wrappers can share. The current `AgentTool` objects are chat-agent facing wrappers, not the ideal direct execution boundary for sandboxed code.

That also gives the main agent and the PTC specialist one shared execution substrate instead of two divergent tool stacks.

### 2. Add A Workflow Runtime Beside The Agent

Suggested location:

- `packages/copilot/src/workflows/`

Suggested modules:

- `workflow-types.ts` - program schema and step definitions
- `workflow-runner.ts` - interpreter and limits
- `workflow-tool-adapters.ts` - wrappers around existing tools
- `workflow-events.ts` - event payload builders
- `workflow-sandbox.ts` - restricted expression execution

### 3. Add Workflow Events To Contracts

Extend `@audako/contracts` so the UI can observe workflow execution similarly to current `agent.tool_start` and `agent.tool_end` events.

Suggested events:

- `workflow.start`
- `workflow.step_start`
- `workflow.step_end`
- `workflow.error`
- `workflow.end`

Each event should include enough data to replay or audit a run:

- workflow ID,
- step index,
- step type,
- sanitized inputs,
- sanitized outputs or error payload,
- duration,
- aggregate mutation counts.

### 4. Let The Agent Choose When To Use It

Do not replace normal tool calling. Add the runner as a specialized tool the agent can invoke when it detects large repetitive structured work.

That keeps simple requests simple and reserves the workflow path for the cases where it meaningfully reduces token churn.

Conceptually, this is less "the main agent becomes programmable" and more "the main agent can delegate heavy structured execution to a specialist runtime."

## Rollout Plan

### Phase 0

- add `batch_mutate_entities`,
- support `common` plus per-item overrides,
- support deterministic template helpers without arbitrary code execution,
- add `dryRun`, `onError`, `maxItems`, timeout, and cancellation support,
- return compact summaries with created, updated, failed, and skipped counts.

### Phase 1

- add workflow types and runtime,
- support read-only steps plus in-memory map/filter/assert,
- expose `query_entities`, `get_type_definition`, and `list_entity_types`,
- emit workflow events,
- enforce step count, runtime, memory, and output-size limits,
- verify deterministic replay in tests.

### Phase 2

- add mutation steps through existing tool adapters,
- keep interactive permission prompts intact,
- add per-step dry-run support,
- add execution summaries for created or updated entities.

### Phase 3

- add batching helpers,
- add resumable workflows,
- add plan optimization for very large entity sets.

## Important Design Constraint

Generated program code should operate on JSON-shaped values, not on live class instances from `audako-core`.

That keeps the runtime deterministic, serializable, and easier to test. The conversion to Audako entities should remain inside the existing entity contract and tool layers.

Also keep the execution model traceable:

- store the generated workflow program,
- store per-step tool calls and results,
- make failures replayable from recorded inputs,
- treat the workflow trace as the debugging artifact instead of the raw final chat transcript.

## Bottom Line

The idea is strong, and this project is a good fit for it because the repository already has typed entity contracts and a clean tool boundary.

But the best version here is not "give the model a raw TypeScript REPL." The best version is "give the model a constrained program runner that composes the existing typed tools and keeps all safety, validation, and observability guarantees intact."
