import { describe, expect, it, vi } from 'vitest';
import { evaluateMutationScope, type MutationScopeEntityService } from '../mutation-scope-guard.js';
import { SessionContext } from '../session-context.js';

describe('evaluateMutationScope', () => {
  it('allows mutations when target group is inside session context group', async () => {
    const sessionContext = new SessionContext({
        sessionId: 'test-session-id',
        groupId: 'group-A',
        scadaUrl: 'https://scada.example.com',
        accessToken: 'token-1',
      });

    const entityService: MutationScopeEntityService = {
      getPartialEntityById: vi.fn().mockResolvedValue({
        Name: 'Group A Child',
        Path: ['tenant-root', 'group-A', 'group-A-child'],
      }),
    };

    const result = await evaluateMutationScope(
      {
        contextGroupId: sessionContext.getGroupId(),
        targetGroupId: 'group-A-child',
      },
      entityService,
    );

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.contextGroupId).toBe('group-A');
      expect(result.targetGroupId).toBe('group-A-child');
      expect(result.targetGroupPath).toContain('group-A');
    }
  });

  it('rejects mutations when target group is outside session context group', async () => {
    const sessionContext = new SessionContext({
        sessionId: 'test-session-id',
        groupId: 'group-A',
        scadaUrl: 'https://scada.example.com',
        accessToken: 'token-2',
      });

    const entityService: MutationScopeEntityService = {
      getPartialEntityById: vi.fn().mockResolvedValue({
        Name: 'Group B',
        Path: ['tenant-root', 'group-B'],
      }),
    };

    const result = await evaluateMutationScope(
      {
        contextGroupId: sessionContext.getGroupId(),
        targetGroupId: 'group-B',
      },
      entityService,
    );

    expect(result).toEqual({
      allowed: false,
      reason: 'outside_context_group',
      contextGroupId: 'group-A',
      targetGroupId: 'group-B',
      targetGroupPath: ['tenant-root', 'group-B'],
      targetGroupLabel: 'Group B',
    });
  });
});
