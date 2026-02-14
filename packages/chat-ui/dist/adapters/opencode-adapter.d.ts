import { ChatAdapter, ChatRequest, StreamCallbacks } from '../types';
export interface OpenCodeAdapterConfig {
    sessionId?: string;
    baseUrl?: string;
    model?: {
        providerID: string;
        modelID: string;
    };
    agent?: string;
    createSession?: boolean;
}
/**
 * OpenCode adapter for connecting to OpenCode server
 * Uses the OpenCode SDK to send messages and receive streaming responses
 */
export declare class OpenCodeAdapter implements ChatAdapter {
    private sessionId;
    private baseUrl;
    private model?;
    private agent?;
    private createSession;
    private client;
    private abortController;
    private eventStream;
    private currentCallbacks;
    private currentAssistantMessageId;
    private currentUserMessageId;
    constructor(config?: OpenCodeAdapterConfig);
    private ensureClient;
    /**
     * Initialize the OpenCode client and set up event listener
     * This can be called proactively to set up the connection before sending messages
     */
    init(): Promise<void>;
    getAgents(): Promise<string[]>;
    /**
     * Start the background event listener
     */
    private startEventListener;
    /**
     * Handle incoming events from the stream
     */
    private handleEvent;
    /**
     * Clear current message tracking
     */
    private clearCurrentMessage;
    private ensureSession;
    sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
    cancel(): void;
    /**
     * Get the current session ID
     */
    getSessionId(): string | null;
    /**
     * Set a specific session ID to use
     */
    setSessionId(sessionId: string): void;
    /**
     * Clear the current session (will create a new one on next message)
     */
    clearSession(): void;
}
