import { createHash, randomUUID } from 'crypto';
import { appConfig, createLogger } from '../config/index.js';
import type {
  OpencodeRuntime,
  ServerRegistryEntry,
  SessionInfo,
  SessionInfoFields,
} from '../types/index.js';
import { getErrorMessage } from '../utils.js';
import type { PortAllocator } from './port-allocator.js';

const logger = createLogger('server-registry');

function isAddressInUseError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    if ((error as { code: unknown }).code === 'EADDRINUSE') {
      return true;
    }
  }

  const message = getErrorMessage(error).toLowerCase();
  return message.includes('eaddrinuse') || message.includes('address already in use');
}

export type ServerRemovalReason = 'idle_timeout' | 'manual' | 'server_shutdown';

type ServerRemovedListener = (entry: ServerRegistryEntry, reason: ServerRemovalReason) => void;

export class ServerRegistry {
  private sessionRuntimes: Map<string, ServerRegistryEntry>;
  private sessionToServerKey: Map<string, string>;
  private portAllocator: PortAllocator;
  private maxServers: number;
  private idleTimeout: number; // in milliseconds
  private cleanupInterval?: NodeJS.Timeout;
  private readonly serverRemovedListeners: Set<ServerRemovedListener>;
  private readonly inflight: Map<string, Promise<{ entry: ServerRegistryEntry; isNew: boolean }>>;

  constructor(
    portAllocator: PortAllocator,
    maxServers: number = 50,
    idleTimeout: number = 3600000, // 1 hour default
  ) {
    this.sessionRuntimes = new Map();
    this.sessionToServerKey = new Map();
    this.portAllocator = portAllocator;
    this.maxServers = maxServers;
    this.idleTimeout = idleTimeout;
    this.serverRemovedListeners = new Set();
    this.inflight = new Map();
    logger.info({ maxServers, idleTimeoutMs: idleTimeout }, 'ServerRegistry initialized');
  }

  onServerRemoved(listener: ServerRemovedListener): () => void {
    this.serverRemovedListeners.add(listener);

    return () => {
      this.serverRemovedListeners.delete(listener);
    };
  }

  private notifyServerRemoved(entry: ServerRegistryEntry, reason: ServerRemovalReason): void {
    for (const listener of this.serverRemovedListeners) {
      try {
        listener(entry, reason);
      } catch (error) {
        logger.warn(
          {
            sessionId: entry.sessionId,
            reason,
            error: getErrorMessage(error),
          },
          'Server removed listener failed',
        );
      }
    }
  }

  /**
   * Returns a server entry by session ID
   */
  private getEntryBySessionId(sessionId: string): ServerRegistryEntry | undefined {
    const serverKey = this.sessionToServerKey.get(sessionId);
    if (!serverKey) {
      return undefined;
    }

    const entry = this.sessionRuntimes.get(serverKey);
    if (!entry) {
      this.sessionToServerKey.delete(sessionId);
      return undefined;
    }

    return entry;
  }

  /**
   * Generates a unique key for server lookup based on SCADA URL and access token
   */
  private generateKey(scadaUrl: string, accessToken: string): string {
    const combined = `${scadaUrl}:${accessToken}`;
    return createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Hashes an access token for storage
   */
  private hashToken(accessToken: string): string {
    return createHash('sha256').update(accessToken).digest('hex');
  }

  /**
   * Checks if the registry can accept a new server
   */
  private canCreateNewServer(): boolean {
    return this.sessionRuntimes.size < this.maxServers;
  }

  /**
   * Gets or creates a server for the given credentials.
   * Concurrent requests with the same credentials are coalesced
   * so only one server is ever created per credential pair.
   */
  async getOrCreateServer(
    scadaUrl: string,
    accessToken: string,
    createServerFn: (port: number, sessionId: string) => Promise<OpencodeRuntime>,
  ): Promise<{ entry: ServerRegistryEntry; isNew: boolean }> {
    const key = this.generateKey(scadaUrl, accessToken);

    // Coalesce concurrent requests for the same credentials.
    const inflight = this.inflight.get(key);
    if (inflight) {
      return inflight;
    }

    const promise = this.doGetOrCreateServer(key, scadaUrl, accessToken, createServerFn);
    this.inflight.set(key, promise);

    try {
      return await promise;
    } finally {
      this.inflight.delete(key);
    }
  }

  private async doGetOrCreateServer(
    key: string,
    scadaUrl: string,
    accessToken: string,
    createServerFn: (port: number, sessionId: string) => Promise<OpencodeRuntime>,
  ): Promise<{ entry: ServerRegistryEntry; isNew: boolean }> {
    // Check if server already exists
    const existingEntry = this.sessionRuntimes.get(key);
    if (existingEntry) {
      existingEntry.lastAccessedAt = new Date();
      this.sessionToServerKey.set(existingEntry.sessionId, key);
      logger.info(
        {
          scadaUrl,
          sessionId: existingEntry.sessionId,
          port: existingEntry.port,
          activeSessions: this.sessionRuntimes.size,
        },
        'Reusing existing OpenCode runtime',
      );
      return { entry: existingEntry, isNew: false };
    }

    // Check capacity
    if (!this.canCreateNewServer()) {
      throw new Error(`Maximum server limit reached (${this.maxServers})`);
    }

    const maxAttempts = this.portAllocator.getAvailableCount();
    let lastAddressInUseError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const port = this.portAllocator.allocatePort();
      if (port === null) {
        break;
      }

      const sessionId = randomUUID();

      try {
        const opencodeServer = await createServerFn(port, sessionId);

        const entry: ServerRegistryEntry = {
          sessionId,
          scadaUrl,
          accessToken,
          accessTokenHash: this.hashToken(accessToken),
          opencodeServer,
          opencodeUrl: `${appConfig.opencode.protocol}://${appConfig.opencode.host}:${port}`,
          port,
          createdAt: new Date(),
          lastAccessedAt: new Date(),
          sessionInfo: {},
        };

        this.sessionRuntimes.set(key, entry);
        this.sessionToServerKey.set(sessionId, key);
        logger.info(
          {
            scadaUrl,
            port,
            sessionId,
            activeSessions: this.sessionRuntimes.size,
          },
          'OpenCode runtime created and registered',
        );

        return { entry, isNew: true };
      } catch (error) {
        if (isAddressInUseError(error)) {
          lastAddressInUseError = error;
          logger.warn(
            { scadaUrl, port, sessionId, error: getErrorMessage(error) },
            'Port already in use outside allocator; trying next port',
          );

          // Keep this port reserved to avoid selecting it repeatedly.
          continue;
        }

        this.portAllocator.releasePort(port);
        logger.error(
          { scadaUrl, port, sessionId, error: getErrorMessage(error) },
          'Failed to create OpenCode runtime',
        );
        throw error;
      }
    }

    if (lastAddressInUseError) {
      throw new Error(
        `No available ports in pool. Last runtime startup error: ${getErrorMessage(lastAddressInUseError)}`,
      );
    }

    throw new Error('No available ports in pool');
  }

