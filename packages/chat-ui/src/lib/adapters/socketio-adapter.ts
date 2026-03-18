import type {
  AssistantDeltaSessionEvent,
  AssistantDoneSessionEvent,
  AssistantErrorSessionEvent,
  CommandAcknowledgementPayload,
  PromptCancelPayload,
  PromptSendPayload,
  QuestionAnswerPayload,
  QuestionAskPayload,
  RealtimeDescriptor,
  SessionEventEnvelope,
  SessionSnapshotEvent,
  SessionUpdatePayload,
} from '@audako/contracts';
import { io, type Socket } from 'socket.io-client';
import type {
  ChatAdapter,
  ChatRequest,
  PublicQuestionHandler,
  PublicQuestionOptions,
  QuestionRequest,
  SessionInfoFields,
  SlashCommand,
  StreamCallbacks,
} from '../types';

type SessionSocketEvents = {
  'session.snapshot': (event: SessionSnapshotEvent) => void;
  'assistant.delta': (event: AssistantDeltaSessionEvent) => void;
  'assistant.done': (event: AssistantDoneSessionEvent) => void;
  'assistant.error': (event: AssistantErrorSessionEvent) => void;
  'question.ask': (event: SessionEventEnvelope<QuestionAskPayload>) => void;
  'session.updated': (event: SessionEventEnvelope<unknown>) => void;
  'session.closed': (event: SessionEventEnvelope<{ reason: string }>) => void;
};

type SessionSocketCommands = {
  'prompt.send': (
    payload: PromptSendPayload,
    ack: (acknowledgement: CommandAcknowledgementPayload) => void,
  ) => void;
  'prompt.cancel': (
    payload: PromptCancelPayload,
    ack: (acknowledgement: CommandAcknowledgementPayload) => void,
  ) => void;
  'question.answer': (
    payload: QuestionAnswerPayload,
    ack: (acknowledgement: CommandAcknowledgementPayload) => void,
  ) => void;
  'session.update': (
    payload: SessionUpdatePayload,
    ack: (acknowledgement: CommandAcknowledgementPayload) => void,
  ) => void;
};

type SessionSocket = Socket<SessionSocketEvents, SessionSocketCommands>;

export interface SocketIOAdapterConfig {
  baseUrl: string;
  sessionId: string;
  realtime: RealtimeDescriptor;
  reconnectAttempts?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
  commandAckTimeoutMs?: number;
}

export class SocketIOAdapter implements ChatAdapter {
  private readonly baseUrl: string;
  private readonly sessionId: string;
  private readonly realtime: RealtimeDescriptor;
  private readonly reconnectAttempts: number;
  private readonly reconnectBaseDelay: number;
  private readonly reconnectMaxDelay: number;
  private readonly commandAckTimeoutMs: number;

  private socket: SessionSocket | null = null;
  private currentCallbacks: StreamCallbacks | null = null;
  private accumulatedText = '';
  private publicQuestionHandler: PublicQuestionHandler | null = null;
  private isConnecting = false;

