import type {
  AgentErrorSessionEvent,
  AgentTextDeltaSessionEvent,
  AgentToolEndSessionEvent,
  AgentToolStartSessionEvent,
  AgentTurnEndSessionEvent,
  AgentTurnStartSessionEvent,
  BridgeSessionWebSocketCancelMessage,
  BridgeSessionWebSocketEvent,
  BridgeSessionWebSocketHubResponseMessage,
  BridgeSessionWebSocketPingMessage,
  BridgeSessionWebSocketPongMessage,
  BridgeSessionWebSocketServerMessage,
  BridgeSessionWebSocketSessionInfoUpdateMessage,
  BridgeSessionWebSocketUserMessage,
  QuestionAskHubRequestEvent,
} from '@audako/contracts/copilot/ws-events';
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

export interface WebSocketAdapterDebugEvent {
  type:
    | 'connection.attempt'
    | 'connection.open'
    | 'connection.error'
    | 'connection.close'
    | 'connection.disconnect'
    | 'connection.reconnect.scheduled'
    | 'connection.reconnect.success'
    | 'connection.reconnect.failure'
    | 'message.inbound.raw'
    | 'message.inbound.pong'
    | 'message.inbound.event'
    | 'message.inbound.custom_event'
    | 'message.inbound.custom_handler_error'
    | 'message.inbound.parse_error'
    | 'message.outbound.user_message'
    | 'message.outbound.cancel'
    | 'message.outbound.ping'
    | 'message.outbound.session_info_update'
    | 'message.outbound.queued'
    | 'message.outbound.queued.flush'
    | 'question.response.posted'
    | 'question.response.post_error';
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
export class WebSocketAdapter implements ChatAdapter {
  private baseUrl: string;
  private websocketPath: string;
  private sessionToken: string;
  private sessionId: string;
  private reconnectAttempts: number;
  private reconnectBaseDelay: number;
  private reconnectMaxDelay: number;
  private heartbeatIntervalMs: number;

  private ws: WebSocket | null = null;
  private currentCallbacks: StreamCallbacks | null = null;
  private accumulatedText = '';
  private accumulatedThinking = '';
  private currentTurnId: string | null = null;
  private reconnectCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private publicQuestionHandler: PublicQuestionHandler | null = null;
  private isConnecting = false;
  private pendingMessages: string[] = [];
  private onDebugEvent?: (event: WebSocketAdapterDebugEvent) => void;
  private onCustomEvent?: (event: BridgeSessionWebSocketEvent) => void;

  constructor(config: WebSocketAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.websocketPath = config.websocketPath;
    this.sessionToken = config.sessionToken;
    this.sessionId = config.sessionId;
    this.reconnectAttempts = config.reconnectAttempts ?? 5;
    this.reconnectBaseDelay = config.reconnectBaseDelay ?? 1000;
    this.reconnectMaxDelay = config.reconnectMaxDelay ?? 30000;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 30000;
    this.onDebugEvent = config.onDebugEvent;
    this.onCustomEvent = config.onCustomEvent;
  }

  private emitDebugEvent(type: WebSocketAdapterDebugEvent['type'], payload: unknown): void {
    if (!this.onDebugEvent) {
      return;
    }

    try {
      this.onDebugEvent({ type, payload });
    } catch (error) {
      console.warn('[WebSocketAdapter] Debug callback failed:', error);
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  async init(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            resolve();
          } else if (!this.isConnecting) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              resolve();
            } else {
              reject(new Error('Connection failed'));
            }
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    await this.connect();
  }

  private async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.websocketPath, this.baseUrl);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('sessionToken', this.sessionToken);
        this.emitDebugEvent('connection.attempt', {
          url: `${url.origin}${url.pathname}`,
          reconnectCount: this.reconnectCount,
        });
        this.ws = new WebSocket(url.toString());

