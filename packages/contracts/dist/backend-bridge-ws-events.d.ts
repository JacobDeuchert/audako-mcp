import { z } from 'zod';
import { type SessionInfoResponse } from './backend-bridge.js';
export declare function createSessionEventEnvelopeSchema<T extends z.ZodTypeAny>(payloadSchema: T): z.ZodObject<{
    type: z.ZodString;
    sessionId: z.ZodString;
    timestamp: z.ZodString;
    payload: T;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    type: z.ZodString;
    sessionId: z.ZodString;
    timestamp: z.ZodString;
    payload: T;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    type: z.ZodString;
    sessionId: z.ZodString;
    timestamp: z.ZodString;
    payload: T;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare function createHubRequestPayloadSchema<T extends z.ZodTypeAny>(payloadSchema: T): z.ZodObject<{
    requestId: z.ZodString;
    requestType: z.ZodString;
    payload: T;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    requestId: z.ZodString;
    requestType: z.ZodString;
    payload: T;
    expiresAt: z.ZodString;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    requestId: z.ZodString;
    requestType: z.ZodString;
    payload: T;
    expiresAt: z.ZodString;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export type SessionEventEnvelope<T = unknown> = {
    type: string;
    sessionId: string;
    timestamp: string;
    payload: T;
};
export type HubRequestPayload<TPayload = unknown> = {
    requestId: string;
    requestType: string;
    payload: TPayload;
    expiresAt: string;
};
export type HubRequestSessionEvent<TPayload = unknown> = SessionEventEnvelope<HubRequestPayload<TPayload>> & {
    type: 'hub.request';
};
export declare const HubResponsePayloadSchema: z.ZodObject<{
    requestId: z.ZodString;
    response: z.ZodUnknown;
    respondedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    requestId: string;
    respondedAt: string;
    response?: unknown;
}, {
    requestId: string;
    respondedAt: string;
    response?: unknown;
}>;
export type HubResponsePayload = z.infer<typeof HubResponsePayloadSchema>;
export type HubResponseSessionEvent = SessionEventEnvelope<HubResponsePayload> & {
    type: 'hub.response';
};
export declare const SessionSnapshotPayloadSchema: z.ZodObject<{
    sessionId: z.ZodString;
    scadaUrl: z.ZodString;
    opencodeUrl: z.ZodString;
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
    isActive: z.ZodBoolean;
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
    isActive: boolean;
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
    isActive: boolean;
}>;
export type SessionSnapshotPayload = z.infer<typeof SessionSnapshotPayloadSchema>;
export declare const SessionClosedEventPayloadSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type SessionClosedEventPayload = z.infer<typeof SessionClosedEventPayloadSchema>;
export declare const EntityCreatedEventPayloadSchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodString;
    tenantId: z.ZodString;
    groupId: z.ZodString;
    sourceTool: z.ZodLiteral<"create-entity">;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    groupId: string;
    entityType: string;
    timestamp: string;
    entityId: string;
    sourceTool: "create-entity";
}, {
    tenantId: string;
    groupId: string;
    entityType: string;
    timestamp: string;
    entityId: string;
    sourceTool: "create-entity";
}>;
export type EntityCreatedEventPayload = z.infer<typeof EntityCreatedEventPayloadSchema>;
export declare const EntityUpdatedEventPayloadSchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodString;
    tenantId: z.ZodString;
    groupId: z.ZodString;
    changedFields: z.ZodArray<z.ZodString, "many">;
    sourceTool: z.ZodLiteral<"update-entity">;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    groupId: string;
    entityType: string;
    timestamp: string;
    entityId: string;
    sourceTool: "update-entity";
    changedFields: string[];
}, {
    tenantId: string;
    groupId: string;
    entityType: string;
    timestamp: string;
    entityId: string;
    sourceTool: "update-entity";
    changedFields: string[];
}>;
export type EntityUpdatedEventPayload = z.infer<typeof EntityUpdatedEventPayloadSchema>;
export declare const EntityMovedEventPayloadSchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodString;
    tenantId: z.ZodString;
    sourceGroupId: z.ZodOptional<z.ZodString>;
    targetGroupId: z.ZodString;
    sourceTool: z.ZodLiteral<"move-entity">;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    entityType: string;
    timestamp: string;
    entityId: string;
    sourceTool: "move-entity";
    targetGroupId: string;
    sourceGroupId?: string | undefined;
}, {
    tenantId: string;
    entityType: string;
    timestamp: string;
    entityId: string;
    sourceTool: "move-entity";
    targetGroupId: string;
    sourceGroupId?: string | undefined;
}>;
export type EntityMovedEventPayload = z.infer<typeof EntityMovedEventPayloadSchema>;
export declare const QuestionAskHubRequestPayloadSchema: z.ZodObject<{
    requestId: z.ZodString;
    payload: z.ZodObject<{
        text: z.ZodString;
        header: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            label: string;
            description: string;
        }, {
            label: string;
            description: string;
        }>, "many">;
        allowMultiple: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        options: {
            label: string;
            description: string;
        }[];
        text: string;
        header: string;
        allowMultiple?: boolean | undefined;
    }, {
        options: {
            label: string;
            description: string;
        }[];
        text: string;
        header: string;
        allowMultiple?: boolean | undefined;
    }>;
    expiresAt: z.ZodString;
} & {
    requestType: z.ZodLiteral<"question.ask">;
}, "strip", z.ZodTypeAny, {
    payload: {
        options: {
            label: string;
            description: string;
        }[];
        text: string;
        header: string;
        allowMultiple?: boolean | undefined;
    };
    requestId: string;
    expiresAt: string;
    requestType: "question.ask";
}, {
    payload: {
        options: {
            label: string;
            description: string;
        }[];
        text: string;
        header: string;
        allowMultiple?: boolean | undefined;
    };
    requestId: string;
    expiresAt: string;
    requestType: "question.ask";
}>;
export type QuestionAskHubRequestPayload = z.infer<typeof QuestionAskHubRequestPayloadSchema>;
export type SessionSnapshotEvent = SessionEventEnvelope<SessionSnapshotPayload> & {
    type: 'session.snapshot';
};
export type SessionInfoUpdatedEvent = SessionEventEnvelope<SessionInfoResponse> & {
    type: 'session.info.updated';
};
export type SessionClosedEvent = SessionEventEnvelope<SessionClosedEventPayload> & {
    type: 'session.closed';
};
export type QuestionAskHubRequestEvent = SessionEventEnvelope<QuestionAskHubRequestPayload> & {
    type: 'hub.request';
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
export type McpPublishedSessionEvent = EntityCreatedSessionEvent | EntityUpdatedSessionEvent | EntityMovedSessionEvent;
export type KnownBridgeSessionWebSocketEvent = SessionSnapshotEvent | SessionInfoUpdatedEvent | SessionClosedEvent | HubRequestSessionEvent | HubResponseSessionEvent | McpPublishedSessionEvent;
export type BridgeSessionWebSocketEvent = KnownBridgeSessionWebSocketEvent | SessionEventEnvelope;
//# sourceMappingURL=backend-bridge-ws-events.d.ts.map