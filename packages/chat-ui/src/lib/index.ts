// Export the main chat component
export { default as ChatWidget } from './ChatWidget.svelte';

// Export all types
export type {
  Message,
  ThinkingBlock,
  StreamChunk,
  ChatQuestionOption,
  ChatQuestion,
  ChatRequest,
  StreamCallbacks,
  ChatAdapter,
  ChatWidgetConfig,
  ChatWidgetThemeProps,
} from './types';

// Export adapters for convenience
export { MockAdapter } from './adapters/mock-adapter';
export { OpenCodeAdapter } from './adapters/opencode-adapter';
