import { randomUUID } from 'crypto';

export interface SessionRequestResolution {
  response: unknown;
  respondedAt: string;
}

export type SessionRequestStatus =
  | { status: 'pending'; expiresAt: string }
  | { status: 'resolved'; response: unknown; respondedAt: string; expiresAt: string }
  | { status: 'expired' };

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
  readonly sessionId: string;
  readonly reason: string;

  constructor(sessionId: string, requestId: string, reason: string) {
    super(`Pending request ${requestId} for session ${sessionId} was cancelled (${reason})`);
    this.name = 'SessionRequestCancelledError';
    this.requestId = requestId;
    this.sessionId = sessionId;
    this.reason = reason;
  }
}

interface PendingRequest {
  sessionId: string;
  requestId: string;
  expiresAt: string;
  timeoutHandle: NodeJS.Timeout;
  resolve: (resolution: SessionRequestResolution) => void;
  reject: (error: Error) => void;
}

interface ResolvedRequest {
  sessionId: string;
  requestId: string;
  expiresAt: string;
  response: unknown;
  respondedAt: string;
}

/**
 * SessionRequestHub manages request/response events for interactive agent flows.
 *
 * Pattern:
 * 1. Routes call create(sessionId, timeoutMs) to get { requestId, expiresAt, waitForResponse }
 * 2. Routes publish hub.request event with requestId
 * 3. UI responds via resolve endpoint
 * 4. waitForResponse resolves with { response, respondedAt }
 *
 * This matches backend-bridge SessionRequestHub pattern exactly.
 */
export class SessionRequestHub {
  private readonly pendingBySession = new Map<string, Map<string, PendingRequest>>();
  private readonly resolvedBySession = new Map<string, Map<string, ResolvedRequest>>();

  create(
    sessionId: string,
    timeoutMs: number,
  ): {
    requestId: string;
    expiresAt: string;
    waitForResponse: Promise<SessionRequestResolution>;
  } {
    const requestId = randomUUID();
    const expiresAt = new Date(Date.now() + timeoutMs).toISOString();

    let resolvePending!: (resolution: SessionRequestResolution) => void;
    let rejectPending!: (error: Error) => void;

    const waitForResponse = new Promise<SessionRequestResolution>((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });

    const timeoutHandle = setTimeout(() => {
      const entry = this.removePending(sessionId, requestId);
      if (!entry) {
        return;
      }

      entry.reject(new SessionRequestTimeoutError(sessionId, requestId, timeoutMs));
    }, timeoutMs);

    const entry: PendingRequest = {
      sessionId,
      requestId,
      expiresAt,
      timeoutHandle,
      resolve: resolvePending,
      reject: rejectPending,
    };

    const pendingForSession = this.pendingBySession.get(sessionId);
    if (pendingForSession) {
      pendingForSession.set(requestId, entry);
    } else {
      this.pendingBySession.set(sessionId, new Map([[requestId, entry]]));
    }

    return {
      requestId,
      expiresAt,
      waitForResponse,
    };
  }

  resolve(
    sessionId: string,
    requestId: string,
    response: unknown,
  ): { resolved: true; respondedAt: string } | { resolved: false } {
    const entry = this.removePending(sessionId, requestId);
    if (!entry) {
      return { resolved: false };
    }

    const respondedAt = new Date().toISOString();
    entry.resolve({ response, respondedAt });

    // Cache the resolution for polling retrieval
    this.storeResolved(sessionId, {
      sessionId,
      requestId,
      expiresAt: entry.expiresAt,
      response,
      respondedAt,
    });

    return {
      resolved: true,
      respondedAt,
    };
  }

  getStatus(sessionId: string, requestId: string): SessionRequestStatus {
    // Check pending first
    const pending = this.pendingBySession.get(sessionId)?.get(requestId);
    if (pending) {
      return { status: 'pending', expiresAt: pending.expiresAt };
    }

    // Check resolved cache
    const resolved = this.resolvedBySession.get(sessionId)?.get(requestId);
    if (resolved) {
      return {
        status: 'resolved',
        expiresAt: resolved.expiresAt,
        response: resolved.response,
        respondedAt: resolved.respondedAt,
      };
    }

    return { status: 'expired' };
  }

  /**
   * Cancel all pending requests for a session.
   * Used during session cleanup.
   */
  cancelSession(sessionId: string): void {
    const pendingMap = this.pendingBySession.get(sessionId);
    if (!pendingMap) {
      return;
    }

    for (const [requestId, entry] of pendingMap.entries()) {
      clearTimeout(entry.timeoutHandle);
      entry.reject(new SessionRequestCancelledError(sessionId, requestId, 'session_closed'));
    }

    this.pendingBySession.delete(sessionId);
    this.resolvedBySession.delete(sessionId);
  }

  private removePending(sessionId: string, requestId: string): PendingRequest | undefined {
    const pendingMap = this.pendingBySession.get(sessionId);
    if (!pendingMap) {
      return undefined;
    }

    const entry = pendingMap.get(requestId);
    if (!entry) {
      return undefined;
    }

    clearTimeout(entry.timeoutHandle);
    pendingMap.delete(requestId);

    if (pendingMap.size === 0) {
      this.pendingBySession.delete(sessionId);
    }

    return entry;
  }

  private storeResolved(sessionId: string, resolved: ResolvedRequest): void {
    const resolvedMap = this.resolvedBySession.get(sessionId);
    if (resolvedMap) {
      resolvedMap.set(resolved.requestId, resolved);
    } else {
      this.resolvedBySession.set(sessionId, new Map([[resolved.requestId, resolved]]));
    }
  }
}
