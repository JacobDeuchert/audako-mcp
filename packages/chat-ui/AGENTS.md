# AGENTS.md - @audako/chat-ui

Package-level guidance for coding agents working in `packages/chat-ui`.

## Role in the System
- Ships an embeddable Svelte chat widget (`ChatWidget`).
- Integrates with backends via adapter interface:
  - `OpenCodeAdapter` (typical full-stack path through `backend-bridge`).
  - `OpenAIAdapter` (direct OpenAI-compatible endpoint).
  - `MockAdapter` (local/demo development).
- Can run independently from `backend-bridge` and `mcp-server`.

## Build, Run, Lint, Test
- Dev server: `npm run dev --workspace @audako/chat-ui`
- Build library: `npm run build --workspace @audako/chat-ui`
- Preview build: `npm run preview --workspace @audako/chat-ui`
- Type/Svelte checks: `npm run check --workspace @audako/chat-ui`
- Lint alias (currently same as check): `npm run lint --workspace @audako/chat-ui`

## Testing Status
- No dedicated `test` script currently.
- If adding tests, add explicit scripts in `package.json` and document single-test usage.

## Adapter Contract (Do Not Break)
- `sendMessage(request, callbacks): Promise<void>` is required.
- Optional lifecycle methods:
  - `init?(): Promise<void>`
  - `cancel?(): void`
- `StreamCallbacks` supports:
  - `onChunk`, `onComplete`, `onError`
  - optional `onThinking`, optional `onQuestion`

## Integration Notes
- Host apps typically create OpenCode sessions via bridge endpoint:
  - `POST /api/session/bootstrap`
- Adapter then targets returned OpenCode URL/session.
- Keep widget behavior compatible with this bridge-provisioned flow.

## Code Style and Patterns
- Svelte 5 + TypeScript + Vite library build.
- Preserve existing package style: single quotes + semicolons.
- Use `import type` for type-only imports.
- Keep state update patterns compatible with Svelte reactivity:
  - Reassign arrays/objects when needed to trigger updates.
- Avoid unnecessary component API churn; widget props are integration surface.

## UX/Behavior Expectations
- Preserve streaming behavior and partial updates.
- Keep question/selection flow (`onQuestion`) working for adapters that use it.
- Maintain mobile-friendly widget behavior and existing CSS variable theming.
- Do not remove exported entry points from `src/lib/index.ts` without versioned migration.
