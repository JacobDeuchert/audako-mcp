# Using @audako/chat-ui as a Svelte Library

This package can be used as a native Svelte component library in your Svelte applications, including Chrome extensions.

## Installation

Since this is a local package, you can install it using npm workspaces or link it locally:

```bash
# If using npm workspaces (from root)
npm install

# Or link it manually
cd packages/chat-ui
npm link
cd your-chrome-extension
npm link @audako/chat-ui
```

## Usage in Svelte 5 Applications

### 1. Import the Component and Styles

```svelte
<script lang="ts">
  import { ChatWidget, MockAdapter, type ChatWidgetConfig } from '@audako/chat-ui';
  import '@audako/chat-ui/style.css';

  // Create your adapter
  const adapter = new MockAdapter({ showThinking: true });

  // Configure the chat widget
  let config: ChatWidgetConfig = {
    adapter,
    title: 'My Assistant',
    initialMessage: 'Hello! How can I help you?',
    placeholder: 'Type your message...'
  };
</script>

<ChatWidget {config} />
```

### 2. Using with Different Adapters

#### Mock Adapter (for testing)
```typescript
import { MockAdapter } from '@audako/chat-ui';

const adapter = new MockAdapter({
  showThinking: true  // Enable thinking simulation
});
```

#### OpenAI Adapter
```typescript
import { OpenAIAdapter } from '@audako/chat-ui';

const adapter = new OpenAIAdapter({
  apiKey: 'your-api-key',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant.'
});
```

#### OpenCode Adapter
```typescript
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

### 3. Custom Adapter

Create your own adapter by implementing the `ChatAdapter` interface:

```typescript
import type { ChatAdapter, ChatRequest, StreamCallbacks } from '@audako/chat-ui';

export class MyCustomAdapter implements ChatAdapter {
  async init(): Promise<void> {
    // Optional: Initialize your adapter
  }

  async sendMessage(
    request: ChatRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    // Implement your message sending logic
    // Call callbacks.onChunk(text) for streaming responses
    // Call callbacks.onThinking(text) for thinking content (optional)
    // Call callbacks.onComplete() when done
    // Call callbacks.onError(error) on errors
  }

  cancel?(): void {
    // Optional: Cancel ongoing requests
  }
}
```

## Usage in Chrome Extension Content Scripts

For Chrome extensions, import and render this package as a regular Svelte component instead of relying on custom elements.

### manifest.json
```json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "css": ["content.css"]
  }]
}
```

### Your Svelte Content Script
```svelte
<script lang="ts">
  import { ChatWidget, MockAdapter } from '@audako/chat-ui';
  import '@audako/chat-ui/style.css';

  let config = {
    adapter: new MockAdapter(),
    title: 'Extension Assistant',
    initialMessage: 'How can I help you today?'
  };
</script>

<div class="extension-chat-container">
  <ChatWidget {config} />
</div>
```

## TypeScript Support

The package includes full TypeScript definitions. Import types as needed:

```typescript
import type {
  ChatAdapter,
  ChatWidgetConfig,
  Message,
  ChatRequest,
  StreamCallbacks
} from '@audako/chat-ui';
```

## Styling

The component uses Tailwind CSS internally, which is bundled into `style.css`. You must import this CSS file for the component to display correctly:

```typescript
import '@audako/chat-ui/style.css';
```

## Component Props

The `ChatWidget` component accepts a single bindable `config` prop:

```typescript
interface ChatWidgetConfig {
  adapter: ChatAdapter;          // Required: The chat adapter to use
  title?: string;                 // Optional: Widget title (default: 'Audako Assistant')
  initialMessage?: string;        // Optional: Initial message to display
  placeholder?: string;           // Optional: Input placeholder text
}
```

## Building

To rebuild the library after making changes:

```bash
npm run build
```

This will generate:
- `dist/index.js` - Main library bundle
- `dist/index.d.ts` - TypeScript definitions
- `dist/style.css` - Bundled Tailwind CSS
- `dist/adapters/` - Adapter type definitions
