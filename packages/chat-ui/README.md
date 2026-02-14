# @audako/chat-ui

Svelte 5 chat UI component library with adapter-based backend integration.

This package is built for direct use in Svelte apps (including Chrome extensions). It does not rely on web components.

## Features

- Native Svelte component export (`ChatWidget`)
- Streaming response support
- Optional "thinking" stream support
- Adapter interface for OpenAI-compatible, OpenCode, or custom backends
- Packaged stylesheet export (`@audako/chat-ui/style.css`)

## Install

```bash
npm install @audako/chat-ui
```

## Basic usage (Svelte)

```svelte
<script lang="ts">
  import { ChatWidget, MockAdapter, type ChatWidgetConfig } from '@audako/chat-ui';
  import '@audako/chat-ui/style.css';

  const adapter = new MockAdapter({ showThinking: true });

  let config: ChatWidgetConfig = {
    adapter,
    title: 'Extension Assistant',
    initialMessage: 'How can I help you today?',
    placeholder: 'Type a message'
  };

  let primary = '#0057B8';
  let secondary = '#146C5B';
  let darkMode = false;
</script>

{#snippet widgetHeader(title: string)}
  <div class="flex items-center justify-between">
    <h2 class="text-sm font-medium">{title}</h2>
    <span class="text-xs opacity-70">Chat</span>
  </div>
{/snippet}

<ChatWidget {config} header={widgetHeader} {primary} {secondary} {darkMode} />
```

The `header` prop accepts a Svelte snippet (`Snippet<[string]>`) and receives the resolved title.

`ChatWidget` also accepts theme props for branded apps:

- `primary` - Primary brand color used for actions and user bubbles
- `secondary` - Secondary brand color used for supporting surfaces (for example thinking blocks)
- `darkMode` - Forces Material-style dark theme when `true`

## Styling hooks

The widget keeps Tailwind styling internally and also exposes semantic class hooks for outer-project overrides.

- Root/layout: `.chat-widget`, `.chat-widget__header`, `.chat-widget__messages`, `.chat-widget__footer`
- Messages: `.chat-widget__message-row`, `.chat-widget__message`, `.chat-widget__bubble`, `.chat-widget__timestamp`
- Message modifiers: `--user`, `--assistant`, `--system` (for row/message/bubble/timestamp)
- Composer: `.chat-widget__composer`, `.chat-widget__input`, `.chat-widget__send`
- Thinking/typing: `.chat-widget__thinking`, `.chat-widget__thinking-content`, `.chat-widget__typing-bubble`

## Adapters

- `MockAdapter` for development
- `OpenAIAdapter` for OpenAI-compatible chat completions endpoints
- `OpenCodeAdapter` for OpenCode server sessions

See `ADAPTER_API.md` for adapter details and custom adapter examples.

## Scripts

- `npm run dev` - Vite dev server
- `npm run build` - Library build to `dist/`
- `npm run check` - Svelte and TypeScript checks

## Extension notes

For Chrome extension usage guidance, see `LIB_USAGE.md`.
