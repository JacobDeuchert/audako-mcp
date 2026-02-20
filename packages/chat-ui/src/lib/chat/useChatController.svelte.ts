import type { ChatQuestion, ChatWidgetConfig, Message } from '../types';
import {
  createAssistantStreamingMessage,
  createComposerPayload,
  createSystemMessage,
  createUserMessage,
  DEFAULT_INITIAL_MESSAGE,
  createMessageId,
} from './utils/message';

interface ChatControllerOptions {
  getConfig: () => ChatWidgetConfig;
  getShowThinking: () => boolean;
  scrollToBottom: () => void;
}

const TYPING_DELAY_MS = 300;

export const useChatController = ({
  getConfig,
  getShowThinking,
  scrollToBottom,
}: ChatControllerOptions) => {
  const state = $state({
    messages: [] as Message[],
    draft: '',
    isTyping: false,
    streamingMessageId: null as string | null,
    pendingQuestion: null as ChatQuestion | null,
    selectedQuestionAnswers: [] as string[],
    shouldFocusQuestion: false,
  });

  let pendingQuestionResolver: ((answers: string[]) => void) | null = null;
  let initializedAdapter: ChatWidgetConfig['adapter'] | null = null;
  let hasSeededInitialMessage = false;

  const debug = (...args: unknown[]) => {
    console.log('[chat-ui]', ...args);
  };

  const resetQuestionState = () => {
    state.pendingQuestion = null;
    state.selectedQuestionAnswers = [];
    state.shouldFocusQuestion = false;
    pendingQuestionResolver = null;
  };

  const resolveQuestion = (answers: string[]) => {
    const resolver = pendingQuestionResolver;
    resetQuestionState();
    resolver?.(answers);
  };

  const askQuestion = (question: ChatQuestion, shouldFocusQuestion = false): Promise<string[]> => {
    if (pendingQuestionResolver) {
      pendingQuestionResolver([]);
    }

    state.pendingQuestion = question;
    state.selectedQuestionAnswers = [];
    state.shouldFocusQuestion = shouldFocusQuestion;

    return new Promise(resolve => {
      pendingQuestionResolver = resolve;
    });
  };

  const updateMessageById = (messageId: string, updater: (message: Message) => Message) => {
    const messageIndex = state.messages.findIndex(message => message.id === messageId);
    if (messageIndex === -1) {
      return;
    }

    state.messages[messageIndex] = updater(state.messages[messageIndex]);
    state.messages = [...state.messages];
  };

  const syncConfig = () => {
    const resolvedConfig = getConfig();

    debug('config resolved', {
      title: resolvedConfig?.title,
      hasAdapter: !!resolvedConfig?.adapter,
      adapterType: resolvedConfig?.adapter?.constructor?.name,
      hasInitialMessage: !!resolvedConfig?.initialMessage,
    });

    if (
      resolvedConfig?.adapter &&
      typeof resolvedConfig.adapter.init === 'function' &&
      resolvedConfig.adapter !== initializedAdapter
    ) {
      initializedAdapter = resolvedConfig.adapter;
      debug('initializing adapter');
      resolvedConfig.adapter.init().catch(error => {
        console.error('Failed to initialize adapter:', error);
      });
    }

    if (!hasSeededInitialMessage) {
      hasSeededInitialMessage = true;
      state.messages = [
        createSystemMessage(resolvedConfig?.initialMessage ?? DEFAULT_INITIAL_MESSAGE),
      ];
    }
  };

  const setDraft = (value: string) => {
    state.draft = value;
  };

  const toggleQuestionAnswer = (optionValue: string) => {
    if (!state.pendingQuestion) {
      return;
    }

    if (!state.pendingQuestion.allowMultiple) {
      resolveQuestion([optionValue]);
      return;
    }

    if (state.selectedQuestionAnswers.includes(optionValue)) {
      state.selectedQuestionAnswers = state.selectedQuestionAnswers.filter(
        answer => answer !== optionValue,
      );
    } else {
      state.selectedQuestionAnswers = [...state.selectedQuestionAnswers, optionValue];
    }
  };

  const submitQuestionAnswers = () => {
    if (!state.pendingQuestion?.allowMultiple || state.selectedQuestionAnswers.length === 0) {
      return;
    }

    resolveQuestion(state.selectedQuestionAnswers);
  };

  const clearQuestionFocusRequest = () => {
    state.shouldFocusQuestion = false;
  };

  const sendMessage = async () => {
    const resolvedConfig = getConfig();
    const payload = createComposerPayload(state.draft);

    debug('sendMessage called', {
      draftLength: state.draft.length,
      isDraftEmpty: !payload.text,
      hasStreamingMessage: !!state.streamingMessageId,
      hasAdapter: !!resolvedConfig?.adapter,
      attachmentCount: payload.attachments.length,
    });

    if (!payload.text || state.streamingMessageId || !resolvedConfig?.adapter) {
      debug('sendMessage aborted', {
        reason: {
          emptyDraft: !payload.text,
          streamingInProgress: !!state.streamingMessageId,
          missingAdapter: !resolvedConfig?.adapter,
        },
      });
      return;
    }

    const userMessage = createUserMessage(payload.text);
    state.messages = [...state.messages, userMessage];
    debug('user message appended', {
      messageId: userMessage.id,
      totalMessages: state.messages.length,
    });

    state.draft = '';
    scrollToBottom();

    state.isTyping = true;
    await new Promise(resolve => setTimeout(resolve, TYPING_DELAY_MS));

    const messageId = createMessageId(1);
    const streamingMessage = createAssistantStreamingMessage(messageId);

    state.messages = [...state.messages, streamingMessage];
    state.isTyping = false;
    state.streamingMessageId = messageId;
    debug('assistant streaming message created', {
      messageId,
      historyLength: state.messages.filter(message => message.from !== 'system').length,
      adapterType: resolvedConfig.adapter.constructor?.name,
    });
    scrollToBottom();

    try {
      debug('calling adapter.sendMessage');
      await resolvedConfig.adapter.sendMessage(
        {
          message: payload.text,
          conversationHistory: state.messages.filter(message => message.from !== 'system'),
        },
        {
          onChunk: (chunk: string) => {
            debug('adapter chunk received', {
              messageId,
              chunkLength: chunk.length,
            });

            updateMessageById(messageId, message => ({
              ...message,
              text: chunk,
            }));
            scrollToBottom();
          },
          onThinking: (chunk: string) => {
            if (!getShowThinking()) {
              return;
            }

            debug('adapter thinking chunk received', {
              messageId,
              chunkLength: chunk.length,
            });

            updateMessageById(messageId, message => ({
              ...message,
              thinking: {
                content: chunk,
                isStreaming: true,
              },
            }));
            scrollToBottom();
          },
          onQuestion: async (question: ChatQuestion) => {
            debug('adapter question received', {
              optionCount: question.options?.length ?? 0,
              allowMultiple: !!question.allowMultiple,
            });

            const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
            const shouldFocusQuestion =
              activeElement instanceof HTMLElement &&
              activeElement.classList.contains('chat-widget__input');

            return askQuestion(question, shouldFocusQuestion);
          },
          onComplete: () => {
            debug('adapter stream completed', { messageId });

            updateMessageById(messageId, message => ({
              ...message,
              isStreaming: false,
              thinking:
                getShowThinking() && message.thinking
                  ? {
                      ...message.thinking,
                      isStreaming: false,
                    }
                  : undefined,
            }));
            resetQuestionState();
            state.streamingMessageId = null;
            scrollToBottom();
          },
          onError: (error: Error) => {
            debug('adapter stream errored', {
              messageId,
              errorMessage: error.message,
            });

            console.error('Chat error:', error);
            updateMessageById(messageId, message => ({
              ...message,
              text: `Error: ${error.message}`,
              isStreaming: false,
            }));
            resetQuestionState();
            state.streamingMessageId = null;
            scrollToBottom();
          },
        },
      );
      debug('adapter.sendMessage resolved', { messageId });
    } catch (error) {
      debug('adapter.sendMessage threw', {
        messageId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error('Unexpected error:', error);
      updateMessageById(messageId, message => ({
        ...message,
        text: 'Unexpected error occurred',
        isStreaming: false,
      }));
      resetQuestionState();
      state.streamingMessageId = null;
      scrollToBottom();
    }
  };

  return {
    state,
    syncConfig,
    setDraft,
    sendMessage,
    toggleQuestionAnswer,
    submitQuestionAnswers,
    clearQuestionFocusRequest,
  };
};
