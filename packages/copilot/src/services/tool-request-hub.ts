import type { QuestionRequest } from '@audako/contracts';
import type { SessionEventHub } from './session-event-hub.js';
import type { SessionRequestHub } from './session-request-hub.js';

/**
 * Tool-friendly wrapper around SessionRequestHub.
 *
 * This adapter provides a simpler API for tools that need to ask questions:
 * - Handles event publishing internally
 * - Returns Promise<unknown> for easier tool consumption
 * - Matches the InlineMutationPermissionRequestHub interface
 *
 * Routes should use SessionRequestHub directly for full control.
 */
export class ToolRequestHub {
  constructor(
    private readonly requestHub: SessionRequestHub,
    private readonly eventHub: SessionEventHub,
    private readonly defaultTimeoutMs: number = 180000,
  ) {}

  /**
   * Create a request and publish it to the session's event hub.
   * Returns a promise that resolves with the user's response.
   */
  async create(sessionId: string, request: QuestionRequest): Promise<unknown> {
    const timeoutMs = this.defaultTimeoutMs;
    const pendingRequest = this.requestHub.create(sessionId, timeoutMs);

    // Build and publish hub.request event
    const event = {
      type: 'hub.request' as const,
      sessionId,
      timestamp: new Date().toISOString(),
      payload: {
        requestId: pendingRequest.requestId,
        requestType: 'question.ask' as const,
        payload: request,
        expiresAt: pendingRequest.expiresAt,
      },
    };

    try {
      this.eventHub.publish(sessionId, event);
    } catch (error) {
      // If publishing fails, cancel the pending request
      this.requestHub.cancelSession(sessionId);
      throw error;
    }

    // Wait for response
    const resolution = await pendingRequest.waitForResponse;
    return resolution.response;
  }

  /**
   * Cancel a specific request by ID.
   * Note: The underlying SessionRequestHub doesn't support per-request cancellation,
   * so this cancels all pending requests for the session.
   */
  cancel(sessionId: string): void {
    this.requestHub.cancelSession(sessionId);
  }
}
