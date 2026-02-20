import type { ChatQuestionOption, Message } from '../../types';

export const DEFAULT_INITIAL_MESSAGE = 'Welcome to Audako MCP Chat. How can I assist you today?';

export interface ComposerPayload {
  text: string;
  attachments: [];
}

export const createComposerPayload = (draft: string): ComposerPayload => {
  return {
    text: draft.trim(),
    attachments: [],
  };
};

export const createMessageId = (offset = 0): string => {
  return (Date.now() + offset).toString();
};

export const createSystemMessage = (text: string, id = '1'): Message => {
  return {
    id,
    from: 'system',
    text,
    timestamp: new Date(),
  };
};

export const createUserMessage = (text: string): Message => {
  return {
    id: createMessageId(),
    from: 'user',
    text,
    timestamp: new Date(),
  };
};

export const createAssistantStreamingMessage = (id: string): Message => {
  return {
    id,
    from: 'assistant',
    text: '',
    timestamp: new Date(),
    isStreaming: true,
  };
};

export const getQuestionOptionValue = (option: ChatQuestionOption): string => {
  return option.value ?? option.label;
};
