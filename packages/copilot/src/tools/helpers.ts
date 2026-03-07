import type { AgentToolResult } from '@mariozechner/pi-agent-core';

function stringifyPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  const json = JSON.stringify(payload, null, 2);
  return typeof json === 'string' ? json : String(payload);
}

export function toTextResponse<T = undefined>(payload: unknown, details?: T): AgentToolResult<T> {
  return {
    content: [
      {
        type: 'text',
        text: stringifyPayload(payload),
      },
    ],
    details: details as T,
  };
}

export function toErrorResponse<T = undefined>(
  message: string,
  errorDetails?: unknown,
  details?: T,
): AgentToolResult<T> {
  return {
    content: [
      {
        type: 'text',
        text:
          typeof errorDetails === 'undefined'
            ? message
            : `${message}\n\n${stringifyPayload(errorDetails)}`,
      },
    ],
    details: details as T,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
