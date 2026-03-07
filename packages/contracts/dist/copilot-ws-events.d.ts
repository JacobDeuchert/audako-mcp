import { z } from 'zod';
import { type SessionInfoResponse } from './copilot.js';
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
/** Minimal WebSocket interface for session event fanout */
export interface SessionSocket {
    readyState: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    on?(event: string, handler: (...args: any[]) => void): void;
    ping?(): void;
}
export declare const BridgeSessionWebSocketUserMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"user_message">;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "user_message";
    content: string;
}, {
    type: "user_message";
    content: string;
}>;
export type BridgeSessionWebSocketUserMessage = z.infer<typeof BridgeSessionWebSocketUserMessageSchema>;
export declare const BridgeSessionWebSocketPingMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"ping">;
}, "strip", z.ZodTypeAny, {
    type: "ping";
}, {
    type: "ping";
}>;
export type BridgeSessionWebSocketPingMessage = z.infer<typeof BridgeSessionWebSocketPingMessageSchema>;
export declare const BridgeSessionWebSocketCancelMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"cancel">;
}, "strip", z.ZodTypeAny, {
    type: "cancel";
}, {
    type: "cancel";
}>;
export type BridgeSessionWebSocketCancelMessage = z.infer<typeof BridgeSessionWebSocketCancelMessageSchema>;
export declare const BridgeSessionWebSocketHubResponseMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"hub.response">;
    requestId: z.ZodString;
    response: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    type: "hub.response";
    requestId: string;
    response?: unknown;
}, {
    type: "hub.response";
    requestId: string;
    response?: unknown;
}>;
export type BridgeSessionWebSocketHubResponseMessage = z.infer<typeof BridgeSessionWebSocketHubResponseMessageSchema>;
export declare const BridgeSessionWebSocketSessionInfoUpdateMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"session.info.update">;
    sessionInfo: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    type: "session.info.update";
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    };
}, {
    type: "session.info.update";
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    };
}>;
export type BridgeSessionWebSocketSessionInfoUpdateMessage = z.infer<typeof BridgeSessionWebSocketSessionInfoUpdateMessageSchema>;
export declare const BridgeSessionWebSocketClientMessageSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"user_message">;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "user_message";
    content: string;
}, {
    type: "user_message";
    content: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"ping">;
}, "strip", z.ZodTypeAny, {
    type: "ping";
}, {
    type: "ping";
}>, z.ZodObject<{
    type: z.ZodLiteral<"cancel">;
}, "strip", z.ZodTypeAny, {
    type: "cancel";
}, {
    type: "cancel";
}>, z.ZodObject<{
    type: z.ZodLiteral<"hub.response">;
    requestId: z.ZodString;
    response: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    type: "hub.response";
    requestId: string;
    response?: unknown;
}, {
    type: "hub.response";
    requestId: string;
    response?: unknown;
}>, z.ZodObject<{
    type: z.ZodLiteral<"session.info.update">;
    sessionInfo: z.ZodObject<{
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
}, "strip", z.ZodTypeAny, {
    type: "session.info.update";
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    };
}, {
    type: "session.info.update";
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    };
}>]>;
export type BridgeSessionWebSocketClientMessage = z.infer<typeof BridgeSessionWebSocketClientMessageSchema>;
export declare function isBridgeSessionWebSocketClientMessage(value: unknown): value is BridgeSessionWebSocketClientMessage;
export declare const BridgeSessionWebSocketPongMessageSchema: z.ZodObject<{
    type: z.ZodLiteral<"pong">;
}, "strip", z.ZodTypeAny, {
    type: "pong";
}, {
    type: "pong";
}>;
export type BridgeSessionWebSocketPongMessage = z.infer<typeof BridgeSessionWebSocketPongMessageSchema>;
export type BridgeSessionWebSocketControlMessage = BridgeSessionWebSocketPongMessage;
export declare function isBridgeSessionWebSocketControlMessage(value: unknown): value is BridgeSessionWebSocketControlMessage;
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
    requestType: "question.ask";
    expiresAt: string;
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
    requestType: "question.ask";
    expiresAt: string;
}>;
export type QuestionAskHubRequestPayload = z.infer<typeof QuestionAskHubRequestPayloadSchema>;
export declare const AgentTextDeltaPayloadSchema: z.ZodObject<{
    index: z.ZodNumber;
    delta: z.ZodString;
}, "strip", z.ZodTypeAny, {
    index: number;
    delta: string;
}, {
    index: number;
    delta: string;
}>;
export type AgentTextDeltaPayload = z.infer<typeof AgentTextDeltaPayloadSchema>;
export type AgentTextDeltaSessionEvent = SessionEventEnvelope<AgentTextDeltaPayload> & {
    type: 'agent.text_delta';
};
export declare const AgentToolStartPayloadSchema: z.ZodObject<{
    toolName: z.ZodString;
    toolInput: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    toolName: string;
    toolInput?: unknown;
}, {
    toolName: string;
    toolInput?: unknown;
}>;
export type AgentToolStartPayload = z.infer<typeof AgentToolStartPayloadSchema>;
export type AgentToolStartSessionEvent = SessionEventEnvelope<AgentToolStartPayload> & {
    type: 'agent.tool_start';
};
export declare const AgentToolEndPayloadSchema: z.ZodObject<{
    toolName: z.ZodString;
    toolOutput: z.ZodUnknown;
}, "strip", z.ZodTypeAny, {
    toolName: string;
    toolOutput?: unknown;
}, {
    toolName: string;
    toolOutput?: unknown;
}>;
export type AgentToolEndPayload = z.infer<typeof AgentToolEndPayloadSchema>;
export type AgentToolEndSessionEvent = SessionEventEnvelope<AgentToolEndPayload> & {
    type: 'agent.tool_end';
};
export declare const AgentTurnStartPayloadSchema: z.ZodObject<{
    turnId: z.ZodString;
    userMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    turnId: string;
    userMessage?: string | undefined;
}, {
    turnId: string;
    userMessage?: string | undefined;
}>;
export type AgentTurnStartPayload = z.infer<typeof AgentTurnStartPayloadSchema>;
export type AgentTurnStartSessionEvent = SessionEventEnvelope<AgentTurnStartPayload> & {
    type: 'agent.turn_start';
};
export declare const AgentTurnEndPayloadSchema: z.ZodObject<{
    turnId: z.ZodString;
    finalMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    turnId: string;
    finalMessage?: string | undefined;
}, {
    turnId: string;
    finalMessage?: string | undefined;
}>;
export type AgentTurnEndPayload = z.infer<typeof AgentTurnEndPayloadSchema>;
export type AgentTurnEndSessionEvent = SessionEventEnvelope<AgentTurnEndPayload> & {
    type: 'agent.turn_end';
};
export declare const AgentErrorPayloadSchema: z.ZodObject<{
    errorMessage: z.ZodString;
    errorCode: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    errorMessage: string;
    errorCode?: string | undefined;
    context?: unknown;
}, {
    errorMessage: string;
    errorCode?: string | undefined;
    context?: unknown;
}>;
export type AgentErrorPayload = z.infer<typeof AgentErrorPayloadSchema>;
export type AgentErrorSessionEvent = SessionEventEnvelope<AgentErrorPayload> & {
    type: 'agent.error';
};
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
export type AgentSessionEvent = AgentTextDeltaSessionEvent | AgentToolStartSessionEvent | AgentToolEndSessionEvent | AgentTurnStartSessionEvent | AgentTurnEndSessionEvent | AgentErrorSessionEvent;
export type KnownBridgeSessionWebSocketEvent = SessionSnapshotEvent | SessionInfoUpdatedEvent | SessionClosedEvent | HubRequestSessionEvent | HubResponseSessionEvent | McpPublishedSessionEvent | AgentSessionEvent;
export type BridgeSessionWebSocketEvent = KnownBridgeSessionWebSocketEvent | SessionEventEnvelope;
export type BridgeSessionWebSocketServerMessage = BridgeSessionWebSocketEvent | BridgeSessionWebSocketControlMessage;
//# sourceMappingURL=copilot-ws-events.d.ts.map