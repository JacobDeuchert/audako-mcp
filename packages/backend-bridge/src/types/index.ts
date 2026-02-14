export interface ServerRegistryEntry {
  sessionId: string;
  scadaUrl: string;
  accessToken: string; // Stored in-memory for MCP session bootstrapping
  accessTokenHash: string; // SHA-256 hash for lookup
  opencodeServer: any; // OpenCode instance type from SDK
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

export interface CreateServerRequest {
  scadaUrl: string;
  accessToken: string;
  model?: string;
}

export interface CreateServerResponse {
  opencodeUrl: string;
  sessionId: string;
  isNew: boolean;
  scadaUrl: string;
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
