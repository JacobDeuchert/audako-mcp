import { SignalType } from 'audako-core';
import { describe, expect, it } from 'vitest';
import { groupEntityContract } from '../group.contract.js';
import { getSupportedEntityTypeNames, listEntityTypeDefinitions, resolveEntityTypeContract, } from '../index.js';
import { signalEntityContract } from '../signal.contract.js';
describe('Entity Type Contracts - Signal', () => {
    describe('Schema Generation', () => {
        it('should validate valid Signal create payload', () => {
            const validPayload = {
                name: 'Temperature Sensor',
                type: SignalType.AnalogInput,
                groupId: 'group-123',
                dataConnectionId: 'connection-123',
            };
            const errors = signalEntityContract.validate(validPayload, 'create');
            expect(errors).toHaveLength(0);
        });
        it('should reject Signal create payload missing required field', () => {
            const invalidPayload = {
                // name is required
                type: SignalType.AnalogInput,
                groupId: 'group-123',
                dataConnectionId: 'connection-123',
            };
            const errors = signalEntityContract.validate(invalidPayload, 'create');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain('name');
        });
        it('should accept Signal update payload with single field', () => {
            const updatePayload = {
                description: 'Updated description',
            };
            const errors = signalEntityContract.validate(updatePayload, 'update');
            expect(errors).toHaveLength(0);
        });
        it('should reject Signal update payload with empty changes', () => {
            const updatePayload = {};
            const errors = signalEntityContract.validate(updatePayload, 'update');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain('At least one field must be provided');
        });
        it('should reject Signal with invalid enum value for type', () => {
            const invalidPayload = {
                name: 'Temperature Sensor',
                type: 'InvalidSignalType',
                groupId: 'group-123',
                dataConnectionId: 'connection-123',
            };
            const errors = signalEntityContract.validate(invalidPayload, 'create');
            expect(errors.length).toBeGreaterThan(0);
        });
        it('should accept Signal with numeric fields', () => {
            const validPayload = {
                name: 'Counter Signal',
                type: SignalType.Counter,
                groupId: 'group-123',
                dataConnectionId: 'connection-123',
                minValue: 0,
                maxValue: 1000,
                decimalPlaces: 2,
            };
            const errors = signalEntityContract.validate(validPayload, 'create');
            expect(errors).toHaveLength(0);
        });
        it('should reject Signal with non-numeric minValue', () => {
            const invalidPayload = {
                name: 'Counter Signal',
                type: SignalType.Counter,
                groupId: 'group-123',
                dataConnectionId: 'connection-123',
                minValue: 'zero', // should be number
            };
            const errors = signalEntityContract.validate(invalidPayload, 'create');
            expect(errors.length).toBeGreaterThan(0);
        });
        it('should accept Signal with boolean fields', () => {
            const validPayload = {
                name: 'Digital Signal',
                type: SignalType.DigitalInput,
                groupId: 'group-123',
                dataConnectionId: 'connection-123',
                invert: true,
                offsetAutomatic: false,
            };
            const errors = signalEntityContract.validate(validPayload, 'create');
            expect(errors).toHaveLength(0);
        });
        it('should include field descriptions in schema', () => {
            const definition = signalEntityContract.getDefinition();
            const nameField = definition.fields.find(f => f.key === 'name');
            expect(nameField).toBeDefined();
            expect(nameField?.description).toContain('Name of the signal');
        });
    });
    describe('Payload Conversion', () => {
        it('should convert Signal entity to payload', () => {
            const contract = signalEntityContract;
            const definition = contract.getDefinition();
            expect(definition.key).toBe('Signal');
            expect(definition.fields.length).toBeGreaterThan(0);
        });
        it('should include examples in definition', () => {
            const definition = signalEntityContract.getDefinition();
            expect(definition.examples).toBeDefined();
            expect(definition.examples?.create).toBeDefined();
            expect(definition.examples?.update).toBeDefined();
            expect(definition.examples?.create.name).toBe('Boiler Temperature');
        });
        it('should validate Signal example payloads', () => {
            const definition = signalEntityContract.getDefinition();
            if (definition.examples) {
                const createPayload = {
                    ...definition.examples.create,
                    groupId: 'group-123', // Add required groupId
                };
                const createErrors = signalEntityContract.validate(createPayload, 'create');
                expect(createErrors).toHaveLength(0);
                const updateErrors = signalEntityContract.validate(definition.examples.update, 'update');
                expect(updateErrors).toHaveLength(0);
            }
        });
    });
});
describe('Entity Type Contracts - Group', () => {
    describe('Schema Generation', () => {
        it('should validate valid Group create payload', () => {
            const validPayload = {
                name: 'Factory Floor',
                groupId: 'parent-group-123',
            };
            const errors = groupEntityContract.validate(validPayload, 'create');
            expect(errors).toHaveLength(0);
        });
        it('should reject Group create payload missing required name', () => {
            const invalidPayload = {
                groupId: 'parent-group-123',
            };
            const errors = groupEntityContract.validate(invalidPayload, 'create');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain('name');
        });
        it('should accept Group update payload with description', () => {
            const updatePayload = {
                description: 'Updated factory floor',
            };
            const errors = groupEntityContract.validate(updatePayload, 'update');
            expect(errors).toHaveLength(0);
        });
        it('should reject Group update payload with no fields', () => {
            const updatePayload = {};
            const errors = groupEntityContract.validate(updatePayload, 'update');
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain('At least one field must be provided');
        });
        it('should accept Group with type field', () => {
            const validPayload = {
                name: 'Maintenance Group',
                type: 'DigitalTwin',
            };
            const errors = groupEntityContract.validate(validPayload, 'create');
            expect(errors).toHaveLength(0);
        });
        it('should accept Group with isEntryPoint flag', () => {
            const validPayload = {
                name: 'Entry Group',
                isEntryPoint: true,
            };
            const errors = groupEntityContract.validate(validPayload, 'create');
            expect(errors).toHaveLength(0);
        });
        it('should reject Group with non-boolean isEntryPoint', () => {
            const invalidPayload = {
                name: 'Entry Group',
                isEntryPoint: 'yes', // should be boolean
            };
            const errors = groupEntityContract.validate(invalidPayload, 'create');
            expect(errors.length).toBeGreaterThan(0);
        });
        it('should accept Group with icon and position', () => {
            const validPayload = {
                name: 'Group with Icon',
                icon: 'mat-folder',
                position: '10',
            };
            const errors = groupEntityContract.validate(validPayload, 'create');
            expect(errors).toHaveLength(0);
        });
    });
    describe('Payload Conversion', () => {
        it('should return Group definition with correct properties', () => {
            const definition = groupEntityContract.getDefinition();
            expect(definition.key).toBeDefined();
            expect(definition.entityType).toBeDefined();
            expect(definition.fields.length).toBeGreaterThan(0);
        });
        it('should include Group examples', () => {
            const definition = groupEntityContract.getDefinition();
            expect(definition.examples).toBeDefined();
            expect(definition.examples?.create.name).toBe('Alarmierungstest');
        });
        it('should validate Group example payloads', () => {
            const definition = groupEntityContract.getDefinition();
            if (definition.examples) {
                const createErrors = groupEntityContract.validate(definition.examples.create, 'create');
                expect(createErrors).toHaveLength(0);
                const updateErrors = groupEntityContract.validate(definition.examples.update, 'update');
                expect(updateErrors).toHaveLength(0);
            }
        });
    });
});
describe('Entity Type Registry', () => {
    describe('Contract Resolution', () => {
        it('should resolve Signal contract by entity type', () => {
            const contract = resolveEntityTypeContract('Signal');
            expect(contract).toBeDefined();
            expect(contract?.key).toBe('Signal');
        });
        it('should resolve Signal contract by alias', () => {
            const contract = resolveEntityTypeContract('signal');
            expect(contract).toBeDefined();
            expect(contract?.key).toBe('Signal');
        });
        it('should resolve Group contract by entity type', () => {
            const contract = resolveEntityTypeContract('Group');
            expect(contract).toBeDefined();
            expect(contract?.key).toBe('Group');
        });
        it('should resolve Group contract by alias (lowercase)', () => {
            const contract = resolveEntityTypeContract('group');
            expect(contract).toBeDefined();
            expect(contract?.key).toBe('Group');
        });
        it('should handle case-insensitive resolution', () => {
            const contract1 = resolveEntityTypeContract('SIGNAL');
            const contract2 = resolveEntityTypeContract('Signal');
            const contract3 = resolveEntityTypeContract('signal');
            expect(contract1).toBe(contract2);
            expect(contract2).toBe(contract3);
        });
        it('should return undefined for unknown entity type', () => {
            const contract = resolveEntityTypeContract('UnknownType');
            expect(contract).toBeUndefined();
        });
    });
    describe('Registry Queries', () => {
        it('should return list of supported entity type names', () => {
            const names = getSupportedEntityTypeNames();
            expect(names).toContain('Group');
            expect(names).toContain('Signal');
            expect(names.length).toBeGreaterThanOrEqual(2);
        });
        it('should return sorted entity type names', () => {
            const names = getSupportedEntityTypeNames();
            const sorted = [...names].sort((a, b) => a.localeCompare(b));
            expect(names).toEqual(sorted);
        });
        it('should list all entity type definitions', () => {
            const definitions = listEntityTypeDefinitions();
            expect(definitions.length).toBeGreaterThanOrEqual(2);
            const signalDef = definitions.find(d => d.key === 'Signal');
            const groupDef = definitions.find(d => d.key === 'Group');
            expect(signalDef).toBeDefined();
            expect(groupDef).toBeDefined();
        });
        it('should include fields in definitions', () => {
            const definitions = listEntityTypeDefinitions();
            for (const definition of definitions) {
                expect(definition.fields).toBeDefined();
                expect(definition.fields.length).toBeGreaterThan(0);
            }
        });
    });
});
//# sourceMappingURL=entity-types.test.js.map