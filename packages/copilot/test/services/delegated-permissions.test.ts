import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createSessionAgent: vi.fn(),
}));

vi.mock('../../src/agent/agent-factory.js', () => ({
  createSessionAgent: mocks.createSessionAgent,
}));

import { getProfile } from '../../src/agent/profiles.js';
import type { AudakoServices } from '../../src/services/audako-services.js';
import { ChildSessionExecutor } from '../../src/services/child-session-executor.js';
import { ChildSessionManager } from '../../src/services/child-session-runtime.js';
import { DefaultPermissionService } from '../../src/services/permission-service.js';
import { SessionContext } from '../../src/services/session-context.js';
import { SessionEventHub } from '../../src/services/session-event-hub.js';
import { SessionRegistry } from '../../src/services/session-registry.js';
import type { ToolRequestHub } from '../../src/services/tool-request-hub.js';

interface MockChildAgent {
  prompt: (input: string) => Promise<unknown>;
  subscribe: (listener: (event: unknown) => void) => () => void;
  abort: () => void;
}

async function createParentSession(
  registry: SessionRegistry,
  key: string,
  groupId = 'context-group',
): Promise<string> {
  const { entry } = await registry.getOrCreateSession(
    `https://example-${key}.audako.dev`,
    `token-${key}`,
    async (sessionId: string) => {
      const audakoServices = {
        entityService: {
          getPartialEntityById: vi.fn(async () => ({ Path: ['outside-group'] })),
        },
      } as unknown as AudakoServices;

      const sessionContext = new SessionContext({
        sessionId,
        scadaUrl: `https://example-${key}.audako.dev`,
        accessToken: `token-${key}`,
        groupId,
      });
      sessionContext.bindServices(audakoServices);

      return {
        agent: {} as never,
        agentDestroy: vi.fn(),
        wsEventBridgeUnsubscribe: vi.fn(),
        sessionContext,
        audakoServices,
      };
    },
  );

  return entry.sessionId;
}

