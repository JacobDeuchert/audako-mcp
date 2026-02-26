import { isErrorResponse } from '@audako/contracts';
import { logger } from './logger.js';
import { getSessionId, resolveSessionId } from './session-id.js';

const BRIDGE_URL_ENV_VAR = 'AUDAKO_BRIDGE_URL';
const BRIDGE_TOKEN_ENV_VAR = 'AUDAKO_BRIDGE_SESSION_TOKEN';
const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:3000';


/**
 * Resolves the bridge URL from environment variables.
 * Defaults to 'http://127.0.0.1:3000' if not configured.
 */
export function resolveBridgeUrl(): string {
  return process.env[BRIDGE_URL_ENV_VAR]?.replace(/\/+$/, '') ?? DEFAULT_BRIDGE_URL;
}

/**
 * Resolves the bridge session token from environment variables.
 * Returns undefined if the token is missing or empty.
 */
export function resolveBridgeSessionToken(): string | undefined {
  const token = process.env[BRIDGE_TOKEN_ENV_VAR]?.trim();
  return token && token.length > 0 ? token : undefined;
}

/**
 * Builds headers for bridge requests, including auth if configured.
 */
export function buildBridgeHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const bridgeToken = resolveBridgeSessionToken();
  if (bridgeToken) {
    headers.Authorization = `Bearer ${bridgeToken}`;
  }

  return headers;
}

/**
 * Builds a full URL for a bridge API endpoint.
 */
export function buildBridgeUrl(path: string): string {
  const baseUrl = resolveBridgeUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Gets the session info endpoint URL for a given session ID.
 */
export function getSessionInfoEndpoint(sessionId: string): string {
  return buildBridgeUrl(`/api/session/${encodeURIComponent(sessionId)}/info`);
}

/**
 * Gets the session events endpoint URL for a given session ID.
 */
export function getSessionEventsEndpoint(sessionId: string): string {
  return buildBridgeUrl(`/api/session/${encodeURIComponent(sessionId)}/events`);
}

/**
 * Gets the session event request endpoint URL for a given session ID.
 */
export function getSessionEventRequestEndpoint(sessionId: string): string {
  return buildBridgeUrl(`/api/session/${encodeURIComponent(sessionId)}/events/request`);
}

/**
 * Gets the session event request status endpoint URL.
 */
export function getSessionEventRequestStatusEndpoint(sessionId: string, requestId: string): string {
  return buildBridgeUrl(
    `/api/session/${encodeURIComponent(sessionId)}/events/request/${encodeURIComponent(requestId)}/status`,
  );
}

interface BridgeRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

interface BridgeRequestResult {
  ok: boolean;
  status: number;
  payload: unknown;
  errorMessage?: string;
}

/**
 * Makes a request to the backend bridge.
 * Handles timeouts, auth headers, and basic error parsing.
 */
export async function bridgeRequest(
  endpoint: string,
  options: BridgeRequestOptions = {},
): Promise<BridgeRequestResult> {
  const { method = 'GET', headers = {}, body, timeoutMs = 5000 } = options;

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  const mergedHeaders = {
    ...buildBridgeHeaders(body !== undefined ? 'application/json' : undefined),
    ...headers,
  };

  try {
    const response = await fetch(endpoint, {
      method,
      headers: mergedHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: abortController.signal,
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    if (!response.ok) {
      const errorMessage = isErrorResponse(payload)
        ? payload.message
        : `Bridge request failed with status ${response.status}`;

      return {
        ok: false,
        status: response.status,
        payload,
        errorMessage,
      };
    }

    return {
      ok: true,
      status: response.status,
      payload,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logger.warn('bridge-client: request failed', {
      endpoint,
      method,
      error: errorMessage,
    });

    return {
      ok: false,
      status: 0,
      payload: undefined,
      errorMessage,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Validates that a bridge response payload matches an expected type guard.
 * Throws a descriptive error if validation fails.
 */
export function validateBridgeResponse<T>(
  result: BridgeRequestResult,
  typeGuard: (value: unknown) => value is T,
  expectedTypeName: string,
): T {
  if (!result.ok) {
    throw new Error(result.errorMessage ?? 'Bridge request failed');
  }

  if (!typeGuard(result.payload)) {
    throw new Error(`Bridge returned an unexpected payload. Expected ${expectedTypeName}.`);
  }

  return result.payload;
}

export { getSessionId, resolveSessionId };
