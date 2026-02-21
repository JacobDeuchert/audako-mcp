import type {
  EntityCreatedEventPayload,
  EntityUpdatedEventPayload,
  ErrorResponse,
  QuestionRequest,
  RequestSessionEventPendingResponse,
  RequestSessionEventResponse,
  RequestSessionEventStatusResponse,
} from '@audako/contracts';
import { logger } from './logger.js';

const DEFAULT_EVENT_TIMEOUT_MS = 3000;
const DEFAULT_REQUEST_TIMEOUT_MS = 180000;
const MIN_REQUEST_TIMEOUT_MS = 1000;
const MAX_REQUEST_TIMEOUT_MS = 600000;

/** Grace period added to the HTTP abort timer so the bridge-side timeout fires first. */
const REQUEST_HTTP_GRACE_MS = 5000;

/** Initial long-poll window sent to bridge. If the user doesn't respond within
 *  this window the bridge returns 202 and the MCP server switches to polling. */
const DEFAULT_LONG_POLL_MS = 120000;

/** Interval between status poll requests after the long-poll window expires. */
const POLL_INTERVAL_MS = 3000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBridgeErrorResponse(value: unknown): value is ErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

function isBridgeRequestSessionEventResponse(value: unknown): value is RequestSessionEventResponse {
  return (
    isRecord(value) &&
    typeof value.sessionId === 'string' &&
    typeof value.requestId === 'string' &&
    Object.hasOwn(value, 'response') &&
    typeof value.respondedAt === 'string'
  );
}

function isBridgePendingResponse(value: unknown): value is RequestSessionEventPendingResponse {
  return isRecord(value) && value.status === 'pending' && typeof value.requestId === 'string';
}

function isBridgeStatusResponse(value: unknown): value is RequestSessionEventStatusResponse {
  return (
    isRecord(value) &&
    typeof value.sessionId === 'string' &&
    typeof value.requestId === 'string' &&
    typeof value.status === 'string'
  );
}

function normalizeRequestTimeoutMs(timeoutMs: number): number {
  if (!Number.isFinite(timeoutMs)) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  const normalized = Math.floor(timeoutMs);
  if (normalized < MIN_REQUEST_TIMEOUT_MS) {
    return MIN_REQUEST_TIMEOUT_MS;
  }

  if (normalized > MAX_REQUEST_TIMEOUT_MS) {
    return MAX_REQUEST_TIMEOUT_MS;
  }

  return normalized;
}

async function resolveBridgeErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const responsePayload: unknown = await response.json();
    if (isBridgeErrorResponse(responsePayload)) {
      return responsePayload.message;
    }
  } catch {
    // Ignore JSON parse errors for non-JSON error bodies.
  }

  return fallbackMessage;
}

function resolveBridgeUrl(): string {
  return process.env.AUDAKO_BRIDGE_URL?.replace(/\/+$/, '') ?? 'http://127.0.0.1:3000';
}

function resolveBridgeSessionToken(): string | undefined {
  const token = process.env.AUDAKO_BRIDGE_SESSION_TOKEN?.trim();
  return token && token.length > 0 ? token : undefined;
}

