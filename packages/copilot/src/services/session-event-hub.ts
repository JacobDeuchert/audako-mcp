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

const WS_OPEN_STATE = 1;
const WS_CLOSED_STATE = 3;

/**
 * SessionEventHub manages WebSocket connections per session and broadcasts events.
 */
export class SessionEventHub {
  private readonly subscribers = new Map<string, Set<SessionSocket>>();

  /**
   * Register a WebSocket connection for a session.
   * Multiple connections per session are supported.
   */
  subscribe(sessionId: string, socket: SessionSocket): void {
    const existing = this.subscribers.get(sessionId);
    if (existing) {
      existing.add(socket);
      return;
    }

    this.subscribers.set(sessionId, new Set([socket]));
  }

  /**
   * Remove a specific WebSocket connection from a session.
   * Cleans up the session entry if no connections remain.
   */
  unsubscribe(sessionId: string, socket: SessionSocket): void {
    const sockets = this.subscribers.get(sessionId);
    if (!sockets) {
      return;
    }

    sockets.delete(socket);
    if (sockets.size === 0) {
      this.subscribers.delete(sessionId);
    }
  }

  /**
   * Publish an event to all subscribers for a session.
   * Returns the count of connections that successfully received the event.
   *
   * Automatically removes stale/closed connections during delivery.
   */
  publish(sessionId: string, event: SessionEventEnvelope): number {
    const sockets = this.subscribers.get(sessionId);
    if (!sockets || sockets.size === 0) {
      return 0;
    }

    const payload = JSON.stringify(event);
    const staleSockets: SessionSocket[] = [];
    let delivered = 0;

    for (const socket of sockets) {
      if (socket.readyState !== WS_OPEN_STATE) {
        staleSockets.push(socket);
        continue;
      }

      try {
        socket.send(payload);
        delivered += 1;
      } catch (_error) {
        staleSockets.push(socket);
        // Silently remove failed connections
      }
    }

    // Clean up stale connections
    for (const socket of staleSockets) {
      this.unsubscribe(sessionId, socket);
    }

    return delivered;
  }

  /**
   * Close all WebSocket connections for a session.
   * Sends a 'session.closed' event before terminating connections.
   */
  closeSession(sessionId: string, reason: string): void {
    const sockets = this.subscribers.get(sessionId);
    if (!sockets || sockets.size === 0) {
      return;
    }

    // Notify subscribers before closing
    const event: SessionEventEnvelope<{ reason: string }> = {
      type: 'session.closed',
      sessionId,
      timestamp: new Date().toISOString(),
      payload: { reason },
    };

    this.publish(sessionId, event);

    // Close all connections
    for (const socket of sockets) {
      if (socket.readyState === WS_CLOSED_STATE) {
        continue;
      }

      try {
        socket.close(1000, reason);
      } catch {
        // Ignore close errors for stale sockets
      }
    }

    this.subscribers.delete(sessionId);
  }

  /**
   * Close all sessions with the given reason.
   * Typically used during server shutdown.
   */
  closeAll(reason = 'server_shutdown'): void {
    for (const sessionId of this.subscribers.keys()) {
      this.closeSession(sessionId, reason);
    }
  }

  /**
   * Get the count of active subscribers for a session.
   * Useful for testing and debugging.
   */
  getSubscriberCount(sessionId: string): number {
    return this.subscribers.get(sessionId)?.size ?? 0;
  }

  /**
   * Get all active session IDs.
   * Useful for testing and debugging.
   */
  getActiveSessions(): string[] {
    return Array.from(this.subscribers.keys());
  }
}
