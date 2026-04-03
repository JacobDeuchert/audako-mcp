import { z } from 'zod';
import {
  SessionInfoFieldsSchema,
  SessionInfoResponseSchema,
  SessionInfoSnapshotSchema,
} from './copilot.js';
import { QuestionRequestSchema } from './question.js';

export function createSessionEventEnvelopeSchema<T extends z.ZodTypeAny>(payloadSchema: T) {
  return z
    .object({
      type: z.string(),
      sessionId: z.string(),
      timestamp: z.string(),
      payload: payloadSchema,
    })
    .strict();
}

export type SessionEventEnvelope<T = unknown> = {
  type: string;
  sessionId: string;
  timestamp: string;
  payload: T;
};

export const CopilotV1EventNames = [
  'prompt.send',
  'prompt.cancel',
  'question.answer',
  'session.update',
  'session.snapshot',
  'session.updated',
  'session.closed',
  'assistant.delta',
  'assistant.done',
  'assistant.error',
  'entity.created',
  'entity.updated',
  'entity.moved',
  'child_task.accepted',
  'child_task.started',
  'child_task.completed',
  'child_task.failed',
  'child_task.cancelled',
] as const;

export const CopilotV1EventNameSchema = z.enum(CopilotV1EventNames);
export type CopilotV1EventName = z.infer<typeof CopilotV1EventNameSchema>;

export const CommandNameSchema = z.enum([
  'prompt.send',
  'prompt.cancel',
  'question.answer',
  'session.update',
]);
export type CommandName = z.infer<typeof CommandNameSchema>;

export const CommandAcknowledgementPayloadSchema = z
  .object({
    commandId: z.string(),
    command: CommandNameSchema,
    status: z.enum(['accepted', 'rejected']),
    acknowledgedAt: z.string(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
      })
      .strict()
      .optional(),
  })
  .strict();
export type CommandAcknowledgementPayload = z.infer<typeof CommandAcknowledgementPayloadSchema>;

export const PromptSendPayloadSchema = z
  .object({
    commandId: z.string(),
    content: z.string(),
  })
  .strict();
export type PromptSendPayload = z.infer<typeof PromptSendPayloadSchema>;

export const PromptCancelPayloadSchema = z
  .object({
    commandId: z.string(),
    reason: z.string().optional(),
  })
  .strict();
export type PromptCancelPayload = z.infer<typeof PromptCancelPayloadSchema>;

export const QuestionAskPayloadSchema = z
  .object({
    questionId: z.string(),
    request: QuestionRequestSchema,
    expiresAt: z.string().optional(),
  })
  .strict();
export type QuestionAskPayload = z.infer<typeof QuestionAskPayloadSchema>;

export const QuestionAnswerPayloadSchema = z
  .object({
    commandId: z.string(),
    questionId: z.string(),
    answers: z.array(z.string()),
  })
  .strict();
export type QuestionAnswerPayload = z.infer<typeof QuestionAnswerPayloadSchema>;

export const SessionUpdatePayloadSchema = z
  .object({
    commandId: z.string(),
    sessionInfo: SessionInfoFieldsSchema,
  })
  .strict();
export type SessionUpdatePayload = z.infer<typeof SessionUpdatePayloadSchema>;

export type SessionCommand =
  | PromptSendSessionEvent
  | PromptCancelSessionEvent
  | QuestionAnswerSessionEvent
  | SessionUpdateSessionEvent;

export const SessionSnapshotPayloadSchema = z
  .object({
    sessionId: z.string(),
    scadaUrl: z.string(),
    sessionInfo: SessionInfoSnapshotSchema,
    isActive: z.boolean(),
  })
  .strict();
export type SessionSnapshotPayload = z.infer<typeof SessionSnapshotPayloadSchema>;

export const SessionUpdatedPayloadSchema = SessionInfoResponseSchema;
export type SessionUpdatedPayload = z.infer<typeof SessionUpdatedPayloadSchema>;

export const SessionClosedEventPayloadSchema = z
  .object({
    reason: z.string(),
  })
  .strict();
export type SessionClosedEventPayload = z.infer<typeof SessionClosedEventPayloadSchema>;

export const AssistantTextDeltaPayloadSchema = z
  .object({
    kind: z.literal('text'),
    index: z.number(),
    delta: z.string(),
  })
  .strict();

export const AssistantDeltaPayloadSchema = AssistantTextDeltaPayloadSchema;
export type AssistantDeltaPayload = z.infer<typeof AssistantDeltaPayloadSchema>;

export const AssistantDonePayloadSchema = z
  .object({
    turnId: z.string().describe('Server-generated assistant turn identifier.'),
    finalText: z.string().describe('Final assistant text content for the completed turn.'),
    finishReason: z.string().describe('Assistant stop reason reported when the turn completed.'),
  })
  .strict();
export type AssistantDonePayload = z.infer<typeof AssistantDonePayloadSchema>;

export const AssistantErrorPayloadSchema = z
  .object({
    errorMessage: z.string(),
    errorCode: z.string().optional(),
    context: z.unknown().optional(),
  })
  .strict();
export type AssistantErrorPayload = z.infer<typeof AssistantErrorPayloadSchema>;

export const EntityEventMetadataCoreSchema = z
  .object({
    tenantId: z.string().optional().describe('Resolved tenant context for the mutation event.'),
    sourceTool: z.enum(['create-entity', 'update-entity', 'move-entity']),
    timestamp: z.string().describe('ISO timestamp when the mutation event payload was built.'),
  })
  .strict();

