import { RealtimeDescriptor } from '@audako/contracts';
import { ChatAdapter, ChatRequest, PublicQuestionHandler, PublicQuestionOptions, QuestionRequest, SessionInfoFields, SlashCommand, StreamCallbacks } from '../types';
export interface SocketIOAdapterConfig {
    baseUrl: string;
    sessionId: string;
    realtime: RealtimeDescriptor;
    reconnectAttempts?: number;
    reconnectBaseDelay?: number;
    reconnectMaxDelay?: number;
    commandAckTimeoutMs?: number;
}
export declare class SocketIOAdapter implements ChatAdapter {
    private readonly baseUrl;
    private readonly sessionId;
    private readonly realtime;
    private readonly reconnectAttempts;
    private readonly reconnectBaseDelay;
    private readonly reconnectMaxDelay;
    private readonly commandAckTimeoutMs;
    private socket;
    private currentCallbacks;
    private accumulatedText;
    private publicQuestionHandler;
    private isConnecting;
    constructor(config: SocketIOAdapterConfig);
    private errorMessage;
    private createCommandId;
    init(): Promise<void>;
    private connect;
    private bindSocketHandlers;
    private assertConnectedSocket;
    private emitCommandWithAck;
    private requireAcceptedAck;
    private handleAssistantDelta;
    private handleAssistantDone;
    private handleAssistantError;
    private handleQuestionAsk;
    private sendQuestionAnswer;
    private clearCurrentTurn;
    sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void>;
    cancel(): void;
    updateSessionInfo(sessionInfo: SessionInfoFields): Promise<void>;
    setPublicQuestionHandler(handler: PublicQuestionHandler | null): void;
    showQuestion(question: QuestionRequest, options?: PublicQuestionOptions): Promise<string[]>;
    disconnect(): void;
    getSlashCommands(): SlashCommand[];
    newSession(): Promise<void>;
}
