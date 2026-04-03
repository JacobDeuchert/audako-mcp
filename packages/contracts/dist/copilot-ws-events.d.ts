import { z } from 'zod';
export declare function createSessionEventEnvelopeSchema<T extends z.ZodTypeAny>(payloadSchema: T): z.ZodObject<{
    type: z.ZodString;
    sessionId: z.ZodString;
    timestamp: z.ZodString;
    payload: T;
}, "strict", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
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
export type SessionEventEnvelope<T = unknown> = {
    type: string;
    sessionId: string;
    timestamp: string;
    payload: T;
};
export declare const CopilotV1EventNames: readonly ["prompt.send", "prompt.cancel", "question.answer", "session.update", "session.snapshot", "session.updated", "session.closed", "assistant.delta", "assistant.done", "assistant.error", "entity.created", "entity.updated", "entity.moved", "child_task.accepted", "child_task.started", "child_task.completed", "child_task.failed", "child_task.cancelled"];
export declare const CopilotV1EventNameSchema: z.ZodEnum<["prompt.send", "prompt.cancel", "question.answer", "session.update", "session.snapshot", "session.updated", "session.closed", "assistant.delta", "assistant.done", "assistant.error", "entity.created", "entity.updated", "entity.moved", "child_task.accepted", "child_task.started", "child_task.completed", "child_task.failed", "child_task.cancelled"]>;
export type CopilotV1EventName = z.infer<typeof CopilotV1EventNameSchema>;
export declare const CommandNameSchema: z.ZodEnum<["prompt.send", "prompt.cancel", "question.answer", "session.update"]>;
export type CommandName = z.infer<typeof CommandNameSchema>;
export declare const CommandAcknowledgementPayloadSchema: z.ZodObject<{
    commandId: z.ZodString;
    command: z.ZodEnum<["prompt.send", "prompt.cancel", "question.answer", "session.update"]>;
    status: z.ZodEnum<["accepted", "rejected"]>;
    acknowledgedAt: z.ZodString;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        message: string;
        code: string;
    }, {
        message: string;
        code: string;
    }>>;
}, "strict", z.ZodTypeAny, {
    status: "accepted" | "rejected";
    commandId: string;
    command: "prompt.send" | "prompt.cancel" | "question.answer" | "session.update";
    acknowledgedAt: string;
    error?: {
        message: string;
        code: string;
    } | undefined;
}, {
    status: "accepted" | "rejected";
    commandId: string;
    command: "prompt.send" | "prompt.cancel" | "question.answer" | "session.update";
    acknowledgedAt: string;
    error?: {
        message: string;
        code: string;
    } | undefined;
}>;
export type CommandAcknowledgementPayload = z.infer<typeof CommandAcknowledgementPayloadSchema>;
export declare const PromptSendPayloadSchema: z.ZodObject<{
    commandId: z.ZodString;
    content: z.ZodString;
}, "strict", z.ZodTypeAny, {
    commandId: string;
    content: string;
}, {
    commandId: string;
    content: string;
}>;
export type PromptSendPayload = z.infer<typeof PromptSendPayloadSchema>;
export declare const PromptCancelPayloadSchema: z.ZodObject<{
    commandId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    commandId: string;
    reason?: string | undefined;
}, {
    commandId: string;
    reason?: string | undefined;
}>;
export type PromptCancelPayload = z.infer<typeof PromptCancelPayloadSchema>;
export declare const QuestionAskPayloadSchema: z.ZodObject<{
    questionId: z.ZodString;
    request: z.ZodObject<{
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
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    questionId: string;
    request: {
        options: {
            label: string;
            description: string;
        }[];
        text: string;
        header: string;
        allowMultiple?: boolean | undefined;
    };
    expiresAt?: string | undefined;
}, {
    questionId: string;
    request: {
        options: {
            label: string;
            description: string;
        }[];
        text: string;
        header: string;
        allowMultiple?: boolean | undefined;
    };
    expiresAt?: string | undefined;
}>;
export type QuestionAskPayload = z.infer<typeof QuestionAskPayloadSchema>;
export declare const QuestionAnswerPayloadSchema: z.ZodObject<{
    commandId: z.ZodString;
    questionId: z.ZodString;
    answers: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    commandId: string;
    questionId: string;
    answers: string[];
}, {
    commandId: string;
    questionId: string;
    answers: string[];
}>;
export type QuestionAnswerPayload = z.infer<typeof QuestionAnswerPayloadSchema>;
export declare const SessionUpdatePayloadSchema: z.ZodObject<{
    commandId: z.ZodString;
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
}, "strict", z.ZodTypeAny, {
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    };
    commandId: string;
}, {
    sessionInfo: {
        tenantId?: string | undefined;
        groupId?: string | undefined;
        entityType?: string | undefined;
        app?: string | undefined;
    };
    commandId: string;
}>;
export type SessionUpdatePayload = z.infer<typeof SessionUpdatePayloadSchema>;
export type SessionCommand = PromptSendSessionEvent | PromptCancelSessionEvent | QuestionAnswerSessionEvent | SessionUpdateSessionEvent;
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
export declare const SessionUpdatedPayloadSchema: z.ZodObject<{
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
export type SessionUpdatedPayload = z.infer<typeof SessionUpdatedPayloadSchema>;
export declare const SessionClosedEventPayloadSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type SessionClosedEventPayload = z.infer<typeof SessionClosedEventPayloadSchema>;
export declare const AssistantTextDeltaPayloadSchema: z.ZodObject<{
    kind: z.ZodLiteral<"text">;
    index: z.ZodNumber;
    delta: z.ZodString;
}, "strict", z.ZodTypeAny, {
    kind: "text";
    index: number;
    delta: string;
}, {
    kind: "text";
    index: number;
    delta: string;
}>;
export declare const AssistantDeltaPayloadSchema: z.ZodObject<{
    kind: z.ZodLiteral<"text">;
    index: z.ZodNumber;
    delta: z.ZodString;
}, "strict", z.ZodTypeAny, {
    kind: "text";
    index: number;
    delta: string;
}, {
    kind: "text";
    index: number;
    delta: string;
}>;
export type AssistantDeltaPayload = z.infer<typeof AssistantDeltaPayloadSchema>;
export declare const AssistantDonePayloadSchema: z.ZodObject<{
    turnId: z.ZodString;
    finalText: z.ZodString;
    finishReason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    turnId: string;
    finalText: string;
    finishReason: string;
}, {
    turnId: string;
    finalText: string;
    finishReason: string;
}>;
export type AssistantDonePayload = z.infer<typeof AssistantDonePayloadSchema>;
export declare const AssistantErrorPayloadSchema: z.ZodObject<{
    errorMessage: z.ZodString;
    errorCode: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodUnknown>;
}, "strict", z.ZodTypeAny, {
    errorMessage: string;
    errorCode?: string | undefined;
    context?: unknown;
}, {
    errorMessage: string;
    errorCode?: string | undefined;
    context?: unknown;
}>;
export type AssistantErrorPayload = z.infer<typeof AssistantErrorPayloadSchema>;
export declare const EntityEventMetadataCoreSchema: z.ZodObject<{
    tenantId: z.ZodOptional<z.ZodString>;
    sourceTool: z.ZodEnum<["create-entity", "update-entity", "move-entity"]>;
    timestamp: z.ZodString;
}, "strict", z.ZodTypeAny, {
    timestamp: string;
    sourceTool: "create-entity" | "update-entity" | "move-entity";
    tenantId?: string | undefined;
}, {
    timestamp: string;
    sourceTool: "create-entity" | "update-entity" | "move-entity";
    tenantId?: string | undefined;
}>;
export declare const EntityCreatedEventPayloadSchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodString;
    groupId: z.ZodString;
    metadata: z.ZodObject<{
        tenantId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    } & {
        sourceTool: z.ZodLiteral<"create-entity">;
    }, "strict", z.ZodTypeAny, {
        timestamp: string;
        sourceTool: "create-entity";
        tenantId?: string | undefined;
    }, {
        timestamp: string;
        sourceTool: "create-entity";
        tenantId?: string | undefined;
    }>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strict", z.ZodTypeAny, {
    groupId: string;
    entityType: string;
    entityId: string;
    metadata: {
        timestamp: string;
        sourceTool: "create-entity";
        tenantId?: string | undefined;
    };
    data: Record<string, unknown>;
}, {
    groupId: string;
    entityType: string;
    entityId: string;
    metadata: {
        timestamp: string;
        sourceTool: "create-entity";
        tenantId?: string | undefined;
    };
    data: Record<string, unknown>;
}>;
export type EntityCreatedEventPayload = z.infer<typeof EntityCreatedEventPayloadSchema>;
export declare const EntityUpdatedEventPayloadSchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodString;
    groupId: z.ZodString;
    changedFields: z.ZodArray<z.ZodString, "many">;
    changes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    metadata: z.ZodObject<{
        tenantId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    } & {
        sourceTool: z.ZodLiteral<"update-entity">;
    }, "strict", z.ZodTypeAny, {
        timestamp: string;
        sourceTool: "update-entity";
        tenantId?: string | undefined;
    }, {
        timestamp: string;
        sourceTool: "update-entity";
        tenantId?: string | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    groupId: string;
    entityType: string;
    entityId: string;
    metadata: {
        timestamp: string;
        sourceTool: "update-entity";
        tenantId?: string | undefined;
    };
    changedFields: string[];
    changes: Record<string, unknown>;
}, {
    groupId: string;
    entityType: string;
    entityId: string;
    metadata: {
        timestamp: string;
        sourceTool: "update-entity";
        tenantId?: string | undefined;
    };
    changedFields: string[];
    changes: Record<string, unknown>;
}>;
export type EntityUpdatedEventPayload = z.infer<typeof EntityUpdatedEventPayloadSchema>;
export declare const EntityMovedEventPayloadSchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodString;
    sourceGroupId: z.ZodOptional<z.ZodString>;
    targetGroupId: z.ZodString;
    metadata: z.ZodObject<{
        tenantId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    } & {
        sourceTool: z.ZodLiteral<"move-entity">;
    }, "strict", z.ZodTypeAny, {
        timestamp: string;
        sourceTool: "move-entity";
        tenantId?: string | undefined;
    }, {
        timestamp: string;
        sourceTool: "move-entity";
        tenantId?: string | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    entityType: string;
    entityId: string;
    metadata: {
        timestamp: string;
        sourceTool: "move-entity";
        tenantId?: string | undefined;
    };
    targetGroupId: string;
    sourceGroupId?: string | undefined;
}, {
    entityType: string;
    entityId: string;
    metadata: {
        timestamp: string;
        sourceTool: "move-entity";
        tenantId?: string | undefined;
    };
    targetGroupId: string;
    sourceGroupId?: string | undefined;
}>;
export type EntityMovedEventPayload = z.infer<typeof EntityMovedEventPayloadSchema>;
export type PromptSendSessionEvent = SessionEventEnvelope<PromptSendPayload> & {
    type: 'prompt.send';
};
export type PromptCancelSessionEvent = SessionEventEnvelope<PromptCancelPayload> & {
    type: 'prompt.cancel';
};
export type QuestionAnswerSessionEvent = SessionEventEnvelope<QuestionAnswerPayload> & {
    type: 'question.answer';
};
export type SessionUpdateSessionEvent = SessionEventEnvelope<SessionUpdatePayload> & {
    type: 'session.update';
};
export type SessionSnapshotEvent = SessionEventEnvelope<SessionSnapshotPayload> & {
    type: 'session.snapshot';
};
export type SessionUpdatedEvent = SessionEventEnvelope<SessionUpdatedPayload> & {
    type: 'session.updated';
};
export type SessionClosedEvent = SessionEventEnvelope<SessionClosedEventPayload> & {
    type: 'session.closed';
};
export type AssistantDeltaSessionEvent = SessionEventEnvelope<AssistantDeltaPayload> & {
    type: 'assistant.delta';
};
export type AssistantDoneSessionEvent = SessionEventEnvelope<AssistantDonePayload> & {
    type: 'assistant.done';
};
export type AssistantErrorSessionEvent = SessionEventEnvelope<AssistantErrorPayload> & {
    type: 'assistant.error';
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
export declare const ChildTaskAcceptedPayloadSchema: z.ZodObject<{
    childSessionId: z.ZodString;
    parentSessionId: z.ZodString;
    profileName: z.ZodString;
    description: z.ZodString;
    timestamp: z.ZodString;
}, "strict", z.ZodTypeAny, {
    description: string;
    timestamp: string;
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
}, {
    description: string;
    timestamp: string;
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
}>;
export type ChildTaskAcceptedPayload = z.infer<typeof ChildTaskAcceptedPayloadSchema>;
export declare const ChildTaskStartedPayloadSchema: z.ZodObject<{
    childSessionId: z.ZodString;
    parentSessionId: z.ZodString;
    profileName: z.ZodString;
    startedAt: z.ZodString;
}, "strict", z.ZodTypeAny, {
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
    startedAt: string;
}, {
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
    startedAt: string;
}>;
export type ChildTaskStartedPayload = z.infer<typeof ChildTaskStartedPayloadSchema>;
export declare const ChildTaskCompletedPayloadSchema: z.ZodObject<{
    childSessionId: z.ZodString;
    parentSessionId: z.ZodString;
    profileName: z.ZodString;
    completedAt: z.ZodString;
    result: z.ZodOptional<z.ZodUnknown>;
}, "strict", z.ZodTypeAny, {
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
    completedAt: string;
    result?: unknown;
}, {
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
    completedAt: string;
    result?: unknown;
}>;
export type ChildTaskCompletedPayload = z.infer<typeof ChildTaskCompletedPayloadSchema>;
export declare const ChildTaskFailedPayloadSchema: z.ZodObject<{
    childSessionId: z.ZodString;
    parentSessionId: z.ZodString;
    profileName: z.ZodString;
    failedAt: z.ZodString;
    error: z.ZodString;
}, "strict", z.ZodTypeAny, {
    error: string;
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
    failedAt: string;
}, {
    error: string;
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
    failedAt: string;
}>;
export type ChildTaskFailedPayload = z.infer<typeof ChildTaskFailedPayloadSchema>;
export declare const ChildTaskCancelledPayloadSchema: z.ZodObject<{
    childSessionId: z.ZodString;
    parentSessionId: z.ZodString;
    profileName: z.ZodString;
    cancelledAt: z.ZodString;
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
    cancelledAt: string;
}, {
    reason: string;
    childSessionId: string;
    parentSessionId: string;
    profileName: string;
    cancelledAt: string;
}>;
export type ChildTaskCancelledPayload = z.infer<typeof ChildTaskCancelledPayloadSchema>;
export type ChildTaskAcceptedSessionEvent = SessionEventEnvelope<ChildTaskAcceptedPayload> & {
    type: 'child_task.accepted';
};
export type ChildTaskStartedSessionEvent = SessionEventEnvelope<ChildTaskStartedPayload> & {
    type: 'child_task.started';
};
export type ChildTaskCompletedSessionEvent = SessionEventEnvelope<ChildTaskCompletedPayload> & {
    type: 'child_task.completed';
};
export type ChildTaskFailedSessionEvent = SessionEventEnvelope<ChildTaskFailedPayload> & {
    type: 'child_task.failed';
};
export type ChildTaskCancelledSessionEvent = SessionEventEnvelope<ChildTaskCancelledPayload> & {
    type: 'child_task.cancelled';
};
export type KnownCopilotV1SessionEvent = PromptSendSessionEvent | PromptCancelSessionEvent | QuestionAnswerSessionEvent | SessionUpdateSessionEvent | SessionSnapshotEvent | SessionUpdatedEvent | SessionClosedEvent | AssistantDeltaSessionEvent | AssistantDoneSessionEvent | AssistantErrorSessionEvent | EntityCreatedSessionEvent | EntityUpdatedSessionEvent | EntityMovedSessionEvent | ChildTaskAcceptedSessionEvent | ChildTaskStartedSessionEvent | ChildTaskCompletedSessionEvent | ChildTaskFailedSessionEvent | ChildTaskCancelledSessionEvent;
//# sourceMappingURL=copilot-ws-events.d.ts.map