import type { SessionInfoFields } from '@audako/contracts';

export type {
  EntityCreatedEventPayload,
  EntityCreatedSessionEvent,
  EntityUpdatedEventPayload,
  EntityUpdatedSessionEvent,
  ErrorResponse,
  McpPublishedSessionEvent,
  PushSessionEventRequest,
  PushSessionEventResponse,
  RequestSessionEventPendingResponse,
  RequestSessionEventRequest,
  RequestSessionEventResponse,
  RequestSessionEventStatusResponse,
  ResolveSessionEventResponse,
  ResolveSessionEventResponseRequest,
  SessionBootstrapRequest,
  SessionBootstrapResponse,
  SessionEventEnvelope,
  SessionInfoFields,
  SessionInfoResponse,
  SessionInfoSnapshot,
  SessionSnapshotPayload,
} from '@audako/contracts';

/**
 * Minimal shape of the object returned by `createOpencode()`.
 * We only need to reach `.server.close()` for teardown.
 */
export interface OpencodeRuntime {
  server?: {
    close?: () => void;
  };
}

/** Minimal WebSocket interface used across session services and routes. */
export interface SessionSocket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  ping?: () => void;
}

/** Internal session info stored in the registry (Date for updatedAt). */
export interface SessionInfo extends SessionInfoFields {
  updatedAt?: Date;
}

export interface ServerRegistryEntry {
  sessionId: string;
  scadaUrl: string;
  accessToken: string; // Stored in-memory for MCP session bootstrapping
  accessTokenHash: string; // SHA-256 hash for lookup
  bridgeSessionToken: string; // Stored in-memory for bootstrap + MCP/bridge auth continuity
  bridgeSessionTokenHash: string; // SHA-256 hash of bridge session capability token
  opencodeServer: OpencodeRuntime;
  opencodeUrl: string;
  port: number;
  createdAt: Date;
  lastAccessedAt: Date;
  sessionInfo: SessionInfo;
}

export interface HealthResponse {
  status: string;
  activeServers: number;
  maxServers: number;
  availablePorts: number;
}

export interface ServerListEntry {
  sessionId: string;
  scadaUrl: string;
  opencodeUrl: string;
  port: number;
  createdAt: string;
  lastAccessedAt: string;
  idleMinutes: number;
}

export interface ServerListResponse {
  servers: ServerListEntry[];
}
