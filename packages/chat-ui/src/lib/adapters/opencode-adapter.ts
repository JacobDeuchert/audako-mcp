import type { ChatAdapter, ChatRequest, StreamCallbacks } from '../types';
import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk/client';

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

type OpenCodeRequestStatus = 'completed' | 'error' | 'cancelled';

/**
 * OpenCode adapter for connecting to OpenCode server
 * Uses the OpenCode SDK to send messages and receive streaming responses
 */
export class OpenCodeAdapter implements ChatAdapter {
  private sessionId: string | null = null;
  private baseUrl: string;
  private model?: { providerID: string; modelID: string };
  private agent?: string;
  private createSession: boolean;
  private logCombinedEvents: boolean;
  private client: OpencodeClient | null = null;
  private abortController: AbortController | null = null;
  private eventStream: any = null;
  private initPromise: Promise<void> | null = null;
  private currentCallbacks: StreamCallbacks | null = null;
  private currentAssistantMessageId: string | null = null;
  private currentUserMessageId: string | null = null;
  private currentText = '';
  private currentReasoning = '';
  private currentToolThinking = '';
  private toolThinkingEntryKeys = new Set<string>();
  private lastEmittedThinking = '';
  private activeMessageLog: OpenCodeCombinedLogEntry[] = [];
  private lastMessageLog: OpenCodeCombinedLogEntry[] = [];
  private combinedMessageLog: OpenCodeCombinedLogEntry[] = [];

  constructor(config: OpenCodeAdapterConfig = {}) {
    this.sessionId = config.sessionId || null;
    this.baseUrl = config.baseUrl || 'http://localhost:4096';
    this.model = config.model;
    this.agent = config.agent;
    this.createSession = config.createSession ?? true;
    this.logCombinedEvents = config.logCombinedEvents ?? true;
  }

  private async ensureClient() {
    if (!this.client) {
      this.client = createOpencodeClient({
        baseUrl: this.baseUrl,
      });
    }
    return this.client;
  }

  /**
   * Initialize the OpenCode client and set up event listener
   * This can be called proactively to set up the connection before sending messages
   */
  async init(): Promise<void> {
    if (this.eventStream) {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      const client = await this.ensureClient();

      if (this.eventStream) {
        return;
      }

      const events = await client.event.subscribe();
      this.eventStream = events.stream;
      this.startEventListener();
    })();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  async getAgents(): Promise<string[]> {
    const client = await this.ensureClient();
    const agents = await client.app.agents();
    if (!agents.data) {
      throw new Error('Failed to fetch agents: no data returned');
    }
    return agents.data.map(agent => agent.name);
  }

  /**
   * Start the background event listener
   */
  private async startEventListener(): Promise<void> {
    if (!this.eventStream) return;

    try {
      for await (const event of this.eventStream) {
        this.handleEvent(event);
      }
    } catch (error) {
      console.error('Event stream error:', error);
      // Reset event stream on error
      this.eventStream = null;
    }
  }

  private appendCombinedLog(entry: Omit<OpenCodeCombinedLogEntry, 'at'>): void {
    const normalizedEntry: OpenCodeCombinedLogEntry = {
      at: new Date().toISOString(),
      ...entry,
    };

    this.activeMessageLog = [...this.activeMessageLog, normalizedEntry];
    this.combinedMessageLog = [...this.combinedMessageLog, normalizedEntry];
  }

  private startCombinedLog(request: ChatRequest): void {
    this.activeMessageLog = [];
    this.appendCombinedLog({
      category: 'request',
      type: 'sendMessage.started',
      sessionId: this.sessionId ?? undefined,
      text: request.message,
      payload: {
        conversationHistoryLength: request.conversationHistory?.length ?? 0,
      },
    });
  }

