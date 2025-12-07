# Chat Widget Adapter API

The Audako Chat UI uses an adapter pattern to connect to different LLM backends. This document explains how to use the built-in adapters and how to create your own custom adapter.

## Table of Contents

- [Overview](#overview)
- [Built-in Adapters](#built-in-adapters)
- [Using Adapters](#using-adapters)
- [Creating Custom Adapters](#creating-custom-adapters)
- [API Reference](#api-reference)

## Overview

The adapter pattern allows you to:
- Connect to any LLM backend (OpenAI, Anthropic, local models, etc.)
- Implement streaming responses
- Display thinking/reasoning steps (optional)
- Handle errors gracefully
- Cancel ongoing requests
- Maintain conversation history

## Built-in Adapters

### MockAdapter

A mock adapter for testing and development. Simulates streaming responses with random delays.

```typescript
import { registerChatWidget, MockAdapter } from '@audako/chat-ui';

// Basic usage
const adapter = new MockAdapter();

// With thinking enabled
const adapterWithThinking = new MockAdapter({ showThinking: true });

registerChatWidget({
  adapter: adapterWithThinking,
  title: 'Test Chat',
  initialMessage: 'Hello! This is a mock chat for testing.',
  placeholder: 'Type something...'
});
```

### OpenAIAdapter

An OpenAI-compatible adapter that works with:
- OpenAI API
- Azure OpenAI
- Any OpenAI-compatible endpoint (e.g., LM Studio, LocalAI)

```typescript
import { registerChatWidget, OpenAIAdapter } from '@audako/chat-ui';

const adapter = new OpenAIAdapter({
  apiKey: 'your-api-key',
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant.'
});

registerChatWidget({
  adapter,
  title: 'AI Assistant',
  initialMessage: 'Hello! How can I help you today?'
});
```

#### OpenAIAdapter Configuration

```typescript
interface OpenAIAdapterConfig {
  apiKey?: string;        // API key for authentication
  apiUrl?: string;        // API endpoint URL
  model?: string;         // Model name (e.g., 'gpt-4', 'gpt-3.5-turbo')
  systemPrompt?: string;  // System prompt to guide the assistant
}
```

## Using Adapters

### Basic Usage

```typescript
import { registerChatWidget, MockAdapter } from '@audako/chat-ui';
import '@audako/chat-ui/style.css';

// Create an adapter instance
const adapter = new MockAdapter();

// Register the widget with the adapter
registerChatWidget({
  adapter,
  title: 'My Chat Assistant',
  initialMessage: 'Welcome! How can I assist you?',
  placeholder: 'Ask me anything...'
});
```

Then in your HTML:

```html
<audako-chat></audako-chat>
```

### Dynamic Configuration

You can configure the widget after it's been rendered:

```typescript
import { configureChatWidget, OpenAIAdapter } from '@audako/chat-ui';

// First register the widget
registerChatWidget();

// Later, configure it dynamically
const adapter = new OpenAIAdapter({
  apiKey: userProvidedKey,
  model: 'gpt-4'
});

configureChatWidget('audako-chat', {
  adapter,
  title: 'Custom Assistant'
});
```

### Using with React

```tsx
import { useEffect, useRef } from 'react';
import { registerChatWidget, OpenAIAdapter } from '@audako/chat-ui';
import '@audako/chat-ui/style.css';

function ChatComponent() {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adapter = new OpenAIAdapter({
      apiKey: process.env.REACT_APP_OPENAI_KEY,
      model: 'gpt-4'
    });

    registerChatWidget({
      adapter,
      title: 'AI Assistant'
    });
  }, []);

  return <audako-chat ref={chatRef}></audako-chat>;
}
```

## Creating Custom Adapters

### Adapter Interface

All adapters must implement the `ChatAdapter` interface:

```typescript
interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onThinking?: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

interface ChatAdapter {
  sendMessage(
    request: ChatRequest,
    callbacks: StreamCallbacks
  ): Promise<void>;

  cancel?(): void;  // Optional: cancel ongoing requests
}

interface ChatRequest {
  message: string;              // The user's message
  conversationHistory?: Message[];  // Previous messages in the conversation
}

interface Message {
  id: string;
  from: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
  thinking?: ThinkingBlock;
}

interface ThinkingBlock {
  content: string;
  isStreaming?: boolean;
}
```

### Example: Custom Anthropic Adapter (with Extended Thinking)

This example shows how to implement an adapter that supports Claude's extended thinking feature:

```typescript
import type { ChatAdapter, ChatRequest, StreamCallbacks } from '@audako/chat-ui';

export class AnthropicAdapter implements ChatAdapter {
  private apiKey: string;
  private model: string;
  private abortController: AbortController | null = null;

  constructor(apiKey: string, model = 'claude-3-7-sonnet-20250219') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async sendMessage(
    request: ChatRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      // Build messages array from conversation history
      const messages = [];
      
      if (request.conversationHistory) {
        for (const msg of request.conversationHistory) {
          if (msg.from === 'user' || msg.from === 'assistant') {
            messages.push({
              role: msg.from === 'user' ? 'user' : 'assistant',
              content: msg.text
            });
          }
        }
      }

      // Add current message
      messages.push({
        role: 'user',
        content: request.message
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          max_tokens: 4096
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let accumulatedThinking = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta') {
                const delta = parsed.delta;
                
                // Check if this is thinking content
                if (delta?.type === 'thinking_delta') {
                  accumulatedThinking += delta.thinking || '';
                  if (callbacks.onThinking) {
                    callbacks.onThinking(accumulatedThinking);
                  }
                }
                // Regular text content
                else if (delta?.type === 'text_delta') {
                  accumulatedText += delta.text || '';
                  callbacks.onChunk(accumulatedText);
                }
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }

      callbacks.onComplete();
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    } finally {
      this.abortController = null;
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
```

### Example: Custom REST API Adapter

For a simple REST API that returns the full response at once:

```typescript
import type { ChatAdapter, ChatRequest } from '@audako/chat-ui';

export class SimpleAPIAdapter implements ChatAdapter {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async sendMessage(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: request.message,
          history: request.conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Simulate streaming by chunking the response
      const text = data.response || data.message || '';
      const words = text.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        onChunk(currentText);
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
```

### Example: WebSocket Adapter

For real-time WebSocket connections:

```typescript
import type { ChatAdapter, ChatRequest } from '@audako/chat-ui';

export class WebSocketAdapter implements ChatAdapter {
  private ws: WebSocket | null = null;
  private wsUrl: string;

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }

  async sendMessage(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.ws = new WebSocket(this.wsUrl);
      let accumulatedText = '';

      this.ws.onopen = () => {
        this.ws?.send(JSON.stringify({
          message: request.message,
          history: request.conversationHistory
        }));
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chunk') {
          accumulatedText += data.content;
          onChunk(accumulatedText);
        } else if (data.type === 'done') {
          onComplete();
          this.ws?.close();
          resolve();
        } else if (data.type === 'error') {
          onError(new Error(data.message));
          this.ws?.close();
          resolve();
        }
      };

      this.ws.onerror = () => {
        onError(new Error('WebSocket error'));
        resolve();
      };
    });
  }

  cancel(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

## API Reference

### ChatWidgetConfig

```typescript
interface ChatWidgetConfig {
  adapter: ChatAdapter;        // Required: LLM adapter instance
  initialMessage?: string;     // Initial message to display
  placeholder?: string;        // Input placeholder text
  title?: string;             // Widget title
}
```

### ChatAdapter Methods

#### sendMessage()

```typescript
interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onThinking?: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

sendMessage(
  request: ChatRequest,
  callbacks: StreamCallbacks
): Promise<void>
```

**Parameters:**
- `request`: Contains the user message and conversation history
- `callbacks`: Object containing streaming callbacks
  - `onChunk`: Called with accumulated response text for each chunk (not delta!)
  - `onThinking` (optional): Called with accumulated thinking/reasoning text
  - `onComplete`: Called when streaming is complete
  - `onError`: Called if an error occurs

**Important:** Both `onChunk` and `onThinking` callbacks expect the **full accumulated text** so far, not just the delta. The UI will handle displaying it correctly.

**Thinking Support:** The optional `onThinking` callback allows you to stream the model's reasoning process separately from the final response. This is useful for models like Claude or o1 that expose their thinking steps. The thinking content is displayed in a collapsible section above the main response.

#### cancel() (Optional)

```typescript
cancel(): void
```

Cancel an ongoing request. Implement this if your adapter supports cancellation.

### Helper Functions

#### registerChatWidget()

```typescript
function registerChatWidget(
  config?: ChatWidgetConfig,
  tag?: string
): string
```

Register the chat widget as a custom element.

#### configureChatWidget()

```typescript
function configureChatWidget(
  element: HTMLElement | string,
  config: ChatWidgetConfig
): void
```

Configure an existing chat widget element.

## Best Practices

1. **Error Handling**: Always catch and report errors via `onError`
2. **Cancellation**: Implement `cancel()` for better UX
3. **Accumulated Text**: Pass the full accumulated text to `onChunk`, not deltas
4. **AbortController**: Use AbortController for cancellable fetch requests
5. **Stream Parsing**: Be robust when parsing SSE/streaming responses
6. **Type Safety**: Use TypeScript for better developer experience

## Examples

See the `/examples` directory for complete working examples:
- `/examples/openai-example.html`
- `/examples/custom-adapter-example.html`
- `/examples/react-example.tsx`
