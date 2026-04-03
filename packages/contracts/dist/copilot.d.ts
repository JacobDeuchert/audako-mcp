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
export declare const RealtimeDescriptorSchema: z.ZodObject<{
    transport: z.ZodLiteral<"socket.io">;
    protocolVersion: z.ZodLiteral<"v1">;
    namespace: z.ZodLiteral<"/session">;
    path: z.ZodLiteral<"/socket.io">;
    auth: z.ZodObject<{
        type: z.ZodLiteral<"session_token">;
        token: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        type: "session_token";
        token: string;
    }, {
        type: "session_token";
        token: string;
    }>;
    room: z.ZodObject<{
        type: z.ZodLiteral<"session">;
        id: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        type: "session";
        id: string;
    }, {
        type: "session";
        id: string;
    }>;
}, "strict", z.ZodTypeAny, {
    path: "/socket.io";
    transport: "socket.io";
    protocolVersion: "v1";
    namespace: "/session";
    auth: {
        type: "session_token";
        token: string;
    };
    room: {
        type: "session";
        id: string;
    };
}, {
    path: "/socket.io";
    transport: "socket.io";
    protocolVersion: "v1";
    namespace: "/session";
    auth: {
        type: "session_token";
        token: string;
    };
    room: {
        type: "session";
        id: string;
    };
}>;
export type RealtimeDescriptor = z.infer<typeof RealtimeDescriptorSchema>;
export declare const SessionBootstrapResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
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
    realtime: z.ZodObject<{
        transport: z.ZodLiteral<"socket.io">;
        protocolVersion: z.ZodLiteral<"v1">;
        namespace: z.ZodLiteral<"/session">;
        path: z.ZodLiteral<"/socket.io">;
        auth: z.ZodObject<{
            type: z.ZodLiteral<"session_token">;
            token: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            type: "session_token";
            token: string;
        }, {
            type: "session_token";
            token: string;
        }>;
        room: z.ZodObject<{
            type: z.ZodLiteral<"session">;
            id: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            type: "session";
            id: string;
        }, {
            type: "session";
            id: string;
        }>;
    }, "strict", z.ZodTypeAny, {
        path: "/socket.io";
        transport: "socket.io";
        protocolVersion: "v1";
        namespace: "/session";
        auth: {
            type: "session_token";
            token: string;
        };
        room: {
            type: "session";
            id: string;
        };
    }, {
        path: "/socket.io";
        transport: "socket.io";
        protocolVersion: "v1";
        namespace: "/session";
        auth: {
            type: "session_token";
            token: string;
        };
        room: {
            type: "session";
            id: string;
        };
    }>;
}, "strict", z.ZodTypeAny, {
    sessionId: string;
    scadaUrl: string;
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
        updatedAt?: string | undefined;
    };
    isNew: boolean;
    realtime: {
        path: "/socket.io";
        transport: "socket.io";
        protocolVersion: "v1";
        namespace: "/session";
        auth: {
            type: "session_token";
            token: string;
        };
        room: {
            type: "session";
            id: string;
        };
    };
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
    isNew: boolean;
    realtime: {
        path: "/socket.io";
        transport: "socket.io";
        protocolVersion: "v1";
        namespace: "/session";
        auth: {
            type: "session_token";
            token: string;
        };
        room: {
            type: "session";
            id: string;
        };
    };
}>;
export type SessionBootstrapResponse = z.infer<typeof SessionBootstrapResponseSchema>;
export declare function isSessionInfoResponse(value: unknown): value is SessionInfoResponse;
export type { AssistantDeltaPayload, AssistantDeltaSessionEvent, AssistantDonePayload, AssistantDoneSessionEvent, AssistantErrorPayload, AssistantErrorSessionEvent, CommandAcknowledgementPayload, CommandName, CopilotV1EventName, EntityCreatedEventPayload, EntityCreatedSessionEvent, EntityMovedEventPayload, EntityMovedSessionEvent, EntityUpdatedEventPayload, EntityUpdatedSessionEvent, KnownCopilotV1SessionEvent, PromptCancelPayload, PromptCancelSessionEvent, PromptSendPayload, PromptSendSessionEvent, QuestionAnswerPayload, QuestionAnswerSessionEvent, QuestionAskPayload, SessionClosedEvent, SessionClosedEventPayload, SessionCommand, SessionEventEnvelope, SessionSnapshotEvent, SessionSnapshotPayload, SessionUpdatedEvent, SessionUpdatedPayload, SessionUpdatePayload, SessionUpdateSessionEvent, } from './copilot-ws-events.js';
//# sourceMappingURL=copilot.d.ts.map