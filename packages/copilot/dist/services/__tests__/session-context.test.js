import { describe, expect, it } from 'vitest';
import { SessionContext } from '../session-context.js';
describe('SessionContext', () => {
    describe('creation and field access', () => {
        it('should create a context with all fields and return them via getters', () => {
            const context = new SessionContext({
                tenantId: 'tenant-123',
                groupId: 'group-456',
                entityType: 'Signal',
                app: 'production-monitor',
                scadaUrl: 'https://scada.example.com',
                accessToken: 'token-abc-xyz',
            });
            expect(context.getTenantId()).toBe('tenant-123');
            expect(context.getGroupId()).toBe('group-456');
            expect(context.getEntityType()).toBe('Signal');
            expect(context.getApp()).toBe('production-monitor');
            expect(context.getScadaUrl()).toBe('https://scada.example.com');
            expect(context.getAccessToken()).toBe('token-abc-xyz');
        });
        it('should create a context with only required fields (scadaUrl and accessToken)', () => {
            const context = new SessionContext({
                scadaUrl: 'https://scada.example.com',
                accessToken: 'token-123',
            });
            expect(context.getTenantId()).toBeUndefined();
            expect(context.getGroupId()).toBeUndefined();
            expect(context.getEntityType()).toBeUndefined();
            expect(context.getApp()).toBeUndefined();
            expect(context.getScadaUrl()).toBe('https://scada.example.com');
            expect(context.getAccessToken()).toBe('token-123');
        });
        it('should return a snapshot of all fields', () => {
            const context = new SessionContext({
                tenantId: 'tenant-999',
                groupId: 'group-111',
                scadaUrl: 'https://api.scada.dev',
                accessToken: 'secret-token',
            });
            const snapshot = context.getSnapshot();
            expect(snapshot).toEqual({
                tenantId: 'tenant-999',
                groupId: 'group-111',
                entityType: undefined,
                app: undefined,
                scadaUrl: 'https://api.scada.dev',
                accessToken: 'secret-token',
            });
        });
    });
    describe('update method', () => {
        it('should update specific fields while leaving others unchanged', () => {
            const context = new SessionContext({
                tenantId: 'tenant-original',
                groupId: 'group-original',
                entityType: 'Signal',
                app: 'old-app',
                scadaUrl: 'https://scada.example.com',
                accessToken: 'token-original',
            });
            context.update({
                groupId: 'group-updated',
                app: 'new-app',
            });
            expect(context.getTenantId()).toBe('tenant-original');
            expect(context.getGroupId()).toBe('group-updated');
            expect(context.getEntityType()).toBe('Signal');
            expect(context.getApp()).toBe('new-app');
            expect(context.getScadaUrl()).toBe('https://scada.example.com');
            expect(context.getAccessToken()).toBe('token-original');
        });
        it('should handle multiple successive updates correctly', () => {
            const context = new SessionContext({
                scadaUrl: 'https://scada.example.com',
                accessToken: 'token-1',
            });
            context.update({ tenantId: 'tenant-first' });
            expect(context.getTenantId()).toBe('tenant-first');
            context.update({ groupId: 'group-second' });
            expect(context.getTenantId()).toBe('tenant-first');
            expect(context.getGroupId()).toBe('group-second');
            context.update({ tenantId: 'tenant-updated', entityType: 'Group' });
            expect(context.getTenantId()).toBe('tenant-updated');
            expect(context.getGroupId()).toBe('group-second');
            expect(context.getEntityType()).toBe('Group');
        });
        it('should update scadaUrl and accessToken if provided', () => {
            const context = new SessionContext({
                tenantId: 'tenant-123',
                scadaUrl: 'https://old-url.com',
                accessToken: 'old-token',
            });
            context.update({
                scadaUrl: 'https://new-url.com',
                accessToken: 'new-token',
            });
            expect(context.getScadaUrl()).toBe('https://new-url.com');
            expect(context.getAccessToken()).toBe('new-token');
            expect(context.getTenantId()).toBe('tenant-123');
        });
        it('should allow updating fields to undefined (clearing context)', () => {
            const context = new SessionContext({
                tenantId: 'tenant-123',
                groupId: 'group-456',
                scadaUrl: 'https://scada.example.com',
                accessToken: 'token-abc',
            });
            context.update({
                tenantId: undefined,
                groupId: undefined,
            });
            expect(context.getTenantId()).toBeUndefined();
            expect(context.getGroupId()).toBeUndefined();
            expect(context.getScadaUrl()).toBe('https://scada.example.com');
            expect(context.getAccessToken()).toBe('token-abc');
        });
    });
    describe('instance isolation', () => {
        it('should maintain independent context per instance (no cross-contamination)', () => {
            const context1 = new SessionContext({
                tenantId: 'tenant-A',
                groupId: 'group-A',
                scadaUrl: 'https://scada-a.example.com',
                accessToken: 'token-A',
            });
            const context2 = new SessionContext({
                tenantId: 'tenant-B',
                groupId: 'group-B',
                scadaUrl: 'https://scada-b.example.com',
                accessToken: 'token-B',
            });
            context1.update({ groupId: 'group-A-updated' });
            expect(context1.getGroupId()).toBe('group-A-updated');
            expect(context2.getGroupId()).toBe('group-B');
            context2.update({ tenantId: 'tenant-B-updated' });
            expect(context1.getTenantId()).toBe('tenant-A');
            expect(context2.getTenantId()).toBe('tenant-B-updated');
        });
    });
});
//# sourceMappingURL=session-context.test.js.map