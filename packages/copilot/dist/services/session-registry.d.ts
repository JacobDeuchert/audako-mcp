import type { Agent } from '@mariozechner/pi-agent-core';
import type { SessionContext } from './session-context.js';
export interface SessionRegistryEntry {
    sessionId: string;
    scadaUrl: string;
    accessToken: string;
    sessionToken: string;
    sessionTokenHash: string;
    agent: Agent;
    agentDestroy: () => void;
    wsEventBridgeUnsubscribe: () => void;
    sessionContext: SessionContext;
    createdAt: Date;
    lastAccessedAt: Date;
}
export type SessionRemovalReason = 'idle_timeout' | 'manual' | 'server_shutdown';
type SessionRemovedListener = (entry: SessionRegistryEntry, reason: SessionRemovalReason) => void;
export declare class SessionRegistry {
    private sessions;
    private sessionIdToKey;
    private idleTimeout;
    private cleanupInterval?;
    private readonly sessionRemovedListeners;
    private readonly inflight;
    constructor(idleTimeout?: number);
    onSessionRemoved(listener: SessionRemovedListener): () => void;
    private notifySessionRemoved;
    private getEntryBySessionId;
    private generateKey;
    private hashToken;
    private generateSessionToken;
    verifySessionToken(sessionId: string, token: string): boolean;
    getOrCreateSession(scadaUrl: string, accessToken: string, createSessionFn: (sessionId: string, sessionToken: string) => Promise<{
        agent: Agent;
        agentDestroy: () => void;
        wsEventBridgeUnsubscribe: () => void;
        sessionContext: SessionContext;
    }>): Promise<{
        entry: SessionRegistryEntry;
        isNew: boolean;
        sessionToken: string;
    }>;
    private doGetOrCreateSession;
    removeSession(key: string, reason?: SessionRemovalReason): Promise<void>;
    cleanupIdleSessions(): void;
    startCleanupTask(intervalMs?: number): void;
    stopCleanupTask(): void;
    getAllSessions(): SessionRegistryEntry[];
    hasSession(sessionId: string): boolean;
    getSession(sessionId: string): SessionRegistryEntry | undefined;
    getActiveSessionCount(): number;
    removeAllSessions(reason?: SessionRemovalReason): Promise<void>;
}
export {};
//# sourceMappingURL=session-registry.d.ts.map