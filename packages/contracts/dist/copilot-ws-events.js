import { z } from 'zod';
import { SessionInfoFieldsSchema, SessionInfoResponseSchema, SessionInfoSnapshotSchema, } from './copilot.js';
import { QuestionRequestSchema } from './question.js';
export function createSessionEventEnvelopeSchema(payloadSchema) {
    return z
        .object({
        type: z.string(),
        sessionId: z.string(),
        timestamp: z.string(),
        payload: payloadSchema,
    })
        .strict();
}
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
];
export const CopilotV1EventNameSchema = z.enum(CopilotV1EventNames);
export const CommandNameSchema = z.enum([
    'prompt.send',
    'prompt.cancel',
    'question.answer',
    'session.update',
]);
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
export const PromptSendPayloadSchema = z
    .object({
    commandId: z.string(),
    content: z.string(),
})
    .strict();
export const PromptCancelPayloadSchema = z
    .object({
    commandId: z.string(),
    reason: z.string().optional(),
})
    .strict();
export const QuestionAskPayloadSchema = z
    .object({
    questionId: z.string(),
    request: QuestionRequestSchema,
    expiresAt: z.string().optional(),
})
    .strict();
export const QuestionAnswerPayloadSchema = z
    .object({
    commandId: z.string(),
    questionId: z.string(),
    answers: z.array(z.string()),
})
    .strict();
export const SessionUpdatePayloadSchema = z
    .object({
    commandId: z.string(),
    sessionInfo: SessionInfoFieldsSchema,
})
    .strict();
export const SessionSnapshotPayloadSchema = z
    .object({
    sessionId: z.string(),
    scadaUrl: z.string(),
    sessionInfo: SessionInfoSnapshotSchema,
    isActive: z.boolean(),
})
    .strict();
export const SessionUpdatedPayloadSchema = SessionInfoResponseSchema;
export const SessionClosedEventPayloadSchema = z
    .object({
    reason: z.string(),
})
    .strict();
export const AssistantTextDeltaPayloadSchema = z
    .object({
    kind: z.literal('text'),
    index: z.number(),
    delta: z.string(),
})
    .strict();
export const AssistantDeltaPayloadSchema = AssistantTextDeltaPayloadSchema;
export const AssistantDonePayloadSchema = z
    .object({
    turnId: z.string().describe('Server-generated assistant turn identifier.'),
    finalText: z.string().describe('Final assistant text content for the completed turn.'),
    finishReason: z.string().describe('Assistant stop reason reported when the turn completed.'),
})
    .strict();
export const AssistantErrorPayloadSchema = z
    .object({
    errorMessage: z.string(),
    errorCode: z.string().optional(),
    context: z.unknown().optional(),
})
    .strict();
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
export const ChildTaskStartedPayloadSchema = z
    .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    startedAt: z.string(),
})
    .strict();
export const ChildTaskCompletedPayloadSchema = z
    .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    completedAt: z.string(),
    result: z.unknown().optional(),
})
    .strict();
export const ChildTaskFailedPayloadSchema = z
    .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    failedAt: z.string(),
    error: z.string(),
})
    .strict();
export const ChildTaskCancelledPayloadSchema = z
    .object({
    childSessionId: z.string(),
    parentSessionId: z.string(),
    profileName: z.string(),
    cancelledAt: z.string(),
    reason: z.string(),
})
    .strict();
//# sourceMappingURL=copilot-ws-events.js.map