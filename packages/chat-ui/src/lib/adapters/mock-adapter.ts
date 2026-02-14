import type { ChatAdapter, ChatRequest, StreamCallbacks } from '../types';

/**
 * Mock adapter for testing and development
 * Simulates streaming responses with random delays and optional thinking
 */
export class MockAdapter implements ChatAdapter {
  private abortController: AbortController | null = null;
  private showThinking: boolean;

  constructor(options?: { showThinking?: boolean }) {
    this.showThinking = options?.showThinking ?? false;
  }

  /**
   * Initialize the mock adapter
   * For MockAdapter, this is a no-op since there's no real connection to set up
   */
  async init(): Promise<void> {
    // Nothing to initialize for mock adapter
  }

  async sendMessage(
    _request: ChatRequest,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();

    const fullResponses = [
      "I understand your question. Let me help you with that. First, we need to consider the context of your request. Then, I'll provide you with a detailed explanation that addresses all aspects of your query.",
      "That's an interesting point. Here's what I think about it. Based on the information provided, there are several factors we should analyze. Let me break this down into manageable parts for better understanding.",
      "I'd be happy to assist you with that. Based on what you've asked, I recommend taking a systematic approach. We can explore multiple solutions and find the one that best fits your needs.",
      "Great question! The answer depends on several factors, but generally speaking, the most effective approach would be to first understand the requirements. Then we can proceed with implementing the solution step by step.",
      "I can help you with that. Let me break it down for you step by step. We'll start with the fundamentals and gradually move to more advanced concepts to ensure you have a complete understanding."
    ];

    const thinkingExamples = [
      "Let me analyze this question... The user is asking about a complex topic. I should break this down into clear, logical steps.",
      "Hmm, interesting query. I need to consider multiple angles here: technical feasibility, best practices, and practical application.",
      "First, I'll identify the core problem. Then I'll explore potential solutions and their trade-offs before providing a recommendation.",
      "Let's think through this systematically. What are the key requirements? What constraints do we have? What's the optimal approach?",
      "Breaking down the problem: 1) Understand the context, 2) Identify relevant factors, 3) Formulate a clear, actionable response."
    ];

    try {
      // Simulate thinking phase if enabled
      if (this.showThinking && callbacks.onThinking) {
        const thinkingText = thinkingExamples[Math.floor(Math.random() * thinkingExamples.length)];
        const thinkingWords = thinkingText.split(' ');
        let currentThinking = '';

        for (let i = 0; i < thinkingWords.length; i++) {
          if (this.abortController.signal.aborted) {
            throw new Error('Request cancelled');
          }

          currentThinking += (i > 0 ? ' ' : '') + thinkingWords[i];
          callbacks.onThinking(currentThinking);

          // Faster streaming for thinking
          await new Promise(resolve => setTimeout(resolve, 40 + Math.random() * 40));
        }

        // Small pause after thinking completes
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Stream the actual response
      const fullText = fullResponses[Math.floor(Math.random() * fullResponses.length)];
      const words = fullText.split(' ');
      let currentText = '';

      for (let i = 0; i < words.length; i++) {
        if (this.abortController.signal.aborted) {
          throw new Error('Request cancelled');
        }

        currentText += (i > 0 ? ' ' : '') + words[i];
        callbacks.onChunk(currentText);

        // Random delay between chunks (20-80ms)
        await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 60));
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
