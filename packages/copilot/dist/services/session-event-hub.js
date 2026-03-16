const WS_OPEN_STATE = 1;
const WS_CLOSED_STATE = 3;
export class SessionEventHub {
    subscribers = new Map();
    subscribe(sessionId, socket) {
        const existing = this.subscribers.get(sessionId);
        if (existing) {
            existing.add(socket);
            return;
        }
        this.subscribers.set(sessionId, new Set([socket]));
    }
    unsubscribe(sessionId, socket) {
        const sockets = this.subscribers.get(sessionId);
        if (!sockets) {
            return;
        }
        sockets.delete(socket);
        if (sockets.size === 0) {
            this.subscribers.delete(sessionId);
        }
    }
    publish(sessionId, event) {
        const sockets = this.subscribers.get(sessionId);
        if (!sockets || sockets.size === 0) {
            return 0;
        }
        const payload = JSON.stringify(event);
        const staleSockets = [];
        let delivered = 0;
        for (const socket of sockets) {
            if (socket.readyState !== WS_OPEN_STATE) {
                staleSockets.push(socket);
                continue;
            }
            try {
                socket.send(payload);
                delivered += 1;
            }
            catch {
                staleSockets.push(socket);
            }
        }
        for (const socket of staleSockets) {
            this.unsubscribe(sessionId, socket);
        }
        return delivered;
    }
    closeSession(sessionId, reason) {
        const sockets = this.subscribers.get(sessionId);
        if (!sockets || sockets.size === 0) {
            return;
        }
        const event = {
            type: 'session.closed',
            sessionId,
            timestamp: new Date().toISOString(),
            payload: { reason },
        };
        this.publish(sessionId, event);
        for (const socket of sockets) {
            this.tryCloseSocket(socket, reason);
        }
        this.subscribers.delete(sessionId);
    }
    closeAll(reason = 'server_shutdown') {
        for (const sessionId of this.subscribers.keys()) {
            this.closeSession(sessionId, reason);
        }
    }
    getSubscriberCount(sessionId) {
        return this.subscribers.get(sessionId)?.size ?? 0;
    }
    getActiveSessions() {
        return Array.from(this.subscribers.keys());
    }
    tryCloseSocket(socket, reason) {
        if (socket.readyState === WS_CLOSED_STATE) {
            return;
        }
        try {
            socket.close(1000, reason);
        }
        catch {
            return;
        }
    }
}
//# sourceMappingURL=session-event-hub.js.map