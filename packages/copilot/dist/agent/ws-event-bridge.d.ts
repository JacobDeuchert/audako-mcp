/**
 * WS Event Bridge - Maps pi-mono agent events to WebSocket event envelopes
 *
 * This bridge subscribes to agent events and transforms them into the
 * standardized WebSocket event format expected by clients.
 *
 * Event Mapping:
 * - message_update (text_delta) → agent.text_delta
 * - tool_execution_start → agent.tool_start
 * - tool_execution_end → agent.tool_end
 * - turn_start → agent.turn_start
 * - turn_end → agent.turn_end
 * - agent_end (with error) → agent.error
 */
import type { AgentEvent } from '@mariozechner/pi-agent-core';
import type { SessionEventHub } from '../services/session-event-hub.js';
interface Agent {
    subscribe: (fn: (e: AgentEvent) => void) => () => void;
    state?: {
        error?: string;
    };
}
/**
 * Creates a bridge between pi-mono agent events and WebSocket clients.
 *
 * @param agent - Pi-mono Agent instance to subscribe to
 * @param sessionId - Session identifier for event routing
 * @param eventHub - Event hub for publishing to WebSocket clients
 * @returns Unsubscribe function to stop event forwarding
 */
export declare function createWsEventBridge(agent: Agent, sessionId: string, eventHub: SessionEventHub): () => void;
export {};
//# sourceMappingURL=ws-event-bridge.d.ts.map