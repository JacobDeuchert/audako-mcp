/**
 * SessionEventHub - Manages WebSocket connections per session and fans out events.
 *
 * This service:
 * - Manages multiple WS connections per session (subscribers)
 * - Publishes events to all subscribers for a session
 * - Handles stale/closed connections gracefully
 * - Provides session-level connection lifecycle management
 */
import type { SessionEventEnvelope, SessionSocket } from '@audako/contracts';
/**
 * SessionEventHub manages WebSocket connections per session and broadcasts events.
 */
export declare class SessionEventHub {
    private readonly subscribers;
    /**
     * Register a WebSocket connection for a session.
     * Multiple connections per session are supported.
     */
    subscribe(sessionId: string, socket: SessionSocket): void;
    /**
     * Remove a specific WebSocket connection from a session.
     * Cleans up the session entry if no connections remain.
     */
    unsubscribe(sessionId: string, socket: SessionSocket): void;
    /**
     * Publish an event to all subscribers for a session.
     * Returns the count of connections that successfully received the event.
     *
     * Automatically removes stale/closed connections during delivery.
     */
    publish(sessionId: string, event: SessionEventEnvelope): number;
    /**
     * Close all WebSocket connections for a session.
     * Sends a 'session.closed' event before terminating connections.
     */
    closeSession(sessionId: string, reason: string): void;
    /**
     * Close all sessions with the given reason.
     * Typically used during server shutdown.
     */
    closeAll(reason?: string): void;
    /**
     * Get the count of active subscribers for a session.
     * Useful for testing and debugging.
     */
    getSubscriberCount(sessionId: string): number;
    /**
     * Get all active session IDs.
     * Useful for testing and debugging.
     */
    getActiveSessions(): string[];
}
//# sourceMappingURL=session-event-hub.d.ts.map