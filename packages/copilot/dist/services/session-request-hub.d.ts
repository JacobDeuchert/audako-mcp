import type { HubRequestSessionEvent, QuestionRequest } from '@audako/contracts';
export type SessionRequestStatus = {
    status: 'pending';
    expiresAt: string;
} | {
    status: 'resolved';
    response: unknown;
    respondedAt: string;
} | {
    status: 'cancelled';
    cancelledAt: string;
    reason: string;
};
export declare class SessionRequestTimeoutError extends Error {
    readonly requestId: string;
    readonly sessionId: string;
    constructor(sessionId: string, requestId: string, timeoutMs: number);
}
export declare class SessionRequestCancelledError extends Error {
    readonly requestId: string;
    readonly reason: string;
    constructor(requestId: string, reason: string);
}
export interface SessionRequestHubEventPublisher {
    publish(sessionId: string, event: HubRequestSessionEvent<QuestionRequest>): unknown;
}
export interface SessionRequestHubOptions {
    eventHub: SessionRequestHubEventPublisher;
    timeoutMs?: number;
}
export declare class SessionRequestHub {
    private readonly pending;
    private readonly statuses;
    private readonly eventHub;
    private readonly timeoutMs;
    constructor(options: SessionRequestHubOptions);
    create(sessionId: string, request: QuestionRequest): Promise<unknown>;
    resolve(requestId: string, response: unknown): boolean;
    cancel(requestId: string): boolean;
    getStatus(requestId: string): SessionRequestStatus | undefined;
}
//# sourceMappingURL=session-request-hub.d.ts.map