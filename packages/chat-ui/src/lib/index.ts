// Export the main chat component
export { default as ChatWidget } from './ChatWidget.svelte';

// Export all types
export type {
  Message,
  ThinkingBlock,
  StreamChunk,
  ChatRequest,
  StreamCallbacks,
  ChatAdapter,
  ChatWidgetConfig,
  ChatWidgetThemeProps
} from './types';

// Export adapters for convenience
export { MockAdapter } from './adapters/mock-adapter';
export { OpenAIAdapter } from './adapters/openai-adapter';
export { OpenCodeAdapter } from './adapters/opencode-adapter';
