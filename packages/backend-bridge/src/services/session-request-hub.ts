import { randomUUID } from 'crypto';
import { createLogger } from '../config/index.js';

const logger = createLogger('session-request-hub');

/** How long a resolved response is retained for polling retrieval. */
const RESOLVED_RETENTION_MS = 300000; // 5 minutes

export interface SessionRequestResolution {
  response: unknown;
  respondedAt: string;
}

export type SessionRequestStatus =
  | { status: 'pending'; expiresAt: string }
  | { status: 'resolved'; expiresAt: string; response: unknown; respondedAt: string }
  | { status: 'expired' };

interface PendingSessionRequest {
  requestId: string;
  sessionId: string;
  expiresAt: string;
  timeoutHandle: NodeJS.Timeout;
  resolve: (resolution: SessionRequestResolution) => void;
  reject: (error: Error) => void;
}

interface ResolvedSessionRequest {
  requestId: string;
  sessionId: string;
  expiresAt: string;
  response: unknown;
  respondedAt: string;
  retentionHandle: NodeJS.Timeout;
}

export class SessionRequestTimeoutError extends Error {
  readonly sessionId: string;
  readonly requestId: string;

  constructor(sessionId: string, requestId: string, timeoutMs: number) {
    super(
      `Timed out waiting for response to request ${requestId} in session ${sessionId} after ${timeoutMs}ms`,
    );
    this.name = 'SessionRequestTimeoutError';
    this.sessionId = sessionId;
    this.requestId = requestId;
  }
}

export class SessionRequestCancelledError extends Error {
  readonly sessionId: string;
  readonly requestId: string;
  readonly reason: string;

  constructor(sessionId: string, requestId: string, reason: string) {
    super(`Pending request ${requestId} for session ${sessionId} was cancelled (${reason})`);
    this.name = 'SessionRequestCancelledError';
    this.sessionId = sessionId;
    this.requestId = requestId;
    this.reason = reason;
  }
}

export class SessionRequestHub {
  private readonly pendingBySession = new Map<string, Map<string, PendingSessionRequest>>();
  private readonly resolvedBySession = new Map<string, Map<string, ResolvedSessionRequest>>();

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

    const entry: PendingSessionRequest = {
      requestId,
      sessionId,
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

    // Cache the resolution for polling retrieval.
    this.storeResolved(sessionId, {
      requestId,
      sessionId,
      expiresAt: entry.expiresAt,
      response,
      respondedAt,
    });

    return {
      resolved: true,
      respondedAt,
    };
  }

  /**
   * Returns the current status of a request for polling consumers.
   * - `pending`  – still waiting for user response
   * - `resolved` – user responded (includes the answer)
   * - `expired`  – not found (either timed out, cancelled, or never existed)
   */
  getStatus(sessionId: string, requestId: string): SessionRequestStatus {
    // Check pending first.
    const pending = this.pendingBySession.get(sessionId)?.get(requestId);
    if (pending) {
      return { status: 'pending', expiresAt: pending.expiresAt };
    }

    // Check resolved cache.
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

  private cancel(sessionId: string, requestId: string, reason: string): boolean {
    const entry = this.removePending(sessionId, requestId);
    if (!entry) {
      return false;
    }

    entry.reject(new SessionRequestCancelledError(sessionId, requestId, reason));
    return true;
  }

  discard(sessionId: string, requestId: string): boolean {
    const entry = this.removePending(sessionId, requestId);
    return Boolean(entry);
  }

  cancelSession(sessionId: string, reason: string): void {
    const pendingForSession = this.pendingBySession.get(sessionId);
    if (!pendingForSession || pendingForSession.size === 0) {
      return;
    }

    for (const requestId of [...pendingForSession.keys()]) {
      this.cancel(sessionId, requestId, reason);
    }

    logger.debug({ sessionId, reason }, 'Cancelled pending session requests');
  }

  cancelAll(reason: string = 'server_shutdown'): void {
    for (const sessionId of [...this.pendingBySession.keys()]) {
      this.cancelSession(sessionId, reason);
    }
  }

  private removePending(sessionId: string, requestId: string): PendingSessionRequest | undefined {
    const pendingForSession = this.pendingBySession.get(sessionId);
    if (!pendingForSession) {
      return undefined;
    }

    const entry = pendingForSession.get(requestId);
    if (!entry) {
      return undefined;
    }

    clearTimeout(entry.timeoutHandle);
    pendingForSession.delete(requestId);
    if (pendingForSession.size === 0) {
      this.pendingBySession.delete(sessionId);
    }

    return entry;
  }

  private storeResolved(
    sessionId: string,
    resolved: Omit<ResolvedSessionRequest, 'retentionHandle'>,
  ): void {
    const retentionHandle = setTimeout(() => {
      this.removeResolved(sessionId, resolved.requestId);
    }, RESOLVED_RETENTION_MS);

    const entry: ResolvedSessionRequest = { ...resolved, retentionHandle };

    const resolvedForSession = this.resolvedBySession.get(sessionId);
    if (resolvedForSession) {
      resolvedForSession.set(resolved.requestId, entry);
    } else {
      this.resolvedBySession.set(sessionId, new Map([[resolved.requestId, entry]]));
    }
  }

  private removeResolved(sessionId: string, requestId: string): void {
    const resolvedForSession = this.resolvedBySession.get(sessionId);
    if (!resolvedForSession) {
      return;
    }

    const entry = resolvedForSession.get(requestId);
    if (entry) {
      clearTimeout(entry.retentionHandle);
      resolvedForSession.delete(requestId);
    }

    if (resolvedForSession.size === 0) {
      this.resolvedBySession.delete(sessionId);
    }
  }
}
