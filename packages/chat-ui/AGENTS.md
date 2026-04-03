# AGENTS.md - @audako/chat-ui

Package-level guidance for coding agents working in `packages/chat-ui`.

## Development Phase

**High-speed development. Bigger rewrites welcome. No backwards compatibility obligation.**
Prefer clean solutions; avoid conservative patches that preserve bad structure.

## Role in the System

- Ships an embeddable Svelte 5 chat widget (`ChatWidget`).
- Adapter-based backend integration — swap adapters without changing widget code.
- Can run independently from the copilot backend (use `MockAdapter`).

## Source Structure

```
  src/lib/
    index.ts              — Public exports: ChatWidget, adapters, types
    types.ts              — ChatAdapter interface, StreamCallbacks, ChatRequest, QuestionRequest,
                            ChatWidgetConfig, PublicQuestionHandler
    style.css             — Widget stylesheet (also exported as @audako/chat-ui/style.css)
    ChatWidget.svelte     — Root widget component; accepts ChatWidgetConfig + theme props
  adapters/
    socketio-adapter.ts  — SocketIOAdapter: connects to copilot server via Socket.IO.
                          Handles prompt send/cancel, assistant streaming, questions, and session updates.
    mock-adapter.ts      — MockAdapter: local/demo usage, no network required
  chat/                 — Internal chat state and message management
  components/           — Internal UI components (message bubbles, composer, thinking block, etc.)
```

## ChatWidget Props

```svelte
<ChatWidget
  config={ChatWidgetConfig}   <!-- required -->
  header={Snippet<[string]>}  <!-- optional: custom header snippet, receives resolved title -->
  primary="string"            <!-- optional: primary brand color (user bubbles, actions) -->
  secondary="string"          <!-- optional: secondary brand color (thinking surfaces) -->
  darkMode={boolean}          <!-- optional: force dark theme -->
/>
```

`ChatWidgetConfig`:
- `adapter: ChatAdapter` — required
- `title?: string`
- `initialMessage?: string`
- `placeholder?: string`

## Adapter Contract

All adapters implement `ChatAdapter`:

```ts
interface ChatAdapter {
  sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
  init?(): Promise<void>;
  cancel?(): void;
}
```

`StreamCallbacks`:
- `onChunk(text: string)` — full accumulated text so far (not just delta)
- `onComplete()` — message finished
- `onError(error: Error)`
- `onThinking?(text: string)` — optional; combined reasoning + tool call log
- `onQuestion?(question: QuestionRequest): Promise<string[]>` — optional

## SocketIOAdapter Setup
const adapter = new SocketIOAdapter({
  baseUrl,
  sessionId: bootstrapResponse.sessionId,
  realtime: bootstrapResponse.realtime,
});
await adapter.init();
```

Key `SocketIOAdapterConfig` options:

| Option | Default | Purpose |
|---|---|---|
| `baseUrl` | required | Copilot server origin |
| `sessionId` | required | Session identifier |
| `realtime` | required | Socket.IO transport descriptor from bootstrap |
| `reconnectAttempts` | `5` | Maximum number of reconnection attempts |
| `commandAckTimeoutMs` | `8000` | Timeout for command acknowledgements |

Runtime methods:
- `adapter.init()` — establish Socket.IO connection
- `adapter.sendMessage(request, callbacks)` — send user prompt and register stream callbacks
- `adapter.cancel()` — signal the current turn to stop
- `adapter.updateSessionInfo(sessionInfo)` — update session metadata
- `adapter.setPublicQuestionHandler(fn)` — wire up question prompts; called by ChatWidget automatically
- `adapter.showQuestion(question, opts)` — programmatic question from outside the widget
- `adapter.disconnect()` — close connection and clean up resources

## Event Handling
`SocketIOAdapter` subscribes to standardized copilot events:
- `assistant.delta` — streams incremental text chunks
- `assistant.done` — signals end of assistant response
- `assistant.error` — reports request failures
- `question.ask` — handles interactive questions via `onQuestion` callback

The adapter accumulates text and emits via `onChunk(fullText)`. Full accumulated text is always sent to the widget, not deltas.

Typical usage with copilot-provisioned session:

```ts
import { SocketIOAdapter } from '@audako/chat-ui';
```
## CSS Hooks (for host app overrides)

```
.chat-widget                    — root container
.chat-widget__header            — header bar
.chat-widget__messages          — scrollable messages area
.chat-widget__footer            — composer area
.chat-widget__message-row       — individual row (--user, --assistant, --system modifiers)
.chat-widget__message
.chat-widget__bubble
.chat-widget__timestamp
.chat-widget__composer
.chat-widget__input
.chat-widget__send
.chat-widget__thinking          — thinking/reasoning block
.chat-widget__thinking-content
.chat-widget__typing-bubble
```

## Build, Run, Lint, Test

- Dev server: `npm run dev --workspace @audako/chat-ui`
- Build library: `npm run build --workspace @audako/chat-ui`
- Preview build: `npm run preview --workspace @audako/chat-ui`
- Type/Svelte checks: `npm run check --workspace @audako/chat-ui`
- Lint (alias for check): `npm run lint --workspace @audako/chat-ui`

## Testing Status

- No dedicated `test` script currently.
- If adding tests, add explicit scripts in `package.json` and document single-test usage.

## Code Style

- Svelte 5 + TypeScript + Vite library build.
- Single quotes + semicolons (match existing files).
- `import type` for type-only imports.
- Svelte reactivity: reassign arrays/objects to trigger updates (don't mutate in place).

## Public API Surface

- Exports from `src/lib/index.ts` are the public API.
- `ChatWidget`, `SocketIOAdapter`, `MockAdapter`, core types.
- Removing or renaming exports is a breaking change for host apps — do it deliberately.
