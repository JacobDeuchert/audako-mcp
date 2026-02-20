# Chat UI Refactor Plan

## Goal

Split `ChatWidget.svelte` into smaller, focused modules so the package is easier to extend and maintain before adding multiline input and file/image upload.

## Why this refactor now

- `src/lib/ChatWidget.svelte` currently mixes UI rendering, adapter lifecycle, streaming state, question workflow, and CSS.
- The component is already large and future features will increase complexity.
- A clear structure now will reduce future regressions and speed up feature work.

## Scope

### In scope

- Break the widget into smaller Svelte components.
- Move orchestration/state logic into a dedicated controller module.
- Move large inline styles into a shared stylesheet while preserving class hooks.
- Keep behavior parity for current features (streaming, thinking, question flow, typing indicator).

### Out of scope (for this pass)

- Implementing multiline input behavior.
- Implementing file or image upload behavior.
- Redesigning widget visuals.

## Target architecture

### Public surface

- Keep `src/lib/index.ts` exports unchanged for this refactor.
- Keep `src/lib/types.ts` adapter and message contracts compatible.

### Internal structure

Proposed files/directories:

```text
src/lib/
  ChatWidget.svelte
  chat-widget.css
  chat/
    useChatController.svelte.ts
    utils/
      markdown.ts
      time.ts
      message.ts
  components/chat-widget/
    ChatHeader.svelte
    MessageList.svelte
    MessageItem.svelte
    ThinkingBlock.svelte
    TypingIndicator.svelte
    QuestionPanel.svelte
    Composer.svelte
```

### Responsibility split

- `ChatWidget.svelte`: composition shell, prop wiring, and top-level layout.
- `useChatController.svelte.ts`: chat state machine and adapter communication.
- `MessageList/MessageItem`: display messages, timestamps, markdown, and stream caret.
- `ThinkingBlock`: assistant reasoning UI only.
- `QuestionPanel`: option selection and submit handling.
- `Composer`: prompt input and submit interactions.

## Implementation phases

### Phase 1: Baseline and guardrails

1. Capture current behavior expectations from existing widget usage.
2. Define component interfaces before moving code.
3. Keep class naming (`.chat-widget__*`) stable for styling compatibility.

Exit criteria:

- Refactor checklist and component contracts are documented.

### Phase 2: CSS extraction

1. Move inline `<style>` from `ChatWidget.svelte` to `src/lib/chat-widget.css`.
2. Import the new stylesheet from the widget entry path.
3. Verify no visual regressions in dev preview.

Exit criteria:

- Styles compile from the shared stylesheet.
- Existing class hooks still work.

### Phase 3: Presentational component extraction

1. Extract low-risk stateless pieces first:
   - `ChatHeader`
   - `TypingIndicator`
   - `ThinkingBlock`
2. Extract message rendering:
   - `MessageItem`
   - `MessageList`
3. Extract footer variants:
   - `QuestionPanel`
   - `Composer`

Exit criteria:

- `ChatWidget.svelte` is significantly smaller and mostly composes child components.
- No behavior changes introduced.

### Phase 4: Controller extraction

1. Move state and action logic into `useChatController.svelte.ts`:
   - adapter initialization
   - `sendMessage`
   - streaming updates (`onChunk`, `onThinking`, `onComplete`, `onError`)
   - question lifecycle (`askQuestion`, selection, submit)
2. Keep Svelte reactivity-safe updates (array/object reassignments).
3. Expose a minimal API back to `ChatWidget`.

Exit criteria:

- UI components are mostly declarative.
- Controller owns chat behavior and side effects.

### Phase 5: Future-feature readiness

1. Shape composer output as structured payload internally (for example `{ text, attachments }`).
2. Keep attachments empty for now.
3. Isolate keyboard handling in `Composer` to make multiline support easy later.

Exit criteria:

- Future multiline/upload work can be added in isolated components/modules.

### Phase 6: Validation and cleanup

1. Run `npm run check --workspace @audako/chat-ui`.
2. Run `npm run build --workspace @audako/chat-ui`.
3. Manual smoke checks:
   - user send flow
   - assistant streaming flow
   - thinking panel
   - question prompt (single and multi-select)
   - dark mode and mobile layout
4. Update docs if implementation details changed.

Exit criteria:

- Build and check pass.
- Runtime behavior matches pre-refactor behavior.

## Definition of done

- `ChatWidget.svelte` is a composition layer, not a monolith.
- Internal code is split by responsibility and easier to reason about.
- Existing integration contract remains stable for host apps.
- The codebase is ready for multiline prompt input and file/image upload implementation.

## Risks and mitigations

- Risk: subtle streaming regressions during state extraction.
  - Mitigation: preserve callback behavior and perform focused smoke tests.
- Risk: style regressions from moving CSS.
  - Mitigation: keep class names stable and verify desktop/mobile/dark mode.
- Risk: accidental API churn.
  - Mitigation: keep exports and types stable in this refactor pass.
