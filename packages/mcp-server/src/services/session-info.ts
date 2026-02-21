import type { ErrorResponse, SessionInfoResponse } from '@audako/contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBridgeErrorResponse(value: unknown): value is ErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

function isSessionInfoResponse(value: unknown): value is SessionInfoResponse {
  return isRecord(value) && typeof value.sessionId === 'string';
}

function resolveBridgeUrl(): string {
  return process.env.AUDAKO_BRIDGE_URL?.replace(/\/+$/, '') ?? 'http://127.0.0.1:3000';
}

function resolveBridgeSessionToken(): string | undefined {
  const token = process.env.AUDAKO_BRIDGE_SESSION_TOKEN?.trim();
  return token && token.length > 0 ? token : undefined;
}

export function getSessionInfoEndpoint(sessionId: string): string {
  return `${resolveBridgeUrl()}/api/session/${encodeURIComponent(sessionId)}/info`;
}

export async function fetchSessionInfo(timeoutMs: number = 5000): Promise<SessionInfoResponse> {
  const sessionId = process.env.AUDAKO_SESSION_ID;
  if (!sessionId) {
    throw new Error('Missing AUDAKO_SESSION_ID in MCP environment.');
  }

  const endpoint = getSessionInfoEndpoint(sessionId);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const bridgeToken = resolveBridgeSessionToken();
    if (bridgeToken) {
      headers.Authorization = `Bearer ${bridgeToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: abortController.signal,
    });

    const payload: unknown = await response.json();

    if (!response.ok) {
      const message = isBridgeErrorResponse(payload)
        ? payload.message
        : `Bridge request failed with status ${response.status}`;
      throw new Error(message);
    }

    if (!isSessionInfoResponse(payload)) {
      throw new Error('Bridge returned an unexpected session payload.');
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}
