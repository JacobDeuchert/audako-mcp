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
export declare class ToolRequestHub {
    private readonly requestHub;
    private readonly eventHub;
    private readonly defaultTimeoutMs;
    constructor(requestHub: SessionRequestHub, eventHub: SessionEventHub, defaultTimeoutMs?: number);
    /**
     * Create a request and publish it to the session's event hub.
     * Returns a promise that resolves with the user's response.
     */
    create(sessionId: string, request: QuestionRequest): Promise<unknown>;
    /**
     * Cancel a specific request by ID.
     * Note: The underlying SessionRequestHub doesn't support per-request cancellation,
     * so this cancels all pending requests for the session.
     */
    cancel(sessionId: string): void;
}
//# sourceMappingURL=tool-request-hub.d.ts.map