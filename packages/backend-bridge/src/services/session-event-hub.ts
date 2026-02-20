import { pino } from 'pino';
import type { SessionEventEnvelope } from '../types/index.js';

const logger = pino({ name: 'session-event-hub' });

const WS_OPEN_STATE = 1;
const WS_CLOSED_STATE = 3;

interface SessionSocket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
}

export class SessionEventHub {
  private readonly subscribers = new Map<string, Set<SessionSocket>>();

  subscribe(sessionId: string, socket: SessionSocket): void {
    const existing = this.subscribers.get(sessionId);
    if (existing) {
      existing.add(socket);
      return;
    }

    this.subscribers.set(sessionId, new Set([socket]));
  }

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
      } catch (error) {
        staleSockets.push(socket);
        logger.debug(
          {
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to send websocket event',
        );
      }
    }

    for (const socket of staleSockets) {
      this.unsubscribe(sessionId, socket);
    }

    return delivered;
  }

  closeSession(sessionId: string, reason: string): void {
    const sockets = this.subscribers.get(sessionId);
    if (!sockets || sockets.size === 0) {
      return;
    }

    const event: SessionEventEnvelope<{ reason: string }> = {
      type: 'session.closed',
      sessionId,
      timestamp: new Date().toISOString(),
      payload: { reason },
    };

    this.publish(sessionId, event);

    for (const socket of sockets) {
      if (socket.readyState === WS_CLOSED_STATE) {
        continue;
      }

      try {
        socket.close(1000, reason);
      } catch {
        // Ignore close errors for stale sockets.
      }
    }

    this.subscribers.delete(sessionId);
  }

  closeAll(reason: string = 'server_shutdown'): void {
    for (const sessionId of this.subscribers.keys()) {
      this.closeSession(sessionId, reason);
    }
  }
}