export const EntityCreatedEventPayloadSchema = z
  .object({
    entityType: z.string(),
    entityId: z.string(),
    groupId: z.string(),
    metadata: EntityEventMetadataCoreSchema.extend({
      sourceTool: z.literal('create-entity'),
    }),
    data: z.record(z.string(), z.unknown()),
  })
  .strict();
export type EntityCreatedEventPayload = z.infer<typeof EntityCreatedEventPayloadSchema>;

export const EntityUpdatedEventPayloadSchema = z
  .object({
    entityType: z.string(),
    entityId: z.string(),
    groupId: z.string(),
    changedFields: z.array(z.string()).min(1),
    changes: z.record(z.string(), z.unknown()),
    metadata: EntityEventMetadataCoreSchema.extend({
      sourceTool: z.literal('update-entity'),
    }),
  })
  .strict();
export type EntityUpdatedEventPayload = z.infer<typeof EntityUpdatedEventPayloadSchema>;

export const EntityMovedEventPayloadSchema = z
  .object({
    entityType: z.string(),
    entityId: z.string(),
    sourceGroupId: z.string().optional(),
    targetGroupId: z.string(),
    metadata: EntityEventMetadataCoreSchema.extend({
      sourceTool: z.literal('move-entity'),
    }),
  })
  .strict();
export type EntityMovedEventPayload = z.infer<typeof EntityMovedEventPayloadSchema>;

export type PromptSendSessionEvent = SessionEventEnvelope<PromptSendPayload> & {
  type: 'prompt.send';
};

export type PromptCancelSessionEvent = SessionEventEnvelope<PromptCancelPayload> & {
  type: 'prompt.cancel';
};

export type QuestionAnswerSessionEvent = SessionEventEnvelope<QuestionAnswerPayload> & {
  type: 'question.answer';
};

export type SessionUpdateSessionEvent = SessionEventEnvelope<SessionUpdatePayload> & {
  type: 'session.update';
};

export type SessionSnapshotEvent = SessionEventEnvelope<SessionSnapshotPayload> & {
  type: 'session.snapshot';
};

export type SessionUpdatedEvent = SessionEventEnvelope<SessionUpdatedPayload> & {
  type: 'session.updated';
};

export type SessionClosedEvent = SessionEventEnvelope<SessionClosedEventPayload> & {
  type: 'session.closed';
};

export type AssistantDeltaSessionEvent = SessionEventEnvelope<AssistantDeltaPayload> & {
  type: 'assistant.delta';
};

export type AssistantDoneSessionEvent = SessionEventEnvelope<AssistantDonePayload> & {
  type: 'assistant.done';
};

export type AssistantErrorSessionEvent = SessionEventEnvelope<AssistantErrorPayload> & {
  type: 'assistant.error';
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

// Child task lifecycle events

export const ChildTaskAcceptedPayloadSchema = z
  .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    description: z.string(),
    timestamp: z.string(),
  })
  .strict();
export type ChildTaskAcceptedPayload = z.infer<typeof ChildTaskAcceptedPayloadSchema>;

export const ChildTaskStartedPayloadSchema = z
  .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    startedAt: z.string(),
  })
  .strict();
export type ChildTaskStartedPayload = z.infer<typeof ChildTaskStartedPayloadSchema>;

export const ChildTaskCompletedPayloadSchema = z
  .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    completedAt: z.string(),
    result: z.unknown().optional(),
  })
  .strict();
export type ChildTaskCompletedPayload = z.infer<typeof ChildTaskCompletedPayloadSchema>;

export const ChildTaskFailedPayloadSchema = z
  .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    failedAt: z.string(),
    error: z.string(),
  })
  .strict();
export type ChildTaskFailedPayload = z.infer<typeof ChildTaskFailedPayloadSchema>;

export const ChildTaskCancelledPayloadSchema = z
  .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    cancelledAt: z.string(),
    reason: z.string(),
  })
  .strict();
export type ChildTaskCancelledPayload = z.infer<typeof ChildTaskCancelledPayloadSchema>;

export type ChildTaskAcceptedSessionEvent = SessionEventEnvelope<ChildTaskAcceptedPayload> & {
  type: 'child_task.accepted';
};

export type ChildTaskStartedSessionEvent = SessionEventEnvelope<ChildTaskStartedPayload> & {
  type: 'child_task.started';
};

export type ChildTaskCompletedSessionEvent = SessionEventEnvelope<ChildTaskCompletedPayload> & {
  type: 'child_task.completed';
};

export type ChildTaskFailedSessionEvent = SessionEventEnvelope<ChildTaskFailedPayload> & {
  type: 'child_task.failed';
};

export type ChildTaskCancelledSessionEvent = SessionEventEnvelope<ChildTaskCancelledPayload> & {
  type: 'child_task.cancelled';
};

export type KnownCopilotV1SessionEvent =
  | PromptSendSessionEvent
  | PromptCancelSessionEvent
  | QuestionAnswerSessionEvent
  | SessionUpdateSessionEvent
  | SessionSnapshotEvent
  | SessionUpdatedEvent
  | SessionClosedEvent
  | AssistantDeltaSessionEvent
  | AssistantDoneSessionEvent
  | AssistantErrorSessionEvent
  | EntityCreatedSessionEvent
  | EntityUpdatedSessionEvent
  | EntityMovedSessionEvent
  | ChildTaskAcceptedSessionEvent
  | ChildTaskStartedSessionEvent
  | ChildTaskCompletedSessionEvent
  | ChildTaskFailedSessionEvent
  | ChildTaskCancelledSessionEvent;
