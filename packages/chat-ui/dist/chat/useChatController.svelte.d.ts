import { ChatQuestion, ChatWidgetConfig, Message } from '../types';
interface ChatControllerOptions {
    getConfig: () => ChatWidgetConfig;
    getShowThinking: () => boolean;
    scrollToBottom: () => void;
}
export declare const useChatController: ({ getConfig, getShowThinking, scrollToBottom }: ChatControllerOptions) => {
    state: {
        messages: Message[];
        draft: string;
        isTyping: boolean;
        streamingMessageId: string | null;
        pendingQuestion: ChatQuestion | null;
        selectedQuestionAnswers: string[];
        shouldFocusQuestion: boolean;
    };
    syncConfig: () => void;
    setDraft: (value: string) => void;
    sendMessage: () => Promise<void>;
    toggleQuestionAnswer: (optionValue: string) => void;
    submitQuestionAnswers: () => void;
    clearQuestionFocusRequest: () => void;
};
export {};
