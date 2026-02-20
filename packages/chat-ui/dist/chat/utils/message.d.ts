import { ChatQuestionOption, Message } from '../../types';
export declare const DEFAULT_INITIAL_MESSAGE = "Welcome to Audako MCP Chat. How can I assist you today?";
export interface ComposerPayload {
    text: string;
    attachments: [];
}
export declare const createComposerPayload: (draft: string) => ComposerPayload;
export declare const createMessageId: (offset?: number) => string;
export declare const createSystemMessage: (text: string, id?: string) => Message;
export declare const createUserMessage: (text: string) => Message;
export declare const createAssistantStreamingMessage: (id: string) => Message;
export declare const getQuestionOptionValue: (option: ChatQuestionOption) => string;
