import { beforeEach, describe, expect, it } from 'vitest';
import { SessionEventHub, } from '../session-event-hub.js';
function createMockSocket(readyState = 1) {
    return {
        readyState,
        messages: [],
        closed: false,
        send(data) {
            this.messages.push(data);
        },
        close(code, reason) {
            this.closed = true;
            this.closeCode = code;
            this.closeReason = reason;
            this.readyState = 3;
        },
    };
}
function createEvent(type, payload = {}) {
    return {
        type,
        sessionId: 'test-session',
        timestamp: new Date().toISOString(),
        payload,
    };
}
describe('SessionEventHub', () => {
    let hub;
    beforeEach(() => {
        hub = new SessionEventHub();
    });
    describe('subscribe', () => {
        it('registers a single WebSocket connection for a session', () => {
            const socket = createMockSocket();
            hub.subscribe('session-1', socket);
            expect(hub.getSubscriberCount('session-1')).toBe(1);
        });
        it('supports multiple WebSocket connections per session', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            const socket3 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-1', socket2);
            hub.subscribe('session-1', socket3);
            expect(hub.getSubscriberCount('session-1')).toBe(3);
        });
        it('maintains separate subscriber lists for different sessions', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-2', socket2);
            expect(hub.getSubscriberCount('session-1')).toBe(1);
            expect(hub.getSubscriberCount('session-2')).toBe(1);
        });
        it('does not duplicate the same socket instance', () => {
            const socket = createMockSocket();
            hub.subscribe('session-1', socket);
            hub.subscribe('session-1', socket);
            expect(hub.getSubscriberCount('session-1')).toBe(1);
        });
    });
    describe('publish', () => {
        it('sends event to all subscribers for a session', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-1', socket2);
            const event = createEvent('test.event', { message: 'hello' });
            const delivered = hub.publish('session-1', event);
            expect(delivered).toBe(2);
            expect(socket1.messages).toHaveLength(1);
            expect(socket2.messages).toHaveLength(1);
            const parsed1 = JSON.parse(socket1.messages[0]);
            expect(parsed1.type).toBe('test.event');
            expect(parsed1.payload.message).toBe('hello');
        });
        it('returns 0 when session has no subscribers', () => {
            const event = createEvent('test.event');
            const delivered = hub.publish('session-1', event);
            expect(delivered).toBe(0);
        });
        it('does not leak events across sessions', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-2', socket2);
            const event = createEvent('test.event', { sessionId: 'session-1' });
            hub.publish('session-1', event);
            expect(socket1.messages).toHaveLength(1);
            expect(socket2.messages).toHaveLength(0);
        });
        it('skips closed sockets and removes them', () => {
            const socket1 = createMockSocket(1);
            const socket2 = createMockSocket(3);
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-1', socket2);
            const event = createEvent('test.event');
            const delivered = hub.publish('session-1', event);
            expect(delivered).toBe(1);
            expect(socket1.messages).toHaveLength(1);
            expect(socket2.messages).toHaveLength(0);
            expect(hub.getSubscriberCount('session-1')).toBe(1);
        });
        it('removes sockets that throw on send', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            socket2.send = () => {
                throw new Error('Socket error');
            };
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-1', socket2);
            const event = createEvent('test.event');
            const delivered = hub.publish('session-1', event);
            expect(delivered).toBe(1);
            expect(socket1.messages).toHaveLength(1);
            expect(hub.getSubscriberCount('session-1')).toBe(1);
        });
        it('serializes event payload as JSON', () => {
            const socket = createMockSocket();
            hub.subscribe('session-1', socket);
            const event = createEvent('test.event', {
                nested: { data: 123 },
                array: [1, 2, 3],
            });
            hub.publish('session-1', event);
            const parsed = JSON.parse(socket.messages[0]);
            expect(parsed.payload).toEqual({
                nested: { data: 123 },
                array: [1, 2, 3],
            });
        });
    });
    describe('unsubscribe', () => {
        it('removes a specific connection from a session', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-1', socket2);
            hub.unsubscribe('session-1', socket1);
            expect(hub.getSubscriberCount('session-1')).toBe(1);
        });
        it('cleans up session entry when last connection is removed', () => {
            const socket = createMockSocket();
            hub.subscribe('session-1', socket);
            hub.unsubscribe('session-1', socket);
            expect(hub.getActiveSessions()).not.toContain('session-1');
        });
        it('does nothing if session does not exist', () => {
            const socket = createMockSocket();
            expect(() => hub.unsubscribe('nonexistent', socket)).not.toThrow();
        });
        it('does nothing if socket is not subscribed', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            expect(() => hub.unsubscribe('session-1', socket2)).not.toThrow();
            expect(hub.getSubscriberCount('session-1')).toBe(1);
        });
    });
    describe('closeSession', () => {
        it('sends session.closed event before terminating connections', () => {
            const socket = createMockSocket();
            hub.subscribe('session-1', socket);
            hub.closeSession('session-1', 'test_shutdown');
            expect(socket.messages).toHaveLength(1);
            const event = JSON.parse(socket.messages[0]);
            expect(event.type).toBe('session.closed');
            expect(event.payload.reason).toBe('test_shutdown');
        });
        it('closes all WebSocket connections for the session', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-1', socket2);
            hub.closeSession('session-1', 'test_shutdown');
            expect(socket1.closed).toBe(true);
            expect(socket1.closeCode).toBe(1000);
            expect(socket1.closeReason).toBe('test_shutdown');
            expect(socket2.closed).toBe(true);
        });
        it('removes session from active sessions', () => {
            const socket = createMockSocket();
            hub.subscribe('session-1', socket);
            hub.closeSession('session-1', 'test_shutdown');
            expect(hub.getActiveSessions()).not.toContain('session-1');
        });
        it('does nothing if session has no subscribers', () => {
            expect(() => hub.closeSession('nonexistent', 'test')).not.toThrow();
        });
        it('handles already-closed sockets gracefully', () => {
            const socket = createMockSocket(3);
            hub.subscribe('session-1', socket);
            expect(() => hub.closeSession('session-1', 'test')).not.toThrow();
        });
        it('handles close errors gracefully', () => {
            const socket = createMockSocket();
            socket.close = () => {
                throw new Error('Close error');
            };
            hub.subscribe('session-1', socket);
            expect(() => hub.closeSession('session-1', 'test')).not.toThrow();
        });
    });
    describe('closeAll', () => {
        it('closes all sessions with default reason', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-2', socket2);
            hub.closeAll();
            expect(socket1.closed).toBe(true);
            expect(socket1.closeReason).toBe('server_shutdown');
            expect(socket2.closed).toBe(true);
            expect(hub.getActiveSessions()).toHaveLength(0);
        });
        it('closes all sessions with custom reason', () => {
            const socket = createMockSocket();
            hub.subscribe('session-1', socket);
            hub.closeAll('maintenance');
            expect(socket.closeReason).toBe('maintenance');
        });
        it('does nothing when no sessions exist', () => {
            expect(() => hub.closeAll()).not.toThrow();
        });
    });
    describe('getSubscriberCount', () => {
        it('returns 0 for nonexistent session', () => {
            expect(hub.getSubscriberCount('nonexistent')).toBe(0);
        });
        it('returns correct count for active session', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-1', socket2);
            expect(hub.getSubscriberCount('session-1')).toBe(2);
        });
    });
    describe('getActiveSessions', () => {
        it('returns empty array when no sessions exist', () => {
            expect(hub.getActiveSessions()).toEqual([]);
        });
        it('returns all active session IDs', () => {
            const socket1 = createMockSocket();
            const socket2 = createMockSocket();
            hub.subscribe('session-1', socket1);
            hub.subscribe('session-2', socket2);
            const sessions = hub.getActiveSessions();
            expect(sessions).toHaveLength(2);
            expect(sessions).toContain('session-1');
            expect(sessions).toContain('session-2');
        });
    });
});
//# sourceMappingURL=session-event-hub.test.js.map