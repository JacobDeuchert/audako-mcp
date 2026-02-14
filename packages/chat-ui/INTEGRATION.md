# Integrating @audako/chat-ui

This guide focuses on native Svelte integration (including Chrome extensions).

## 1) Install

```bash
npm install @audako/chat-ui
```

If this package is in the same monorepo, use your workspace dependency setup.

## 2) Use the component in Svelte

```svelte
<script lang="ts">
  import { ChatWidget, MockAdapter, type ChatWidgetConfig } from '@audako/chat-ui';
  import '@audako/chat-ui/style.css';

  const adapter = new MockAdapter({ showThinking: true });

  let config: ChatWidgetConfig = {
    adapter,
    title: 'My Assistant',
    initialMessage: 'Hello! How can I help?',
    placeholder: 'Ask anything...'
  };

  const primary = '#0057B8';
  const secondary = '#146C5B';
  const darkMode = false;
</script>

<ChatWidget {config} {primary} {secondary} {darkMode} />
```

Theme props are optional and let you match your app branding while keeping Material-style surfaces.

## 3) Choose an adapter

### Mock adapter

```ts
import { MockAdapter } from '@audako/chat-ui';

const adapter = new MockAdapter({ showThinking: true });
```

### OpenAI-compatible adapter

```ts
import { OpenAIAdapter } from '@audako/chat-ui';

const adapter = new OpenAIAdapter({
  apiKey: 'your-api-key',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant.'
});
```

### OpenCode adapter

```ts
import { OpenCodeAdapter } from '@audako/chat-ui';

const adapter = new OpenCodeAdapter({
  baseUrl: 'http://localhost:4096',
  model: {
    providerID: 'anthropic',
    modelID: 'claude-haiku-4-5'
  },
  createSession: true
});
```

## Chrome extension notes

- Import `ChatWidget` directly in your Svelte extension UI.
- Import `@audako/chat-ui/style.css` where your extension bundle can include CSS.
- Keep secrets (for example API keys) out of content scripts; route privileged calls through extension background/service worker endpoints.

## Troubleshooting

### Styles are missing

Ensure the stylesheet is imported:

```ts
import '@audako/chat-ui/style.css';
```

### Type errors on config

Use exported types:

```ts
import type { ChatWidgetConfig } from '@audako/chat-ui';
```
