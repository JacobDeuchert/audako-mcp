import { z } from 'zod';
export const SessionInfoFieldsSchema = z.object({
    tenantId: z.string().optional(),
    groupId: z.string().optional(),
    entityType: z.string().optional(),
    app: z.string().optional(),
});
export const SessionInfoSnapshotSchema = SessionInfoFieldsSchema.extend({
    updatedAt: z.string().optional(),
});
export const SessionInfoResponseSchema = SessionInfoSnapshotSchema.extend({
    sessionId: z.string(),
});
export const SessionBootstrapRequestSchema = z
    .object({
    scadaUrl: z.string(),
    accessToken: z.string(),
    sessionInfo: SessionInfoFieldsSchema.optional(),
})
    .strict();
export const SessionBootstrapResponseSchema = z.object({
    websocketUrl: z.string(),
    sessionId: z.string(),
    bridgeSessionToken: z.string(),
    isNew: z.boolean(),
    scadaUrl: z.string(),
    sessionInfo: SessionInfoSnapshotSchema,
});
export const PushSessionEventRequestSchema = z
    .object({
    type: z.string(),
    payload: z.unknown().optional(),
})
    .strict();
export const RequestSessionEventRequestSchema = z
    .object({
    type: z.string(),
    payload: z.unknown().optional(),
    timeoutMs: z.number().optional(),
    longPollMs: z.number().optional(),
})
    .strict();
export const PushSessionEventResponseSchema = z.object({
    sessionId: z.string(),
    deliveredTo: z.number(),
});
export const RequestSessionEventResponseSchema = z.object({
    sessionId: z.string(),
    requestId: z.string(),
    response: z.unknown(),
    respondedAt: z.string(),
});
export const ResolveSessionEventResponseRequestSchema = z
    .object({
    response: z.unknown(),
})
    .strict();
export const RequestSessionEventPendingResponseSchema = z.object({
    sessionId: z.string(),
    requestId: z.string(),
    status: z.literal('pending'),
    expiresAt: z.string(),
});
export const RequestSessionEventStatusResponseSchema = z.object({
    sessionId: z.string(),
    requestId: z.string(),
    status: z.enum(['pending', 'resolved', 'expired']),
    expiresAt: z.string(),
    response: z.unknown().optional(),
    respondedAt: z.string().optional(),
});
export const ResolveSessionEventResponseSchema = z.object({
    sessionId: z.string(),
    requestId: z.string(),
    resolved: z.literal(true),
});
export function isSessionInfoResponse(value) {
    return SessionInfoResponseSchema.safeParse(value).success;
}
export function isRequestSessionEventResponse(value) {
    return RequestSessionEventResponseSchema.safeParse(value).success;
}
export function isRequestSessionEventPendingResponse(value) {
    return RequestSessionEventPendingResponseSchema.safeParse(value).success;
}
export function isRequestSessionEventStatusResponse(value) {
    return RequestSessionEventStatusResponseSchema.safeParse(value).success;
}
export function isHubResponseSessionEvent(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        value.type === 'hub.response' &&
        'payload' in value &&
        typeof value.payload === 'object' &&
        value.payload !== null &&
        'requestId' in value.payload &&
        typeof value.payload.requestId === 'string' &&
        'response' in value.payload &&
        'respondedAt' in value.payload &&
        typeof value.payload.respondedAt === 'string');
}
//# sourceMappingURL=copilot.js.map