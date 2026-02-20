import { logger } from './logger.js';

interface BridgeErrorResponse {
  error: string;
  message: string;
}

const DEFAULT_EVENT_TIMEOUT_MS = 3000;
const DEFAULT_REQUEST_TIMEOUT_MS = 180000;
const MIN_REQUEST_TIMEOUT_MS = 1000;
const MAX_REQUEST_TIMEOUT_MS = 180000;
const REQUEST_HTTP_GRACE_MS = 5000;

interface BridgeRequestSessionEventResponse {
  sessionId: string;
  requestId: string;
  response: unknown;
  respondedAt: string;
}

export interface SessionQuestionOption {
  label: string;
  value?: string;
  description?: string;
}

export interface SessionQuestionRequest {
  text: string;
  options: SessionQuestionOption[];
  allowMultiple?: boolean;
}

export interface EntityCreatedEventPayload {
  entityType: string;
  entityId: string;
  tenantId: string;
  groupId: string;
  sourceTool: 'create-entity';
  timestamp: string;
}

export interface EntityUpdatedEventPayload {
  entityType: string;
  entityId: string;
  tenantId: string;
  groupId: string;
  changedFields: string[];
  sourceTool: 'update-entity';
  timestamp: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBridgeErrorResponse(value: unknown): value is BridgeErrorResponse {
  return isRecord(value) && typeof value.error === 'string' && typeof value.message === 'string';
}

function isBridgeRequestSessionEventResponse(
  value: unknown,
): value is BridgeRequestSessionEventResponse {
  return (
    isRecord(value) &&
    typeof value.sessionId === 'string' &&
    typeof value.requestId === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'response') &&
    typeof value.respondedAt === 'string'
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
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
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
  const abortController = new AbortController();
  const requestTimeout = setTimeout(() => {
    abortController.abort();
  }, normalizedTimeoutMs + REQUEST_HTTP_GRACE_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        payload,
        timeoutMs: normalizedTimeoutMs,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorMessage = await resolveBridgeErrorMessage(
        response,
        `Bridge event request failed with status ${response.status}`,
      );

      throw new Error(errorMessage);
    }

    const responsePayload: unknown = await response.json();
    if (!isBridgeRequestSessionEventResponse(responsePayload)) {
      throw new Error('Bridge returned invalid request event response payload');
    }

    return responsePayload.response;
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.name === 'AbortError'
        ? `Timed out waiting for request response after ${normalizedTimeoutMs}ms`
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
}

export async function requestQuestionAnswer(
  question: SessionQuestionRequest,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
): Promise<string[]> {
  const response = await requestSessionEvent('question.ask', question, timeoutMs);

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
