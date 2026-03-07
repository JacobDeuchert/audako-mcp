import { ChatWidgetConfig, Message, QuestionRequest, SlashCommand } from '../types';
interface ChatControllerOptions {
    getConfig: () => ChatWidgetConfig;
    getShowThinking: () => boolean;
    scrollToBottom: () => void;
}
export declare const useChatController: ({ getConfig, getShowThinking, scrollToBottom, }: ChatControllerOptions) => {
    state: {
        messages: Message[];
        draft: string;
        isTyping: boolean;
        streamingMessageId: string | null;
        pendingQuestion: QuestionRequest | null;
        selectedQuestionAnswers: string[];
        shouldFocusQuestion: boolean;
    };
    syncConfig: () => void;
    setDraft: (value: string) => void;
    sendMessage: () => Promise<void>;
    cancelMessage: () => void;
    toggleQuestionAnswer: (optionValue: string) => void;
    submitQuestionAnswers: () => void;
    submitCustomAnswer: (value: string) => void;
    clearQuestionFocusRequest: () => void;
    getSlashCommands: () => SlashCommand[];
    executeSlashCommand: (commandName: string) => Promise<void>;
};
export {};
