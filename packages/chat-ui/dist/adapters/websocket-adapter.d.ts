import { BridgeSessionWebSocketEvent } from '@audako/contracts/copilot/ws-events';
import { ChatAdapter, ChatRequest, PublicQuestionHandler, PublicQuestionOptions, QuestionRequest, SessionInfoFields, SlashCommand, StreamCallbacks } from '../types';
export interface WebSocketAdapterDebugEvent {
    type: 'connection.attempt' | 'connection.open' | 'connection.error' | 'connection.close' | 'connection.disconnect' | 'connection.reconnect.scheduled' | 'connection.reconnect.success' | 'connection.reconnect.failure' | 'message.inbound.raw' | 'message.inbound.pong' | 'message.inbound.event' | 'message.inbound.custom_event' | 'message.inbound.custom_handler_error' | 'message.inbound.parse_error' | 'message.outbound.user_message' | 'message.outbound.cancel' | 'message.outbound.ping' | 'message.outbound.session_info_update' | 'message.outbound.queued' | 'message.outbound.queued.flush' | 'question.response.posted' | 'question.response.post_error';
    payload: unknown;
}
export interface WebSocketAdapterConfig {
    /** Base HTTP(S) URL of the copilot server (e.g. 'https://copilot.example.com') */
    baseUrl: string;
    /** Relative WebSocket path from bootstrap response (e.g. '/api/session/:id/ws') */
    websocketPath: string;
    sessionToken: string;
    sessionId: string;
    reconnectAttempts?: number;
    reconnectBaseDelay?: number;
    reconnectMaxDelay?: number;
    heartbeatIntervalMs?: number;
    onDebugEvent?: (event: WebSocketAdapterDebugEvent) => void;
    onCustomEvent?: (event: BridgeSessionWebSocketEvent) => void;
}
/**
 * WebSocket adapter for connecting to the copilot agent server
 * Implements ChatAdapter interface for streaming chat responses via WebSocket
 */
export declare class WebSocketAdapter implements ChatAdapter {
    private baseUrl;
    private websocketPath;
    private sessionToken;
    private sessionId;
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
    private onDebugEvent?;
    private onCustomEvent?;
    constructor(config: WebSocketAdapterConfig);
    private emitDebugEvent;
    private errorMessage;
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
    private postHubResponse;
    private handleClose;
    private handleError;
    private scheduleReconnect;
    private clearCurrentTurn;
    sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
    cancel(): void;
    updateSessionInfo(sessionInfo: SessionInfoFields): Promise<void>;
    setPublicQuestionHandler(handler: PublicQuestionHandler | null): void;
    showQuestion(question: QuestionRequest, options?: PublicQuestionOptions): Promise<string[]>;
    /**
     * Close the WebSocket connection and clean up
     */
    disconnect(): void;
    getSlashCommands(): SlashCommand[];
    newSession(): Promise<void>;
}
