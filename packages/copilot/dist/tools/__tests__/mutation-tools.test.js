import { describe, expect, it, vi } from 'vitest';
import { MutationPermissions } from '../../services/mutation-permissions.js';
import { createMutationThrottle } from '../../services/mutation-throttle.js';
import { createMutationTools } from '../mutation-tools.js';
function getTool(name, tools) {
    const tool = tools.find(candidate => candidate.name === name);
    if (!tool) {
        throw new Error(`Missing tool ${name}`);
    }
    return tool;
}
describe('createMutationTools', () => {
    it('returns all 3 mutation tools with expected names', () => {
        const tools = createMutationTools({
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        }, {
            entityData: {
                create: vi.fn(),
                update: vi.fn(),
            },
            group: {
                moveEntity: vi.fn(),
            },
        }, {
            execute: vi.fn(async (handler) => handler()),
        }, {
            validate: vi.fn(),
        }, new MutationPermissions(), {
            publish: vi.fn(),
        }, {
            create: vi.fn(),
        });
        expect(tools.map(tool => tool.name)).toEqual([
            'audako_mcp_create_entity',
            'audako_mcp_update_entity',
            'audako_mcp_move_entity',
        ]);
    });
    it('runs create-entity full pipeline in order and publishes event', async () => {
        const order = [];
        const context = {
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        };
        const permissions = new MutationPermissions();
        const requestHub = {
            create: vi.fn(async () => {
                order.push('permission');
                return ['Allow'];
            }),
        };
        const scopeGuard = {
            validate: vi.fn(async () => {
                order.push('scope');
            }),
        };
        const mutationThrottle = {
            execute: vi.fn(async (handler) => {
                order.push('throttle');
                return handler();
            }),
        };
        const audakoServices = {
            entityData: {
                create: vi.fn(async () => {
                    order.push('create');
                    return { id: 'entity-1', name: 'Created' };
                }),
                update: vi.fn(),
            },
            group: {
                moveEntity: vi.fn(),
            },
        };
        const eventHub = {
            publish: vi.fn(() => {
                order.push('event');
            }),
        };
        const tools = createMutationTools(context, audakoServices, mutationThrottle, scopeGuard, permissions, eventHub, requestHub);
        const tool = getTool('audako_mcp_create_entity', tools);
        await tool.execute('call-1', {
            entityType: 'Signal',
            payload: {
                name: 'Signal A',
                type: 'AnalogInput',
                groupId: 'group-1',
                dataConnectionId: 'connection-1',
            },
            permissionMode: 'interactive',
        });
        expect(order).toEqual(['permission', 'scope', 'throttle', 'create', 'event']);
        expect(scopeGuard.validate).toHaveBeenCalledWith('group-1', 'Signal');
        expect(audakoServices.entityData.create).toHaveBeenCalledWith('Signal', expect.any(Object));
        expect(eventHub.publish).toHaveBeenCalledWith('session-1', expect.objectContaining({
            type: 'entity.created',
            payload: expect.objectContaining({
                entityType: 'Signal',
                entityId: 'entity-1',
            }),
        }));
    });
    it('prompts only for first interactive mutation of an entity type', async () => {
        const context = {
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        };
        const permissions = new MutationPermissions();
        const requestHub = {
            create: vi.fn().mockResolvedValue(['Allow']),
        };
        const tools = createMutationTools(context, {
            entityData: {
                create: vi.fn().mockResolvedValue({ id: 'entity-1' }),
                update: vi.fn(),
            },
            group: {
                moveEntity: vi.fn(),
            },
        }, {
            execute: vi.fn(async (handler) => handler()),
        }, {
            validate: vi.fn(),
        }, permissions, {
            publish: vi.fn(),
        }, requestHub);
        const tool = getTool('audako_mcp_create_entity', tools);
        const payload = {
            name: 'Signal A',
            type: 'AnalogInput',
            groupId: 'group-1',
            dataConnectionId: 'connection-1',
        };
        await tool.execute('call-1', { entityType: 'Signal', payload, permissionMode: 'interactive' });
        await tool.execute('call-2', { entityType: 'Signal', payload, permissionMode: 'interactive' });
        expect(requestHub.create).toHaveBeenCalledTimes(1);
    });
    it('fails fast without prompting when permissionMode is fail_fast and no grant exists', async () => {
        const requestHub = {
            create: vi.fn(),
        };
        const tools = createMutationTools({
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        }, {
            entityData: {
                create: vi.fn(),
                update: vi.fn(),
            },
            group: {
                moveEntity: vi.fn(),
            },
        }, {
            execute: vi.fn(async (handler) => handler()),
        }, {
            validate: vi.fn(),
        }, new MutationPermissions(), {
            publish: vi.fn(),
        }, requestHub);
        const tool = getTool('audako_mcp_create_entity', tools);
        await expect(tool.execute('call-1', {
            entityType: 'Signal',
            payload: {
                name: 'Signal A',
                type: 'AnalogInput',
                groupId: 'group-1',
                dataConnectionId: 'connection-1',
            },
            permissionMode: 'fail_fast',
        })).rejects.toThrow('Mutation blocked: permission denied for Signal.');
        expect(requestHub.create).not.toHaveBeenCalled();
    });
    it('stops before throttle when scope guard rejects', async () => {
        const permissions = new MutationPermissions();
        permissions.grantPermission('Signal');
        const throttle = {
            execute: vi.fn(async (handler) => handler()),
        };
        const services = {
            entityData: {
                create: vi.fn(),
                update: vi.fn(),
            },
            group: {
                moveEntity: vi.fn(),
            },
        };
        const eventHub = {
            publish: vi.fn(),
        };
        const tools = createMutationTools({
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        }, services, throttle, {
            validate: vi.fn().mockRejectedValue(new Error('outside context')),
        }, permissions, eventHub, {
            create: vi.fn(),
        });
        const tool = getTool('audako_mcp_create_entity', tools);
        await expect(tool.execute('call-1', {
            entityType: 'Signal',
            payload: {
                name: 'Signal A',
                type: 'AnalogInput',
                groupId: 'group-1',
                dataConnectionId: 'connection-1',
            },
            permissionMode: 'fail_fast',
        })).rejects.toThrow('outside context');
        expect(throttle.execute).not.toHaveBeenCalled();
        expect(services.entityData.create).not.toHaveBeenCalled();
        expect(eventHub.publish).not.toHaveBeenCalled();
    });
    it('validates create payload before API call', async () => {
        const permissions = new MutationPermissions();
        permissions.grantPermission('Signal');
        const services = {
            entityData: {
                create: vi.fn(),
                update: vi.fn(),
            },
            group: {
                moveEntity: vi.fn(),
            },
        };
        const tools = createMutationTools({
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        }, services, {
            execute: vi.fn(async (handler) => handler()),
        }, {
            validate: vi.fn(),
        }, permissions, {
            publish: vi.fn(),
        }, {
            create: vi.fn(),
        });
        const tool = getTool('audako_mcp_create_entity', tools);
        await expect(tool.execute('call-1', {
            entityType: 'Signal',
            payload: {
                name: 'Signal A',
            },
            permissionMode: 'fail_fast',
        })).rejects.toThrow('Entity payload validation failed');
        expect(services.entityData.create).not.toHaveBeenCalled();
    });
    it('validates update changes and publishes update event', async () => {
        const permissions = new MutationPermissions();
        permissions.grantPermission('Signal');
        const services = {
            entityData: {
                create: vi.fn(),
                update: vi.fn().mockResolvedValue({ id: 'sig-1' }),
            },
            group: {
                moveEntity: vi.fn(),
            },
        };
        const eventHub = {
            publish: vi.fn(),
        };
        const tools = createMutationTools({
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        }, services, {
            execute: vi.fn(async (handler) => handler()),
        }, {
            validate: vi.fn(),
        }, permissions, eventHub, {
            create: vi.fn(),
        });
        const tool = getTool('audako_mcp_update_entity', tools);
        await tool.execute('call-1', {
            entityType: 'Signal',
            entityId: 'sig-1',
            changes: {
                description: 'Updated signal',
            },
            permissionMode: 'fail_fast',
        });
        await expect(tool.execute('call-2', {
            entityType: 'Signal',
            entityId: 'sig-1',
            changes: {
                unknownField: 'x',
            },
            permissionMode: 'fail_fast',
        })).rejects.toThrow('Entity update validation failed');
        expect(services.entityData.update).toHaveBeenCalledWith('Signal', 'sig-1', {
            description: 'Updated signal',
        });
        expect(eventHub.publish).toHaveBeenCalledWith('session-1', expect.objectContaining({
            type: 'entity.updated',
            payload: {
                entityType: 'Signal',
                entityId: 'sig-1',
                changes: { description: 'Updated signal' },
            },
        }));
    });
    it('runs move-entity pipeline and publishes move event', async () => {
        const permissions = new MutationPermissions();
        permissions.grantPermission('Signal');
        const services = {
            entityData: {
                create: vi.fn(),
                update: vi.fn(),
            },
            group: {
                moveEntity: vi.fn().mockResolvedValue({
                    fromGroupId: 'group-1',
                    toGroupId: 'group-2',
                }),
            },
        };
        const eventHub = {
            publish: vi.fn(),
        };
        const tools = createMutationTools({
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        }, services, {
            execute: vi.fn(async (handler) => handler()),
        }, {
            validate: vi.fn(),
        }, permissions, eventHub, {
            create: vi.fn(),
        });
        const tool = getTool('audako_mcp_move_entity', tools);
        await tool.execute('call-1', {
            entityType: 'Signal',
            entityId: 'sig-2',
            targetGroupId: 'group-2',
            permissionMode: 'fail_fast',
        });
        expect(services.group.moveEntity).toHaveBeenCalledWith('Signal', 'sig-2', 'group-2');
        expect(eventHub.publish).toHaveBeenCalledWith('session-1', expect.objectContaining({
            type: 'entity.moved',
            payload: {
                entityType: 'Signal',
                entityId: 'sig-2',
                fromGroupId: 'group-1',
                toGroupId: 'group-2',
            },
        }));
    });
    it('serializes mutation execution through throttle queue', async () => {
        const permissions = new MutationPermissions();
        permissions.grantPermission('Signal');
        let active = 0;
        let maxActive = 0;
        const tools = createMutationTools({
            getSessionId: () => 'session-1',
            getGroupId: () => 'group-1',
        }, {
            entityData: {
                create: vi.fn(async () => {
                    active += 1;
                    maxActive = Math.max(maxActive, active);
                    await new Promise(resolve => {
                        setTimeout(resolve, 20);
                    });
                    active -= 1;
                    return { id: crypto.randomUUID() };
                }),
                update: vi.fn(),
            },
            group: {
                moveEntity: vi.fn(),
            },
        }, createMutationThrottle(0), {
            validate: vi.fn(),
        }, permissions, {
            publish: vi.fn(),
        }, {
            create: vi.fn(),
        });
        const tool = getTool('audako_mcp_create_entity', tools);
        await Promise.all([
            tool.execute('call-1', {
                entityType: 'Signal',
                payload: {
                    name: 'Signal A',
                    type: 'AnalogInput',
                    groupId: 'group-1',
                    dataConnectionId: 'connection-1',
                },
                permissionMode: 'fail_fast',
            }),
            tool.execute('call-2', {
                entityType: 'Signal',
                payload: {
                    name: 'Signal B',
                    type: 'AnalogInput',
                    groupId: 'group-1',
                    dataConnectionId: 'connection-1',
                },
                permissionMode: 'fail_fast',
            }),
        ]);
        expect(maxActive).toBe(1);
    });
});
//# sourceMappingURL=mutation-tools.test.js.map