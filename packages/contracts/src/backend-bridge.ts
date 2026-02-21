export interface SessionInfoFields {
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
}

export interface SessionInfoSnapshot extends SessionInfoFields {
  updatedAt?: string;
}

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
  bridgeSessionToken: string;
  isNew: boolean;
  scadaUrl: string;
  sessionInfo: SessionInfoSnapshot;
}

export interface PushSessionEventRequest {
  type: string;
  payload?: unknown;
}

export interface RequestSessionEventRequest {
  type: string;
  payload?: unknown;
  timeoutMs?: number;
  longPollMs?: number;
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

export interface RequestSessionEventPendingResponse {
  sessionId: string;
  requestId: string;
  status: 'pending';
  expiresAt: string;
}

export interface RequestSessionEventStatusResponse {
  sessionId: string;
  requestId: string;
  status: 'pending' | 'resolved' | 'expired';
  expiresAt: string;
  response?: unknown;
  respondedAt?: string;
}

export interface ResolveSessionEventResponse {
  sessionId: string;
  requestId: string;
  resolved: true;
}

export type {
  BridgeSessionWebSocketEvent,
  EntityCreatedEventPayload,
  EntityCreatedSessionEvent,
  EntityUpdatedEventPayload,
  EntityUpdatedSessionEvent,
  HubRequestPayload,
  HubRequestSessionEvent,
  KnownBridgeSessionWebSocketEvent,
  McpPublishedSessionEvent,
  QuestionAskHubRequestEvent,
  QuestionAskHubRequestPayload,
  SessionClosedEvent,
  SessionClosedEventPayload,
  SessionEventEnvelope,
  SessionInfoUpdatedEvent,
  SessionSnapshotEvent,
  SessionSnapshotPayload,
} from './backend-bridge-ws-events.js';
