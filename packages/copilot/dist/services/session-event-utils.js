export function buildSessionEvent(type, sessionId, payload) {
    return {
        type,
        sessionId,
        timestamp: new Date().toISOString(),
        payload,
    };
}
//# sourceMappingURL=session-event-utils.js.map