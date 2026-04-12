import type { AssistantMessage } from '@mariozechner/pi-ai';

export function isAssistantMessage(message: unknown): message is AssistantMessage {
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
