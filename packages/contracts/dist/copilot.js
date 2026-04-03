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
export const SessionBootstrapResponseSchema = z
    .object({
    sessionId: z.string(),
    isNew: z.boolean(),
    scadaUrl: z.string(),
    sessionInfo: SessionInfoSnapshotSchema,
    realtime: RealtimeDescriptorSchema,
})
    .strict();
export function isSessionInfoResponse(value) {
    return SessionInfoResponseSchema.safeParse(value).success;
}
//# sourceMappingURL=copilot.js.map