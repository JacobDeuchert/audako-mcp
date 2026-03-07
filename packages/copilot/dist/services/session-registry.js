import { createHash, randomBytes } from 'node:crypto';
import { createLogger } from '../config/app-config.js';
const logger = createLogger('session-registry');
export class SessionRegistry {
    sessions;
    sessionIdToKey;
    idleTimeout;
    cleanupInterval;
    sessionRemovedListeners;
    inflight;
    constructor(idleTimeout = 1800000) {
        this.sessions = new Map();
        this.sessionIdToKey = new Map();
        this.idleTimeout = idleTimeout;
        this.sessionRemovedListeners = new Set();
        this.inflight = new Map();
        logger.info({ idleTimeoutMs: idleTimeout }, 'SessionRegistry initialized');
    }
    onSessionRemoved(listener) {
        this.sessionRemovedListeners.add(listener);
        return () => {
            this.sessionRemovedListeners.delete(listener);
        };
    }
    notifySessionRemoved(entry, reason) {
        for (const listener of this.sessionRemovedListeners) {
            try {
                listener(entry, reason);
            }
            catch (error) {
                logger.warn({
                    sessionId: entry.sessionId,
                    reason,
                    error: error instanceof Error ? error.message : String(error),
                }, 'Session removed listener failed');
            }
        }
    }
    getEntryBySessionId(sessionId) {
        const key = this.sessionIdToKey.get(sessionId);
        if (!key) {
            return undefined;
        }
        const entry = this.sessions.get(key);
        if (!entry) {
            this.sessionIdToKey.delete(sessionId);
            return undefined;
        }
        return entry;
    }
    generateKey(scadaUrl, accessToken) {
        const combined = `${scadaUrl}:${accessToken}`;
        return createHash('sha256').update(combined).digest('hex');
    }
    hashToken(token) {
        return createHash('sha256').update(token).digest('hex');
    }
    generateSessionToken() {
        return randomBytes(32).toString('hex');
    }
    verifySessionToken(sessionId, token) {
        const entry = this.getEntryBySessionId(sessionId);
        if (!entry) {
            return false;
        }
        const candidateHash = this.hashToken(token);
        return candidateHash === entry.sessionTokenHash;
    }
    async getOrCreateSession(scadaUrl, accessToken, createSessionFn) {
        const key = this.generateKey(scadaUrl, accessToken);
        // Coalesce concurrent requests for the same credentials.
        const inflight = this.inflight.get(key);
        if (inflight) {
            return inflight;
        }
        const promise = this.doGetOrCreateSession(key, scadaUrl, accessToken, createSessionFn);
        this.inflight.set(key, promise);
        try {
            return await promise;
        }
        finally {
            this.inflight.delete(key);
        }
    }
    async doGetOrCreateSession(key, scadaUrl, accessToken, createSessionFn) {
        // Check if session already exists.
        const existingEntry = this.sessions.get(key);
        if (existingEntry) {
            existingEntry.lastAccessedAt = new Date();
            this.sessionIdToKey.set(existingEntry.sessionId, key);
            logger.info({
                scadaUrl,
                sessionId: existingEntry.sessionId,
                activeSessions: this.sessions.size,
            }, 'Reusing existing session');
            return {
                entry: existingEntry,
                isNew: false,
                sessionToken: existingEntry.sessionToken,
            };
        }
        // Create new session
        const sessionId = randomBytes(16).toString('hex');
        const sessionToken = this.generateSessionToken();
        const { agent, agentDestroy, wsEventBridgeUnsubscribe, sessionContext, audakoServices } = await createSessionFn(sessionId, sessionToken);
        const entry = {
            sessionId,
            scadaUrl,
            accessToken,
            sessionToken,
            sessionTokenHash: this.hashToken(sessionToken),
            agent,
            agentDestroy,
            wsEventBridgeUnsubscribe,
            sessionContext,
            audakoServices,
            createdAt: new Date(),
            lastAccessedAt: new Date(),
        };
        this.sessions.set(key, entry);
        this.sessionIdToKey.set(sessionId, key);
        logger.info({
            scadaUrl,
            sessionId,
            activeSessions: this.sessions.size,
        }, 'Session created and registered');
        return { entry, isNew: true, sessionToken };
    }
    async removeSession(key, reason = 'manual') {
        const entry = this.sessions.get(key);
        if (!entry) {
            return;
        }
        try {
            // Cleanup agent resources
            entry.wsEventBridgeUnsubscribe();
            entry.agentDestroy();
            this.sessions.delete(key);
            this.sessionIdToKey.delete(entry.sessionId);
            this.notifySessionRemoved(entry, reason);
            logger.info({
                scadaUrl: entry.scadaUrl,
                sessionId: entry.sessionId,
                reason,
                activeSessions: this.sessions.size,
            }, 'Session removed');
        }
        catch (error) {
            logger.error({ key, error: error instanceof Error ? error.message : String(error) }, 'Error removing session');
        }
    }
    cleanupIdleSessions() {
        const now = Date.now();
        const keysToRemove = [];
        for (const [key, entry] of this.sessions.entries()) {
            const idleTime = now - entry.lastAccessedAt.getTime();
            if (idleTime > this.idleTimeout) {
                keysToRemove.push(key);
            }
        }
        for (const key of keysToRemove) {
            void this.removeSession(key, 'idle_timeout');
        }
        if (keysToRemove.length > 0) {
            logger.info({ removedCount: keysToRemove.length }, 'Idle session cleanup completed');
        }
    }
    startCleanupTask(intervalMs = 900000) {
        if (this.cleanupInterval) {
            return;
        }
        logger.info({ intervalMs }, 'Starting cleanup task');
        this.cleanupInterval = setInterval(() => {
            this.cleanupIdleSessions();
        }, intervalMs);
    }
    stopCleanupTask() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
    }
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    hasSession(sessionId) {
        return this.getEntryBySessionId(sessionId) !== undefined;
    }
    getSession(sessionId) {
        const entry = this.getEntryBySessionId(sessionId);
        if (entry) {
            entry.lastAccessedAt = new Date();
        }
        return entry;
    }
    getActiveSessionCount() {
        return this.sessions.size;
    }
    async removeAllSessions(reason = 'server_shutdown') {
        const keys = Array.from(this.sessions.keys());
        for (const key of keys) {
            await this.removeSession(key, reason);
        }
    }
}
//# sourceMappingURL=session-registry.js.map