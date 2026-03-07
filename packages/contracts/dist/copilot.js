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
    websocketPath: z.string(),
    sessionId: z.string(),
    bridgeSessionToken: z.string(),
    isNew: z.boolean(),
    scadaUrl: z.string(),
    sessionInfo: SessionInfoSnapshotSchema,
});
export function isSessionInfoResponse(value) {
    return SessionInfoResponseSchema.safeParse(value).success;
}
//# sourceMappingURL=copilot.js.map