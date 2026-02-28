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
    requestHub;
    eventHub;
    defaultTimeoutMs;
    constructor(requestHub, eventHub, defaultTimeoutMs = 180000) {
        this.requestHub = requestHub;
        this.eventHub = eventHub;
        this.defaultTimeoutMs = defaultTimeoutMs;
    }
    /**
     * Create a request and publish it to the session's event hub.
     * Returns a promise that resolves with the user's response.
     */
    async create(sessionId, request) {
        const timeoutMs = this.defaultTimeoutMs;
        const pendingRequest = this.requestHub.create(sessionId, timeoutMs);
        // Build and publish hub.request event
        const event = {
            type: 'hub.request',
            sessionId,
            timestamp: new Date().toISOString(),
            payload: {
                requestId: pendingRequest.requestId,
                requestType: 'question.ask',
                payload: request,
                expiresAt: pendingRequest.expiresAt,
            },
        };
        try {
            this.eventHub.publish(sessionId, event);
        }
        catch (error) {
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
    cancel(sessionId) {
        this.requestHub.cancelSession(sessionId);
    }
}
//# sourceMappingURL=tool-request-hub.js.map