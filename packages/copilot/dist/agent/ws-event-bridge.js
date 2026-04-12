import { createLogger } from '../config/app-config.js';
import { buildSessionEvent } from '../services/session-event-utils.js';
import { isAssistantMessage } from '../session/message-utils.js';
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
                    eventHub.publish(sessionId, buildSessionEvent('assistant.delta', sessionId, {
                        kind: 'text',
                        index: event.assistantMessageEvent.contentIndex,
                        delta: event.assistantMessageEvent.delta,
                    }));
                }
                break;
            }
            case 'turn_start': {
                if (currentTurnId) {
                    break;
                }
                currentTurnId = generateTurnId();
                break;
            }
            case 'turn_end': {
                if (isToolUseTurn(event.message)) {
                    break;
                }
                const turnId = currentTurnId || generateTurnId();
                eventHub.publish(sessionId, buildSessionEvent('assistant.done', sessionId, {
                    turnId,
                    finalText: extractAssistantText(event.message),
                    finishReason: extractFinishReason(event.message),
                }));
                currentTurnId = null;
                break;
            }
            case 'agent_end': {
                const errorMessage = agent.state?.error;
                if (errorMessage) {
                    eventHub.publish(sessionId, buildSessionEvent('assistant.error', sessionId, {
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
function isToolUseTurn(message) {
    return isAssistantMessage(message) && message.stopReason === 'toolUse';
}
function extractAssistantText(message) {
    if (!isAssistantMessage(message)) {
        return '';
    }
    let text = '';
    for (const block of message.content) {
        if (block.type !== 'text') {
            continue;
        }
        text += block.text;
    }
    return text.trim();
}
function extractFinishReason(message) {
    if (!isAssistantMessage(message)) {
        return 'unknown';
    }
    return message.stopReason;
}
function generateTurnId() {
    return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
//# sourceMappingURL=ws-event-bridge.js.map