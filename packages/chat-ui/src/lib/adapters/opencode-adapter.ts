import type { ChatAdapter, ChatRequest, StreamCallbacks } from '../types';
import { createOpencodeClient } from '@opencode-ai/sdk/client';

export interface OpenCodeAdapterConfig {
  sessionId?: string;
  baseUrl?: string;
  model?: {
    providerID: string;
    modelID: string;
  };
  createSession?: boolean;
}

/**
 * OpenCode adapter for connecting to OpenCode server
 * Uses the OpenCode SDK to send messages and receive streaming responses
 */
export class OpenCodeAdapter implements ChatAdapter {
  private sessionId: string | null = null;
  private baseUrl: string;
  private model: { providerID: string; modelID: string };
  private createSession: boolean;
  private client: any = null;
  private abortController: AbortController | null = null;

  constructor(config: OpenCodeAdapterConfig = {}) {
    this.sessionId = config.sessionId || null;
    this.baseUrl = config.baseUrl || 'http://localhost:4096';
    this.model = config.model || {
      providerID: 'anthropic',
      modelID: 'claude-3-5-sonnet-20241022'
    };
    this.createSession = config.createSession ?? true;
  }

  private async ensureClient() {
    if (!this.client) {
      // Dynamic import to avoid bundling issues
      
      this.client = createOpencodeClient({
        baseUrl: this.baseUrl,
      });
    }
    return this.client;
  }

  private async ensureSession(): Promise<string> {
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

      // Build the parts array for the prompt
      const parts = [
        {
          type: 'text' as const,
          text: request.message
        }
      ];

      // Send the prompt and get the response
      const response = await client.session.prompt({
        path: { id: sessionId },
        body: {
          model: this.model,
          parts
        }
      });

      // Check if request was aborted
      if (this.abortController.signal.aborted) {
        return;
      }

      // Handle the response
      if (!response.data) {
        throw new Error('No response data received');
      }

      const assistantMessage = response.data;

      // Extract text and thinking content from parts
      let accumulatedText = '';
      let accumulatedThinking = '';

      if (assistantMessage.parts && Array.isArray(assistantMessage.parts)) {
        for (const part of assistantMessage.parts) {
          if (part.type === 'text' && part.text) {
            // Regular text content
            accumulatedText += part.text;
            callbacks.onChunk(accumulatedText);
          } else if (part.type === 'thinking' && part.thinking && callbacks.onThinking) {
            // Thinking/reasoning content
            accumulatedThinking += part.thinking;
            callbacks.onThinking(accumulatedThinking);
          }
        }
      }

      // If we got text from the info object instead
      if (!accumulatedText && assistantMessage.info?.text) {
        accumulatedText = assistantMessage.info.text;
        callbacks.onChunk(accumulatedText);
      }

      callbacks.onComplete();
    } catch (error) {
      if (!this.abortController.signal.aborted) {
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    } finally {
      this.abortController = null;
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
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
