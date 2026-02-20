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
    logCombinedEvents?: boolean;
}
export interface OpenCodeCombinedLogEntry {
    at: string;
    category: 'request' | 'event' | 'state';
    type: string;
    sessionId?: string;
    messageId?: string;
    role?: string;
    partType?: string;
    delta?: string;
    text?: string;
    ignored?: boolean;
    reason?: string;
    payload?: unknown;
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
    private logCombinedEvents;
    private client;
    private abortController;
    private eventStream;
    private initPromise;
    private currentCallbacks;
    private currentAssistantMessageId;
    private currentUserMessageId;
    private currentText;
    private currentReasoning;
    private currentToolThinking;
    private toolThinkingEntryKeys;
    private lastEmittedThinking;
    private activeMessageLog;
    private lastMessageLog;
    private combinedMessageLog;
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
    private appendCombinedLog;
    private startCombinedLog;
    private recordEvent;
    private finalizeCombinedLog;
    /**
     * Handle incoming events from the stream
     */
    private handleEvent;
    private resolveAccumulatedContent;
    private getCombinedThinkingContent;
    private emitThinkingUpdate;
    private stringifyToolValue;
    private formatToolOutput;
    private buildToolThinkingEntry;
    /**
     * Clear current message tracking
     */
    private clearCurrentMessage;
    private ensureSession;
    sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
    cancel(): void;
    /**
     * Returns the most recent per-request combined log.
     */
    getLastCombinedLog(): OpenCodeCombinedLogEntry[];
    /**
     * Returns a flat combined log of all request entries captured by this adapter instance.
     */
    getCombinedLog(): OpenCodeCombinedLogEntry[];
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
