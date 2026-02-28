import type {
  AgentErrorSessionEvent,
  AgentTextDeltaSessionEvent,
  AgentToolEndSessionEvent,
  AgentToolStartSessionEvent,
  AgentTurnEndSessionEvent,
  AgentTurnStartSessionEvent,
  BridgeSessionWebSocketEvent,
  QuestionAskHubRequestEvent,
} from '@audako/contracts/copilot/ws-events';
import type {
  ChatAdapter,
  ChatRequest,
  PublicQuestionHandler,
  PublicQuestionOptions,
  QuestionRequest,
  StreamCallbacks,
} from '../types';

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
export class WebSocketAdapter implements ChatAdapter {
  private websocketUrl: string;
  private sessionToken: string;
  private sessionId: string;
  private bridgeUrl: string;
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

  constructor(config: WebSocketAdapterConfig) {
    this.websocketUrl = config.websocketUrl;
    this.sessionToken = config.sessionToken;
    this.sessionId = config.sessionId;
    this.bridgeUrl = config.bridgeUrl || this.inferBridgeUrl(config.websocketUrl);
    this.reconnectAttempts = config.reconnectAttempts ?? 5;
    this.reconnectBaseDelay = config.reconnectBaseDelay ?? 1000;
    this.reconnectMaxDelay = config.reconnectMaxDelay ?? 30000;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 30000;
  }

  private inferBridgeUrl(websocketUrl: string): string {
    // Convert ws://host:port/path to http://host:port
    // Convert wss://host:port/path to https://host:port
    const url = new URL(websocketUrl);
    const protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    return `${protocol}//${url.host}`;
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
        const wsUrl = `${this.websocketUrl}?token=${encodeURIComponent(this.sessionToken)}`;
        this.ws = new WebSocket(wsUrl);

        const onOpen = () => {
          console.log('[WebSocketAdapter] Connected');
          this.isConnecting = false;
          this.reconnectCount = 0;
          this.startHeartbeat();

          // Send any pending messages
          while (this.pendingMessages.length > 0) {
            const message = this.pendingMessages.shift();
            if (message && this.ws) {
              this.ws.send(message);
            }
          }

          this.ws?.removeEventListener('open', onOpen);
          this.ws?.removeEventListener('error', onError);
          resolve();
        };

        const onError = (event: Event) => {
          console.error('[WebSocketAdapter] Connection error:', event);
          this.isConnecting = false;
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
        reject(error);
      }
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
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
      const data = JSON.parse(event.data);

      // Handle pong response
      if (data.type === 'pong') {
        return;
      }

      // Handle session events
      this.handleSessionEvent(data as BridgeSessionWebSocketEvent);
    } catch (error) {
      console.error('[WebSocketAdapter] Failed to parse message:', error);
    }
  }

  private handleSessionEvent(event: BridgeSessionWebSocketEvent): void {
    if (!this.currentCallbacks) {
      return;
    }

    console.log('[WebSocketAdapter] Received event:', event);

    switch (event.type) {
      case 'agent.text_delta':
        this.handleTextDelta(event as AgentTextDeltaSessionEvent);
        break;
      case 'agent.turn_start':
        this.handleTurnStart(event as AgentTurnStartSessionEvent);
        break;
      case 'agent.turn_end':
        this.handleTurnEnd(event as AgentTurnEndSessionEvent);
        break;
      case 'agent.tool_start':
        this.handleToolStart(event as AgentToolStartSessionEvent);
        break;
      case 'agent.tool_end':
        this.handleToolEnd(event as AgentToolEndSessionEvent);
        break;
      case 'agent.error':
        this.handleAgentError(event as AgentErrorSessionEvent);
        break;
      case 'hub.request':
        this.handleHubRequest(event as QuestionAskHubRequestEvent);
        break;
      default:
        console.log('[WebSocketAdapter] Unhandled event type:', event.type);
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
    const error = new Error(errorMessage);

    if (event.payload.errorCode) {
      (error as any).code = event.payload.errorCode;
    }

    this.currentCallbacks?.onError(error);
    this.clearCurrentTurn();
  }

  private async handleHubRequest(event: QuestionAskHubRequestEvent): Promise<void> {
    if (!this.currentCallbacks?.onQuestion) {
      console.warn('[WebSocketAdapter] Received hub.request but no onQuestion handler registered');
      return;
    }

    const { requestId, requestType, payload: questionPayload } = event.payload;

    if (requestType !== 'question.ask') {
      console.warn('[WebSocketAdapter] Unsupported request type:', requestType);
      return;
    }

    const question = questionPayload as QuestionRequest;

    try {
      const answers = await this.currentCallbacks.onQuestion(question);

      // POST response back to bridge
      const responseUrl = `${this.bridgeUrl}/api/session/${encodeURIComponent(this.sessionId)}/events/request/${encodeURIComponent(requestId)}/response`;

      await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sessionToken}`,
        },
        body: JSON.stringify({ response: answers }),
      });

      console.log('[WebSocketAdapter] Question response posted:', requestId);
    } catch (error) {
      console.error('[WebSocketAdapter] Failed to handle question:', error);
      // Try to post error response
      try {
        const responseUrl = `${this.bridgeUrl}/api/session/${encodeURIComponent(this.sessionId)}/events/request/${encodeURIComponent(requestId)}/response`;
        await fetch(responseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.sessionToken}`,
          },
          body: JSON.stringify({ response: [] }),
        });
      } catch (postError) {
        console.error('[WebSocketAdapter] Failed to post error response:', postError);
      }
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocketAdapter] Connection closed:', event.code, event.reason);
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

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;

      try {
        await this.connect();
        console.log('[WebSocketAdapter] Reconnected successfully');
      } catch (error) {
        console.error('[WebSocketAdapter] Reconnection failed:', error);
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
    const message = JSON.stringify({
      type: 'user_message',
      content: request.message,
    });

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      // Queue message for when connection is ready
      this.pendingMessages.push(message);
    }
  }

  cancel(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'cancel' }));
    }

    this.clearCurrentTurn();
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

    this.clearCurrentTurn();
    this.reconnectCount = 0;
    this.pendingMessages = [];
  }
}
