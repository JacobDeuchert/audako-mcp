export interface ToolTextResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

function stringifyPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  const json = JSON.stringify(payload, null, 2);
  return typeof json === 'string' ? json : String(payload);
}

export function toTextResponse(payload: unknown): ToolTextResponse {
  return {
    content: [
      {
        type: 'text',
        text: stringifyPayload(payload),
      },
    ],
  };
}

export function toErrorResponse(message: string, details?: unknown): ToolTextResponse {
  return {
    content: [
      {
        type: 'text',
        text:
          typeof details === 'undefined' ? message : `${message}\n\n${stringifyPayload(details)}`,
      },
    ],
    isError: true,
  };
}

export function toStructuredErrorResponse(payload: unknown): ToolTextResponse {
  return toErrorResponse(JSON.stringify(payload, null, 2));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizeRequiredString(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`'${fieldName}' must be a non-empty string.`);
  }

  return trimmed;
}

export function getRecordStringValue(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  return normalizeOptionalString(record[key]);
}