  constructor(config: SocketIOAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.sessionId = config.sessionId;
    this.realtime = config.realtime;
    this.reconnectAttempts = config.reconnectAttempts ?? 5;
    this.reconnectBaseDelay = config.reconnectBaseDelay ?? 1000;
    this.reconnectMaxDelay = config.reconnectMaxDelay ?? 30000;
    this.commandAckTimeoutMs = config.commandAckTimeoutMs ?? 8000;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private createCommandId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  async init(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const check = () => {
          if (this.socket?.connected) {
            resolve();
            return;
          }

          if (!this.isConnecting) {
            reject(new Error('Socket.IO connection failed'));
            return;
          }

          setTimeout(check, 100);
        };

        check();
      });
    }

    await this.connect();
  }

  private async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const socket = io(`${this.baseUrl}${this.realtime.namespace}`, {
      path: this.realtime.path,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.reconnectAttempts,
      reconnectionDelay: this.reconnectBaseDelay,
      reconnectionDelayMax: this.reconnectMaxDelay,
      auth: {
        sessionId: this.sessionId,
        token: this.realtime.auth.token,
      },
      autoConnect: false,
    }) as SessionSocket;

    this.bindSocketHandlers(socket);

    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const onConnect = () => {
        this.isConnecting = false;
        cleanup();
        resolve();
      };

      const onConnectError = (error: Error & { data?: unknown }) => {
        this.isConnecting = false;
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
      };

      socket.on('connect', onConnect);
      socket.on('connect_error', onConnectError);
      socket.connect();
    });
  }

  private bindSocketHandlers(socket: SessionSocket): void {
    socket.on('session.snapshot', (_event: SessionSnapshotEvent) => {
      // Session snapshot received - no action needed for basic adapter
    });

    socket.on('assistant.delta', (event: AssistantDeltaSessionEvent) => {
      this.handleAssistantDelta(event);
    });

    socket.on('assistant.done', (_event: AssistantDoneSessionEvent) => {
      this.handleAssistantDone();
    });

    socket.on('assistant.error', (event: AssistantErrorSessionEvent) => {
      this.handleAssistantError(event);
    });

    socket.on('question.ask', (event: SessionEventEnvelope<QuestionAskPayload>) => {
      void this.handleQuestionAsk(event);
    });

    socket.on('disconnect', (_reason: string) => {
      // Socket.IO handles reconnection automatically
    });
  }

  private assertConnectedSocket(): SessionSocket {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Socket.IO is not connected');
    }

    return this.socket;
  }

  private async emitCommandWithAck<TPayload>(
    command: keyof SessionSocketCommands,
    payload: TPayload,
  ): Promise<CommandAcknowledgementPayload> {
    const socket = this.assertConnectedSocket();

    return new Promise((resolve, reject) => {
      socket
        .timeout(this.commandAckTimeoutMs)
        .emit(
          command,
          payload as never,
          (error: Error | null, ack: CommandAcknowledgementPayload) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(ack as CommandAcknowledgementPayload);
          },
        );
    });
  }

  private async requireAcceptedAck<TPayload>(
    command: keyof SessionSocketCommands,
    payload: TPayload,
  ): Promise<CommandAcknowledgementPayload> {
    const acknowledgement = await this.emitCommandWithAck(command, payload);

    if (acknowledgement.status === 'accepted') {
      return acknowledgement;
    }

    const error = new Error(acknowledgement.error?.message ?? `${command} command rejected`) as Error & {
      code?: string;
    };
    error.code = acknowledgement.error?.code;
    throw error;
  }

  private handleAssistantDelta(event: AssistantDeltaSessionEvent): void {
    if (!this.currentCallbacks) {
      return;
    }

    // Only handle text deltas - tool/thinking events are no longer part of the contract
    if (event.payload.kind === 'text') {
      this.accumulatedText += event.payload.delta;
      this.currentCallbacks.onChunk(this.accumulatedText);
    }
  }

  private handleAssistantDone(): void {
    if (!this.currentCallbacks) {
      return;
    }

    this.currentCallbacks.onComplete();
    this.clearCurrentTurn();
  }

  private handleAssistantError(event: AssistantErrorSessionEvent): void {
    const error = new Error(event.payload.errorMessage || 'Unknown assistant error') as Error & {
      code?: string;
    };
    error.code = event.payload.errorCode;

    this.currentCallbacks?.onError(error);
    this.clearCurrentTurn();
  }

  private async handleQuestionAsk(event: SessionEventEnvelope<QuestionAskPayload>): Promise<void> {
    const questionHandler = this.currentCallbacks?.onQuestion
      ? (question: QuestionRequest) => this.currentCallbacks?.onQuestion?.(question)
      : this.publicQuestionHandler
        ? (question: QuestionRequest) =>
            this.publicQuestionHandler?.(question, { autoFocus: false })
        : null;

    if (!questionHandler) {
      await this.sendQuestionAnswer(event.payload.questionId, []);
      return;
    }

    try {
      const answers = (await questionHandler(event.payload.request)) ?? [];
      await this.sendQuestionAnswer(event.payload.questionId, answers);
    } catch {
      await this.sendQuestionAnswer(event.payload.questionId, []);
    }
  }

  private async sendQuestionAnswer(questionId: string, answers: string[]): Promise<void> {
    const payload: QuestionAnswerPayload = {
      commandId: this.createCommandId(),
      questionId,
      answers,
    };

    await this.requireAcceptedAck('question.answer', payload);
  }

  private clearCurrentTurn(): void {
    this.currentCallbacks = null;
    this.accumulatedText = '';
  }

  async sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void> {
    if (!this.socket?.connected) {
      await this.init();
    }

    this.currentCallbacks = callbacks;
    this.accumulatedText = '';

    const payload: PromptSendPayload = {
      commandId: this.createCommandId(),
      content: request.message,
    };

    try {
      await this.requireAcceptedAck('prompt.send', payload);
    } catch (error) {
      this.clearCurrentTurn();
      throw error;
    }
  }

  cancel(): void {
    if (!this.socket?.connected) {
      this.clearCurrentTurn();
      return;
    }

    const payload: PromptCancelPayload = {
      commandId: this.createCommandId(),
      reason: 'user_cancelled',
    };

    void this.requireAcceptedAck('prompt.cancel', payload).finally(() => {
      this.clearCurrentTurn();
    });
  }

  async updateSessionInfo(sessionInfo: SessionInfoFields): Promise<void> {
    if (!this.socket?.connected) {
      await this.init();
    }

    const payload: SessionUpdatePayload = {
      commandId: this.createCommandId(),
      sessionInfo,
    };

    await this.requireAcceptedAck('session.update', payload);
  }

  setPublicQuestionHandler(handler: PublicQuestionHandler | null): void {
    this.publicQuestionHandler = handler;
  }

  async showQuestion(
    question: QuestionRequest,
    options?: PublicQuestionOptions,
  ): Promise<string[]> {
    if (!this.publicQuestionHandler) {
      throw new Error(
        'No question handler is registered. Mount ChatWidget with this adapter first.',
      );
    }

    return this.publicQuestionHandler(question, options);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = false;
    this.clearCurrentTurn();
  }

  getSlashCommands(): SlashCommand[] {
    return [{ name: 'new', description: 'Start a new conversation' }];
  }

  async newSession(): Promise<void> {
    this.disconnect();
  }
}