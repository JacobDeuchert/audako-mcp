import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChildSessionManager } from '../../src/services/child-session-runtime.js';
import { SessionEventHub } from '../../src/services/session-event-hub.js';
import { SessionRegistry } from '../../src/services/session-registry.js';

async function createParentSession(registry: SessionRegistry, key: string): Promise<string> {
  const { entry } = await registry.getOrCreateSession(
    `https://example-${key}.audako.dev`,
    `token-${key}`,
    async () => ({
      agent: {} as never,
      agentDestroy: vi.fn(),
      wsEventBridgeUnsubscribe: vi.fn(),
      sessionContext: {} as never,
      audakoServices: {} as never,
    }),
  );

  return entry.sessionId;
}

describe('ChildSessionManager', () => {
  let registry: SessionRegistry;
  let eventHub: SessionEventHub;
  let manager: ChildSessionManager;

  beforeEach(() => {
    registry = new SessionRegistry();
    eventHub = new SessionEventHub();
    manager = new ChildSessionManager(registry, eventHub);
  });

  it('creates child runtime state per parent without affecting other parents', async () => {
    const parentOne = await createParentSession(registry, 'parent-1');
    const parentTwo = await createParentSession(registry, 'parent-2');

    const childOne = manager.createChildSession(parentOne, 'explore');
    const childTwo = manager.createChildSession(parentTwo, 'explore');

    expect(manager.getChildSession(childOne.childSessionId)?.parentSessionId).toBe(parentOne);
    expect(manager.getChildSession(childTwo.childSessionId)?.parentSessionId).toBe(parentTwo);

    manager.completeChildSession(childOne.childSessionId, { ok: true });

    expect(manager.getChildSession(childOne.childSessionId)).toBeUndefined();
    expect(manager.getChildSession(childTwo.childSessionId)).toBeDefined();
    expect(childTwo.abortController.signal.aborted).toBe(false);
  });

  it('cancels child sessions when parent emits prompt.cancel', async () => {
    const parentSessionId = await createParentSession(registry, 'cancel-parent');
    const child = manager.createChildSession(parentSessionId, 'explore');

    eventHub.publish(parentSessionId, {
      type: 'prompt.cancel',
      sessionId: parentSessionId,
      timestamp: new Date().toISOString(),
      payload: { commandId: 'cancel-command' },
    });

    expect(child.abortController.signal.aborted).toBe(true);
    expect(manager.getChildSession(child.childSessionId)).toBeUndefined();
  });

  it('cancels child sessions when parent session is removed', async () => {
    const parentSessionId = await createParentSession(registry, 'remove-parent');
    const child = manager.createChildSession(parentSessionId, 'explore');

    await registry.removeSessionBySessionId(parentSessionId, 'manual');

    expect(child.abortController.signal.aborted).toBe(true);
    expect(manager.getChildSession(child.childSessionId)).toBeUndefined();
  });

  it('emits completion event and removes bookkeeping on child completion', async () => {
    const parentSessionId = await createParentSession(registry, 'complete-child');
    const receivedEvents: string[] = [];
    const completionPayloads: unknown[] = [];

    const unsubscribe = eventHub.subscribe(parentSessionId, event => {
      receivedEvents.push(event.type);
      if (event.type === 'child_session.completed') {
        completionPayloads.push(event.payload);
      }
    });

    const child = manager.createChildSession(parentSessionId, 'explore');
    manager.completeChildSession(child.childSessionId, { summary: 'done' });

    expect(receivedEvents).toContain('child_session.created');
    expect(receivedEvents).toContain('child_session.completed');
    expect(completionPayloads).toHaveLength(1);
    expect(completionPayloads[0]).toMatchObject({
      childSession: {
        childSessionId: child.childSessionId,
        parentSessionId,
        status: 'completed',
        result: { summary: 'done' },
      },
    });
    expect(manager.getChildSession(child.childSessionId)).toBeUndefined();

    unsubscribe();
  });

  it('records failures and clears failed child bookkeeping', async () => {
    const parentSessionId = await createParentSession(registry, 'failed-child');
    const child = manager.createChildSession(parentSessionId, 'explore');

    manager.failChildSession(child.childSessionId, new Error('child failed'));

    expect(manager.getChildSession(child.childSessionId)).toBeUndefined();
  });
});
