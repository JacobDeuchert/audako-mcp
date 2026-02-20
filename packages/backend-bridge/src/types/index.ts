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

export interface ServerRegistryEntry {
  sessionId: string;
  scadaUrl: string;
  accessToken: string; // Stored in-memory for MCP session bootstrapping
  accessTokenHash: string; // SHA-256 hash for lookup
  opencodeServer: OpencodeRuntime;
  opencodeUrl: string;
  port: number;
  createdAt: Date;
  lastAccessedAt: Date;
  sessionInfo: SessionInfo;
}

/** Fields that a client may send when updating session info. */
export interface SessionInfoFields {
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
}

/** Internal session info stored in the registry (Date for updatedAt). */
export interface SessionInfo extends SessionInfoFields {
  updatedAt?: Date;
}

/** Serialised session info sent over the wire (ISO string for updatedAt). */
export interface SessionInfoSnapshot extends SessionInfoFields {
  updatedAt?: string;
}

/** Serialised session info with the owning sessionId attached. */
export interface SessionInfoResponse extends SessionInfoSnapshot {
  sessionId: string;
}

export interface SessionBootstrapRequest {
  scadaUrl: string;
  accessToken: string;
  sessionInfo?: SessionInfoFields;
}

export interface SessionBootstrapResponse {
  opencodeUrl: string;
  websocketUrl: string;
  sessionId: string;
  isNew: boolean;
  scadaUrl: string;
  sessionInfo: SessionInfoSnapshot;
}

export interface SessionSnapshotPayload {
  sessionId: string;
  scadaUrl: string;
  opencodeUrl: string;
  sessionInfo: SessionInfoSnapshot;
  isActive: boolean;
}

export interface SessionEventEnvelope<T = unknown> {
  type: string;
  sessionId: string;
  timestamp: string;
  payload: T;
}

export interface PushSessionEventRequest {
  type: string;
  payload?: unknown;
}

export interface RequestSessionEventRequest {
  type: string;
  payload?: unknown;
  timeoutMs?: number;
}

export interface PushSessionEventPayload {
  type: string;
  payload?: unknown;
}

export interface PushSessionEventResponse {
  sessionId: string;
  deliveredTo: number;
}

export interface RequestSessionEventResponse {
  sessionId: string;
  requestId: string;
  response: unknown;
  respondedAt: string;
}

export interface ResolveSessionEventResponseRequest {
  response: unknown;
}

export interface ResolveSessionEventResponse {
  sessionId: string;
  requestId: string;
  resolved: true;
}

export interface ErrorResponse {
  error: string;
  message: string;
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
