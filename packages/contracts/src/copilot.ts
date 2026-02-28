import { z } from 'zod';
import type { HubResponseSessionEvent } from './copilot-ws-events.js';

export const SessionInfoFieldsSchema = z.object({
  tenantId: z.string().optional(),
  groupId: z.string().optional(),
  entityType: z.string().optional(),
  app: z.string().optional(),
});

export type SessionInfoFields = z.infer<typeof SessionInfoFieldsSchema>;

export const SessionInfoSnapshotSchema = SessionInfoFieldsSchema.extend({
  updatedAt: z.string().optional(),
});

export type SessionInfoSnapshot = z.infer<typeof SessionInfoSnapshotSchema>;

export const SessionInfoResponseSchema = SessionInfoSnapshotSchema.extend({
  sessionId: z.string(),
});

export type SessionInfoResponse = z.infer<typeof SessionInfoResponseSchema>;

export const SessionBootstrapRequestSchema = z
  .object({
    scadaUrl: z.string(),
    accessToken: z.string(),
    sessionInfo: SessionInfoFieldsSchema.optional(),
  })
  .strict();

export type SessionBootstrapRequest = z.infer<typeof SessionBootstrapRequestSchema>;

export const SessionBootstrapResponseSchema = z.object({
  websocketUrl: z.string(),
  sessionId: z.string(),
  bridgeSessionToken: z.string(),
  isNew: z.boolean(),
  scadaUrl: z.string(),
  sessionInfo: SessionInfoSnapshotSchema,
});

export type SessionBootstrapResponse = z.infer<typeof SessionBootstrapResponseSchema>;

export const PushSessionEventRequestSchema = z
  .object({
    type: z.string(),
    payload: z.unknown().optional(),
  })
  .strict();

export type PushSessionEventRequest = z.infer<typeof PushSessionEventRequestSchema>;

export const RequestSessionEventRequestSchema = z
  .object({
    type: z.string(),
    payload: z.unknown().optional(),
    timeoutMs: z.number().optional(),
    longPollMs: z.number().optional(),
  })
  .strict();

export type RequestSessionEventRequest = z.infer<typeof RequestSessionEventRequestSchema>;

export const PushSessionEventResponseSchema = z.object({
  sessionId: z.string(),
  deliveredTo: z.number(),
});

export type PushSessionEventResponse = z.infer<typeof PushSessionEventResponseSchema>;

export const RequestSessionEventResponseSchema = z.object({
  sessionId: z.string(),
  requestId: z.string(),
  response: z.unknown(),
  respondedAt: z.string(),
});

export type RequestSessionEventResponse = z.infer<typeof RequestSessionEventResponseSchema>;

export const ResolveSessionEventResponseRequestSchema = z
  .object({
    response: z.unknown(),
  })
  .strict();

export type ResolveSessionEventResponseRequest = z.infer<
  typeof ResolveSessionEventResponseRequestSchema
>;

export const RequestSessionEventPendingResponseSchema = z.object({
  sessionId: z.string(),
  requestId: z.string(),
  status: z.literal('pending'),
  expiresAt: z.string(),
});

export type RequestSessionEventPendingResponse = z.infer<
  typeof RequestSessionEventPendingResponseSchema
>;

export const RequestSessionEventStatusResponseSchema = z.object({
  sessionId: z.string(),
  requestId: z.string(),
  status: z.enum(['pending', 'resolved', 'expired']),
  expiresAt: z.string(),
  response: z.unknown().optional(),
  respondedAt: z.string().optional(),
});

export type RequestSessionEventStatusResponse = z.infer<
  typeof RequestSessionEventStatusResponseSchema
>;

export const ResolveSessionEventResponseSchema = z.object({
  sessionId: z.string(),
  requestId: z.string(),
  resolved: z.literal(true),
});

export type ResolveSessionEventResponse = z.infer<typeof ResolveSessionEventResponseSchema>;

export function isSessionInfoResponse(value: unknown): value is SessionInfoResponse {
  return SessionInfoResponseSchema.safeParse(value).success;
}

export function isRequestSessionEventResponse(
  value: unknown,
): value is RequestSessionEventResponse {
  return RequestSessionEventResponseSchema.safeParse(value).success;
}

export function isRequestSessionEventPendingResponse(
  value: unknown,
): value is RequestSessionEventPendingResponse {
  return RequestSessionEventPendingResponseSchema.safeParse(value).success;
}

export function isRequestSessionEventStatusResponse(
  value: unknown,
): value is RequestSessionEventStatusResponse {
  return RequestSessionEventStatusResponseSchema.safeParse(value).success;
}

export function isHubResponseSessionEvent(value: unknown): value is HubResponseSessionEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as any).type === 'hub.response' &&
    'payload' in value &&
    typeof (value as any).payload === 'object' &&
    (value as any).payload !== null &&
    'requestId' in (value as any).payload &&
    typeof (value as any).payload.requestId === 'string' &&
    'response' in (value as any).payload &&
    'respondedAt' in (value as any).payload &&
    typeof (value as any).payload.respondedAt === 'string'
  );
}

export type {
  BridgeSessionWebSocketEvent,
  EntityCreatedEventPayload,
  EntityCreatedSessionEvent,
  EntityMovedEventPayload,
  EntityMovedSessionEvent,
  EntityUpdatedEventPayload,
  EntityUpdatedSessionEvent,
  HubRequestPayload,
  HubRequestSessionEvent,
  HubResponsePayload,
  HubResponseSessionEvent,
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
} from './copilot-ws-events.js';
