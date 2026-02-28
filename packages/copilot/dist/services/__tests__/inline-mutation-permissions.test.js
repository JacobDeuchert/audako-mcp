import { describe, expect, it, vi } from 'vitest';
import { ensureInlineMutationPermission } from '../inline-mutation-permissions.js';
import { MutationPermissions } from '../mutation-permissions.js';
describe('ensureInlineMutationPermission', () => {
    it('prompts for permission on first mutation attempt', async () => {
        const permissionStore = new MutationPermissions();
        const create = vi.fn().mockResolvedValue(['Allow']);
        await ensureInlineMutationPermission({
            sessionId: 'session-1',
            entityType: 'Signal',
            permissionStore,
            sessionRequestHub: { create },
        });
        expect(create).toHaveBeenCalledTimes(1);
        expect(create).toHaveBeenCalledWith('session-1', {
            text: 'Allow mutation of Signal entities?',
            header: 'Mutation Permission',
            options: [
                {
                    label: 'Allow',
                    description: 'Allow mutation operations for this entity type in this session.',
                },
                {
                    label: 'Deny',
                    description: 'Block this mutation operation.',
                },
            ],
        });
    });
    it('grants permission and proceeds when user allows', async () => {
        const permissionStore = new MutationPermissions();
        const create = vi.fn().mockResolvedValue(['Allow']);
        await expect(ensureInlineMutationPermission({
            sessionId: 'session-1',
            entityType: 'Signal',
            permissionStore,
            sessionRequestHub: { create },
        })).resolves.toBeUndefined();
        expect(permissionStore.hasPermission('Signal')).toBe(true);
    });
    it('skips prompt on subsequent mutation for same entity type', async () => {
        const permissionStore = new MutationPermissions();
        const create = vi.fn().mockResolvedValue(['Allow']);
        await ensureInlineMutationPermission({
            sessionId: 'session-1',
            entityType: 'Signal',
            permissionStore,
            sessionRequestHub: { create },
        });
        await ensureInlineMutationPermission({
            sessionId: 'session-1',
            entityType: 'Signal',
            permissionStore,
            sessionRequestHub: { create },
        });
        expect(create).toHaveBeenCalledTimes(1);
    });
    it('prompts independently for different entity types', async () => {
        const permissionStore = new MutationPermissions();
        const create = vi.fn().mockResolvedValue(['Allow']);
        await ensureInlineMutationPermission({
            sessionId: 'session-1',
            entityType: 'Signal',
            permissionStore,
            sessionRequestHub: { create },
        });
        await ensureInlineMutationPermission({
            sessionId: 'session-1',
            entityType: 'Group',
            permissionStore,
            sessionRequestHub: { create },
        });
        expect(create).toHaveBeenCalledTimes(2);
    });
    it('blocks mutation when user denies permission', async () => {
        const permissionStore = new MutationPermissions();
        const create = vi.fn().mockResolvedValue(['Deny']);
        await expect(ensureInlineMutationPermission({
            sessionId: 'session-1',
            entityType: 'Signal',
            permissionStore,
            sessionRequestHub: { create },
        })).rejects.toThrow('Mutation blocked: permission denied for Signal.');
        expect(permissionStore.hasPermission('Signal')).toBe(false);
    });
    it('blocks mutation when prompt times out or fails', async () => {
        const permissionStore = new MutationPermissions();
        const create = vi.fn().mockRejectedValue(new Error('Timed out waiting for answer'));
        await expect(ensureInlineMutationPermission({
            sessionId: 'session-1',
            entityType: 'Signal',
            permissionStore,
            sessionRequestHub: { create },
        })).rejects.toThrow('Mutation permission request failed for Signal: Timed out waiting for answer');
        expect(permissionStore.hasPermission('Signal')).toBe(false);
    });
});
//# sourceMappingURL=inline-mutation-permissions.test.js.map