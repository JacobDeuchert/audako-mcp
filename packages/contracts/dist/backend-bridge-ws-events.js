import { z } from 'zod';
import { SessionInfoSnapshotSchema } from './backend-bridge.js';
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
    opencodeUrl: z.string(),
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
//# sourceMappingURL=backend-bridge-ws-events.js.map