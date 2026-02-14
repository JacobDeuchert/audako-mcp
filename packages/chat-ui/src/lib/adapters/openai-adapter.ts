import type { ChatAdapter, ChatRequest, StreamCallbacks } from '../types';

export interface OpenAIAdapterConfig {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  systemPrompt?: string;
}

/**
 * OpenAI-compatible adapter for chat completions API
 * Works with OpenAI, Azure OpenAI, or any OpenAI-compatible endpoint
 */
export class OpenAIAdapter implements ChatAdapter {
  private apiKey: string;
  private apiUrl: string;
  private model: string;
  private systemPrompt: string;
  private abortController: AbortController | null = null;

  constructor(config: OpenAIAdapterConfig = {}) {
    this.apiKey = config.apiKey || '';
    this.apiUrl = config.apiUrl || 'https://api.openai.com/v1/chat/completions';
    this.model = config.model || 'gpt-4';
    this.systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
  }

  /**
   * Initialize the OpenAI adapter
   * For OpenAIAdapter, this is a no-op since authentication happens per-request
   */
  async init(): Promise<void> {
    // Nothing to initialize - authentication is per-request via API key
  }

  async sendMessage(
    request: ChatRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      // Build messages array
      const messages = [
        { role: 'system', content: this.systemPrompt }
      ];

      // Add conversation history
      if (request.conversationHistory) {
        for (const msg of request.conversationHistory) {
          if (msg.from === 'user') {
            messages.push({ role: 'user', content: msg.text });
          } else if (msg.from === 'assistant') {
            messages.push({ role: 'assistant', content: msg.text });
          }
        }
      }

      // Add current message
      messages.push({ role: 'user', content: request.message });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                accumulatedText += content;
                callbacks.onChunk(accumulatedText);
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
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
}
