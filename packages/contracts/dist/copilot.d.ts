import { z } from 'zod';
export declare const SessionInfoFieldsSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodString>;
    app: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tenantId?: string | undefined;
    groupId?: string | undefined;
    entityType?: string | undefined;
    app?: string | undefined;
}, {
    tenantId?: string | undefined;
    groupId?: string | undefined;
    entityType?: string | undefined;
    app?: string | undefined;
}>;
export type SessionInfoFields = z.infer<typeof SessionInfoFieldsSchema>;
export declare const SessionInfoSnapshotSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodString>;
    app: z.ZodOptional<z.ZodString>;
} & {
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tenantId?: string | undefined;
    groupId?: string | undefined;
    entityType?: string | undefined;
    app?: string | undefined;
    updatedAt?: string | undefined;
}, {
    tenantId?: string | undefined;
    groupId?: string | undefined;
    entityType?: string | undefined;
    app?: string | undefined;
    updatedAt?: string | undefined;
}>;
export type SessionInfoSnapshot = z.infer<typeof SessionInfoSnapshotSchema>;
export declare const SessionInfoResponseSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    entityType: z.ZodOptional<z.ZodString>;
    app: z.ZodOptional<z.ZodString>;
} & {
    updatedAt: z.ZodOptional<z.ZodString>;
} & {
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    tenantId?: string | undefined;
    groupId?: string | undefined;
    entityType?: string | undefined;
    app?: string | undefined;
    updatedAt?: string | undefined;
}, {
    sessionId: string;
    tenantId?: string | undefined;
    groupId?: string | undefined;
    entityType?: string | undefined;
    app?: string | undefined;
    updatedAt?: string | undefined;
}>;
export type SessionInfoResponse = z.infer<typeof SessionInfoResponseSchema>;
export declare const SessionBootstrapRequestSchema: z.ZodObject<{
    scadaUrl: z.ZodString;
    accessToken: z.ZodString;
    sessionInfo: z.ZodOptional<z.ZodObject<{
        tenantId: z.ZodOptional<z.ZodString>;
        groupId: z.ZodOptional<z.ZodString>;
        entityType: z.ZodOptional<z.ZodString>;
        app: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    }, {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    scadaUrl: string;
    accessToken: string;
    sessionInfo?: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    } | undefined;
}, {
    scadaUrl: string;
    accessToken: string;
    sessionInfo?: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    } | undefined;
}>;
export type SessionBootstrapRequest = z.infer<typeof SessionBootstrapRequestSchema>;
export declare const SessionBootstrapResponseSchema: z.ZodObject<{
    websocketPath: z.ZodString;
    sessionId: z.ZodString;
    bridgeSessionToken: z.ZodString;
    isNew: z.ZodBoolean;
    scadaUrl: z.ZodString;
    sessionInfo: z.ZodObject<{
        tenantId: z.ZodOptional<z.ZodString>;
        groupId: z.ZodOptional<z.ZodString>;
        entityType: z.ZodOptional<z.ZodString>;
        app: z.ZodOptional<z.ZodString>;
    } & {
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
        updatedAt?: string | undefined;
    }, {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
        updatedAt?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    scadaUrl: string;
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
        updatedAt?: string | undefined;
    };
    websocketPath: string;
    bridgeSessionToken: string;
    isNew: boolean;
}, {
    sessionId: string;
    scadaUrl: string;
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
        updatedAt?: string | undefined;
    };
    websocketPath: string;
    bridgeSessionToken: string;
    isNew: boolean;
}>;
export type SessionBootstrapResponse = z.infer<typeof SessionBootstrapResponseSchema>;
export declare function isSessionInfoResponse(value: unknown): value is SessionInfoResponse;
export type { BridgeSessionWebSocketEvent, EntityCreatedEventPayload, EntityCreatedSessionEvent, EntityMovedEventPayload, EntityMovedSessionEvent, EntityUpdatedEventPayload, EntityUpdatedSessionEvent, HubRequestPayload, HubRequestSessionEvent, HubResponsePayload, HubResponseSessionEvent, KnownBridgeSessionWebSocketEvent, McpPublishedSessionEvent, QuestionAskHubRequestEvent, QuestionAskHubRequestPayload, SessionClosedEvent, SessionClosedEventPayload, SessionEventEnvelope, SessionInfoUpdatedEvent, SessionSnapshotEvent, SessionSnapshotPayload, } from './copilot-ws-events.js';
//# sourceMappingURL=copilot.d.ts.map