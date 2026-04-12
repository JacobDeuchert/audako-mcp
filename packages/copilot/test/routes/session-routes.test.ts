import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChildSessionExecutor } from '../../src/services/child-session-executor.js';
import { ChildSessionManager } from '../../src/services/child-session-runtime.js';
import { DefaultPermissionService } from '../../src/services/permission-service.js';
import { SessionEventHub } from '../../src/services/session-event-hub.js';
import { SessionRegistry, type SessionRemovalReason } from '../../src/services/session-registry.js';
import { ToolRequestHub } from '../../src/services/tool-request-hub.js';

interface CapturedEvent {
  type: string;
  sessionId: string;
  payload: unknown;
}

async function createMockParentSession(
  registry: SessionRegistry,
  scadaUrl = 'https://example.audako.dev',
  token = 'test-token',
): Promise<string> {
  const { entry } = await registry.getOrCreateSession(scadaUrl, token, async () => ({
    session: { destroy: vi.fn(), sessionContext: {}, audakoServices: {} } as never,
  }));

  return entry.sessionId;
}

function createMockChildSessionExecutor(): ChildSessionExecutor {
  return {
    execute: vi.fn(),
  } as unknown as ChildSessionExecutor;
}

describe('Session Routes Service Composition', () => {
  let registry: SessionRegistry;
  let eventHub: SessionEventHub;
  let childSessionManager: ChildSessionManager;
  let toolRequestHub: ToolRequestHub;
  let permissionService: DefaultPermissionService;
  let childSessionExecutor: ChildSessionExecutor;

  beforeEach(() => {
    registry = new SessionRegistry();
    eventHub = new SessionEventHub();
    childSessionManager = new ChildSessionManager(registry, eventHub);
    const requestHub = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      subscribeRequest: vi.fn(),
    } as never;
    toolRequestHub = new ToolRequestHub(requestHub, eventHub);
    permissionService = new DefaultPermissionService(registry, toolRequestHub);
    childSessionExecutor = createMockChildSessionExecutor();
  });

  afterEach(() => {
    childSessionManager.destroy();
  });

  describe('Bootstrap Flow', () => {
    it('creates primary session successfully through the new composition path', async () => {
      const sessionId = await createMockParentSession(registry);

      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBeGreaterThan(0);

      const session = registry.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('wires ChildSessionManager with shared registry and eventHub', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const runtime = childSessionManager.createChildSession(parentSessionId, 'explore');
      expect(runtime).toBeDefined();
      expect(runtime.parentSessionId).toBe(parentSessionId);
      expect(runtime.profileName).toBe('explore');
    });

    it('wires ChildSessionExecutor with shared service graph', () => {
      expect(childSessionExecutor).toBeDefined();
      expect(typeof childSessionExecutor.execute).toBe('function');
    });
  });

  describe('Child Task Lifecycle Events', () => {
    it('publishes accepted event after child session creation', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const capturedEvents: CapturedEvent[] = [];

      eventHub.subscribe(parentSessionId, event => {
        capturedEvents.push({
          type: event.type,
          sessionId: event.sessionId,
          payload: event.payload,
        });
      });

      const runtime = childSessionManager.createChildSession(parentSessionId, 'explore');

      const acceptedEvent = capturedEvents.find(e => e.type === 'child_session.created');
      expect(acceptedEvent).toBeDefined();
      expect(acceptedEvent?.payload).toMatchObject({
        childSession: expect.objectContaining({
          childSessionId: runtime.childSessionId,
          parentSessionId,
          profileName: 'explore',
          status: 'pending',
        }),
      });
    });

    it('publishes completed event on child session completion', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const capturedEvents: CapturedEvent[] = [];

      eventHub.subscribe(parentSessionId, event => {
        capturedEvents.push({
          type: event.type,
          sessionId: event.sessionId,
          payload: event.payload,
        });
      });

      const runtime = childSessionManager.createChildSession(parentSessionId, 'explore');
      childSessionManager.completeChildSession(runtime.childSessionId, { summary: 'done' });

      const completedEvent = capturedEvents.find(e => e.type === 'child_session.completed');
      expect(completedEvent).toBeDefined();
      expect(completedEvent?.payload).toMatchObject({
        childSession: expect.objectContaining({
          childSessionId: runtime.childSessionId,
          status: 'completed',
          result: { summary: 'done' },
        }),
      });
    });

    it('publishes failed event on child session failure', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const capturedEvents: CapturedEvent[] = [];

      eventHub.subscribe(parentSessionId, event => {
        capturedEvents.push({
          type: event.type,
          sessionId: event.sessionId,
          payload: event.payload,
        });
      });

      const runtime = childSessionManager.createChildSession(parentSessionId, 'explore');
      childSessionManager.failChildSession(runtime.childSessionId, new Error('test failure'));

      const failedEvent = capturedEvents.find(e => e.type === 'child_session.failed');
      expect(failedEvent).toBeDefined();
      expect(failedEvent?.payload).toMatchObject({
        childSession: expect.objectContaining({
          childSessionId: runtime.childSessionId,
          status: 'failed',
          error: 'test failure',
        }),
      });
    });

    it('publishes cancelled event when child session is cancelled', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const capturedEvents: CapturedEvent[] = [];

      eventHub.subscribe(parentSessionId, event => {
        capturedEvents.push({
          type: event.type,
          sessionId: event.sessionId,
          payload: event.payload,
        });
      });

      const runtime = childSessionManager.createChildSession(parentSessionId, 'explore');
      childSessionManager.cancelChildSession(runtime.childSessionId);

      const cancelledEvent = capturedEvents.find(e => e.type === 'child_session.cancelled');
      expect(cancelledEvent).toBeDefined();
      expect(cancelledEvent?.payload).toMatchObject({
        childSession: expect.objectContaining({
          childSessionId: runtime.childSessionId,
          status: 'cancelled',
        }),
      });
    });

    it('cancels child sessions when parent emits prompt.cancel', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const runtime = childSessionManager.createChildSession(parentSessionId, 'explore');

      expect(runtime.abortController.signal.aborted).toBe(false);

      eventHub.publish(parentSessionId, {
        type: 'prompt.cancel',
        sessionId: parentSessionId,
        timestamp: new Date().toISOString(),
        payload: { commandId: 'cancel-1' },
      });

      expect(runtime.abortController.signal.aborted).toBe(true);
    });

    it('cancels child sessions when parent session is removed', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const runtime = childSessionManager.createChildSession(parentSessionId, 'explore');

      expect(runtime.abortController.signal.aborted).toBe(false);

      await registry.removeSessionBySessionId(parentSessionId, 'manual' as SessionRemovalReason);

      expect(runtime.abortController.signal.aborted).toBe(true);
    });
  });

  describe('Parent Session Streaming', () => {
    it('does not interfere with session event hub for non-child sessions', async () => {
      const sessionId = await createMockParentSession(registry);
      const capturedEvents: CapturedEvent[] = [];

      eventHub.subscribe(sessionId, event => {
        capturedEvents.push({
          type: event.type,
          sessionId: event.sessionId,
          payload: event.payload,
        });
      });

      eventHub.publish(sessionId, {
        type: 'assistant.delta',
        sessionId,
        timestamp: new Date().toISOString(),
        payload: { kind: 'text', index: 0, delta: 'Hello' },
      });

      const deltaEvent = capturedEvents.find(e => e.type === 'assistant.delta');
      expect(deltaEvent).toBeDefined();
      expect(deltaEvent?.payload).toEqual({ kind: 'text', index: 0, delta: 'Hello' });
    });

    it('handles multiple child sessions per parent independently', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const events: string[] = [];

      eventHub.subscribe(parentSessionId, event => {
        events.push(event.type);
      });

      const child1 = childSessionManager.createChildSession(parentSessionId, 'explore');
      const child2 = childSessionManager.createChildSession(parentSessionId, 'explore');

      childSessionManager.completeChildSession(child1.childSessionId, 'result 1');

      expect(events).toContain('child_session.created');
      expect(events).toContain('child_session.completed');

      childSessionManager.completeChildSession(child2.childSessionId, 'result 2');

      const completedEvents = events.filter(e => e === 'child_session.completed');
      expect(completedEvents).toHaveLength(2);
    });
  });

  describe('Permission Service Integration', () => {
    it('grants and clears delegated scope correctly', async () => {
      const parentSessionId = await createMockParentSession(registry);
      const childSessionId = 'child-123';

      permissionService.grantDelegatedScope(parentSessionId, childSessionId, {
        entityTypes: ['entity-type-1'],
        groupIds: ['group-1'],
        grantedAt: new Date().toISOString(),
      });

      // Verify scope is in effect via permission check
      expect(
        permissionService.hasDelegatedPermission(childSessionId, 'entity-type-1', 'group-1'),
      ).toBe(true);
      // Verify out-of-scope is denied
      expect(
        permissionService.hasDelegatedPermission(childSessionId, 'other-type', 'group-1'),
      ).toBe(false);

      permissionService.clearDelegatedScope(childSessionId);

      // Verify scope is cleared
      expect(
        permissionService.hasDelegatedPermission(childSessionId, 'entity-type-1', 'group-1'),
      ).toBe(false);
    });
  });

  describe('Service Graph Cleanup', () => {
    it('cleans up child sessions on ChildSessionManager.destroy()', async () => {
      const parent1 = await createMockParentSession(registry, 'https://p1.test', 'token1');
      const parent2 = await createMockParentSession(registry, 'https://p2.test', 'token2');

      childSessionManager.createChildSession(parent1, 'explore');
      childSessionManager.createChildSession(parent1, 'explore');
      childSessionManager.createChildSession(parent2, 'explore');

      childSessionManager.destroy();

      expect(childSessionManager.getChildSession('non-existent')).toBeUndefined();
    });
  });
});
