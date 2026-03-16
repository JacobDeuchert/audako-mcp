import type { SessionEventEnvelope, SessionSocket } from '@audako/contracts';

const WS_OPEN_STATE = 1;
const WS_CLOSED_STATE = 3;

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
      } catch {
        staleSockets.push(socket);
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
      this.tryCloseSocket(socket, reason);
    }

    this.subscribers.delete(sessionId);
  }

  closeAll(reason = 'server_shutdown'): void {
    for (const sessionId of this.subscribers.keys()) {
      this.closeSession(sessionId, reason);
    }
  }

  getSubscriberCount(sessionId: string): number {
    return this.subscribers.get(sessionId)?.size ?? 0;
  }

  getActiveSessions(): string[] {
    return Array.from(this.subscribers.keys());
  }

  private tryCloseSocket(socket: SessionSocket, reason: string): void {
    if (socket.readyState === WS_CLOSED_STATE) {
      return;
    }

    try {
      socket.close(1000, reason);
    } catch {
      return;
    }
  }
}
