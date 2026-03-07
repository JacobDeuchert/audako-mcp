import { createLogger } from '../config/app-config.js';
const wsBridgeLogger = createLogger('ws-event-bridge');
export function createWsEventBridge(agent, sessionId, eventHub) {
    let currentTurnId = null;
    const handleAgentEvent = (event) => {
        wsBridgeLogger.info({
            sessionId,
            eventType: event.type,
            event,
        }, 'Received agent event');
        switch (event.type) {
            case 'message_update': {
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
                if (currentTurnId) {
                    break;
                }
                currentTurnId = generateTurnId();
                eventHub.publish(sessionId, buildWsEvent('agent.turn_start', sessionId, {
                    turnId: currentTurnId,
                    userMessage: undefined,
                }));
                break;
            }
            case 'turn_end': {
                if (isToolUseTurn(event.message)) {
                    break;
                }
                const turnId = currentTurnId || generateTurnId();
                eventHub.publish(sessionId, buildWsEvent('agent.turn_end', sessionId, {
                    turnId,
                    finalMessage: extractAssistantText(event.message),
                }));
                currentTurnId = null;
                break;
            }
            case 'agent_end': {
                const errorMessage = agent.state?.error;
                if (errorMessage) {
                    eventHub.publish(sessionId, buildWsEvent('agent.error', sessionId, {
                        errorMessage,
                    }));
                }
                currentTurnId = null;
                break;
            }
            default:
                break;
        }
    };
    const unsubscribe = agent.subscribe(handleAgentEvent);
    return unsubscribe;
}
function isAssistantMessage(message) {
    if (!message || typeof message !== 'object') {
        return false;
    }
    const candidate = message;
    return (candidate.role === 'assistant' &&
        Array.isArray(candidate.content) &&
        typeof candidate.stopReason === 'string');
}
function isToolUseTurn(message) {
    return isAssistantMessage(message) && message.stopReason === 'toolUse';
}
function extractAssistantText(message) {
    if (!isAssistantMessage(message)) {
        return undefined;
    }
    let text = '';
    for (const block of message.content) {
        if (block.type !== 'text') {
            continue;
        }
        text += block.text;
    }
    const trimmedText = text.trim();
    return trimmedText || undefined;
}
function buildWsEvent(type, sessionId, payload) {
    return {
        type,
        sessionId,
        timestamp: new Date().toISOString(),
        payload,
    };
}
function generateTurnId() {
    return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
//# sourceMappingURL=ws-event-bridge.js.map