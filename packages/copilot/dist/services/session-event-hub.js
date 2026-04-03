export class SessionEventHub {
    listeners = new Map();
    subscribe(sessionId, listener) {
        const existing = this.listeners.get(sessionId);
        if (existing) {
            existing.add(listener);
        }
        else {
            this.listeners.set(sessionId, new Set([listener]));
        }
        return () => {
            this.unsubscribe(sessionId, listener);
        };
    }
    unsubscribe(sessionId, listener) {
        const sessionListeners = this.listeners.get(sessionId);
        if (!sessionListeners) {
            return;
        }
        sessionListeners.delete(listener);
        if (sessionListeners.size === 0) {
            this.listeners.delete(sessionId);
        }
    }
    publish(sessionId, event) {
        const sessionListeners = this.listeners.get(sessionId);
        if (!sessionListeners || sessionListeners.size === 0) {
            return 0;
        }
        let delivered = 0;
        for (const listener of sessionListeners) {
            try {
                listener(event);
                delivered += 1;
            }
            catch { }
        }
        return delivered;
    }
    closeSession(sessionId, reason) {
        const listeners = this.listeners.get(sessionId);
        if (!listeners || listeners.size === 0) {
            return;
        }
        const event = {
            type: 'session.closed',
            sessionId,
            timestamp: new Date().toISOString(),
            payload: { reason },
        };
        this.publish(sessionId, event);
        this.listeners.delete(sessionId);
    }
    closeAll(reason = 'server_shutdown') {
        for (const sessionId of this.listeners.keys()) {
            this.closeSession(sessionId, reason);
        }
    }
    getSubscriberCount(sessionId) {
        return this.listeners.get(sessionId)?.size ?? 0;
    }
    getActiveSessions() {
        return Array.from(this.listeners.keys());
    }
}
//# sourceMappingURL=session-event-hub.js.map