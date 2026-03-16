export class ToolRequestHub {
    requestHub;
    eventHub;
    defaultTimeoutMs;
    constructor(requestHub, eventHub, defaultTimeoutMs = 180000) {
        this.requestHub = requestHub;
        this.eventHub = eventHub;
        this.defaultTimeoutMs = defaultTimeoutMs;
    }
    async create(sessionId, request) {
        const timeoutMs = this.defaultTimeoutMs;
        const pendingRequest = this.requestHub.create(sessionId, timeoutMs);
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
            this.requestHub.cancelSession(sessionId);
            throw error;
        }
        const resolution = await pendingRequest.waitForResponse;
        return resolution.response;
    }
    cancel(sessionId) {
        this.requestHub.cancelSession(sessionId);
    }
}
//# sourceMappingURL=tool-request-hub.js.map