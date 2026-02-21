import type { SessionInfoResponse, SessionInfoSnapshot } from './backend-bridge.js';
import type { QuestionRequest } from './question.js';
export interface SessionEventEnvelope<T = unknown> {
    type: string;
    sessionId: string;
    timestamp: string;
    payload: T;
}
export interface SessionSnapshotPayload {
    sessionId: string;
    scadaUrl: string;
    opencodeUrl: string;
    sessionInfo: SessionInfoSnapshot;
    isActive: boolean;
}
export interface SessionSnapshotEvent extends SessionEventEnvelope<SessionSnapshotPayload> {
    type: 'session.snapshot';
}
export interface SessionInfoUpdatedEvent extends SessionEventEnvelope<SessionInfoResponse> {
    type: 'session.info.updated';
}
export interface SessionClosedEventPayload {
    reason: string;
}
export interface SessionClosedEvent extends SessionEventEnvelope<SessionClosedEventPayload> {
    type: 'session.closed';
}
export interface HubRequestPayload<TPayload = unknown> {
    requestId: string;
    requestType: string;
    payload: TPayload;
    expiresAt: string;
}
export interface HubRequestSessionEvent<TPayload = unknown> extends SessionEventEnvelope<HubRequestPayload<TPayload>> {
    type: 'hub.request';
}
export interface QuestionAskHubRequestPayload extends HubRequestPayload<QuestionRequest> {
    requestType: 'question.ask';
}
export interface QuestionAskHubRequestEvent extends SessionEventEnvelope<QuestionAskHubRequestPayload> {
    type: 'hub.request';
}
export interface EntityCreatedEventPayload {
    entityType: string;
    entityId: string;
    tenantId: string;
    groupId: string;
    sourceTool: 'create-entity';
    timestamp: string;
}
export interface EntityUpdatedEventPayload {
    entityType: string;
    entityId: string;
    tenantId: string;
    groupId: string;
    changedFields: string[];
    sourceTool: 'update-entity';
    timestamp: string;
}
export interface EntityCreatedSessionEvent extends SessionEventEnvelope<EntityCreatedEventPayload> {
    type: 'entity.created';
}
export interface EntityUpdatedSessionEvent extends SessionEventEnvelope<EntityUpdatedEventPayload> {
    type: 'entity.updated';
}
export type McpPublishedSessionEvent = EntityCreatedSessionEvent | EntityUpdatedSessionEvent;
export type KnownBridgeSessionWebSocketEvent = SessionSnapshotEvent | SessionInfoUpdatedEvent | SessionClosedEvent | HubRequestSessionEvent | McpPublishedSessionEvent;
export type BridgeSessionWebSocketEvent = KnownBridgeSessionWebSocketEvent | SessionEventEnvelope;
//# sourceMappingURL=backend-bridge-ws-events.d.ts.map