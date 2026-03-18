import type { AgentEvent } from '@mariozechner/pi-agent-core';
import type { AssistantMessage } from '@mariozechner/pi-ai';
import { createLogger } from '../config/app-config.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import { buildSessionEvent } from '../services/session-event-utils.js';

interface Agent {
  subscribe: (fn: (e: AgentEvent) => void) => () => void;
  state?: { error?: string };
}

const wsBridgeLogger = createLogger('ws-event-bridge');

export function createWsEventBridge(
  agent: Agent,
  sessionId: string,
  eventHub: SessionEventHub,
): () => void {
  let currentTurnId: string | null = null;

  const handleAgentEvent = (event: AgentEvent): void => {
    wsBridgeLogger.info(
      {
        sessionId,
        eventType: event.type,
        event,
      },
      'Received agent event',
    );

    switch (event.type) {
      case 'message_update': {
        if (event.assistantMessageEvent.type === 'text_delta') {
          eventHub.publish(
            sessionId,
            buildSessionEvent('assistant.delta', sessionId, {
              kind: 'text',
              index: event.assistantMessageEvent.contentIndex,
              delta: event.assistantMessageEvent.delta,
            }),
          );
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
        eventHub.publish(
          sessionId,
          buildSessionEvent('assistant.done', sessionId, {
            turnId,
            finalText: extractAssistantText(event.message),
            finishReason: extractFinishReason(event.message),
          }),
        );
        currentTurnId = null;
        break;
      }

      case 'agent_end': {
        const errorMessage = agent.state?.error;
        if (errorMessage) {
          eventHub.publish(
            sessionId,
            buildSessionEvent('assistant.error', sessionId, {
              errorMessage,
            }),
          );
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

function isAssistantMessage(message: unknown): message is AssistantMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as {
    role?: unknown;
    content?: unknown;
    stopReason?: unknown;
  };

  return (
    candidate.role === 'assistant' &&
    Array.isArray(candidate.content) &&
    typeof candidate.stopReason === 'string'
  );
}

function isToolUseTurn(message: unknown): boolean {
  return isAssistantMessage(message) && message.stopReason === 'toolUse';
}

function extractAssistantText(message: unknown): string | undefined {
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

function extractFinishReason(message: unknown): string {
  if (!isAssistantMessage(message)) {
    return 'unknown';
  }

  return message.stopReason;
}

function generateTurnId(): string {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
