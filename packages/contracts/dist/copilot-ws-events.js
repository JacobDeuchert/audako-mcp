import { z } from 'zod';
import { SessionInfoSnapshotSchema } from './copilot.js';
import { QuestionRequestSchema } from './question.js';
export function createSessionEventEnvelopeSchema(payloadSchema) {
    return z.object({
        type: z.string(),
        sessionId: z.string(),
        timestamp: z.string(),
        payload: payloadSchema,
    });
}
export function createHubRequestPayloadSchema(payloadSchema) {
    return z.object({
        requestId: z.string(),
        requestType: z.string(),
        payload: payloadSchema,
        expiresAt: z.string(),
    });
}
export const HubResponsePayloadSchema = z.object({
    requestId: z.string(),
    response: z.unknown(),
    respondedAt: z.string(),
});
export const SessionSnapshotPayloadSchema = z.object({
    sessionId: z.string(),
    scadaUrl: z.string(),
    sessionInfo: SessionInfoSnapshotSchema,
    isActive: z.boolean(),
});
export const SessionClosedEventPayloadSchema = z.object({
    reason: z.string(),
});
export const EntityCreatedEventPayloadSchema = z.object({
    entityType: z.string(),
    entityId: z.string(),
    tenantId: z.string(),
    groupId: z.string(),
    sourceTool: z.literal('create-entity'),
    timestamp: z.string(),
});
export const EntityUpdatedEventPayloadSchema = z.object({
    entityType: z.string(),
    entityId: z.string(),
    tenantId: z.string(),
    groupId: z.string(),
    changedFields: z.array(z.string()),
    sourceTool: z.literal('update-entity'),
    timestamp: z.string(),
});
export const EntityMovedEventPayloadSchema = z.object({
    entityType: z.string(),
    entityId: z.string(),
    tenantId: z.string(),
    sourceGroupId: z.string().optional(),
    targetGroupId: z.string(),
    sourceTool: z.literal('move-entity'),
    timestamp: z.string(),
});
export const QuestionAskHubRequestPayloadSchema = createHubRequestPayloadSchema(QuestionRequestSchema).extend({
    requestType: z.literal('question.ask'),
});
// Agent event types for pi-mono agent
export const AgentTextDeltaPayloadSchema = z.object({
    index: z.number(),
    delta: z.string(),
});
export const AgentToolStartPayloadSchema = z.object({
    toolName: z.string(),
    toolInput: z.unknown(),
});
export const AgentToolEndPayloadSchema = z.object({
    toolName: z.string(),
    toolOutput: z.unknown(),
});
export const AgentTurnStartPayloadSchema = z.object({
    turnId: z.string(),
    userMessage: z.string().optional(),
});
export const AgentTurnEndPayloadSchema = z.object({
    turnId: z.string(),
    finalMessage: z.string().optional(),
});
export const AgentErrorPayloadSchema = z.object({
    errorMessage: z.string(),
    errorCode: z.string().optional(),
    context: z.unknown().optional(),
});
//# sourceMappingURL=copilot-ws-events.js.map