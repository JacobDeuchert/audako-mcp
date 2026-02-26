import { z } from 'zod';
import type { HubResponseSessionEvent } from './backend-bridge-ws-events.js';
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
    opencodeUrl: z.ZodString;
    websocketUrl: z.ZodString;
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
    opencodeUrl: string;
    websocketUrl: string;
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
    opencodeUrl: string;
    websocketUrl: string;
    bridgeSessionToken: string;
    isNew: boolean;
}>;
export type SessionBootstrapResponse = z.infer<typeof SessionBootstrapResponseSchema>;
export declare const PushSessionEventRequestSchema: z.ZodObject<{
    type: z.ZodString;
    payload: z.ZodOptional<z.ZodUnknown>;
}, "strict", z.ZodTypeAny, {
    type: string;
    payload?: unknown;
}, {
    type: string;
    payload?: unknown;
}>;
export type PushSessionEventRequest = z.infer<typeof PushSessionEventRequestSchema>;
export declare const RequestSessionEventRequestSchema: z.ZodObject<{
    type: z.ZodString;
    payload: z.ZodOptional<z.ZodUnknown>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
    longPollMs: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    type: string;
    payload?: unknown;
    timeoutMs?: number | undefined;
    longPollMs?: number | undefined;
}, {
    type: string;
    payload?: unknown;
    timeoutMs?: number | undefined;
    longPollMs?: number | undefined;
}>;
export type RequestSessionEventRequest = z.infer<typeof RequestSessionEventRequestSchema>;
export declare const PushSessionEventResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    deliveredTo: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    deliveredTo: number;
}, {
    sessionId: string;
    deliveredTo: number;
}>;
export type PushSessionEventResponse = z.infer<typeof PushSessionEventResponseSchema>;
export declare const RequestSessionEventResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    requestId: z.ZodString;
    response: z.ZodUnknown;
    respondedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    requestId: string;
    respondedAt: string;
    response?: unknown;
}, {
    sessionId: string;
    requestId: string;
    respondedAt: string;
    response?: unknown;
}>;
export type RequestSessionEventResponse = z.infer<typeof RequestSessionEventResponseSchema>;
export declare const ResolveSessionEventResponseRequestSchema: z.ZodObject<{
    response: z.ZodUnknown;
}, "strict", z.ZodTypeAny, {
    response?: unknown;
}, {
    response?: unknown;
}>;
export type ResolveSessionEventResponseRequest = z.infer<typeof ResolveSessionEventResponseRequestSchema>;
export declare const RequestSessionEventPendingResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    requestId: z.ZodString;
    status: z.ZodLiteral<"pending">;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "pending";
    sessionId: string;
    requestId: string;
    expiresAt: string;
}, {
    status: "pending";
    sessionId: string;
    requestId: string;
    expiresAt: string;
}>;
export type RequestSessionEventPendingResponse = z.infer<typeof RequestSessionEventPendingResponseSchema>;
export declare const RequestSessionEventStatusResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    requestId: z.ZodString;
    status: z.ZodEnum<["pending", "resolved", "expired"]>;
    expiresAt: z.ZodString;
    response: z.ZodOptional<z.ZodUnknown>;
    respondedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "resolved" | "expired";
    sessionId: string;
    requestId: string;
    expiresAt: string;
    response?: unknown;
    respondedAt?: string | undefined;
}, {
    status: "pending" | "resolved" | "expired";
    sessionId: string;
    requestId: string;
    expiresAt: string;
    response?: unknown;
    respondedAt?: string | undefined;
}>;
export type RequestSessionEventStatusResponse = z.infer<typeof RequestSessionEventStatusResponseSchema>;
export declare const ResolveSessionEventResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    requestId: z.ZodString;
    resolved: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    sessionId: string;
    requestId: string;
    resolved: true;
}, {
    sessionId: string;
    requestId: string;
    resolved: true;
}>;
export type ResolveSessionEventResponse = z.infer<typeof ResolveSessionEventResponseSchema>;
export declare function isSessionInfoResponse(value: unknown): value is SessionInfoResponse;
export declare function isRequestSessionEventResponse(value: unknown): value is RequestSessionEventResponse;
export declare function isRequestSessionEventPendingResponse(value: unknown): value is RequestSessionEventPendingResponse;
export declare function isRequestSessionEventStatusResponse(value: unknown): value is RequestSessionEventStatusResponse;
export declare function isHubResponseSessionEvent(value: unknown): value is HubResponseSessionEvent;
export type { BridgeSessionWebSocketEvent, EntityCreatedEventPayload, EntityCreatedSessionEvent, EntityMovedEventPayload, EntityMovedSessionEvent, EntityUpdatedEventPayload, EntityUpdatedSessionEvent, HubRequestPayload, HubRequestSessionEvent, HubResponsePayload, HubResponseSessionEvent, KnownBridgeSessionWebSocketEvent, McpPublishedSessionEvent, QuestionAskHubRequestEvent, QuestionAskHubRequestPayload, SessionClosedEvent, SessionClosedEventPayload, SessionEventEnvelope, SessionInfoUpdatedEvent, SessionSnapshotEvent, SessionSnapshotPayload, } from './backend-bridge-ws-events.js';
//# sourceMappingURL=backend-bridge.d.ts.map