        const onOpen = () => {
          console.log('[WebSocketAdapter] Connected');
          this.isConnecting = false;
          this.reconnectCount = 0;
          this.startHeartbeat();
          this.emitDebugEvent('connection.open', {
            url: `${url.origin}${url.pathname}`,
          });

          // Send any pending messages
          while (this.pendingMessages.length > 0) {
            const message = this.pendingMessages.shift();
            if (message && this.ws) {
              this.ws.send(message);
              this.emitDebugEvent('message.outbound.queued.flush', {
                preview: message.slice(0, 200),
              });
            }
          }

          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          resolve();
        };

        const onError = (event: Event) => {
          console.error('[WebSocketAdapter] Connection error:', event);
          this.isConnecting = false;
          this.emitDebugEvent('connection.error', {
            phase: 'connect',
          });
          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.addEventListener('open', onOpen);
        this.ws.addEventListener('error', onError);

        this.ws.addEventListener('message', this.handleMessage.bind(this));
        this.ws.addEventListener('close', this.handleClose.bind(this));
        this.ws.addEventListener('error', this.handleError.bind(this));
      } catch (error) {
        this.isConnecting = false;
        this.emitDebugEvent('connection.error', {
          phase: 'connect.setup',
          message: this.errorMessage(error),
        });
        reject(error);
      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message: BridgeSessionWebSocketPingMessage = { type: 'ping' };
        this.ws.send(JSON.stringify(message));
        this.emitDebugEvent('message.outbound.ping', {});
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const rawMessage = typeof event.data === 'string' ? event.data : String(event.data);
      this.emitDebugEvent('message.inbound.raw', {
        preview: rawMessage.slice(0, 200),
      });

      const data = JSON.parse(rawMessage) as BridgeSessionWebSocketServerMessage;

      // Handle pong response
      if ((data as BridgeSessionWebSocketPongMessage).type === 'pong') {
        this.emitDebugEvent('message.inbound.pong', {});
        return;
      }

      // Handle session events
      this.handleSessionEvent(data as BridgeSessionWebSocketEvent);
    } catch (error) {
      console.error('[WebSocketAdapter] Failed to parse message:', error);
      this.emitDebugEvent('message.inbound.parse_error', {
        message: this.errorMessage(error),
      });
    }
  }

  private handleSessionEvent(event: BridgeSessionWebSocketEvent): void {
    this.emitDebugEvent('message.inbound.event', {
      eventType: event.type,
      payload: event.payload,
    });

    switch (event.type) {
      case 'agent.text_delta':
        if (!this.currentCallbacks) return;
        this.handleTextDelta(event as AgentTextDeltaSessionEvent);
        break;
      case 'agent.turn_start':
        if (!this.currentCallbacks) return;
        this.handleTurnStart(event as AgentTurnStartSessionEvent);
        break;
      case 'agent.turn_end':
        if (!this.currentCallbacks) return;
        this.handleTurnEnd(event as AgentTurnEndSessionEvent);
        break;
      case 'agent.tool_start':
        if (!this.currentCallbacks) return;
        this.handleToolStart(event as AgentToolStartSessionEvent);
        break;
      case 'agent.tool_end':
        if (!this.currentCallbacks) return;
        this.handleToolEnd(event as AgentToolEndSessionEvent);
        break;
      case 'agent.error':
        if (!this.currentCallbacks) return;
        this.handleAgentError(event as AgentErrorSessionEvent);
        break;
      case 'hub.request':
        this.handleHubRequest(event as QuestionAskHubRequestEvent);
        break;
      default:
        this.emitDebugEvent('message.inbound.custom_event', {
          eventType: event.type,
          payload: event.payload,
        });

        if (!this.onCustomEvent) {
          return;
        }

        try {
          this.onCustomEvent(event);
        } catch (error) {
          this.emitDebugEvent('message.inbound.custom_handler_error', {
            eventType: event.type,
            message: this.errorMessage(error),
          });
        }
    }
  }

  private handleTextDelta(event: AgentTextDeltaSessionEvent): void {
    this.accumulatedText += event.payload.delta;
    this.currentCallbacks?.onChunk(this.accumulatedText);
  }

  private handleTurnStart(event: AgentTurnStartSessionEvent): void {
    this.currentTurnId = event.payload.turnId;
    this.accumulatedText = '';
    this.accumulatedThinking = '';
    console.log('[WebSocketAdapter] Turn started:', this.currentTurnId);
  }

  private handleTurnEnd(event: AgentTurnEndSessionEvent): void {
    console.log('[WebSocketAdapter] Turn ended:', event.payload.turnId);
    this.currentCallbacks?.onComplete();
    this.clearCurrentTurn();
  }

  private handleToolStart(event: AgentToolStartSessionEvent): void {
    if (this.currentCallbacks?.onThinking) {
      const toolName = event.payload.toolName;
      const thinkingText = `Using tool: ${toolName}`;

      if (this.accumulatedThinking) {
        this.accumulatedThinking += `\n${thinkingText}`;
      } else {
        this.accumulatedThinking = thinkingText;
      }

      this.currentCallbacks.onThinking(this.accumulatedThinking);
    }
  }

  private handleToolEnd(event: AgentToolEndSessionEvent): void {
    if (this.currentCallbacks?.onThinking) {
      const toolName = event.payload.toolName;
      const output = event.payload.toolOutput;
      const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
      const thinkingText = `Completed tool: ${toolName}\nOutput: ${this.truncateOutput(outputStr, 200)}`;

      if (this.accumulatedThinking) {
        this.accumulatedThinking += `\n${thinkingText}`;
      } else {
        this.accumulatedThinking = thinkingText;
      }

      this.currentCallbacks.onThinking(this.accumulatedThinking);
    }
  }

  private truncateOutput(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}... [truncated]`;
  }

  private handleAgentError(event: AgentErrorSessionEvent): void {
    const errorMessage = event.payload.errorMessage || 'Unknown agent error';
    const error: Error & { code?: string } = new Error(errorMessage);

    if (event.payload.errorCode) {
      error.code = event.payload.errorCode;
    }

    this.currentCallbacks?.onError(error);
    this.clearCurrentTurn();
  }

  private async handleHubRequest(event: QuestionAskHubRequestEvent): Promise<void> {
    const { requestId, requestType, payload: questionPayload } = event.payload;

    if (requestType !== 'question.ask') {
      console.warn('[WebSocketAdapter] Unsupported request type:', requestType);
      return;
    }

    const question = questionPayload as QuestionRequest;
    const questionHandler = this.currentCallbacks?.onQuestion
      ? (prompt: QuestionRequest) => this.currentCallbacks?.onQuestion?.(prompt)
      : this.publicQuestionHandler
        ? (prompt: QuestionRequest) => this.publicQuestionHandler?.(prompt, { autoFocus: false })
        : null;

    try {
      if (!questionHandler) {
        console.warn(
          '[WebSocketAdapter] Received hub.request but no question handler is registered',
        );
        this.postHubResponse(requestId, []);
        return;
      }

      const answers = await questionHandler(question);

      this.postHubResponse(requestId, answers);

      this.emitDebugEvent('question.response.posted', {
        requestId,
        answersCount: answers.length,
      });
    } catch (error) {
      console.error('[WebSocketAdapter] Failed to handle question:', error);
      this.emitDebugEvent('question.response.post_error', {
        requestId,
        message: this.errorMessage(error),
      });
      try {
        this.postHubResponse(requestId, []);
      } catch (sendError) {
        console.error('[WebSocketAdapter] Failed to send fallback response:', sendError);
      }
    }
  }

  private postHubResponse(requestId: string, response: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const responseMessage: BridgeSessionWebSocketHubResponseMessage = {
      type: 'hub.response',
      requestId,
      response,
    };
    this.ws.send(JSON.stringify(responseMessage));

    console.log('[WebSocketAdapter] Question response sent:', requestId);
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocketAdapter] Connection closed:', event.code, event.reason);
    this.emitDebugEvent('connection.close', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    this.stopHeartbeat();

    // Attempt reconnection if not explicitly closed by cancel()
    if (event.code !== 1000 && this.reconnectCount < this.reconnectAttempts) {
      this.scheduleReconnect();
    } else if (this.reconnectCount >= this.reconnectAttempts) {
      console.error('[WebSocketAdapter] Max reconnection attempts reached');
      this.currentCallbacks?.onError(
        new Error('Connection lost and max reconnection attempts reached'),
      );
      this.clearCurrentTurn();
    }
  }

  private handleError(event: Event): void {
    console.error('[WebSocketAdapter] WebSocket error:', event);
    this.emitDebugEvent('connection.error', {
      phase: 'runtime',
    });
    // Error will be followed by close event, which handles reconnection
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectCount++;
    const delay = Math.min(
      this.reconnectBaseDelay * 2 ** (this.reconnectCount - 1),
      this.reconnectMaxDelay,
    );

    console.log(
      `[WebSocketAdapter] Scheduling reconnect attempt ${this.reconnectCount}/${this.reconnectAttempts} in ${delay}ms`,
    );
    this.emitDebugEvent('connection.reconnect.scheduled', {
      attempt: this.reconnectCount,
      maxAttempts: this.reconnectAttempts,
      delayMs: delay,
    });

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;

      try {
        await this.connect();
        console.log('[WebSocketAdapter] Reconnected successfully');
        this.emitDebugEvent('connection.reconnect.success', {
          attempt: this.reconnectCount,
        });
      } catch (error) {
        console.error('[WebSocketAdapter] Reconnection failed:', error);
        this.emitDebugEvent('connection.reconnect.failure', {
          attempt: this.reconnectCount,
          message: this.errorMessage(error),
        });
        // handleClose will schedule another attempt if needed
      }
    }, delay);
  }

  private clearCurrentTurn(): void {
    this.currentCallbacks = null;
    this.currentTurnId = null;
    this.accumulatedText = '';
    this.accumulatedThinking = '';
  }

  async sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void> {
    // Ensure connection is established
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.init();
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    // Set callbacks for this turn
    this.currentCallbacks = callbacks;
    this.accumulatedText = '';
    this.accumulatedThinking = '';

    // Send user message
    const payload: BridgeSessionWebSocketUserMessage = {
      type: 'user_message',
      content: request.message,
    };
    const message = JSON.stringify(payload);

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      this.emitDebugEvent('message.outbound.user_message', {
        textLength: request.message.length,
      });
    } else {
      // Queue message for when connection is ready
      this.pendingMessages.push(message);
      this.emitDebugEvent('message.outbound.queued', {
        reason: 'socket_not_open',
      });
    }
  }

  cancel(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: BridgeSessionWebSocketCancelMessage = { type: 'cancel' };
      this.ws.send(JSON.stringify(message));
      this.emitDebugEvent('message.outbound.cancel', {});
    }

    this.clearCurrentTurn();
  }

  async updateSessionInfo(sessionInfo: SessionInfoFields): Promise<void> {
    const payload: BridgeSessionWebSocketSessionInfoUpdateMessage = {
      type: 'session.info.update',
      sessionInfo,
    };
    const message = JSON.stringify(payload);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      this.emitDebugEvent('message.outbound.session_info_update', { sessionInfo });
      return;
    }

    this.pendingMessages.push(message);
    this.emitDebugEvent('message.outbound.queued', {
      reason: 'socket_not_open',
      messageType: 'session.info.update',
    });
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

  /**
   * Close the WebSocket connection and clean up
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      // Use code 1000 to prevent reconnection attempts
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.emitDebugEvent('connection.disconnect', {});

    this.clearCurrentTurn();
    this.reconnectCount = 0;
    this.pendingMessages = [];
  }

  getSlashCommands(): SlashCommand[] {
    return [{ name: 'new', description: 'Start a new conversation' }];
  }

  async newSession(): Promise<void> {
    this.disconnect();
  }
}