function buildBridgeHeaders(contentType?: string): Record<string, string> {
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

function resolveSessionId(): string | undefined {
  const sessionId = process.env.AUDAKO_SESSION_ID?.trim();
  return sessionId && sessionId.length > 0 ? sessionId : undefined;
}

function getSessionEventsEndpoint(sessionId: string): string {
  return `${resolveBridgeUrl()}/api/session/${encodeURIComponent(sessionId)}/events`;
}

function getSessionEventRequestEndpoint(sessionId: string): string {
  return `${resolveBridgeUrl()}/api/session/${encodeURIComponent(sessionId)}/events/request`;
}

function getSessionEventRequestStatusEndpoint(sessionId: string, requestId: string): string {
  return `${resolveBridgeUrl()}/api/session/${encodeURIComponent(sessionId)}/events/request/${encodeURIComponent(requestId)}/status`;
}

async function publishSessionEvent(
  type: string,
  payload: unknown,
  timeoutMs: number = DEFAULT_EVENT_TIMEOUT_MS,
): Promise<void> {
  const sessionId = resolveSessionId();
  if (!sessionId) {
    await logger.warn('session-events: skipped publish because AUDAKO_SESSION_ID is missing', {
      type,
    });
    return;
  }

  const endpoint = getSessionEventsEndpoint(sessionId);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: buildBridgeHeaders('application/json'),
      body: JSON.stringify({
        type,
        payload,
      }),
      signal: abortController.signal,
    });

    if (response.ok) {
      return;
    }

    const errorMessage = await resolveBridgeErrorMessage(
      response,
      `Bridge event publish failed with status ${response.status}`,
    );

    await logger.warn('session-events: bridge rejected event publish', {
      type,
      sessionId,
      endpoint,
      status: response.status,
      error: errorMessage,
    });
  } catch (error) {
    await logger.warn('session-events: failed to publish event', {
      type,
      sessionId,
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestSessionEvent(
  type: string,
  payload: unknown,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<unknown> {
  const sessionId = resolveSessionId();
  if (!sessionId) {
    throw new Error(
      'Unable to request session event response because AUDAKO_SESSION_ID is missing',
    );
  }

  const normalizedTimeoutMs = normalizeRequestTimeoutMs(timeoutMs);
  const endpoint = getSessionEventRequestEndpoint(sessionId);

  // Determine whether to use the hybrid long-poll + polling approach.
  // Only engage polling when the total timeout exceeds the long-poll window.
  const useLongPoll = normalizedTimeoutMs > DEFAULT_LONG_POLL_MS;
  const longPollMs = useLongPoll ? DEFAULT_LONG_POLL_MS : undefined;

  // Phase 1: Initial long-poll request.
  // If longPollMs is set, the bridge will return 202 after that window if no
  // answer arrives. Otherwise it blocks for the full timeout (legacy behaviour).
  const httpTimeoutMs = useLongPoll
    ? DEFAULT_LONG_POLL_MS + REQUEST_HTTP_GRACE_MS
    : normalizedTimeoutMs + REQUEST_HTTP_GRACE_MS;

  const abortController = new AbortController();
  const requestTimeout = setTimeout(() => {
    abortController.abort();
  }, httpTimeoutMs);

  let pendingRequestId: string | undefined;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: buildBridgeHeaders('application/json'),
      body: JSON.stringify({
        type,
        payload,
        timeoutMs: normalizedTimeoutMs,
        ...(longPollMs !== undefined ? { longPollMs } : {}),
      }),
      signal: abortController.signal,
    });

    // 202 Accepted = long-poll window expired, switch to polling.
    if (response.status === 202) {
      const pendingPayload: unknown = await response.json();
      if (!isBridgePendingResponse(pendingPayload)) {
        throw new Error('Bridge returned invalid pending response payload');
      }

      pendingRequestId = pendingPayload.requestId;
    } else if (!response.ok) {
      const errorMessage = await resolveBridgeErrorMessage(
        response,
        `Bridge event request failed with status ${response.status}`,
      );

      throw new Error(errorMessage);
    } else {
      // 200 OK = immediate response.
      const responsePayload: unknown = await response.json();
      if (!isBridgeRequestSessionEventResponse(responsePayload)) {
        throw new Error('Bridge returned invalid request event response payload');
      }

      return responsePayload.response;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.name === 'AbortError'
        ? `Timed out waiting for request response after ${useLongPoll ? 'long-poll window' : `${normalizedTimeoutMs}ms`}`
        : error instanceof Error
          ? error.message
          : String(error);

    await logger.warn('session-events: failed to request event response', {
      type,
      sessionId,
      endpoint,
      timeoutMs: normalizedTimeoutMs,
      error: errorMessage,
    });

    throw new Error(errorMessage);
  } finally {
    clearTimeout(requestTimeout);
  }

  // Phase 2: Poll for the answer until the full timeout expires.
  if (!pendingRequestId) {
    throw new Error('Unexpected state: missing pending request ID for polling');
  }

  return pollForRequestResponse(sessionId, pendingRequestId, normalizedTimeoutMs, type);
}

async function pollForRequestResponse(
  sessionId: string,
  requestId: string,
  totalTimeoutMs: number,
  type: string,
): Promise<unknown> {
  const statusEndpoint = getSessionEventRequestStatusEndpoint(sessionId, requestId);
  const deadline = Date.now() + totalTimeoutMs;

  await logger.trace('session-events', 'switching to polling', {
    type,
    sessionId,
    requestId,
    remainingMs: totalTimeoutMs,
  });

  while (Date.now() < deadline) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      break;
    }

    // Wait before polling (but not longer than the remaining time).
    await sleep(Math.min(POLL_INTERVAL_MS, remainingMs));

    if (Date.now() >= deadline) {
      break;
    }

    const pollAbort = new AbortController();
    const pollTimeout = setTimeout(() => pollAbort.abort(), 10000);

    try {
      const response = await fetch(statusEndpoint, {
        method: 'GET',
        headers: buildBridgeHeaders(),
        signal: pollAbort.signal,
      });

      if (response.status === 404) {
        // Request expired or was cancelled on the bridge side.
        throw new Error(`Request ${requestId} expired or was cancelled while waiting for response`);
      }

      if (!response.ok) {
        // Transient error — log and retry.
        await logger.warn('session-events: poll status request failed', {
          sessionId,
          requestId,
          status: response.status,
        });
        continue;
      }

      const statusPayload: unknown = await response.json();
      if (!isBridgeStatusResponse(statusPayload)) {
        await logger.warn('session-events: invalid poll status response', {
          sessionId,
          requestId,
        });
        continue;
      }

      if (statusPayload.status === 'resolved') {
        await logger.trace('session-events', 'poll received answer', {
          sessionId,
          requestId,
        });
        return statusPayload.response;
      }

      if (statusPayload.status === 'expired') {
        throw new Error(`Request ${requestId} expired while waiting for response`);
      }

      // status === 'pending' — continue polling.
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Individual poll request timed out — retry.
        await logger.warn('session-events: poll request timed out, retrying', {
          sessionId,
          requestId,
        });
        continue;
      }

      throw error;
    } finally {
      clearTimeout(pollTimeout);
    }
  }

  throw new Error(`Timed out waiting for request response after ${totalTimeoutMs}ms`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function requestQuestionAnswer(question: QuestionRequest): Promise<string[]> {
  const response = await requestSessionEvent('question.ask', question);

  if (!Array.isArray(response) || !response.every(item => typeof item === 'string')) {
    throw new Error('Invalid question response payload from hub');
  }

  return response;
}

export async function publishEntityCreatedEvent(payload: EntityCreatedEventPayload): Promise<void> {
  await publishSessionEvent('entity.created', payload);
}

export async function publishEntityUpdatedEvent(payload: EntityUpdatedEventPayload): Promise<void> {
  await publishSessionEvent('entity.updated', payload);
}
