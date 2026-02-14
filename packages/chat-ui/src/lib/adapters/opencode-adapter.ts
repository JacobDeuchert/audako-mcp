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
}

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
  private client: OpencodeClient | null = null;
  private abortController: AbortController | null = null;
  private eventStream: any = null;
  private currentCallbacks: StreamCallbacks | null = null;
  private currentAssistantMessageId: string | null = null;
  private currentUserMessageId: string | null = null;

  constructor(config: OpenCodeAdapterConfig = {}) {
    this.sessionId = config.sessionId || null;
    this.baseUrl = config.baseUrl || 'http://localhost:4096';
    this.model = config.model
    this.agent = config.agent;
    this.createSession = config.createSession ?? true;
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
    const client = await this.ensureClient();
    
    // Set up event stream listener if not already set up
    if (!this.eventStream) {
      const events = await client.event.subscribe();
      this.eventStream = events.stream;
      
      // Start listening to events in the background
      this.startEventListener();
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

  /**
   * Handle incoming events from the stream
   */
  private handleEvent(event: any): void {
    if (!this.currentCallbacks) return;

    // Check if request was aborted
    if (this.abortController?.signal.aborted) {
      return;
    }

    console.log('Received event:', event);

    // Handle different event types
    if (event.type === 'message.updated') {
      // Track message creation
      const messageId = event.properties?.info?.id;
      const messageRole = event.properties?.info?.role;
      
      if (messageRole === 'user') {
        this.currentUserMessageId = messageId;
        console.log('Tracking user message ID:', messageId);
      } else if (messageRole === 'assistant') {
        this.currentAssistantMessageId = messageId;
        console.log('Tracking assistant message ID:', messageId);
      }

      const isFinished = event.properties?.info?.finish === 'stop';

        if (isFinished && messageRole === 'assistant') {
            console.log('Assistant message finished:', messageId);
            this.currentCallbacks.onComplete();
            this.clearCurrentMessage();
        }

    } else if (event.type === 'message.part.updated') {
      // Streaming part update - only process assistant messages
      const messageId = event.properties?.part?.messageID;
      
      // Only process if this is the assistant's message (not the user's)
      if (messageId === this.currentAssistantMessageId && messageId !== this.currentUserMessageId) {
        console.log('Processing part update for assistant message:', messageId);
        const part = event.properties?.part;
        
        if (part?.type === 'text' && part.text) {
          this.currentCallbacks.onChunk(part.text);
        } else if (part?.type === 'thinking' && part.thinking && this.currentCallbacks.onThinking) {
          this.currentCallbacks.onThinking(part.thinking);
        }
      }
    }
  }

  /**
   * Clear current message tracking
   */
  private clearCurrentMessage(): void {
    this.currentCallbacks = null;
    this.currentAssistantMessageId = null;
    this.currentUserMessageId = null;
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
          title: `Chat ${new Date().toLocaleString()}`
        }
      });

      console.log('Session created:', response);

      if (!response.data?.id) {
        throw new Error('Failed to create session: no session ID returned');
      }

      const newSessionId = response.data.id;
      this.sessionId = newSessionId;
      return newSessionId;
    } catch (error) {
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMessage(
    request: ChatRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const client = await this.ensureClient();
      const sessionId = await this.ensureSession();

      // Ensure event stream is set up
      if (!this.eventStream) {
        await this.init();
      }

      // Set current callbacks for event handling
      this.currentCallbacks = callbacks;

      // Build the parts array for the prompt
      const parts = [
        {
          type: 'text' as const,
          text: request.message
        }
      ];

      console.info('Sending prompt to session:', sessionId, parts, this.model, this.agent);
      
      // Send the prompt - events will handle the response
      await client.session.prompt({
        path: { id: sessionId },
        body: {
          model: this.model,
          agent: this.agent,
          parts
        }
      });
      
      console.log('Prompt sent successfully');
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
      this.clearCurrentMessage();
    } finally {
      this.abortController = null;
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.clearCurrentMessage();
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
