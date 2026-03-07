import { z } from 'zod';

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
  websocketPath: z.string(),
  sessionId: z.string(),
  bridgeSessionToken: z.string(),
  isNew: z.boolean(),
  scadaUrl: z.string(),
  sessionInfo: SessionInfoSnapshotSchema,
});

export type SessionBootstrapResponse = z.infer<typeof SessionBootstrapResponseSchema>;

export function isSessionInfoResponse(value: unknown): value is SessionInfoResponse {
  return SessionInfoResponseSchema.safeParse(value).success;
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