function createMockAgent(options?: { throwMessage?: string; pauseMs?: number }): MockChildAgent {
  const listeners = new Set<(event: unknown) => void>();

  return {
    prompt: async () => {
      if (options?.pauseMs) {
        await new Promise(resolve => {
          setTimeout(resolve, options.pauseMs);
        });
      }

      if (options?.throwMessage) {
        throw new Error(options.throwMessage);
      }

      for (const listener of listeners) {
        listener({
          type: 'turn_end',
          message: {
            role: 'assistant',
            stopReason: 'end_turn',
            content: [{ type: 'text', text: 'done' }],
          },
        });
      }
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    abort: vi.fn(),
  };
}

describe('delegated permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows child writes in delegated scope without prompting the user again', async () => {
    const registry = new SessionRegistry();
    const requestHub = {
      create: vi.fn(),
    } as unknown as ToolRequestHub;
    const permissionService = new DefaultPermissionService(registry, requestHub);

    permissionService.grantDelegatedScope('parent-session-1', 'child-session-1', {
      entityTypes: ['Signal'],
      groupIds: ['group-1'],
      grantedAt: new Date().toISOString(),
    });

    await expect(
      permissionService.hasPermission(
        'child-session-1',
        'Signal',
        'group-1',
        'interactive',
        'create_entity',
      ),
    ).resolves.toBe(true);

    expect(permissionService.hasDelegatedPermission('child-session-1', 'Signal', 'group-1')).toBe(
      true,
    );
    expect(requestHub.create).not.toHaveBeenCalled();
  });

  it('blocks child writes outside delegated scope deterministically without prompting', async () => {
    const registry = new SessionRegistry();
    const requestHub = {
      create: vi.fn(),
    } as unknown as ToolRequestHub;
    const permissionService = new DefaultPermissionService(registry, requestHub);

    permissionService.grantDelegatedScope('parent-session-1', 'child-session-1', {
      entityTypes: ['Signal'],
      groupIds: ['group-1'],
      grantedAt: new Date().toISOString(),
    });

    await expect(
      permissionService.hasPermission(
        'child-session-1',
        'Signal',
        'group-2',
        'interactive',
        'update_entity',
      ),
    ).rejects.toThrowError('outside delegated child scope');

    expect(requestHub.create).not.toHaveBeenCalled();
  });

  it('keeps non-child permission prompts and grants behavior unchanged', async () => {
    const registry = new SessionRegistry();
    const requestHub = {
      create: vi.fn(async () => 'Allow'),
    } as unknown as ToolRequestHub;
    const parentSessionId = await createParentSession(registry, 'non-child-permissions');
    const permissionService = new DefaultPermissionService(registry, requestHub);

    await expect(
      permissionService.hasPermission(
        parentSessionId,
        'Signal',
        'outside-group',
        'interactive',
        'update_entity',
      ),
    ).resolves.toBe(true);

    await expect(
      permissionService.hasPermission(
        parentSessionId,
        'Signal',
        'outside-group',
        'fail_fast',
        'update_entity',
      ),
    ).resolves.toBe(true);

    expect(requestHub.create).toHaveBeenCalledTimes(1);
  });

  it('clears delegated scope after child completion, failure, and cancellation', async () => {
    const registry = new SessionRegistry();
    const eventHub = new SessionEventHub();
    const childSessionManager = new ChildSessionManager(registry, eventHub);
    const parentSessionId = await createParentSession(registry, 'executor-cleanup');

    const permissionService = {
      hasPermission: vi.fn(),
      grantDelegatedScope: vi.fn(),
      hasDelegatedPermission: vi.fn(),
      clearDelegatedScope: vi.fn(),
    };

    const executor = new ChildSessionExecutor({
      registry,
      eventHub,
      childSessionManager,
      requestHub: { create: vi.fn() } as unknown as ToolRequestHub,
      permissionService,
    });

    mocks.createSessionAgent.mockResolvedValueOnce({
      agent: createMockAgent(),
      destroy: vi.fn(),
    });
    const completed = await executor.execute({
      parentSessionId,
      description: 'complete run',
      prompt: 'run',
      profile: getProfile('explore'),
      delegatedScope: {
        entityTypes: ['Signal'],
        groupIds: ['group-1'],
        grantedAt: new Date().toISOString(),
      },
    });

    mocks.createSessionAgent.mockResolvedValueOnce({
      agent: createMockAgent({ throwMessage: 'child failed' }),
      destroy: vi.fn(),
    });
    const failed = await executor.execute({
      parentSessionId,
      description: 'failed run',
      prompt: 'run',
      profile: getProfile('explore'),
    });

    mocks.createSessionAgent.mockResolvedValueOnce({
      agent: createMockAgent({ pauseMs: 20 }),
      destroy: vi.fn(),
    });
    const cancelController = new AbortController();
    setTimeout(() => {
      cancelController.abort();
    }, 0);
    const cancelled = await executor.execute({
      parentSessionId,
      description: 'cancelled run',
      prompt: 'run',
      profile: getProfile('explore'),
      abortSignal: cancelController.signal,
    });

    expect(completed.status).toBe('completed');
    expect(failed.status).toBe('failed');
    expect(cancelled.status).toBe('cancelled');

    expect(permissionService.grantDelegatedScope).toHaveBeenCalledTimes(3);
    expect(permissionService.grantDelegatedScope).toHaveBeenNthCalledWith(
      1,
      parentSessionId,
      completed.childSessionId,
      expect.objectContaining({
        entityTypes: ['Signal'],
        groupIds: ['group-1'],
      }),
    );

    expect(permissionService.clearDelegatedScope).toHaveBeenCalledWith(completed.childSessionId);
    expect(permissionService.clearDelegatedScope).toHaveBeenCalledWith(failed.childSessionId);
    expect(permissionService.clearDelegatedScope).toHaveBeenCalledWith(cancelled.childSessionId);
  });
});
