import { createHash, randomUUID } from 'crypto';
import { pino } from 'pino';
import type { ServerRegistryEntry, SessionInfo, SessionInfoUpdateRequest } from '../types/index.js';
import { PortAllocator } from './port-allocator.js';

const logger = pino({ name: 'server-registry' });

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return String(error);
}

function isAddressInUseError(error: unknown): boolean {
  if (typeof error === 'string') {
    const normalized = error.toLowerCase();
    return (
      normalized.includes('eaddrinuse') ||
      normalized.includes('address already in use') ||
      normalized.includes('port is already in use')
    );
  }

  if (error && typeof error === 'object') {
    const maybeCode = 'code' in error ? (error as { code?: unknown }).code : undefined;
    if (maybeCode === 'EADDRINUSE') {
      return true;
    }

    const maybeMessage = 'message' in error ? (error as { message?: unknown }).message : undefined;
    if (typeof maybeMessage === 'string') {
      const normalized = maybeMessage.toLowerCase();
      return (
        normalized.includes('eaddrinuse') ||
        normalized.includes('address already in use') ||
        normalized.includes('port is already in use')
      );
    }
  }

  return false;
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
            error: error instanceof Error ? error.message : String(error),
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
   * @param scadaUrl - SCADA system URL
   * @param accessToken - Access token for SCADA system
   * @returns SHA-256 hash key
   */
  private generateKey(scadaUrl: string, accessToken: string): string {
    const combined = `${scadaUrl}:${accessToken}`;
    return createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Hashes an access token for storage
   * @param accessToken - Access token to hash
   * @returns SHA-256 hash of the token
   */
  private hashToken(accessToken: string): string {
    return createHash('sha256').update(accessToken).digest('hex');
  }

  /**
   * Checks if the registry can accept a new server
   * @returns true if a new server can be created
   */
  canCreateNewServer(): boolean {
    return this.sessionRuntimes.size < this.maxServers;
  }

  /**
   * Gets or creates a server for the given credentials
   * @param scadaUrl - SCADA system URL
   * @param accessToken - Access token
   * @param model - Optional model to use
   * @param createServerFn - Function to create a new chat session runtime
   * @returns Server registry entry and whether it's new
   */
  async getOrCreateServer(
    scadaUrl: string,
    accessToken: string,
    model: string | undefined,
    createServerFn: (port: number, sessionId: string) => Promise<any>,
  ): Promise<{ entry: ServerRegistryEntry; isNew: boolean }> {
    const key = this.generateKey(scadaUrl, accessToken);
    const credentialKeyPrefix = key.slice(0, 12);
    const accessTokenHashPrefix = this.hashToken(accessToken).slice(0, 12);

    logger.info(
      {
        scadaUrl,
        model,
        credentialKeyPrefix,
        accessTokenHashPrefix,
        activeSessions: this.sessionRuntimes.size,
      },
      'Resolving OpenCode runtime for bootstrap',
    );

    // Check if server already exists
    const existingEntry = this.sessionRuntimes.get(key);
    if (existingEntry) {
      // Update last accessed time
      existingEntry.lastAccessedAt = new Date();
      this.sessionToServerKey.set(existingEntry.sessionId, key);
      logger.info(
        {
          scadaUrl,
          sessionId: existingEntry.sessionId,
          port: existingEntry.port,
          credentialKeyPrefix,
          accessTokenHashPrefix,
          activeSessions: this.sessionRuntimes.size,
        },
        'Reusing existing OpenCode runtime',
      );
      return { entry: existingEntry, isNew: false };
    }

    const sameScadaSessions = Array.from(this.sessionRuntimes.values())
      .filter(entry => entry.scadaUrl === scadaUrl)
      .map(entry => ({
        sessionId: entry.sessionId,
        port: entry.port,
        accessTokenHashPrefix: entry.accessTokenHash.slice(0, 12),
      }));

    if (sameScadaSessions.length > 0) {
      logger.info(
        {
          scadaUrl,
          credentialKeyPrefix,
          accessTokenHashPrefix,
          sameScadaSessions,
        },
        'No exact credential match, but sessions for same scadaUrl exist',
      );
    }

    logger.info(
      { scadaUrl, credentialKeyPrefix, accessTokenHashPrefix },
      'No reusable OpenCode runtime found; creating new runtime',
    );

    // Check capacity
    if (!this.canCreateNewServer()) {
      throw new Error(`Maximum server limit reached (${this.maxServers})`);
    }

    let lastAddressInUseError: unknown;

    while (true) {
      const port = this.portAllocator.allocatePort();
      if (port === null) {
        if (lastAddressInUseError) {
          const message = getErrorMessage(lastAddressInUseError);
          throw new Error(`No available ports in pool. Last runtime startup error: ${message}`);
        }

        throw new Error('No available ports in pool');
      }

      const sessionId = randomUUID();

      try {
        logger.info(
          {
            scadaUrl,
            port,
            sessionId,
            credentialKeyPrefix,
            accessTokenHashPrefix,
          },
          'Creating new OpenCode runtime',
        );
        const opencodeServer = await createServerFn(port, sessionId);

        const entry: ServerRegistryEntry = {
          sessionId,
          scadaUrl,
          accessToken,
          accessTokenHash: this.hashToken(accessToken),
          opencodeServer,
          opencodeUrl: `http://localhost:${port}`,
          port,
          createdAt: new Date(),
          lastAccessedAt: new Date(),
          model,
          sessionInfo: {},
        };

        this.sessionRuntimes.set(key, entry);
        this.sessionToServerKey.set(sessionId, key);
        logger.info(
          {
            scadaUrl,
            port,
            sessionId,
            credentialKeyPrefix,
            accessTokenHashPrefix,
            activeSessions: this.sessionRuntimes.size,
          },
          'OpenCode runtime created and registered',
        );

        return { entry, isNew: true };
      } catch (error) {
        if (isAddressInUseError(error)) {
          lastAddressInUseError = error;
          logger.warn(
            {
              scadaUrl,
              port,
              sessionId,
              credentialKeyPrefix,
              accessTokenHashPrefix,
              error: getErrorMessage(error),
            },
            'Port already in use outside allocator; trying next port',
          );

          // Keep this port reserved to avoid selecting it repeatedly.
          continue;
        }

        this.portAllocator.releasePort(port);
        logger.error(
          {
            scadaUrl,
            port,
            sessionId,
            credentialKeyPrefix,
            accessTokenHashPrefix,
            error: getErrorMessage(error),
          },
          'Failed to create OpenCode runtime',
        );
        throw error;
      }
    }
  }

  /**
   * Removes a server from the registry and cleans up resources
   * @param key - Registry key for the server
   */
  async removeServer(key: string, reason: ServerRemovalReason = 'manual'): Promise<void> {
    const entry = this.sessionRuntimes.get(key);
    if (!entry) {
      logger.warn({ key }, 'Attempted to remove non-existent server');
      return;
    }

    try {
      const runtimeServer =
        entry.opencodeServer && typeof entry.opencodeServer === 'object'
          ? (
              entry.opencodeServer as {
                server?: {
                  close?: () => void;
                };
              }
            ).server
          : undefined;

      if (runtimeServer?.close) {
        runtimeServer.close();
      }

      logger.info({ scadaUrl: entry.scadaUrl, port: entry.port }, 'Removing server from registry');

      this.sessionRuntimes.delete(key);
      this.sessionToServerKey.delete(entry.sessionId);
      this.portAllocator.releasePort(entry.port);
      this.notifyServerRemoved(entry, reason);

      logger.info(
        {
          scadaUrl: entry.scadaUrl,
          port: entry.port,
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
        logger.info(
          {
            scadaUrl: entry.scadaUrl,
            port: entry.port,
            idleMinutes: Math.floor(idleTime / 60000),
          },
          'Marking idle server for cleanup',
        );
      }
    }

    // Remove idle session runtimes
    for (const key of keysToRemove) {
      void this.removeServer(key, 'idle_timeout');
    }

    if (keysToRemove.length > 0) {
      logger.info({ removedCount: keysToRemove.length }, 'Idle server cleanup completed');
    }
  }

  /**
   * Starts the background cleanup task
   * @param intervalMs - Cleanup interval in milliseconds (default: 15 minutes)
   */
  startCleanupTask(intervalMs: number = 900000): void {
    if (this.cleanupInterval) {
      logger.warn('Cleanup task already running');
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
      logger.info('Cleanup task stopped');
    }
  }

  /**
   * Gets all active session runtimes
   * @returns Array of all runtime entries
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
  updateSessionInfo(sessionId: string, update: SessionInfoUpdateRequest): SessionInfo | null {
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
    logger.debug(
      {
        sessionId,
        tenantId: update.tenantId,
        groupId: update.groupId,
        entityType: update.entityType,
        app: update.app,
      },
      'Session info updated',
    );

    return { ...entry.sessionInfo };
  }

  /**
   * Gets the count of active session runtimes
   * @returns number of active session runtimes
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
