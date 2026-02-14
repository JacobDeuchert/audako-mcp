import { createHash, randomUUID } from "crypto";
import { pino } from "pino";
import type {
  ServerRegistryEntry,
  SessionInfo,
  SessionInfoUpdateRequest,
} from "../types/index.js";
import { PortAllocator } from "./port-allocator.js";

const logger = pino({ name: "server-registry" });

export class ServerRegistry {
  private servers: Map<string, ServerRegistryEntry>;
  private sessionToServerKey: Map<string, string>;
  private portAllocator: PortAllocator;
  private maxServers: number;
  private idleTimeout: number; // in milliseconds
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    portAllocator: PortAllocator,
    maxServers: number = 50,
    idleTimeout: number = 3600000, // 1 hour default
  ) {
    this.servers = new Map();
    this.sessionToServerKey = new Map();
    this.portAllocator = portAllocator;
    this.maxServers = maxServers;
    this.idleTimeout = idleTimeout;
    logger.info(
      { maxServers, idleTimeoutMs: idleTimeout },
      "ServerRegistry initialized",
    );
  }

  /**
   * Returns a server entry by session ID
   */
  private getEntryBySessionId(
    sessionId: string,
  ): ServerRegistryEntry | undefined {
    const serverKey = this.sessionToServerKey.get(sessionId);
    if (!serverKey) {
      return undefined;
    }

    const entry = this.servers.get(serverKey);
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
    return createHash("sha256").update(combined).digest("hex");
  }

  /**
   * Hashes an access token for storage
   * @param accessToken - Access token to hash
   * @returns SHA-256 hash of the token
   */
  private hashToken(accessToken: string): string {
    return createHash("sha256").update(accessToken).digest("hex");
  }

  /**
   * Checks if the registry can accept a new server
   * @returns true if a new server can be created
   */
  canCreateNewServer(): boolean {
    return this.servers.size < this.maxServers;
  }

  /**
   * Gets or creates a server for the given credentials
   * @param scadaUrl - SCADA system URL
   * @param accessToken - Access token
   * @param model - Optional model to use
   * @param createServerFn - Function to create a new OpenCode server
   * @returns Server registry entry and whether it's new
   */
  async getOrCreateServer(
    scadaUrl: string,
    accessToken: string,
    model: string | undefined,
    createServerFn: (port: number, sessionId: string) => Promise<any>,
  ): Promise<{ entry: ServerRegistryEntry; isNew: boolean }> {
    const key = this.generateKey(scadaUrl, accessToken);

    // Check if server already exists
    const existingEntry = this.servers.get(key);
    if (existingEntry) {
      // Update last accessed time
      existingEntry.lastAccessedAt = new Date();
      this.sessionToServerKey.set(existingEntry.sessionId, key);
      logger.info(
        { scadaUrl, port: existingEntry.port },
        "Reusing existing OpenCode server",
      );
      return { entry: existingEntry, isNew: false };
    }

    // Check capacity
    if (!this.canCreateNewServer()) {
      throw new Error(`Maximum server limit reached (${this.maxServers})`);
    }

    // Allocate port
    const port = this.portAllocator.allocatePort();
    if (port === null) {
      throw new Error("No available ports in pool");
    }

    const sessionId = randomUUID();

    try {
      // Create new OpenCode server
      logger.info(
        { scadaUrl, port, sessionId },
        "Creating new OpenCode server",
      );
      const opencodeServer = await createServerFn(port, sessionId);

      // Create registry entry
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

      this.servers.set(key, entry);
      this.sessionToServerKey.set(sessionId, key);
      logger.info(
        { scadaUrl, port, sessionId, activeServers: this.servers.size },
        "OpenCode server created and registered",
      );

      return { entry, isNew: true };
    } catch (error) {
      // Release port on failure
      this.portAllocator.releasePort(port);
      logger.error(
        { error, scadaUrl, port },
        "Failed to create OpenCode server",
      );
      throw error;
    }
  }

  /**
   * Removes a server from the registry and cleans up resources
   * @param key - Registry key for the server
   */
  async removeServer(key: string): Promise<void> {
    const entry = this.servers.get(key);
    if (!entry) {
      logger.warn({ key }, "Attempted to remove non-existent server");
      return;
    }

    try {
      // TODO: Add proper cleanup for OpenCode server instance
      // For now, we just remove from registry and release port
      logger.info(
        { scadaUrl: entry.scadaUrl, port: entry.port },
        "Removing server from registry",
      );

      this.servers.delete(key);
      this.sessionToServerKey.delete(entry.sessionId);
      this.portAllocator.releasePort(entry.port);

      logger.info(
        {
          scadaUrl: entry.scadaUrl,
          port: entry.port,
          activeServers: this.servers.size,
        },
        "Server removed",
      );
    } catch (error) {
      logger.error({ error, key }, "Error removing server");
    }
  }

  /**
   * Cleans up idle servers that haven't been accessed within the idle timeout
   */
  cleanupIdleServers(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.servers.entries()) {
      const idleTime = now - entry.lastAccessedAt.getTime();
      if (idleTime > this.idleTimeout) {
        keysToRemove.push(key);
        logger.info(
          {
            scadaUrl: entry.scadaUrl,
            port: entry.port,
            idleMinutes: Math.floor(idleTime / 60000),
          },
          "Marking idle server for cleanup",
        );
      }
    }

    // Remove idle servers
    for (const key of keysToRemove) {
      this.removeServer(key);
    }

    if (keysToRemove.length > 0) {
      logger.info(
        { removedCount: keysToRemove.length },
        "Idle server cleanup completed",
      );
    }
  }

  /**
   * Starts the background cleanup task
   * @param intervalMs - Cleanup interval in milliseconds (default: 15 minutes)
   */
  startCleanupTask(intervalMs: number = 900000): void {
    if (this.cleanupInterval) {
      logger.warn("Cleanup task already running");
      return;
    }

    logger.info({ intervalMs }, "Starting cleanup task");
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
      logger.info("Cleanup task stopped");
    }
  }

  /**
   * Gets all active servers
   * @returns Array of all server entries
   */
  getAllServers(): ServerRegistryEntry[] {
    return Array.from(this.servers.values());
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
  updateSessionInfo(
    sessionId: string,
    update: SessionInfoUpdateRequest,
  ): SessionInfo | null {
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
      "Session info updated",
    );

    return { ...entry.sessionInfo };
  }

  /**
   * Gets the count of active servers
   * @returns number of active servers
   */
  getActiveServerCount(): number {
    return this.servers.size;
  }
}