  private recordEvent(event: any, ignored = false, reason?: string): void {
    const info = event?.properties?.info;
    const part = event?.properties?.part;
    const eventType = typeof event?.type === 'string' ? event.type : 'unknown';
    const messageId =
      typeof info?.id === 'string'
        ? info.id
        : typeof part?.messageID === 'string'
          ? part.messageID
          : undefined;
    const sessionId =
      typeof info?.sessionID === 'string'
        ? info.sessionID
        : typeof part?.sessionID === 'string'
          ? part.sessionID
          : undefined;
    const role = typeof info?.role === 'string' ? info.role : undefined;
    const partType = typeof part?.type === 'string' ? part.type : undefined;
    const delta = typeof event?.properties?.delta === 'string' ? event.properties.delta : undefined;
    const text =
      typeof part?.text === 'string'
        ? part.text
        : typeof part?.thinking === 'string'
          ? part.thinking
          : undefined;

    this.appendCombinedLog({
      category: 'event',
      type: eventType,
      sessionId,
      messageId,
      role,
      partType,
      delta,
      text,
      ignored,
      reason,
      payload: event,
    });
  }

  private finalizeCombinedLog(status: OpenCodeRequestStatus): void {
    if (this.activeMessageLog.length === 0) {
      return;
    }

    this.appendCombinedLog({
      category: 'state',
      type: 'sendMessage.finished',
      sessionId: this.sessionId ?? undefined,
      messageId: this.currentAssistantMessageId ?? undefined,
      reason: status,
      payload: {
        userMessageId: this.currentUserMessageId,
        assistantMessageId: this.currentAssistantMessageId,
        textLength: this.currentText.length,
        reasoningLength: this.getCombinedThinkingContent().length,
      },
    });

    this.lastMessageLog = [...this.activeMessageLog];

    if (this.logCombinedEvents) {
      console.info('[OpenCodeAdapter] Combined OpenCode message log:', this.lastMessageLog);
    }

    this.activeMessageLog = [];
  }

  /**
   * Handle incoming events from the stream
   */
  private handleEvent(event: any): void {
    if (!this.currentCallbacks) return;

    // Check if request was aborted
    if (this.abortController?.signal.aborted) {
      this.recordEvent(event, true, 'request-aborted');
      return;
    }

    console.log('Received event:', event);

    // Handle different event types
    if (event.type === 'message.updated') {
      // Track message creation
      const messageId = event.properties?.info?.id;
      const messageRole = event.properties?.info?.role;
      const messageSessionId = event.properties?.info?.sessionID;

      // Ignore events from other sessions
      if (this.sessionId && messageSessionId && messageSessionId !== this.sessionId) {
        this.recordEvent(event, true, 'session-mismatch');
        return;
      }

      this.recordEvent(event);

      if (messageRole === 'user') {
        this.currentUserMessageId = messageId;
        console.log('Tracking user message ID:', messageId);
      } else if (messageRole === 'assistant') {
        this.currentAssistantMessageId = messageId;
        console.log('Tracking assistant message ID:', messageId);
      }

      const finishReason = event.properties?.info?.finish;
      const hasCompletedTime = !!event.properties?.info?.time?.completed;
      const isFinished =
        finishReason === 'stop' || (hasCompletedTime && finishReason !== 'tool-calls');

      if (
        isFinished &&
        messageRole === 'assistant' &&
        messageId === this.currentAssistantMessageId
      ) {
        console.log('Assistant message finished:', messageId);
        this.currentCallbacks.onComplete();
        this.clearCurrentMessage('completed');
      }
    } else if (event.type === 'message.part.updated') {
      // Streaming part update - only process assistant messages
      const part = event.properties?.part;
      const messageId = part?.messageID;
      const messageSessionId = part?.sessionID;
      const delta = typeof event.properties?.delta === 'string' ? event.properties.delta : '';

      if (!part) {
        this.recordEvent(event, true, 'missing-part');
        return;
      }

      // Ignore events from other sessions
      if (this.sessionId && messageSessionId && messageSessionId !== this.sessionId) {
        this.recordEvent(event, true, 'session-mismatch');
        return;
      }

      // Assistant message ID can arrive after part updates, so infer it from the first non-user message
      if (!this.currentAssistantMessageId && messageId && messageId !== this.currentUserMessageId) {
        this.currentAssistantMessageId = messageId;
      }

      // Only process if this is the assistant's message (not the user's)
      if (messageId === this.currentAssistantMessageId && messageId !== this.currentUserMessageId) {
        this.recordEvent(event);
        console.log('Processing part update for assistant message:', messageId);

        if (part.type === 'text') {
          this.currentText = this.resolveAccumulatedContent(part.text, delta, this.currentText);
          this.currentCallbacks.onChunk(this.currentText);
        } else if (part.type === 'reasoning' || part.type === 'thinking') {
          const thinkingText =
            typeof part.text === 'string'
              ? part.text
              : typeof part.thinking === 'string'
                ? part.thinking
                : '';

          this.currentReasoning = this.resolveAccumulatedContent(
            thinkingText,
            delta,
            this.currentReasoning,
          );
          this.emitThinkingUpdate();
        } else if (part.type === 'tool') {
          const toolThinkingEntry = this.buildToolThinkingEntry(part);
          if (toolThinkingEntry) {
            this.currentToolThinking = this.currentToolThinking
              ? `${this.currentToolThinking}\n\n${toolThinkingEntry}`
              : toolThinkingEntry;
            this.emitThinkingUpdate();
          }
        }
      } else {
        this.recordEvent(event, true, 'not-assistant-message');
      }
    } else {
      this.recordEvent(event, true, 'unsupported-event-type');
    }
  }

