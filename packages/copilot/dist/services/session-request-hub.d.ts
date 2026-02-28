export interface SessionRequestResolution {
    response: unknown;
    respondedAt: string;
}
export type SessionRequestStatus = {
    status: 'pending';
    expiresAt: string;
} | {
    status: 'resolved';
    response: unknown;
    respondedAt: string;
    expiresAt: string;
} | {
    status: 'expired';
};
export declare class SessionRequestTimeoutError extends Error {
    readonly requestId: string;
    readonly sessionId: string;
    constructor(sessionId: string, requestId: string, timeoutMs: number);
}
export declare class SessionRequestCancelledError extends Error {
    readonly requestId: string;
    readonly sessionId: string;
    readonly reason: string;
    constructor(sessionId: string, requestId: string, reason: string);
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
export declare class SessionRequestHub {
    private readonly pendingBySession;
    private readonly resolvedBySession;
    create(sessionId: string, timeoutMs: number): {
        requestId: string;
        expiresAt: string;
        waitForResponse: Promise<SessionRequestResolution>;
    };
    resolve(sessionId: string, requestId: string, response: unknown): {
        resolved: true;
        respondedAt: string;
    } | {
        resolved: false;
    };
    getStatus(sessionId: string, requestId: string): SessionRequestStatus;
    /**
     * Cancel all pending requests for a session.
     * Used during session cleanup.
     */
    cancelSession(sessionId: string): void;
    private removePending;
    private storeResolved;
}
//# sourceMappingURL=session-request-hub.d.ts.map