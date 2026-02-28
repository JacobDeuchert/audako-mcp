import type { HubRequestSessionEvent, QuestionRequest } from '@audako/contracts';
import { randomUUID } from 'crypto';

const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

export type SessionRequestStatus =
  | { status: 'pending'; expiresAt: string }
  | { status: 'resolved'; response: unknown; respondedAt: string }
  | { status: 'cancelled'; cancelledAt: string; reason: string };

export class SessionRequestTimeoutError extends Error {
  readonly requestId: string;
  readonly sessionId: string;

  constructor(sessionId: string, requestId: string, timeoutMs: number) {
    super(
      `Timed out waiting for response to request ${requestId} in session ${sessionId} after ${timeoutMs}ms`,
    );
    this.name = 'SessionRequestTimeoutError';
    this.requestId = requestId;
    this.sessionId = sessionId;
  }
}

export class SessionRequestCancelledError extends Error {
  readonly requestId: string;
  readonly reason: string;

  constructor(requestId: string, reason: string) {
    super(`Pending request ${requestId} was cancelled (${reason})`);
    this.name = 'SessionRequestCancelledError';
    this.requestId = requestId;
    this.reason = reason;
  }
}

interface PendingRequest {
  sessionId: string;
  requestId: string;
  timeoutHandle: NodeJS.Timeout;
  resolve: (response: unknown) => void;
  reject: (error: Error) => void;
}

export interface SessionRequestHubEventPublisher {
  publish(sessionId: string, event: HubRequestSessionEvent<QuestionRequest>): unknown;
}

export interface SessionRequestHubOptions {
  eventHub: SessionRequestHubEventPublisher;
  timeoutMs?: number;
}

export class SessionRequestHub {
  private readonly pending = new Map<string, PendingRequest>();
  private readonly statuses = new Map<string, SessionRequestStatus>();
  private readonly eventHub: SessionRequestHubEventPublisher;
  private readonly timeoutMs: number;

  constructor(options: SessionRequestHubOptions) {
    this.eventHub = options.eventHub;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  create(sessionId: string, request: QuestionRequest): Promise<unknown> {
    const requestId = randomUUID();
    const expiresAt = new Date(Date.now() + this.timeoutMs).toISOString();

    let resolvePending!: (response: unknown) => void;
    let rejectPending!: (error: Error) => void;

    const waitForResponse = new Promise<unknown>((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });

    const timeoutHandle = setTimeout(() => {
      const entry = this.pending.get(requestId);
      if (!entry) {
        return;
      }

      this.pending.delete(requestId);
      this.statuses.set(requestId, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        reason: 'timeout',
      });
      entry.reject(new SessionRequestTimeoutError(sessionId, requestId, this.timeoutMs));
    }, this.timeoutMs);

    this.pending.set(requestId, {
      sessionId,
      requestId,
      timeoutHandle,
      resolve: resolvePending,
      reject: rejectPending,
    });
    this.statuses.set(requestId, { status: 'pending', expiresAt });

    const event: HubRequestSessionEvent<QuestionRequest> = {
      type: 'hub.request',
      sessionId,
      timestamp: new Date().toISOString(),
      payload: {
        requestId,
        requestType: 'question.ask',
        payload: request,
        expiresAt,
      },
    };

    try {
      this.eventHub.publish(sessionId, event);
    } catch (error) {
      this.pending.delete(requestId);
      clearTimeout(timeoutHandle);

      const reason = error instanceof Error ? error.message : String(error);
      this.statuses.set(requestId, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        reason: `publish_failed:${reason}`,
      });

      rejectPending(new SessionRequestCancelledError(requestId, `publish_failed:${reason}`));
    }

    return waitForResponse;
  }

  resolve(requestId: string, response: unknown): boolean {
    const entry = this.pending.get(requestId);
    if (!entry) {
      return false;
    }

    this.pending.delete(requestId);
    clearTimeout(entry.timeoutHandle);

    this.statuses.set(requestId, {
      status: 'resolved',
      response,
      respondedAt: new Date().toISOString(),
    });

    entry.resolve(response);
    return true;
  }

  cancel(requestId: string): boolean {
    const entry = this.pending.get(requestId);
    if (!entry) {
      return false;
    }

    this.pending.delete(requestId);
    clearTimeout(entry.timeoutHandle);

    this.statuses.set(requestId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      reason: 'cancelled',
    });

    entry.reject(new SessionRequestCancelledError(requestId, 'cancelled'));
    return true;
  }

  getStatus(requestId: string): SessionRequestStatus | undefined {
    return this.statuses.get(requestId);
  }
}
