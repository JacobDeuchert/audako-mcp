import { z } from 'zod';
import { type SessionInfoResponse, SessionInfoSnapshotSchema } from './copilot.js';
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

// Agent event types for pi-mono agent
export const AgentTextDeltaPayloadSchema = z.object({
  index: z.number(),
  delta: z.string(),
});
export type AgentTextDeltaPayload = z.infer<typeof AgentTextDeltaPayloadSchema>;

export type AgentTextDeltaSessionEvent = SessionEventEnvelope<AgentTextDeltaPayload> & {
  type: 'agent.text_delta';
};

export const AgentToolStartPayloadSchema = z.object({
  toolName: z.string(),
  toolInput: z.unknown(),
});
export type AgentToolStartPayload = z.infer<typeof AgentToolStartPayloadSchema>;

export type AgentToolStartSessionEvent = SessionEventEnvelope<AgentToolStartPayload> & {
  type: 'agent.tool_start';
};

export const AgentToolEndPayloadSchema = z.object({
  toolName: z.string(),
  toolOutput: z.unknown(),
});
export type AgentToolEndPayload = z.infer<typeof AgentToolEndPayloadSchema>;

export type AgentToolEndSessionEvent = SessionEventEnvelope<AgentToolEndPayload> & {
  type: 'agent.tool_end';
};

export const AgentTurnStartPayloadSchema = z.object({
  turnId: z.string(),
  userMessage: z.string().optional(),
});
export type AgentTurnStartPayload = z.infer<typeof AgentTurnStartPayloadSchema>;

export type AgentTurnStartSessionEvent = SessionEventEnvelope<AgentTurnStartPayload> & {
  type: 'agent.turn_start';
};

export const AgentTurnEndPayloadSchema = z.object({
  turnId: z.string(),
  finalMessage: z.string().optional(),
});
export type AgentTurnEndPayload = z.infer<typeof AgentTurnEndPayloadSchema>;

export type AgentTurnEndSessionEvent = SessionEventEnvelope<AgentTurnEndPayload> & {
  type: 'agent.turn_end';
};

export const AgentErrorPayloadSchema = z.object({
  errorMessage: z.string(),
  errorCode: z.string().optional(),
  context: z.unknown().optional(),
});
export type AgentErrorPayload = z.infer<typeof AgentErrorPayloadSchema>;

export type AgentErrorSessionEvent = SessionEventEnvelope<AgentErrorPayload> & {
  type: 'agent.error';
};

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

export type AgentSessionEvent =
  | AgentTextDeltaSessionEvent
  | AgentToolStartSessionEvent
  | AgentToolEndSessionEvent
  | AgentTurnStartSessionEvent
  | AgentTurnEndSessionEvent
  | AgentErrorSessionEvent;

export type KnownBridgeSessionWebSocketEvent =
  | SessionSnapshotEvent
  | SessionInfoUpdatedEvent
  | SessionClosedEvent
  | HubRequestSessionEvent
  | HubResponseSessionEvent
  | McpPublishedSessionEvent
  | AgentSessionEvent;

export type BridgeSessionWebSocketEvent = KnownBridgeSessionWebSocketEvent | SessionEventEnvelope;
