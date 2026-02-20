import { ChatAdapter, ChatRequest, StreamCallbacks } from '../types';
/**
 * Mock adapter for testing and development
 * Simulates streaming responses with random delays and optional thinking
 */
export declare class MockAdapter implements ChatAdapter {
    private abortController;
    private showThinking;
    private showQuestion;
    constructor(options?: {
        showThinking?: boolean;
        showQuestion?: boolean;
    });
    /**
     * Initialize the mock adapter
     * For MockAdapter, this is a no-op since there's no real connection to set up
     */
    init(): Promise<void>;
    sendMessage(_request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
    cancel(): void;
}
