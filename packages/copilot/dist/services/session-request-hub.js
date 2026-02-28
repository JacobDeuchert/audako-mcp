import { randomUUID } from 'crypto';
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;
export class SessionRequestTimeoutError extends Error {
    requestId;
    sessionId;
    constructor(sessionId, requestId, timeoutMs) {
        super(`Timed out waiting for response to request ${requestId} in session ${sessionId} after ${timeoutMs}ms`);
        this.name = 'SessionRequestTimeoutError';
        this.requestId = requestId;
        this.sessionId = sessionId;
    }
}
export class SessionRequestCancelledError extends Error {
    requestId;
    reason;
    constructor(requestId, reason) {
        super(`Pending request ${requestId} was cancelled (${reason})`);
        this.name = 'SessionRequestCancelledError';
        this.requestId = requestId;
        this.reason = reason;
    }
}
export class SessionRequestHub {
    pending = new Map();
    statuses = new Map();
    eventHub;
    timeoutMs;
    constructor(options) {
        this.eventHub = options.eventHub;
        this.timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    }
    create(sessionId, request) {
        const requestId = randomUUID();
        const expiresAt = new Date(Date.now() + this.timeoutMs).toISOString();
        let resolvePending;
        let rejectPending;
        const waitForResponse = new Promise((resolve, reject) => {
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
        const event = {
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
        }
        catch (error) {
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
    resolve(requestId, response) {
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
    cancel(requestId) {
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
    getStatus(requestId) {
        return this.statuses.get(requestId);
    }
}
//# sourceMappingURL=session-request-hub.js.map