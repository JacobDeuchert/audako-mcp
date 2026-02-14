import { ChatAdapter, ChatRequest, StreamCallbacks } from '../types';
export interface OpenAIAdapterConfig {
    apiKey?: string;
    apiUrl?: string;
    model?: string;
    systemPrompt?: string;
}
/**
 * OpenAI-compatible adapter for chat completions API
 * Works with OpenAI, Azure OpenAI, or any OpenAI-compatible endpoint
 */
export declare class OpenAIAdapter implements ChatAdapter {
    private apiKey;
    private apiUrl;
    private model;
    private systemPrompt;
    private abortController;
    constructor(config?: OpenAIAdapterConfig);
    /**
     * Initialize the OpenAI adapter
     * For OpenAIAdapter, this is a no-op since authentication happens per-request
     */
    init(): Promise<void>;
    sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
    cancel(): void;
}
