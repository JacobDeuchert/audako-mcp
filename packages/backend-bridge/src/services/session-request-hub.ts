import { randomUUID } from 'crypto';
import { pino } from 'pino';

const logger = pino({ name: 'session-request-hub' });

export interface SessionRequestResolution {
  response: unknown;
  respondedAt: string;
}

interface PendingSessionRequest {
  requestId: string;
  sessionId: string;
  expiresAt: string;
  timeoutHandle: NodeJS.Timeout;
  resolve: (resolution: SessionRequestResolution) => void;
  reject: (error: Error) => void;
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
      const entry = this.remove(sessionId, requestId);
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
    const entry = this.remove(sessionId, requestId);
    if (!entry) {
      return { resolved: false };
    }

    const respondedAt = new Date().toISOString();
    entry.resolve({ response, respondedAt });

    return {
      resolved: true,
      respondedAt,
    };
  }

  cancel(sessionId: string, requestId: string, reason: string): boolean {
    const entry = this.remove(sessionId, requestId);
    if (!entry) {
      return false;
    }

    entry.reject(new SessionRequestCancelledError(sessionId, requestId, reason));
    return true;
  }

  discard(sessionId: string, requestId: string): boolean {
    const entry = this.remove(sessionId, requestId);
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

    logger.debug(
      {
        sessionId,
        reason,
      },
      'Cancelled pending session requests',
    );
  }

  cancelAll(reason: string = 'server_shutdown'): void {
    for (const sessionId of [...this.pendingBySession.keys()]) {
      this.cancelSession(sessionId, reason);
    }
  }

  private remove(sessionId: string, requestId: string): PendingSessionRequest | undefined {
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
}
