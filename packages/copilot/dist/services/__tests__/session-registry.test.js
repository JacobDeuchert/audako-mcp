import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionContext } from '../session-context.js';
import { SessionRegistry } from '../session-registry.js';
function createMockAgent() {
    return {
        prompt: vi.fn().mockResolvedValue(undefined),
        abort: vi.fn(),
        clearAllQueues: vi.fn(),
        clearMessages: vi.fn(),
        subscribe: vi.fn().mockReturnValue(() => { }),
    };
}
function createMockSessionResources() {
    return {
        agent: createMockAgent(),
        agentDestroy: vi.fn(),
        wsEventBridgeUnsubscribe: vi.fn(),
        sessionContext: new SessionContext({
            sessionId: 'test-session-id',
            scadaUrl: 'https://scada.example.com',
            accessToken: 'token123',
        }),
    };
}
describe('SessionRegistry', () => {
    let registry;
    beforeEach(() => {
        registry = new SessionRegistry(1800000); // 30 minutes
    });
    afterEach(() => {
        registry.stopCleanupTask();
    });
    describe('getOrCreateSession', () => {
        it('creates a new session', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const result = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            expect(result.isNew).toBe(true);
            expect(result.entry.scadaUrl).toBe('https://scada.example.com');
            expect(result.entry.sessionId).toBeTruthy();
            expect(result.sessionToken).toBeTruthy();
            expect(result.sessionToken.length).toBe(64);
            expect(createFn).toHaveBeenCalledOnce();
            expect(createFn).toHaveBeenCalledWith(expect.any(String), // sessionId
            expect.any(String));
        });
        it('reuses existing session for same credentials', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const result1 = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            const result2 = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            expect(result1.entry.sessionId).toBe(result2.entry.sessionId);
            expect(result2.isNew).toBe(false);
            expect(createFn).toHaveBeenCalledOnce(); // Only called for first request
        });
        it('creates separate sessions for different credentials', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const result1 = await registry.getOrCreateSession('https://scada1.example.com', 'token123', createFn);
            const result2 = await registry.getOrCreateSession('https://scada2.example.com', 'token456', createFn);
            expect(result1.entry.sessionId).not.toBe(result2.entry.sessionId);
            expect(result1.isNew).toBe(true);
            expect(result2.isNew).toBe(true);
            expect(createFn).toHaveBeenCalledTimes(2);
        });
        it('coalesces concurrent requests for same credentials', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const [result1, result2, result3] = await Promise.all([
                registry.getOrCreateSession('https://scada.example.com', 'token123', createFn),
                registry.getOrCreateSession('https://scada.example.com', 'token123', createFn),
                registry.getOrCreateSession('https://scada.example.com', 'token123', createFn),
            ]);
            expect(result1.entry.sessionId).toBe(result2.entry.sessionId);
            expect(result2.entry.sessionId).toBe(result3.entry.sessionId);
            expect(createFn).toHaveBeenCalledOnce(); // Only one session created
        });
    });
    describe('verifySessionToken', () => {
        it('verifies valid token', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const { entry, sessionToken } = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            expect(registry.verifySessionToken(entry.sessionId, sessionToken)).toBe(true);
        });
        it('rejects invalid token', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const { entry } = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            expect(registry.verifySessionToken(entry.sessionId, 'wrong-token')).toBe(false);
        });
        it('rejects token for nonexistent session', () => {
            expect(registry.verifySessionToken('nonexistent', 'any-token')).toBe(false);
        });
    });
    describe('hasSession', () => {
        it('returns true for existing session', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const { entry } = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            expect(registry.hasSession(entry.sessionId)).toBe(true);
        });
        it('returns false for nonexistent session', () => {
            expect(registry.hasSession('nonexistent')).toBe(false);
        });
    });
    describe('getSession', () => {
        it('returns session entry', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const { entry } = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            const retrieved = registry.getSession(entry.sessionId);
            expect(retrieved).toBeDefined();
            expect(retrieved.sessionId).toBe(entry.sessionId);
            expect(retrieved.scadaUrl).toBe('https://scada.example.com');
        });
        it('returns undefined for nonexistent session', () => {
            expect(registry.getSession('nonexistent')).toBeUndefined();
        });
        it('updates lastAccessedAt on access', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const { entry } = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            const before = entry.lastAccessedAt.getTime();
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 10));
            registry.getSession(entry.sessionId);
            const retrieved = registry.getSession(entry.sessionId);
            const after = retrieved.lastAccessedAt.getTime();
            expect(after).toBeGreaterThan(before);
        });
    });
    describe('removeSession', () => {
        it('removes session and calls cleanup functions', async () => {
            const resources = createMockSessionResources();
            const createFn = vi.fn().mockResolvedValue(resources);
            const { entry } = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            const key = registry.generateKey('https://scada.example.com', 'token123');
            await registry.removeSession(key);
            expect(resources.agentDestroy).toHaveBeenCalled();
            expect(resources.wsEventBridgeUnsubscribe).toHaveBeenCalled();
            expect(registry.hasSession(entry.sessionId)).toBe(false);
        });
        it('invokes onSessionRemoved listeners', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const listener = vi.fn();
            registry.onSessionRemoved(listener);
            const { entry } = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            const key = registry.generateKey('https://scada.example.com', 'token123');
            await registry.removeSession(key, 'manual');
            expect(listener).toHaveBeenCalledWith(entry, 'manual');
        });
    });
    describe('cleanupIdleSessions', () => {
        it('removes idle sessions', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            // Create registry with very short idle timeout
            const shortRegistry = new SessionRegistry(100); // 100ms
            const { entry } = await shortRegistry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            // Wait for idle timeout
            await new Promise(resolve => setTimeout(resolve, 150));
            shortRegistry.cleanupIdleSessions();
            expect(shortRegistry.hasSession(entry.sessionId)).toBe(false);
            shortRegistry.stopCleanupTask();
        });
        it('keeps active sessions', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            const { entry } = await registry.getOrCreateSession('https://scada.example.com', 'token123', createFn);
            // Access session to keep it active
            registry.getSession(entry.sessionId);
            registry.cleanupIdleSessions();
            expect(registry.hasSession(entry.sessionId)).toBe(true);
        });
    });
    describe('cleanup task', () => {
        it('starts and stops cleanup task', () => {
            registry.startCleanupTask(1000);
            expect(registry.cleanupInterval).toBeDefined();
            registry.stopCleanupTask();
            expect(registry.cleanupInterval).toBeUndefined();
        });
        it('does not start multiple cleanup tasks', () => {
            registry.startCleanupTask(1000);
            const interval1 = registry.cleanupInterval;
            registry.startCleanupTask(1000);
            const interval2 = registry.cleanupInterval;
            expect(interval1).toBe(interval2);
            registry.stopCleanupTask();
        });
    });
    describe('getAllSessions', () => {
        it('returns all sessions', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            await registry.getOrCreateSession('https://scada1.example.com', 'token1', createFn);
            await registry.getOrCreateSession('https://scada2.example.com', 'token2', createFn);
            await registry.getOrCreateSession('https://scada3.example.com', 'token3', createFn);
            const all = registry.getAllSessions();
            expect(all).toHaveLength(3);
        });
        it('returns empty array when no sessions', () => {
            expect(registry.getAllSessions()).toEqual([]);
        });
    });
    describe('getActiveSessionCount', () => {
        it('returns correct count', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            expect(registry.getActiveSessionCount()).toBe(0);
            await registry.getOrCreateSession('https://scada1.example.com', 'token1', createFn);
            expect(registry.getActiveSessionCount()).toBe(1);
            await registry.getOrCreateSession('https://scada2.example.com', 'token2', createFn);
            expect(registry.getActiveSessionCount()).toBe(2);
        });
    });
    describe('removeAllSessions', () => {
        it('removes all sessions', async () => {
            const createFn = vi.fn().mockResolvedValue(createMockSessionResources());
            await registry.getOrCreateSession('https://scada1.example.com', 'token1', createFn);
            await registry.getOrCreateSession('https://scada2.example.com', 'token2', createFn);
            expect(registry.getActiveSessionCount()).toBe(2);
            await registry.removeAllSessions();
            expect(registry.getActiveSessionCount()).toBe(0);
        });
    });
});
//# sourceMappingURL=session-registry.test.js.map