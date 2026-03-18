// Export the main chat component

// Export adapters for convenience
export { MockAdapter } from './adapters/mock-adapter';
export type { SocketIOAdapterConfig } from './adapters/socketio-adapter';
export { SocketIOAdapter } from './adapters/socketio-adapter';
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
  SessionInfoFields,
  SlashCommand,
  StreamCallbacks,
  ThinkingBlock,
} from './types';
