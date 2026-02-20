export interface BridgeSessionInfoResponse {
  sessionId: string;
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
  updatedAt?: string;
}

interface BridgeErrorResponse {
  error: string;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBridgeErrorResponse(value: unknown): value is BridgeErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

function isBridgeSessionInfoResponse(value: unknown): value is BridgeSessionInfoResponse {
  return isRecord(value) && typeof value.sessionId === 'string';
}

function resolveBridgeUrl(): string {
  return process.env.AUDAKO_BRIDGE_URL?.replace(/\/+$/, '') ?? 'http://127.0.0.1:3000';
}

export function getSessionInfoEndpoint(sessionId: string): string {
  return `${resolveBridgeUrl()}/api/session/${encodeURIComponent(sessionId)}/info`;
}

export async function fetchSessionInfo(
  timeoutMs: number = 5000,
): Promise<BridgeSessionInfoResponse> {
  const sessionId = process.env.AUDAKO_SESSION_ID;
  if (!sessionId) {
    throw new Error('Missing AUDAKO_SESSION_ID in MCP environment.');
  }

  const endpoint = getSessionInfoEndpoint(sessionId);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: abortController.signal,
    });

    const payload: unknown = await response.json();

    if (!response.ok) {
      const message = isBridgeErrorResponse(payload)
        ? payload.message
        : `Bridge request failed with status ${response.status}`;
      throw new Error(message);
    }

    if (!isBridgeSessionInfoResponse(payload)) {
      throw new Error('Bridge returned an unexpected session payload.');
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}
