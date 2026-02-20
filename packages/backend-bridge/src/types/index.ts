export interface ServerRegistryEntry {
  sessionId: string;
  scadaUrl: string;
  accessToken: string; // Stored in-memory for MCP session bootstrapping
  accessTokenHash: string; // SHA-256 hash for lookup
  opencodeServer: any; // Current runtime instance (OpenCode)
  opencodeUrl: string;
  port: number;
  createdAt: Date;
  lastAccessedAt: Date;
  model?: string; // Client-specified model
  sessionInfo: SessionInfo;
}

export interface SessionInfo {
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
  updatedAt?: Date;
}

export interface SessionInfoUpdateRequest {
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
}

export interface SessionInfoResponse {
  sessionId: string;
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
  updatedAt?: string;
}

export interface SessionInfoSnapshot {
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
  updatedAt?: string;
}

export interface SessionBootstrapRequest {
  scadaUrl: string;
  accessToken: string;
  model?: string;
  sessionInfo?: SessionInfoUpdateRequest;
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
