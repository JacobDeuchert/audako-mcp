import { ChatAdapter, ChatRequest, PublicQuestionHandler, PublicQuestionOptions, QuestionRequest, SlashCommand, StreamCallbacks } from '../types';
/**
 * Mock adapter for testing and development
 * Simulates streaming responses with random delays and optional thinking
 */
export declare class MockAdapter implements ChatAdapter {
    private abortController;
    private showThinking;
    private showQuestionPrompt;
    private publicQuestionHandler;
    constructor(options?: {
        showThinking?: boolean;
        showQuestion?: boolean;
    });
    /**
     * Initialize the mock adapter
     * For MockAdapter, this is a no-op since there's no real connection to set up
     */
    init(): Promise<void>;
    setPublicQuestionHandler(handler: PublicQuestionHandler | null): void;
    showQuestion(question: QuestionRequest, options?: PublicQuestionOptions): Promise<string[]>;
    sendMessage(_request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
    cancel(): void;
    getSlashCommands(): SlashCommand[];
    newSession(): Promise<void>;
}
