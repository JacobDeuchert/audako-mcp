import type {
  EntityCreatedEventPayload,
  EntityMovedEventPayload,
  EntityUpdatedEventPayload,
  QuestionRequest,
} from '@audako/contracts';
import {
  isRequestSessionEventPendingResponse,
  isRequestSessionEventResponse,
  isRequestSessionEventStatusResponse,
} from '@audako/contracts';
import {
  bridgeRequest,
  getSessionEventRequestEndpoint,
  getSessionEventRequestStatusEndpoint,
  getSessionEventsEndpoint,
  resolveSessionId,
} from './bridge-client.js';
import { bridgeWsClient } from './bridge-ws-client.js';
import { logger } from './logger.js';

const DEFAULT_EVENT_TIMEOUT_MS = 3000;
const DEFAULT_REQUEST_TIMEOUT_MS = 180000;
const MIN_REQUEST_TIMEOUT_MS = 1000;
const MAX_REQUEST_TIMEOUT_MS = 600000;

const POLL_INTERVAL_MS = 3000;

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

  const result = await bridgeRequest(endpoint, {
    method: 'POST',
    body: { type, payload },
    timeoutMs,
  });

  if (!result.ok) {
    await logger.warn('session-events: failed to publish event', {
      type,
      sessionId,
      endpoint,
      status: result.status,
      error: result.errorMessage,
    });
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

  const postResult = await bridgeRequest(endpoint, {
    method: 'POST',
    body: { type, payload, timeoutMs: normalizedTimeoutMs },
    timeoutMs: 10000,
  });

  if (!postResult.ok) {
    const errorMessage =
      postResult.errorMessage ?? `Bridge event request failed with status ${postResult.status}`;

    await logger.warn('session-events: failed to request event response', {
      type,
      sessionId,
      endpoint,
      timeoutMs: normalizedTimeoutMs,
      error: errorMessage,
    });

    throw new Error(errorMessage);
  }

  if (isRequestSessionEventResponse(postResult.payload)) {
    return postResult.payload.response;
  }

  if (!isRequestSessionEventPendingResponse(postResult.payload)) {
    throw new Error('Bridge returned invalid response payload');
  }

  const { requestId } = postResult.payload;
  const statusEndpoint = getSessionEventRequestStatusEndpoint(sessionId, requestId);
  const deadline = Date.now() + normalizedTimeoutMs;

  return new Promise<unknown>((outerResolve, outerReject) => {
    let settled = false;

    function settle(resolveValue: boolean, valueOrError: unknown): void {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      if (resolveValue) {
        outerResolve(valueOrError);
      } else {
        outerReject(valueOrError instanceof Error ? valueOrError : new Error(String(valueOrError)));
      }
    }

    const timeoutTimer = setTimeout(() => {
      void logger.warn('session-events: timed out waiting for event response', {
        type,
        sessionId,
        requestId,
        timeoutMs: normalizedTimeoutMs,
      });
      settle(
        false,
        new Error(`Timed out waiting for request response after ${normalizedTimeoutMs}ms`),
      );
    }, normalizedTimeoutMs);

    bridgeWsClient.onHubResponse(requestId, response => {
      settle(true, response);
    });

    async function pollLoop(): Promise<void> {
      while (!settled && Date.now() < deadline) {
        await sleep(POLL_INTERVAL_MS);
        if (settled || Date.now() >= deadline) break;

        const pollResult = await bridgeRequest(statusEndpoint, { timeoutMs: 10000 });

        if (settled) break;

        if (pollResult.status === 404) {
          settle(
            false,
            new Error(`Request ${requestId} expired or was cancelled while waiting for response`),
          );
          return;
        }

        if (!pollResult.ok) {
          await logger.warn('session-events: poll status request failed', {
            sessionId,
            requestId,
            status: pollResult.status,
          });
          continue;
        }

        if (!isRequestSessionEventStatusResponse(pollResult.payload)) {
          await logger.warn('session-events: invalid poll status response', {
            sessionId,
            requestId,
          });
          continue;
        }

        if (pollResult.payload.status === 'resolved') {
          await logger.trace('session-events', 'poll received answer', {
            sessionId,
            requestId,
          });
          settle(true, pollResult.payload.response);
          return;
        }

        if (pollResult.payload.status === 'expired') {
          settle(false, new Error(`Request ${requestId} expired while waiting for response`));
          return;
        }
      }
    }

    pollLoop().catch(error => {
      if (!settled) {
        settle(false, error);
      }
    });
  });
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

export async function publishEntityMovedEvent(payload: EntityMovedEventPayload): Promise<void> {
  await publishSessionEvent('entity.moved', payload);
}
