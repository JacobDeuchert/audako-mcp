import { randomUUID } from 'node:crypto';
import { buildSessionEvent } from './session-event-utils.js';
export class ChildSessionManager {
    registry;
    eventHub;
    childSessions = new Map();
    childIdsByParent = new Map();
    parentEventUnsubscribers = new Map();
    removeListenerUnsubscribe;
    constructor(registry, eventHub) {
        this.registry = registry;
        this.eventHub = eventHub;
        this.removeListenerUnsubscribe = this.registry.onSessionRemoved(entry => {
            this.cancelChildSessionsForParent(entry.sessionId, 'parent_session_removed');
        });
    }
    createChildSession(parentSessionId, profileName) {
        if (!this.registry.hasSession(parentSessionId)) {
            throw new Error(`Cannot create child session for unknown parent session: ${parentSessionId}`);
        }
        const runtime = {
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
        }
        else {
            this.childIdsByParent.set(parentSessionId, new Set([runtime.childSessionId]));
            this.registerParentEventListener(parentSessionId);
        }
        this.publish(runtime, 'child_session.created');
        return runtime;
    }
    getChildSession(childSessionId) {
        return this.childSessions.get(childSessionId);
    }
    completeChildSession(childSessionId, result) {
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
    failChildSession(childSessionId, error) {
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
    cancelChildSession(childSessionId) {
        this.cancelChildSessionWithReason(childSessionId, 'cancelled');
    }
    cancelChildSessionsForParent(parentSessionId, reason = 'parent_cancelled') {
        const childIds = this.childIdsByParent.get(parentSessionId);
        if (!childIds) {
            return;
        }
        for (const childSessionId of Array.from(childIds)) {
            this.cancelChildSessionWithReason(childSessionId, reason);
        }
    }
    destroy() {
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
    registerParentEventListener(parentSessionId) {
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
    cancelChildSessionWithReason(childSessionId, reason) {
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
    removeChildSession(childSessionId) {
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
    publish(runtime, type) {
        this.eventHub.publish(runtime.parentSessionId, buildSessionEvent(type, runtime.parentSessionId, {
            childSession: this.snapshot(runtime),
        }));
    }
    snapshot(runtime) {
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
//# sourceMappingURL=child-session-runtime.js.map