  /**
   * Removes a server from the registry and cleans up resources
   */
  async removeServer(key: string, reason: ServerRemovalReason = 'manual'): Promise<void> {
    const entry = this.sessionRuntimes.get(key);
    if (!entry) {
      return;
    }

    try {
      entry.opencodeServer.server?.close?.();

      this.sessionRuntimes.delete(key);
      this.sessionToServerKey.delete(entry.sessionId);
      this.portAllocator.releasePort(entry.port);
      this.notifyServerRemoved(entry, reason);

      logger.info(
        {
          scadaUrl: entry.scadaUrl,
          port: entry.port,
          reason,
          activeSessions: this.sessionRuntimes.size,
        },
        'Server removed',
      );
    } catch (error) {
      logger.error({ key, error: getErrorMessage(error) }, 'Error removing server');
    }
  }

  /**
   * Cleans up idle session runtimes not accessed within idle timeout
   */
  cleanupIdleServers(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.sessionRuntimes.entries()) {
      const idleTime = now - entry.lastAccessedAt.getTime();
      if (idleTime > this.idleTimeout) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      void this.removeServer(key, 'idle_timeout');
    }

    if (keysToRemove.length > 0) {
      logger.info({ removedCount: keysToRemove.length }, 'Idle server cleanup completed');
    }
  }

  /**
   * Starts the background cleanup task
   */
  startCleanupTask(intervalMs: number = 900000): void {
    if (this.cleanupInterval) {
      return;
    }

    logger.info({ intervalMs }, 'Starting cleanup task');
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleServers();
    }, intervalMs);
  }

  /**
   * Stops the background cleanup task
   */
  stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Gets all active session runtimes
   */
  getAllServers(): ServerRegistryEntry[] {
    return Array.from(this.sessionRuntimes.values());
  }

  hasSession(sessionId: string): boolean {
    return this.getEntryBySessionId(sessionId) !== undefined;
  }

  getSessionSnapshot(sessionId: string): {
    sessionId: string;
    scadaUrl: string;
    opencodeUrl: string;
    sessionInfo: SessionInfo;
  } | null {
    const entry = this.getEntryBySessionId(sessionId);
    if (!entry) {
      return null;
    }

    entry.lastAccessedAt = new Date();

    return {
      sessionId: entry.sessionId,
      scadaUrl: entry.scadaUrl,
      opencodeUrl: entry.opencodeUrl,
      sessionInfo: { ...entry.sessionInfo },
    };
  }

  /**
   * Gets session info by session ID
   */
  getSessionInfo(sessionId: string): SessionInfo | null {
    const entry = this.getEntryBySessionId(sessionId);
    if (!entry) {
      return null;
    }

    entry.lastAccessedAt = new Date();
    return { ...entry.sessionInfo };
  }

  /**
   * Updates session info for a session
   */
  updateSessionInfo(sessionId: string, update: SessionInfoFields): SessionInfo | null {
    const entry = this.getEntryBySessionId(sessionId);
    if (!entry) {
      return null;
    }

    entry.sessionInfo = {
      tenantId: update.tenantId,
      groupId: update.groupId,
      entityType: update.entityType,
      app: update.app,
      updatedAt: new Date(),
    };

    entry.lastAccessedAt = new Date();
    logger.debug({ sessionId, ...update }, 'Session info updated');

    return { ...entry.sessionInfo };
  }

  /**
   * Gets the count of active session runtimes
   */
  getActiveServerCount(): number {
    return this.sessionRuntimes.size;
  }

  async removeAllServers(reason: ServerRemovalReason = 'server_shutdown'): Promise<void> {
    const keys = Array.from(this.sessionRuntimes.keys());
    for (const key of keys) {
      await this.removeServer(key, reason);
    }
  }
}
