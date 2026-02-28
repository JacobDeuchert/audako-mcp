import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import { askQuestionSchema, createEntitySchema, getEntityDefinitionSchema, getEntityNameSchema, getGroupPathSchema, getSessionInfoSchema, listEntityTypesSchema, moveEntitySchema, queryEntitiesSchema, updateEntitySchema, } from '../schemas.js';
describe('Tool Schemas', () => {
    describe('getSessionInfoSchema', () => {
        it('should accept empty object', () => {
            const result = Value.Check(getSessionInfoSchema, {});
            expect(result).toBe(true);
        });
        it('should reject non-object', () => {
            const result = Value.Check(getSessionInfoSchema, 'invalid');
            expect(result).toBe(false);
        });
        it('should reject with extra properties', () => {
            const result = Value.Check(getSessionInfoSchema, { extra: 'prop' });
            expect(result).toBe(false);
        });
    });
    describe('askQuestionSchema', () => {
        it('should accept valid question input', () => {
            const input = {
                question: 'Do you want to continue?',
                header: 'Confirm Action',
                options: [
                    { label: 'Yes', description: 'Continue with operation' },
                    { label: 'No', description: 'Cancel operation' },
                ],
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(true);
        });
        it('should accept with multiple flag', () => {
            const input = {
                question: 'Which items?',
                header: 'Select Items',
                options: [
                    { label: 'Item1', description: 'First item' },
                    { label: 'Item2', description: 'Second item' },
                ],
                multiple: true,
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(true);
        });
        it('should reject missing question', () => {
            const input = {
                header: 'Header',
                options: [{ label: 'Yes', description: 'Yes' }],
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing header', () => {
            const input = {
                question: 'Question?',
                options: [{ label: 'Yes', description: 'Yes' }],
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing options', () => {
            const input = {
                question: 'Question?',
                header: 'Header',
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(false);
        });
        it('should reject empty options array', () => {
            const input = {
                question: 'Question?',
                header: 'Header',
                options: [],
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(false);
        });
        it('should reject option missing label', () => {
            const input = {
                question: 'Question?',
                header: 'Header',
                options: [{ description: 'Just description' }],
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(false);
        });
        it('should reject option missing description', () => {
            const input = {
                question: 'Question?',
                header: 'Header',
                options: [{ label: 'Just label' }],
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-boolean multiple', () => {
            const input = {
                question: 'Question?',
                header: 'Header',
                options: [{ label: 'Yes', description: 'Yes' }],
                multiple: 'true',
            };
            const result = Value.Check(askQuestionSchema, input);
            expect(result).toBe(false);
        });
    });
    describe('listEntityTypesSchema', () => {
        it('should accept empty object', () => {
            const result = Value.Check(listEntityTypesSchema, {});
            expect(result).toBe(true);
        });
        it('should reject with properties', () => {
            const result = Value.Check(listEntityTypesSchema, { prop: 'value' });
            expect(result).toBe(false);
        });
    });
    describe('getEntityDefinitionSchema', () => {
        it('should accept with entityType string', () => {
            const input = { entityType: 'Signal' };
            const result = Value.Check(getEntityDefinitionSchema, input);
            expect(result).toBe(true);
        });
        it('should accept with different entityType', () => {
            const input = { entityType: 'Group' };
            const result = Value.Check(getEntityDefinitionSchema, input);
            expect(result).toBe(true);
        });
        it('should reject missing entityType', () => {
            const input = {};
            const result = Value.Check(getEntityDefinitionSchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string entityType', () => {
            const input = { entityType: 123 };
            const result = Value.Check(getEntityDefinitionSchema, input);
            expect(result).toBe(false);
        });
    });
    describe('getEntityNameSchema', () => {
        it('should accept with entityType and entityId', () => {
            const input = { entityType: 'Signal', entityId: 'sig-123' };
            const result = Value.Check(getEntityNameSchema, input);
            expect(result).toBe(true);
        });
        it('should reject missing entityType', () => {
            const input = { entityId: 'sig-123' };
            const result = Value.Check(getEntityNameSchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing entityId', () => {
            const input = { entityType: 'Signal' };
            const result = Value.Check(getEntityNameSchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string entityType', () => {
            const input = { entityType: 123, entityId: 'sig-123' };
            const result = Value.Check(getEntityNameSchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string entityId', () => {
            const input = { entityType: 'Signal', entityId: 456 };
            const result = Value.Check(getEntityNameSchema, input);
            expect(result).toBe(false);
        });
    });
    describe('getGroupPathSchema', () => {
        it('should accept with groupId', () => {
            const input = { groupId: 'group-123' };
            const result = Value.Check(getGroupPathSchema, input);
            expect(result).toBe(true);
        });
        it('should reject missing groupId', () => {
            const input = {};
            const result = Value.Check(getGroupPathSchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string groupId', () => {
            const input = { groupId: 789 };
            const result = Value.Check(getGroupPathSchema, input);
            expect(result).toBe(false);
        });
    });
    describe('queryEntitiesSchema', () => {
        it('should accept valid query with group scope', () => {
            const input = {
                scope: 'group',
                entityType: 'Signal',
                filter: { Name: 'test' },
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(true);
        });
        it('should accept with scopeId', () => {
            const input = {
                scope: 'group',
                scopeId: 'group-456',
                entityType: 'Signal',
                filter: { Name: 'test' },
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(true);
        });
        it('should accept tenant scope', () => {
            const input = {
                scope: 'tenant',
                entityType: 'Signal',
                filter: {},
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(true);
        });
        it('should accept global scope', () => {
            const input = {
                scope: 'global',
                entityType: 'Signal',
                filter: { $or: [{ Name: 'a' }, { Name: 'b' }] },
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(true);
        });
        it('should reject invalid scope', () => {
            const input = {
                scope: 'invalid',
                entityType: 'Signal',
                filter: {},
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing scope', () => {
            const input = {
                entityType: 'Signal',
                filter: {},
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing entityType', () => {
            const input = {
                scope: 'group',
                filter: {},
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing filter', () => {
            const input = {
                scope: 'group',
                entityType: 'Signal',
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-object filter', () => {
            const input = {
                scope: 'group',
                entityType: 'Signal',
                filter: 'not an object',
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string scope', () => {
            const input = {
                scope: 123,
                entityType: 'Signal',
                filter: {},
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string scopeId when provided', () => {
            const input = {
                scope: 'group',
                scopeId: 123,
                entityType: 'Signal',
                filter: {},
            };
            const result = Value.Check(queryEntitiesSchema, input);
            expect(result).toBe(false);
        });
    });
    describe('createEntitySchema', () => {
        it('should accept valid entity creation', () => {
            const input = {
                entityType: 'Signal',
                payload: { name: 'Test Signal', groupId: 'group-123' },
            };
            const result = Value.Check(createEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should accept with interactive permission mode', () => {
            const input = {
                entityType: 'Signal',
                payload: { name: 'Test' },
                permissionMode: 'interactive',
            };
            const result = Value.Check(createEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should accept with fail_fast permission mode', () => {
            const input = {
                entityType: 'Signal',
                payload: { name: 'Test' },
                permissionMode: 'fail_fast',
            };
            const result = Value.Check(createEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should reject missing entityType', () => {
            const input = {
                payload: { name: 'Test' },
            };
            const result = Value.Check(createEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing payload', () => {
            const input = {
                entityType: 'Signal',
            };
            const result = Value.Check(createEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-object payload', () => {
            const input = {
                entityType: 'Signal',
                payload: 'not an object',
            };
            const result = Value.Check(createEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject invalid permission mode', () => {
            const input = {
                entityType: 'Signal',
                payload: { name: 'Test' },
                permissionMode: 'invalid',
            };
            const result = Value.Check(createEntitySchema, input);
            expect(result).toBe(false);
        });
    });
    describe('updateEntitySchema', () => {
        it('should accept valid entity update', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                changes: { name: 'Updated' },
            };
            const result = Value.Check(updateEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should accept with interactive permission mode', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                changes: { name: 'Updated' },
                permissionMode: 'interactive',
            };
            const result = Value.Check(updateEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should accept with fail_fast permission mode', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                changes: { name: 'Updated' },
                permissionMode: 'fail_fast',
            };
            const result = Value.Check(updateEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should reject missing entityType', () => {
            const input = {
                entityId: 'sig-123',
                changes: { name: 'Updated' },
            };
            const result = Value.Check(updateEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing entityId', () => {
            const input = {
                entityType: 'Signal',
                changes: { name: 'Updated' },
            };
            const result = Value.Check(updateEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing changes', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
            };
            const result = Value.Check(updateEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-object changes', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                changes: 'not an object',
            };
            const result = Value.Check(updateEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject invalid permission mode', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                changes: { name: 'Updated' },
                permissionMode: 'invalid',
            };
            const result = Value.Check(updateEntitySchema, input);
            expect(result).toBe(false);
        });
    });
    describe('moveEntitySchema', () => {
        it('should accept valid entity move', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                targetGroupId: 'group-456',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should accept with interactive permission mode', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                targetGroupId: 'group-456',
                permissionMode: 'interactive',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should accept with fail_fast permission mode', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                targetGroupId: 'group-456',
                permissionMode: 'fail_fast',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(true);
        });
        it('should reject missing entityType', () => {
            const input = {
                entityId: 'sig-123',
                targetGroupId: 'group-456',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing entityId', () => {
            const input = {
                entityType: 'Signal',
                targetGroupId: 'group-456',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject missing targetGroupId', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string entityType', () => {
            const input = {
                entityType: 123,
                entityId: 'sig-123',
                targetGroupId: 'group-456',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string entityId', () => {
            const input = {
                entityType: 'Signal',
                entityId: 456,
                targetGroupId: 'group-456',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject non-string targetGroupId', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                targetGroupId: 789,
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(false);
        });
        it('should reject invalid permission mode', () => {
            const input = {
                entityType: 'Signal',
                entityId: 'sig-123',
                targetGroupId: 'group-456',
                permissionMode: 'invalid',
            };
            const result = Value.Check(moveEntitySchema, input);
            expect(result).toBe(false);
        });
    });
});
//# sourceMappingURL=schemas.test.js.map