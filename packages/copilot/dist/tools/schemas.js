import { Type } from '@sinclair/typebox';
/**
 * Schema for get-session-info tool (no parameters)
 */
export const getSessionInfoSchema = Type.Object({}, { additionalProperties: false });
/**
 * Schema for ask-question tool
 * Parameters: question, header, options (array of {label, description}), multiple (optional)
 */
export const askQuestionSchema = Type.Object({
    question: Type.String({ description: 'Complete question' }),
    header: Type.String({ description: 'Very short label (max 30 chars)' }),
    options: Type.Array(Type.Object({
        label: Type.String({ description: 'Display text (1-5 words, concise)' }),
        description: Type.String({ description: 'Explanation of choice' }),
    }), {
        minItems: 1,
        description: 'Available choices',
    }),
    multiple: Type.Optional(Type.Boolean({ description: 'Allow selecting multiple choices' })),
});
/**
 * Schema for list-entity-types tool (no parameters)
 */
export const listEntityTypesSchema = Type.Object({}, { additionalProperties: false });
/**
 * Schema for get-entity-definition tool
 * Parameters: entityType
 */
export const getEntityDefinitionSchema = Type.Object({
    entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
});
/**
 * Schema for get-entity-name tool
 * Parameters: entityType, entityId
 */
export const getEntityNameSchema = Type.Object({
    entityType: Type.String({ description: "Entity type name, for example 'Signal' or 'Group'." }),
    entityId: Type.String({ description: 'The ID of the entity to resolve.' }),
});
/**
 * Schema for get-group-path tool
 * Parameters: groupId
 */
export const getGroupPathSchema = Type.Object({
    groupId: Type.String({ description: 'The group ID to resolve.' }),
});
/**
 * Schema for query-entities tool
 * Parameters: scope (enum), scopeId (optional), entityType, filter (record)
 */
export const queryEntitiesSchema = Type.Object({
    scope: Type.Enum({ group: 'group', tenant: 'tenant', global: 'global' }, {
        description: 'Scope for the query.',
    }),
    scopeId: Type.Optional(Type.String({
        description: 'Optional scope identifier. If omitted, groupId or tenantId is taken from session info based on scope.',
    })),
    entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
    filter: Type.Object({}, {
        additionalProperties: true,
        description: 'REQUIRED: Mongo-style filter object that supports logical operators like $and, $or, $not, and $nor.',
    }),
});
/**
 * Schema for create-entity tool
 * Parameters: entityType, payload (record), permissionMode (optional enum)
 */
export const createEntitySchema = Type.Object({
    entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
    payload: Type.Object({}, {
        additionalProperties: true,
        description: 'REQUIRED: Entity payload. Use get-entity-definition before creating',
    }),
    permissionMode: Type.Optional(Type.Union([Type.Literal('interactive'), Type.Literal('fail_fast')], {
        description: 'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
    })),
});
/**
 * Schema for update-entity tool
 * Parameters: entityType, entityId, changes (record), permissionMode (optional enum)
 */
export const updateEntitySchema = Type.Object({
    entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
    entityId: Type.String({ description: 'The ID of the entity to update.' }),
    changes: Type.Object({}, {
        additionalProperties: true,
        description: 'Partial field updates. Use get-entity-definition first.',
    }),
    permissionMode: Type.Optional(Type.Union([Type.Literal('interactive'), Type.Literal('fail_fast')], {
        description: 'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
    })),
});
/**
 * Schema for move-entity tool
 * Parameters: entityType, entityId, targetGroupId, permissionMode (optional enum)
 */
export const moveEntitySchema = Type.Object({
    entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
    entityId: Type.String({ description: 'The ID of the entity to move.' }),
    targetGroupId: Type.String({ description: 'The ID of the destination group.' }),
    permissionMode: Type.Optional(Type.Union([Type.Literal('interactive'), Type.Literal('fail_fast')], {
        description: 'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
    })),
});
//# sourceMappingURL=schemas.js.map