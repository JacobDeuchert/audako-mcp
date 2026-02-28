import type { AgentEvent } from '@mariozechner/pi-agent-core';
import { describe, expect, it, vi } from 'vitest';
import { createWsEventBridge } from '../ws-event-bridge.js';

// Mock types matching pi-agent-core
interface MockAgent {
  subscribe: (fn: (e: AgentEvent) => void) => () => void;
  state?: { error?: string };
}

interface MockEventHub {
  publish: (sessionId: string, event: unknown) => number;
}

describe('createWsEventBridge', () => {
  function createMockAgent(): MockAgent {
    const listeners: Array<(e: AgentEvent) => void> = [];
    return {
      subscribe: (fn: (e: AgentEvent) => void) => {
        listeners.push(fn);
        return () => {
          const index = listeners.indexOf(fn);
          if (index !== -1) listeners.splice(index, 1);
        };
      },
      emit(event: AgentEvent) {
        for (const listener of listeners) {
          listener(event);
        }
      },
    } as MockAgent & { emit: (e: AgentEvent) => void };
  }

  function createMockEventHub() {
    const events: unknown[] = [];
    const publish = vi.fn((sessionId: string, event: unknown) => {
      events.push(event);
      return 1;
    });
    return { events, publish };
  }

  describe('message_update with text_delta', () => {
    it('maps to agent.text_delta event', () => {
      const agent = createMockAgent();
      const eventHub = createMockEventHub();

      createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'message_update',
        message: {} as any,
        assistantMessageEvent: {
          type: 'text_delta',
          contentIndex: 0,
          delta: 'Hello',
          partial: {} as any,
        },
      } as unknown as AgentEvent);

      expect(eventHub.publish).toHaveBeenCalledOnce();
      const [sessionId, event] = (eventHub.publish as any).mock.calls[0];
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

      createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'message_update',
        message: {} as any,
        assistantMessageEvent: {
          type: 'tool_call',
          contentIndex: 0,
          id: 'call-1',
          name: 'test',
        } as any,
      } as unknown as AgentEvent);

      expect(eventHub.publish).not.toHaveBeenCalled();
    });
  });

  describe('tool_execution_start', () => {
    it('maps to agent.tool_start event', () => {
      const agent = createMockAgent();
      const eventHub = createMockEventHub();

      createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'tool_execution_start',
        toolCallId: 'call-1',
        toolName: 'read_file',
        args: { path: 'config.json' },
      } as AgentEvent);

      expect(eventHub.publish).toHaveBeenCalledOnce();
      const [sessionId, event] = (eventHub.publish as any).mock.calls[0];
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

      createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'tool_execution_end',
        toolCallId: 'call-1',
        toolName: 'read_file',
        result: { content: [{ type: 'text', text: '{ "key": "value" }' }] },
        isError: false,
      } as AgentEvent);

      expect(eventHub.publish).toHaveBeenCalledOnce();
      const [sessionId, event] = (eventHub.publish as any).mock.calls[0];
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

      createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'turn_start',
      } as AgentEvent);

      expect(eventHub.publish).toHaveBeenCalledOnce();
      const [sessionId, event] = (eventHub.publish as any).mock.calls[0];
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

      createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'turn_end',
        message: {} as any,
        toolResults: [],
      } as unknown as AgentEvent);

      expect(eventHub.publish).toHaveBeenCalledOnce();
      const [sessionId, event] = (eventHub.publish as any).mock.calls[0];
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
      (agent as any).state = { error: 'Failed to connect to API' };

      createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'agent_end',
        messages: [],
      } as AgentEvent);

      expect(eventHub.publish).toHaveBeenCalledOnce();
      const [sessionId, event] = (eventHub.publish as any).mock.calls[0];
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

      (agent as any).state = {};

      createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'agent_end',
        messages: [],
      } as AgentEvent);

      expect(eventHub.publish).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('stops event forwarding when unsubscribe is called', () => {
      const agent = createMockAgent();
      const eventHub = createMockEventHub();

      const unsubscribe = createWsEventBridge(agent, 'session-123', eventHub as any);

      (agent as any).emit({
        type: 'turn_start',
      } as AgentEvent);

      expect(eventHub.publish).toHaveBeenCalledOnce();

      unsubscribe();

      (agent as any).emit({
        type: 'turn_end',
        message: {} as any,
        toolResults: [],
      } as unknown as AgentEvent);

      // Still only called once - second event was not forwarded
      expect(eventHub.publish).toHaveBeenCalledOnce();
    });
  });

  describe('event isolation', () => {
    it('publishes events to the correct session', () => {
      const agent1 = createMockAgent();
      const agent2 = createMockAgent();
      const eventHub = createMockEventHub();

      createWsEventBridge(agent1, 'session-1', eventHub as any);
      createWsEventBridge(agent2, 'session-2', eventHub as any);

      (agent1 as any).emit({ type: 'turn_start' } as AgentEvent);
      (agent2 as any).emit({ type: 'turn_start' } as AgentEvent);

      expect(eventHub.publish).toHaveBeenCalledTimes(2);
      const calls = (eventHub.publish as any).mock.calls;
      expect(calls[0][0]).toBe('session-1');
      expect(calls[1][0]).toBe('session-2');
    });
  });
});
