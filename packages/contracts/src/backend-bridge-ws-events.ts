import { z } from 'zod';
import { type SessionInfoResponse, SessionInfoSnapshotSchema } from './backend-bridge.js';
import { QuestionRequestSchema } from './question.js';

export function createSessionEventEnvelopeSchema<T extends z.ZodTypeAny>(payloadSchema: T) {
  return z.object({
    type: z.string(),
    sessionId: z.string(),
    timestamp: z.string(),
    payload: payloadSchema,
  });
}

export function createHubRequestPayloadSchema<T extends z.ZodTypeAny>(payloadSchema: T) {
  return z.object({
    requestId: z.string(),
    requestType: z.string(),
    payload: payloadSchema,
    expiresAt: z.string(),
  });
}

export type SessionEventEnvelope<T = unknown> = {
  type: string;
  sessionId: string;
  timestamp: string;
  payload: T;
};

export type HubRequestPayload<TPayload = unknown> = {
  requestId: string;
  requestType: string;
  payload: TPayload;
  expiresAt: string;
};

export type HubRequestSessionEvent<TPayload = unknown> = SessionEventEnvelope<
  HubRequestPayload<TPayload>
> & { type: 'hub.request' };

export const HubResponsePayloadSchema = z.object({
  requestId: z.string(),
  response: z.unknown(),
  respondedAt: z.string(),
});
export type HubResponsePayload = z.infer<typeof HubResponsePayloadSchema>;

export type HubResponseSessionEvent = SessionEventEnvelope<HubResponsePayload> & {
  type: 'hub.response';
};

export const SessionSnapshotPayloadSchema = z.object({
  sessionId: z.string(),
  scadaUrl: z.string(),
  opencodeUrl: z.string(),
  sessionInfo: SessionInfoSnapshotSchema,
  isActive: z.boolean(),
});
export type SessionSnapshotPayload = z.infer<typeof SessionSnapshotPayloadSchema>;

export const SessionClosedEventPayloadSchema = z.object({
  reason: z.string(),
});
export type SessionClosedEventPayload = z.infer<typeof SessionClosedEventPayloadSchema>;

export const EntityCreatedEventPayloadSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  tenantId: z.string(),
  groupId: z.string(),
  sourceTool: z.literal('create-entity'),
  timestamp: z.string(),
});
export type EntityCreatedEventPayload = z.infer<typeof EntityCreatedEventPayloadSchema>;

export const EntityUpdatedEventPayloadSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  tenantId: z.string(),
  groupId: z.string(),
  changedFields: z.array(z.string()),
  sourceTool: z.literal('update-entity'),
  timestamp: z.string(),
});
export type EntityUpdatedEventPayload = z.infer<typeof EntityUpdatedEventPayloadSchema>;

export const EntityMovedEventPayloadSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  tenantId: z.string(),
  sourceGroupId: z.string().optional(),
  targetGroupId: z.string(),
  sourceTool: z.literal('move-entity'),
  timestamp: z.string(),
});
export type EntityMovedEventPayload = z.infer<typeof EntityMovedEventPayloadSchema>;

export const QuestionAskHubRequestPayloadSchema = createHubRequestPayloadSchema(
  QuestionRequestSchema,
).extend({
  requestType: z.literal('question.ask'),
});
export type QuestionAskHubRequestPayload = z.infer<typeof QuestionAskHubRequestPayloadSchema>;

export type SessionSnapshotEvent = SessionEventEnvelope<SessionSnapshotPayload> & {
  type: 'session.snapshot';
};

export type SessionInfoUpdatedEvent = SessionEventEnvelope<SessionInfoResponse> & {
  type: 'session.info.updated';
};

export type SessionClosedEvent = SessionEventEnvelope<SessionClosedEventPayload> & {
  type: 'session.closed';
};

export type QuestionAskHubRequestEvent = SessionEventEnvelope<QuestionAskHubRequestPayload> & {
  type: 'hub.request';
};

export type EntityCreatedSessionEvent = SessionEventEnvelope<EntityCreatedEventPayload> & {
  type: 'entity.created';
};

export type EntityUpdatedSessionEvent = SessionEventEnvelope<EntityUpdatedEventPayload> & {
  type: 'entity.updated';
};

export type EntityMovedSessionEvent = SessionEventEnvelope<EntityMovedEventPayload> & {
  type: 'entity.moved';
};

export type McpPublishedSessionEvent =
  | EntityCreatedSessionEvent
  | EntityUpdatedSessionEvent
  | EntityMovedSessionEvent;

export type KnownBridgeSessionWebSocketEvent =
  | SessionSnapshotEvent
  | SessionInfoUpdatedEvent
  | SessionClosedEvent
  | HubRequestSessionEvent
  | HubResponseSessionEvent
  | McpPublishedSessionEvent;

export type BridgeSessionWebSocketEvent = KnownBridgeSessionWebSocketEvent | SessionEventEnvelope;
