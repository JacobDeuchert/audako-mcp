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
/**
 * Creates a bridge between pi-mono agent events and WebSocket clients.
 *
 * @param agent - Pi-mono Agent instance to subscribe to
 * @param sessionId - Session identifier for event routing
 * @param eventHub - Event hub for publishing to WebSocket clients
 * @returns Unsubscribe function to stop event forwarding
 */
export function createWsEventBridge(agent, sessionId, eventHub) {
    // Generate stable turn IDs for turn_start/turn_end pairs
    let currentTurnId = null;
    const handleAgentEvent = (event) => {
        switch (event.type) {
            case 'message_update': {
                // Only forward text_delta events (ignore tool_call, thinking, etc.)
                if (event.assistantMessageEvent.type === 'text_delta') {
                    eventHub.publish(sessionId, buildWsEvent('agent.text_delta', sessionId, {
                        index: event.assistantMessageEvent.contentIndex,
                        delta: event.assistantMessageEvent.delta,
                    }));
                }
                break;
            }
            case 'tool_execution_start': {
                eventHub.publish(sessionId, buildWsEvent('agent.tool_start', sessionId, {
                    toolName: event.toolName,
                    toolInput: event.args,
                }));
                break;
            }
            case 'tool_execution_end': {
                eventHub.publish(sessionId, buildWsEvent('agent.tool_end', sessionId, {
                    toolName: event.toolName,
                    toolOutput: event.result,
                }));
                break;
            }
            case 'turn_start': {
                currentTurnId = generateTurnId();
                eventHub.publish(sessionId, buildWsEvent('agent.turn_start', sessionId, {
                    turnId: currentTurnId,
                    userMessage: undefined,
                }));
                break;
            }
            case 'turn_end': {
                const turnId = currentTurnId || generateTurnId();
                eventHub.publish(sessionId, buildWsEvent('agent.turn_end', sessionId, {
                    turnId,
                    finalMessage: undefined,
                }));
                currentTurnId = null;
                break;
            }
            case 'agent_end': {
                // Only emit agent.error if agent state has an error
                const errorMessage = agent.state?.error;
                if (errorMessage) {
                    eventHub.publish(sessionId, buildWsEvent('agent.error', sessionId, {
                        errorMessage,
                    }));
                }
                break;
            }
            // Ignore other event types (agent_start, message_start, message_end, tool_execution_update)
            default:
                break;
        }
    };
    const unsubscribe = agent.subscribe(handleAgentEvent);
    return unsubscribe;
}
/**
 * Build WebSocket event envelope with current timestamp.
 */
function buildWsEvent(type, sessionId, payload) {
    return {
        type,
        sessionId,
        timestamp: new Date().toISOString(),
        payload,
    };
}
/**
 * Generate a unique turn ID for turn_start/turn_end pairing.
 */
function generateTurnId() {
    return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
//# sourceMappingURL=ws-event-bridge.js.map