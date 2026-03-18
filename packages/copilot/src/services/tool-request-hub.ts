import type { QuestionAskPayload, QuestionRequest } from '@audako/contracts';
import type { SessionEventHub } from './session-event-hub.js';
import type { SessionRequestHub } from './session-request-hub.js';

export class ToolRequestHub {
  constructor(
    private readonly requestHub: SessionRequestHub,
    private readonly eventHub: SessionEventHub,
    private readonly defaultTimeoutMs: number = 180000,
  ) {}

  async create(sessionId: string, request: QuestionRequest): Promise<unknown> {
    const timeoutMs = this.defaultTimeoutMs;
    const pendingRequest = this.requestHub.create(sessionId, timeoutMs);

    const event = {
      type: 'question.ask' as const,
      sessionId,
      timestamp: new Date().toISOString(),
      payload: {
        questionId: pendingRequest.requestId,
        request,
        expiresAt: pendingRequest.expiresAt,
      } satisfies QuestionAskPayload,
    };

    try {
      this.eventHub.publish(sessionId, event);
    } catch (error) {
      this.requestHub.cancelSession(sessionId);
      throw error;
    }

    const resolution = await pendingRequest.waitForResponse;
    return resolution.response;
  }

  cancel(sessionId: string): void {
    this.requestHub.cancelSession(sessionId);
  }
}
