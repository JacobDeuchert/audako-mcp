import { randomUUID } from 'node:crypto';
import type { SessionEventHub } from './session-event-hub.js';
import { buildSessionEvent } from './session-event-utils.js';
import type { SessionRegistry } from './session-registry.js';

export interface ChildSessionRuntime {
  childSessionId: string;
  parentSessionId: string;
  profileName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: unknown;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  abortController: AbortController;
}

type ChildSessionSnapshot = {
  childSessionId: string;
  parentSessionId: string;
  profileName: string;
  status: ChildSessionRuntime['status'];
  result?: unknown;
  error?: string;
  createdAt: string;
  completedAt?: string;
};

export class ChildSessionManager {
  private readonly childSessions = new Map<string, ChildSessionRuntime>();
  private readonly childIdsByParent = new Map<string, Set<string>>();
  private readonly parentEventUnsubscribers = new Map<string, () => void>();
  private readonly removeListenerUnsubscribe: () => void;

  constructor(
    private readonly registry: SessionRegistry,
    private readonly eventHub: SessionEventHub,
  ) {
    this.removeListenerUnsubscribe = this.registry.onSessionRemoved(entry => {
      this.cancelChildSessionsForParent(entry.sessionId, 'parent_session_removed');
    });
  }

  createChildSession(parentSessionId: string, profileName: string): ChildSessionRuntime {
    if (!this.registry.hasSession(parentSessionId)) {
      throw new Error(`Cannot create child session for unknown parent session: ${parentSessionId}`);
    }

    const runtime: ChildSessionRuntime = {
      childSessionId: randomUUID(),
      parentSessionId,
      profileName,
      status: 'pending',
      createdAt: new Date(),
      abortController: new AbortController(),
    };

    this.childSessions.set(runtime.childSessionId, runtime);

    const childrenForParent = this.childIdsByParent.get(parentSessionId);
    if (childrenForParent) {
      childrenForParent.add(runtime.childSessionId);
    } else {
      this.childIdsByParent.set(parentSessionId, new Set([runtime.childSessionId]));
      this.registerParentEventListener(parentSessionId);
    }

    this.publish(runtime, 'child_session.created');
    return runtime;
  }

  getChildSession(childSessionId: string): ChildSessionRuntime | undefined {
    return this.childSessions.get(childSessionId);
  }

  completeChildSession(childSessionId: string, result: unknown): void {
    const runtime = this.childSessions.get(childSessionId);
    if (!runtime) {
      return;
    }

    runtime.status = 'completed';
    runtime.result = result;
    runtime.completedAt = new Date();

    this.publish(runtime, 'child_session.completed');
    this.removeChildSession(childSessionId);
  }

  failChildSession(childSessionId: string, error: unknown): void {
    const runtime = this.childSessions.get(childSessionId);
    if (!runtime) {
      return;
    }

    runtime.status = 'failed';
    runtime.error = error instanceof Error ? error.message : String(error);
    runtime.completedAt = new Date();

    this.publish(runtime, 'child_session.failed');
    this.removeChildSession(childSessionId);
  }

  cancelChildSession(childSessionId: string): void {
    this.cancelChildSessionWithReason(childSessionId, 'cancelled');
  }

  cancelChildSessionsForParent(parentSessionId: string, reason = 'parent_cancelled'): void {
    const childIds = this.childIdsByParent.get(parentSessionId);
    if (!childIds) {
      return;
    }

    for (const childSessionId of Array.from(childIds)) {
      this.cancelChildSessionWithReason(childSessionId, reason);
    }
  }

  destroy(): void {
    for (const unsubscribe of this.parentEventUnsubscribers.values()) {
      unsubscribe();
    }

    this.parentEventUnsubscribers.clear();

    for (const runtime of this.childSessions.values()) {
      runtime.abortController.abort();
    }

    this.childSessions.clear();
    this.childIdsByParent.clear();
    this.removeListenerUnsubscribe();
  }

  private registerParentEventListener(parentSessionId: string): void {
    if (this.parentEventUnsubscribers.has(parentSessionId)) {
      return;
    }

    const unsubscribe = this.eventHub.subscribe(parentSessionId, event => {
      if (event.type === 'prompt.cancel') {
        this.cancelChildSessionsForParent(parentSessionId, 'parent_cancelled');
        return;
      }

      if (event.type === 'session.closed') {
        this.cancelChildSessionsForParent(parentSessionId, 'parent_session_closed');
      }
    });

    this.parentEventUnsubscribers.set(parentSessionId, unsubscribe);
  }

  private cancelChildSessionWithReason(childSessionId: string, reason: string): void {
    const runtime = this.childSessions.get(childSessionId);
    if (!runtime) {
      return;
    }

    runtime.status = 'cancelled';
    runtime.error = reason;
    runtime.completedAt = new Date();
    runtime.abortController.abort();

    this.publish(runtime, 'child_session.cancelled');
    this.removeChildSession(childSessionId);
  }

  private removeChildSession(childSessionId: string): void {
    const runtime = this.childSessions.get(childSessionId);
    if (!runtime) {
      return;
    }

    this.childSessions.delete(childSessionId);

    const childIdsForParent = this.childIdsByParent.get(runtime.parentSessionId);
    if (!childIdsForParent) {
      return;
    }

    childIdsForParent.delete(childSessionId);
    if (childIdsForParent.size > 0) {
      return;
    }

    this.childIdsByParent.delete(runtime.parentSessionId);
    const unsubscribe = this.parentEventUnsubscribers.get(runtime.parentSessionId);
    if (!unsubscribe) {
      return;
    }

    unsubscribe();
    this.parentEventUnsubscribers.delete(runtime.parentSessionId);
  }

  private publish(runtime: ChildSessionRuntime, type: string): void {
    this.eventHub.publish(
      runtime.parentSessionId,
      buildSessionEvent(type, runtime.parentSessionId, {
        childSession: this.snapshot(runtime),
      }),
    );
  }

  private snapshot(runtime: ChildSessionRuntime): ChildSessionSnapshot {
    return {
      childSessionId: runtime.childSessionId,
      parentSessionId: runtime.parentSessionId,
      profileName: runtime.profileName,
      status: runtime.status,
      result: runtime.result,
      error: runtime.error,
      createdAt: runtime.createdAt.toISOString(),
      completedAt: runtime.completedAt?.toISOString(),
    };
  }
}
