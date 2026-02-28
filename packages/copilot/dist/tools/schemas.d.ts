/**
 * Schema for get-session-info tool (no parameters)
 */
export declare const getSessionInfoSchema: import("@sinclair/typebox").TObject<{}>;
/**
 * Schema for ask-question tool
 * Parameters: question, header, options (array of {label, description}), multiple (optional)
 */
export declare const askQuestionSchema: import("@sinclair/typebox").TObject<{
    question: import("@sinclair/typebox").TString;
    header: import("@sinclair/typebox").TString;
    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        label: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
    }>>;
    multiple: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
/**
 * Schema for list-entity-types tool (no parameters)
 */
export declare const listEntityTypesSchema: import("@sinclair/typebox").TObject<{}>;
/**
 * Schema for get-entity-definition tool
 * Parameters: entityType
 */
export declare const getEntityDefinitionSchema: import("@sinclair/typebox").TObject<{
    entityType: import("@sinclair/typebox").TString;
}>;
/**
 * Schema for get-entity-name tool
 * Parameters: entityType, entityId
 */
export declare const getEntityNameSchema: import("@sinclair/typebox").TObject<{
    entityType: import("@sinclair/typebox").TString;
    entityId: import("@sinclair/typebox").TString;
}>;
/**
 * Schema for get-group-path tool
 * Parameters: groupId
 */
export declare const getGroupPathSchema: import("@sinclair/typebox").TObject<{
    groupId: import("@sinclair/typebox").TString;
}>;
/**
 * Schema for query-entities tool
 * Parameters: scope (enum), scopeId (optional), entityType, filter (record)
 */
export declare const queryEntitiesSchema: import("@sinclair/typebox").TObject<{
    scope: import("@sinclair/typebox").TEnum<{
        group: "group";
        tenant: "tenant";
        global: "global";
    }>;
    scopeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    entityType: import("@sinclair/typebox").TString;
    filter: import("@sinclair/typebox").TObject<{}>;
}>;
/**
 * Schema for create-entity tool
 * Parameters: entityType, payload (record), permissionMode (optional enum)
 */
export declare const createEntitySchema: import("@sinclair/typebox").TObject<{
    entityType: import("@sinclair/typebox").TString;
    payload: import("@sinclair/typebox").TObject<{}>;
    permissionMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"interactive">, import("@sinclair/typebox").TLiteral<"fail_fast">]>>;
}>;
/**
 * Schema for update-entity tool
 * Parameters: entityType, entityId, changes (record), permissionMode (optional enum)
 */
export declare const updateEntitySchema: import("@sinclair/typebox").TObject<{
    entityType: import("@sinclair/typebox").TString;
    entityId: import("@sinclair/typebox").TString;
    changes: import("@sinclair/typebox").TObject<{}>;
    permissionMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"interactive">, import("@sinclair/typebox").TLiteral<"fail_fast">]>>;
}>;
/**
 * Schema for move-entity tool
 * Parameters: entityType, entityId, targetGroupId, permissionMode (optional enum)
 */
export declare const moveEntitySchema: import("@sinclair/typebox").TObject<{
    entityType: import("@sinclair/typebox").TString;
    entityId: import("@sinclair/typebox").TString;
    targetGroupId: import("@sinclair/typebox").TString;
    permissionMode: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"interactive">, import("@sinclair/typebox").TLiteral<"fail_fast">]>>;
}>;
//# sourceMappingURL=schemas.d.ts.map