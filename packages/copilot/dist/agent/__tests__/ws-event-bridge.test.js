import { describe, expect, it, vi } from 'vitest';
import { createWsEventBridge } from '../ws-event-bridge.js';
describe('createWsEventBridge', () => {
    function createMockAgent() {
        const listeners = [];
        return {
            subscribe: (fn) => {
                listeners.push(fn);
                return () => {
                    const index = listeners.indexOf(fn);
                    if (index !== -1)
                        listeners.splice(index, 1);
                };
            },
            emit(event) {
                for (const listener of listeners) {
                    listener(event);
                }
            },
        };
    }
    function createMockEventHub() {
        const events = [];
        const publish = vi.fn((sessionId, event) => {
            events.push(event);
            return 1;
        });
        return { events, publish };
    }
    describe('message_update with text_delta', () => {
        it('maps to agent.text_delta event', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'message_update',
                message: {},
                assistantMessageEvent: {
                    type: 'text_delta',
                    contentIndex: 0,
                    delta: 'Hello',
                    partial: {},
                },
            });
            expect(eventHub.publish).toHaveBeenCalledOnce();
            const [sessionId, event] = eventHub.publish.mock.calls[0];
            expect(sessionId).toBe('session-123');
            expect(event).toMatchObject({
                type: 'agent.text_delta',
                sessionId: 'session-123',
                payload: { index: 0, delta: 'Hello' },
            });
            expect(event.timestamp).toBeDefined();
        });
        it('ignores message_update without text_delta', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'message_update',
                message: {},
                assistantMessageEvent: {
                    type: 'tool_call',
                    contentIndex: 0,
                    id: 'call-1',
                    name: 'test',
                },
            });
            expect(eventHub.publish).not.toHaveBeenCalled();
        });
    });
    describe('tool_execution_start', () => {
        it('maps to agent.tool_start event', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'tool_execution_start',
                toolCallId: 'call-1',
                toolName: 'read_file',
                args: { path: 'config.json' },
            });
            expect(eventHub.publish).toHaveBeenCalledOnce();
            const [sessionId, event] = eventHub.publish.mock.calls[0];
            expect(sessionId).toBe('session-123');
            expect(event).toMatchObject({
                type: 'agent.tool_start',
                sessionId: 'session-123',
                payload: { toolName: 'read_file', toolInput: { path: 'config.json' } },
            });
        });
    });
    describe('tool_execution_end', () => {
        it('maps to agent.tool_end event', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'tool_execution_end',
                toolCallId: 'call-1',
                toolName: 'read_file',
                result: { content: [{ type: 'text', text: '{ "key": "value" }' }] },
                isError: false,
            });
            expect(eventHub.publish).toHaveBeenCalledOnce();
            const [sessionId, event] = eventHub.publish.mock.calls[0];
            expect(sessionId).toBe('session-123');
            expect(event).toMatchObject({
                type: 'agent.tool_end',
                sessionId: 'session-123',
                payload: {
                    toolName: 'read_file',
                    toolOutput: { content: [{ type: 'text', text: '{ "key": "value" }' }] },
                },
            });
        });
    });
    describe('turn_start', () => {
        it('maps to agent.turn_start event', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'turn_start',
            });
            expect(eventHub.publish).toHaveBeenCalledOnce();
            const [sessionId, event] = eventHub.publish.mock.calls[0];
            expect(sessionId).toBe('session-123');
            expect(event).toMatchObject({
                type: 'agent.turn_start',
                sessionId: 'session-123',
                payload: { turnId: expect.any(String) },
            });
        });
    });
    describe('turn_end', () => {
        it('maps to agent.turn_end event', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'turn_end',
                message: {},
                toolResults: [],
            });
            expect(eventHub.publish).toHaveBeenCalledOnce();
            const [sessionId, event] = eventHub.publish.mock.calls[0];
            expect(sessionId).toBe('session-123');
            expect(event).toMatchObject({
                type: 'agent.turn_end',
                sessionId: 'session-123',
                payload: { turnId: expect.any(String) },
            });
        });
    });
    describe('agent_end with error', () => {
        it('maps to agent.error event when agent state has error', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            // Mock agent.state to have an error
            agent.state = { error: 'Failed to connect to API' };
            createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'agent_end',
                messages: [],
            });
            expect(eventHub.publish).toHaveBeenCalledOnce();
            const [sessionId, event] = eventHub.publish.mock.calls[0];
            expect(sessionId).toBe('session-123');
            expect(event).toMatchObject({
                type: 'agent.error',
                sessionId: 'session-123',
                payload: { errorMessage: 'Failed to connect to API' },
            });
        });
        it('does not emit agent.error when agent_end has no error', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            agent.state = {};
            createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'agent_end',
                messages: [],
            });
            expect(eventHub.publish).not.toHaveBeenCalled();
        });
    });
    describe('unsubscribe', () => {
        it('stops event forwarding when unsubscribe is called', () => {
            const agent = createMockAgent();
            const eventHub = createMockEventHub();
            const unsubscribe = createWsEventBridge(agent, 'session-123', eventHub);
            agent.emit({
                type: 'turn_start',
            });
            expect(eventHub.publish).toHaveBeenCalledOnce();
            unsubscribe();
            agent.emit({
                type: 'turn_end',
                message: {},
                toolResults: [],
            });
            // Still only called once - second event was not forwarded
            expect(eventHub.publish).toHaveBeenCalledOnce();
        });
    });
    describe('event isolation', () => {
        it('publishes events to the correct session', () => {
            const agent1 = createMockAgent();
            const agent2 = createMockAgent();
            const eventHub = createMockEventHub();
            createWsEventBridge(agent1, 'session-1', eventHub);
            createWsEventBridge(agent2, 'session-2', eventHub);
            agent1.emit({ type: 'turn_start' });
            agent2.emit({ type: 'turn_start' });
            expect(eventHub.publish).toHaveBeenCalledTimes(2);
            const calls = eventHub.publish.mock.calls;
            expect(calls[0][0]).toBe('session-1');
            expect(calls[1][0]).toBe('session-2');
        });
    });
});
//# sourceMappingURL=ws-event-bridge.test.js.map