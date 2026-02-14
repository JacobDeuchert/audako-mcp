# Adapter API

`@audako/chat-ui` uses an adapter interface so the UI can stream responses from any backend.

## Core interfaces

```ts
export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onThinking?: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
}

export interface ChatAdapter {
  init?(): Promise<void>;
  sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
  cancel?(): void;
}
```

`onChunk` and `onThinking` receive the accumulated text.

## Built-in adapters

### MockAdapter

```ts
import { MockAdapter } from '@audako/chat-ui';

const adapter = new MockAdapter({ showThinking: true });
```

### OpenAIAdapter

```ts
import { OpenAIAdapter } from '@audako/chat-ui';

const adapter = new OpenAIAdapter({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are a helpful assistant.'
});
```

### OpenCodeAdapter

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

## Widget usage with adapter

```svelte
<script lang="ts">
  import { ChatWidget, MockAdapter, type ChatWidgetConfig } from '@audako/chat-ui';
  import '@audako/chat-ui/style.css';

  let config: ChatWidgetConfig = {
    adapter: new MockAdapter({ showThinking: true }),
    title: 'Audako Assistant'
  };
</script>

<ChatWidget {config} />
```

## Custom adapter example

```ts
import type { ChatAdapter, ChatRequest, StreamCallbacks } from '@audako/chat-ui';

export class CustomAdapter implements ChatAdapter {
  private abortController: AbortController | null = null;

  async init(): Promise<void> {
    // Optional setup
  }

  async sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: request.message,
          history: request.conversationHistory
        }),
        signal: this.abortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        text += decoder.decode(value, { stream: true });
        callbacks.onChunk(text);
      }

      callbacks.onComplete();
    } catch (error) {
      if (!this.abortController?.signal.aborted) {
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    } finally {
      this.abortController = null;
    }
  }

  cancel(): void {
    this.abortController?.abort();
  }
}
```
