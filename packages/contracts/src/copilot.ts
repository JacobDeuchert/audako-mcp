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

export const RealtimeDescriptorSchema = z
  .object({
    transport: z.literal('socket.io'),
    protocolVersion: z.literal('v1'),
    namespace: z.literal('/session'),
    path: z.literal('/socket.io'),
    auth: z
      .object({
        type: z.literal('session_token'),
        token: z.string(),
      })
      .strict(),
    room: z
      .object({
        type: z.literal('session'),
        id: z.string(),
      })
      .strict(),
  })
  .strict();

export type RealtimeDescriptor = z.infer<typeof RealtimeDescriptorSchema>;

export const SessionBootstrapResponseSchema = z
  .object({
    sessionId: z.string(),
    isNew: z.boolean(),
    scadaUrl: z.string(),
    sessionInfo: SessionInfoSnapshotSchema,
    realtime: RealtimeDescriptorSchema,
  })
  .strict();

export type SessionBootstrapResponse = z.infer<typeof SessionBootstrapResponseSchema>;

export function isSessionInfoResponse(value: unknown): value is SessionInfoResponse {
  return SessionInfoResponseSchema.safeParse(value).success;
}

export type {
  AssistantDeltaPayload,
  AssistantDeltaSessionEvent,
  AssistantDonePayload,
  AssistantDoneSessionEvent,
  AssistantErrorPayload,
  AssistantErrorSessionEvent,
  CommandAcknowledgementPayload,
  CommandName,
  CopilotV1EventName,
  EntityCreatedEventPayload,
  EntityCreatedSessionEvent,
  EntityMovedEventPayload,
  EntityMovedSessionEvent,
  EntityUpdatedEventPayload,
  EntityUpdatedSessionEvent,
  KnownCopilotV1SessionEvent,
  PromptCancelPayload,
  PromptCancelSessionEvent,
  PromptSendPayload,
  PromptSendSessionEvent,
  QuestionAnswerPayload,
  QuestionAnswerSessionEvent,
  QuestionAskPayload,
  SessionClosedEvent,
  SessionClosedEventPayload,
  SessionCommand,
  SessionEventEnvelope,
  SessionSnapshotEvent,
  SessionSnapshotPayload,
  SessionUpdatedEvent,
  SessionUpdatedPayload,
  SessionUpdatePayload,
  SessionUpdateSessionEvent,
} from './copilot-ws-events.js';