  private resolveAccumulatedContent(content: unknown, delta: string, current: string): string {
    const nextContent = typeof content === 'string' ? content : '';

    if (nextContent) {
      if (nextContent.length >= current.length) {
        return nextContent;
      }

      if (current.startsWith(nextContent)) {
        return current;
      }
    }

    const nextDelta = delta || nextContent;
    if (!nextDelta) {
      return current;
    }

    if (current.endsWith(nextDelta)) {
      return current;
    }

    return current + nextDelta;
  }

  private getCombinedThinkingContent(): string {
    const segments: string[] = [];

    if (this.currentReasoning.trim()) {
      segments.push(this.currentReasoning.trim());
    }

    if (this.currentToolThinking.trim()) {
      segments.push(this.currentToolThinking.trim());
    }

    return segments.join('\n\n');
  }

  private emitThinkingUpdate(): void {
    if (!this.currentCallbacks?.onThinking) {
      return;
    }

    const combinedThinking = this.getCombinedThinkingContent();
    if (!combinedThinking || combinedThinking === this.lastEmittedThinking) {
      return;
    }

    this.lastEmittedThinking = combinedThinking;
    this.currentCallbacks.onThinking(combinedThinking);
  }

  private stringifyToolValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[unserializable tool value]';
      }
    }

    return String(value);
  }

  private formatToolOutput(text: string, maxLength = 4000): string {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}\n... [truncated ${text.length - maxLength} chars]`;
  }

  private buildToolThinkingEntry(part: any): string | null {
    const toolName = typeof part?.tool === 'string' ? part.tool : 'unknown-tool';
    const callID = typeof part?.callID === 'string' ? part.callID : undefined;
    const partID = typeof part?.id === 'string' ? part.id : `${toolName}:${callID ?? 'n/a'}`;
    const state = part?.state ?? {};
    const status = typeof state?.status === 'string' ? state.status : 'unknown';

    const outputText = this.stringifyToolValue(state?.output);
    const signature = `${partID}|${status}|${outputText}`;
    if (this.toolThinkingEntryKeys.has(signature)) {
      return null;
    }

    this.toolThinkingEntryKeys.add(signature);

    const header = `[tool ${status}] ${toolName}${callID ? ` (${callID})` : ''}`;

    if (status === 'completed') {
      if (!outputText) {
        return `${header}\n(no output)`;
      }

      return `${header}\n${this.formatToolOutput(outputText)}`;
    }

    if (status === 'error' || status === 'failed') {
      const errorText = this.stringifyToolValue(state?.error || state?.output || state?.raw);
      if (!errorText) {
        return header;
      }

      return `${header}\n${this.formatToolOutput(errorText)}`;
    }

    return header;
  }

  /**
   * Clear current message tracking
   */
  private clearCurrentMessage(status?: OpenCodeRequestStatus): void {
    if (status) {
      this.finalizeCombinedLog(status);
    }

    this.currentCallbacks = null;
    this.currentAssistantMessageId = null;
    this.currentUserMessageId = null;
    this.currentText = '';
    this.currentReasoning = '';
    this.currentToolThinking = '';
    this.toolThinkingEntryKeys = new Set<string>();
    this.lastEmittedThinking = '';
  }

  private async ensureSession(): Promise<string> {
    console.log('Ensuring session...');
    if (this.sessionId) {
      return this.sessionId;
    }

    if (!this.createSession) {
      throw new Error('No session ID provided and createSession is false');
    }

    const client = await this.ensureClient();

    try {
      const response = await client.session.create({
        body: {
          title: `Chat ${new Date().toLocaleString()}`,
        },
      });

      console.log('Session created:', response);

      if (!response.data?.id) {
        throw new Error('Failed to create session: no session ID returned');
      }

      const newSessionId = response.data.id;
      this.sessionId = newSessionId;
      return newSessionId;
    } catch (error) {
      throw new Error(
        `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendMessage(request: ChatRequest, callbacks: StreamCallbacks): Promise<void> {
    this.abortController = new AbortController();
    this.startCombinedLog(request);

    try {
      const client = await this.ensureClient();
      const sessionId = await this.ensureSession();

      this.appendCombinedLog({
        category: 'state',
        type: 'session.ready',
        sessionId,
        payload: {
          model: this.model,
          agent: this.agent,
        },
      });

      // Ensure event stream is set up
      if (!this.eventStream) {
        await this.init();
      }

      // Set current callbacks for event handling
      this.currentCallbacks = callbacks;
      this.currentAssistantMessageId = null;
      this.currentUserMessageId = null;
      this.currentText = '';
      this.currentReasoning = '';
      this.currentToolThinking = '';
      this.toolThinkingEntryKeys = new Set<string>();
      this.lastEmittedThinking = '';

      // Build the parts array for the prompt
      const parts = [
        {
          type: 'text' as const,
          text: request.message,
        },
      ];

      console.info('Sending prompt to session:', sessionId, parts, this.model, this.agent);
      this.appendCombinedLog({
        category: 'request',
        type: 'session.prompt',
        sessionId,
        payload: {
          model: this.model,
          agent: this.agent,
          parts,
        },
      });

      // Send the prompt - events will handle the response
      await client.session.prompt({
        path: { id: sessionId },
        body: {
          model: this.model,
          agent: this.agent,
          parts,
        },
      });

      console.log('Prompt sent successfully');
      this.appendCombinedLog({
        category: 'state',
        type: 'session.prompt.sent',
        sessionId,
      });
    } catch (error) {
      const wasAborted = this.abortController?.signal.aborted ?? false;

      if (!wasAborted) {
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }

      this.clearCurrentMessage(wasAborted ? 'cancelled' : 'error');
    } finally {
      this.abortController = null;
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.clearCurrentMessage('cancelled');
  }

  /**
   * Returns the most recent per-request combined log.
   */
  getLastCombinedLog(): OpenCodeCombinedLogEntry[] {
    return [...this.lastMessageLog];
  }

  /**
   * Returns a flat combined log of all request entries captured by this adapter instance.
   */
  getCombinedLog(): OpenCodeCombinedLogEntry[] {
    return [...this.combinedMessageLog];
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Set a specific session ID to use
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Clear the current session (will create a new one on next message)
   */
  clearSession(): void {
    this.sessionId = null;
  }
}
