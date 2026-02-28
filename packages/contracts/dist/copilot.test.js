import { describe, expect, it } from 'vitest';
import { RequestSessionEventResponseSchema, SessionBootstrapResponseSchema, SessionInfoResponseSchema, } from '../src/copilot.js';
import { AgentErrorPayloadSchema, AgentTextDeltaPayloadSchema, AgentToolEndPayloadSchema, AgentToolStartPayloadSchema, AgentTurnEndPayloadSchema, AgentTurnStartPayloadSchema, SessionSnapshotPayloadSchema, } from '../src/copilot-ws-events.js';
describe('@audako/contracts - Copilot Schemas', () => {
    describe('SessionBootstrapResponseSchema', () => {
        it('should validate correct bootstrap response without opencodeUrl', () => {
            const validResponse = {
                websocketUrl: 'wss://example.com/ws',
                sessionId: 'sess_123',
                bridgeSessionToken: 'token_abc',
                isNew: true,
                scadaUrl: 'https://scada.example.com',
                sessionInfo: {
                    tenantId: 'tenant_1',
                    groupId: 'group_1',
                    updatedAt: '2025-01-01T00:00:00Z',
                },
            };
            const result = SessionBootstrapResponseSchema.safeParse(validResponse);
            expect(result.success).toBe(true);
        });
        it('should reject bootstrap response with opencodeUrl', () => {
            const invalidResponse = {
                opencodeUrl: 'https://opencode.example.com',
                websocketUrl: 'wss://example.com/ws',
                sessionId: 'sess_123',
                bridgeSessionToken: 'token_abc',
                isNew: true,
                scadaUrl: 'https://scada.example.com',
                sessionInfo: {
                    tenantId: 'tenant_1',
                    groupId: 'group_1',
                    updatedAt: '2025-01-01T00:00:00Z',
                },
            };
            const result = SessionBootstrapResponseSchema.safeParse(invalidResponse);
            expect(result.success).toBe(false);
        });
        it('should require websocketUrl and sessionId', () => {
            const missingFields = {
                bridgeSessionToken: 'token_abc',
                isNew: true,
                scadaUrl: 'https://scada.example.com',
                sessionInfo: {},
            };
            const result = SessionBootstrapResponseSchema.safeParse(missingFields);
            expect(result.success).toBe(false);
        });
    });
    describe('Agent Event Schemas', () => {
        it('AgentTextDeltaPayloadSchema should validate text delta events', () => {
            const payload = {
                index: 0,
                delta: 'Hello, ',
            };
            const result = AgentTextDeltaPayloadSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
        it('AgentToolStartPayloadSchema should validate tool start events', () => {
            const payload = {
                toolName: 'create-entity',
                toolInput: { entityType: 'customer', name: 'John' },
            };
            const result = AgentToolStartPayloadSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
        it('AgentToolEndPayloadSchema should validate tool end events', () => {
            const payload = {
                toolName: 'create-entity',
                toolOutput: { entityId: 'entity_123', created: true },
            };
            const result = AgentToolEndPayloadSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
        it('AgentTurnStartPayloadSchema should validate turn start events', () => {
            const payload = {
                turnId: 'turn_1',
                userMessage: 'Create a new customer',
            };
            const result = AgentTurnStartPayloadSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
        it('AgentTurnEndPayloadSchema should validate turn end events', () => {
            const payload = {
                turnId: 'turn_1',
                finalMessage: 'Customer created successfully',
            };
            const result = AgentTurnEndPayloadSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
        it('AgentErrorPayloadSchema should validate error events', () => {
            const payload = {
                errorMessage: 'Failed to create entity',
                errorCode: 'ENTITY_CREATE_FAILED',
                context: { entityType: 'customer' },
            };
            const result = AgentErrorPayloadSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
        it('AgentErrorPayloadSchema should allow minimal error', () => {
            const payload = {
                errorMessage: 'Unknown error',
            };
            const result = AgentErrorPayloadSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
    });
    describe('SessionSnapshotPayloadSchema', () => {
        it('should validate snapshot without opencodeUrl', () => {
            const payload = {
                sessionId: 'sess_123',
                scadaUrl: 'https://scada.example.com',
                sessionInfo: {
                    tenantId: 'tenant_1',
                    groupId: 'group_1',
                },
                isActive: true,
            };
            const result = SessionSnapshotPayloadSchema.safeParse(payload);
            expect(result.success).toBe(true);
        });
        it('should reject snapshot with opencodeUrl', () => {
            const payload = {
                sessionId: 'sess_123',
                scadaUrl: 'https://scada.example.com',
                opencodeUrl: 'https://opencode.example.com',
                sessionInfo: {
                    tenantId: 'tenant_1',
                    groupId: 'group_1',
                },
                isActive: true,
            };
            const result = SessionSnapshotPayloadSchema.safeParse(payload);
            expect(result.success).toBe(false);
        });
    });
});
//# sourceMappingURL=copilot.test.js.map