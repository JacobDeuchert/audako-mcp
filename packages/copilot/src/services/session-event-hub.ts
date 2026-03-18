import type { SessionEventEnvelope } from '@audako/contracts';

type SessionListener = (event: SessionEventEnvelope) => void;

export class SessionEventHub {
  private readonly listeners = new Map<string, Set<SessionListener>>();

  subscribe(sessionId: string, listener: SessionListener): () => void {
    const existing = this.listeners.get(sessionId);
    if (existing) {
      existing.add(listener);
    } else {
      this.listeners.set(sessionId, new Set([listener]));
    }

    return () => {
      this.unsubscribe(sessionId, listener);
    };
  }

  unsubscribe(sessionId: string, listener: SessionListener): void {
    const sessionListeners = this.listeners.get(sessionId);
    if (!sessionListeners) {
      return;
    }

    sessionListeners.delete(listener);
    if (sessionListeners.size === 0) {
      this.listeners.delete(sessionId);
    }
  }

  publish(sessionId: string, event: SessionEventEnvelope): number {
    const sessionListeners = this.listeners.get(sessionId);
    if (!sessionListeners || sessionListeners.size === 0) {
      return 0;
    }

    let delivered = 0;

    for (const listener of sessionListeners) {
      try {
        listener(event);
        delivered += 1;
      } catch {}
    }

    return delivered;
  }

  closeSession(sessionId: string, reason: string): void {
    const listeners = this.listeners.get(sessionId);
    if (!listeners || listeners.size === 0) {
      return;
    }

    const event: SessionEventEnvelope<{ reason: string }> = {
      type: 'session.closed',
      sessionId,
      timestamp: new Date().toISOString(),
      payload: { reason },
    };

    this.publish(sessionId, event);

    this.listeners.delete(sessionId);
  }

  closeAll(reason = 'server_shutdown'): void {
    for (const sessionId of this.listeners.keys()) {
      this.closeSession(sessionId, reason);
    }
  }

  getSubscriberCount(sessionId: string): number {
    return this.listeners.get(sessionId)?.size ?? 0;
  }

  getActiveSessions(): string[] {
    return Array.from(this.listeners.keys());
  }
}
