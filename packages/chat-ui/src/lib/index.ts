// Export the main chat component

// Export adapters for convenience
export { MockAdapter } from './adapters/mock-adapter';
export type { OpenCodeAdapterConfig, OpenCodeCombinedLogEntry } from './adapters/opencode-adapter';
export { OpenCodeAdapter } from './adapters/opencode-adapter';
export { default as ChatWidget } from './ChatWidget.svelte';
export { DEFAULT_INITIAL_MESSAGE, DEFAULT_TITLE } from './chat/utils/message';
// Export all types
export type {
  ChatAdapter,
  ChatRequest,
  ChatWidgetConfig,
  ChatWidgetThemeProps,
  Message,
  PublicQuestionHandler,
  PublicQuestionOptions,
  QuestionOption,
  QuestionRequest,
  StreamCallbacks,
  ThinkingBlock,
} from './types';
