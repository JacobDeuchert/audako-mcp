import { ChatAdapter, ChatRequest, PublicQuestionHandler, PublicQuestionOptions, QuestionRequest, StreamCallbacks } from '../types';
export interface WebSocketAdapterConfig {
    websocketUrl: string;
    sessionToken: string;
    sessionId: string;
    bridgeUrl?: string;
    reconnectAttempts?: number;
    reconnectBaseDelay?: number;
    reconnectMaxDelay?: number;
    heartbeatIntervalMs?: number;
}
/**
 * WebSocket adapter for connecting to the copilot agent server
 * Implements ChatAdapter interface for streaming chat responses via WebSocket
 */
export declare class WebSocketAdapter implements ChatAdapter {
    private websocketUrl;
    private sessionToken;
    private sessionId;
    private bridgeUrl;
    private reconnectAttempts;
    private reconnectBaseDelay;
    private reconnectMaxDelay;
    private heartbeatIntervalMs;
    private ws;
    private currentCallbacks;
    private accumulatedText;
    private accumulatedThinking;
    private currentTurnId;
    private reconnectCount;
    private reconnectTimer;
    private heartbeatTimer;
    private publicQuestionHandler;
    private isConnecting;
    private pendingMessages;
    constructor(config: WebSocketAdapterConfig);
    private inferBridgeUrl;
    init(): Promise<void>;
    private connect;
    private startHeartbeat;
    private stopHeartbeat;
    private handleMessage;
    private handleSessionEvent;
    private handleTextDelta;
    private handleTurnStart;
    private handleTurnEnd;
    private handleToolStart;
    private handleToolEnd;
    private truncateOutput;
    private handleAgentError;
    private handleHubRequest;
    private handleClose;
    private handleError;
    private scheduleReconnect;
    private clearCurrentTurn;
    sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
    cancel(): void;
    setPublicQuestionHandler(handler: PublicQuestionHandler | null): void;
    showQuestion(question: QuestionRequest, options?: PublicQuestionOptions): Promise<string[]>;
    /**
     * Close the WebSocket connection and clean up
     */
    disconnect(): void;
}
