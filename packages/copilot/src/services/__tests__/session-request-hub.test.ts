import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SessionRequestCancelledError,
  SessionRequestHub,
  SessionRequestTimeoutError,
} from '../session-request-hub.js';

describe('SessionRequestHub', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves waitForResponse when resolve() is called with matching requestId', async () => {
    const hub = new SessionRequestHub();

    const pendingRequest = hub.create('session-1', 1000);
    const resolveResult = hub.resolve('session-1', pendingRequest.requestId, {
      choice: 'Option A',
    });

    expect(resolveResult.resolved).toBe(true);
    if (!resolveResult.resolved) throw new Error('Expected resolved');
    expect(resolveResult.respondedAt).toBeDefined();

    await expect(pendingRequest.waitForResponse).resolves.toEqual({
      response: { choice: 'Option A' },
      respondedAt: resolveResult.respondedAt,
    });
  });

  it('rejects with timeout error when no response arrives in time', async () => {
    const hub = new SessionRequestHub();

    const pendingRequest = hub.create('session-timeout', 50);
    const timeoutRejection = expect(pendingRequest.waitForResponse).rejects.toBeInstanceOf(
      SessionRequestTimeoutError,
    );

    await vi.advanceTimersByTimeAsync(60);
    await timeoutRejection;

    const status = hub.getStatus('session-timeout', pendingRequest.requestId);
    expect(status).toEqual({ status: 'expired' });
  });

  it('cancelSession() rejects all pending promises for that session', async () => {
    const hub = new SessionRequestHub();

    const pendingRequest1 = hub.create('session-cancel', 1000);
    const pendingRequest2 = hub.create('session-cancel', 1000);
    const cancellationRejection1 = expect(pendingRequest1.waitForResponse).rejects.toBeInstanceOf(
      SessionRequestCancelledError,
    );
    const cancellationRejection2 = expect(pendingRequest2.waitForResponse).rejects.toBeInstanceOf(
      SessionRequestCancelledError,
    );

    hub.cancelSession('session-cancel');

    await cancellationRejection1;
    await cancellationRejection2;

    expect(hub.getStatus('session-cancel', pendingRequest1.requestId)).toEqual({
      status: 'expired',
    });
    expect(hub.getStatus('session-cancel', pendingRequest2.requestId)).toEqual({
      status: 'expired',
    });
  });

  it('getStatus() tracks pending then resolved lifecycle', async () => {
    const hub = new SessionRequestHub();

    const pendingRequest = hub.create('session-status', 1000);

    const pendingStatus = hub.getStatus('session-status', pendingRequest.requestId);
    expect(pendingStatus?.status).toBe('pending');
    expect(pendingStatus).toHaveProperty('expiresAt');

    const resolveResult = hub.resolve('session-status', pendingRequest.requestId, 'done');
    expect(resolveResult.resolved).toBe(true);
    if (!resolveResult.resolved) throw new Error('Expected resolved');

    const resolution = await pendingRequest.waitForResponse;
    expect(resolution.response).toBe('done');

    const resolvedStatus = hub.getStatus('session-status', pendingRequest.requestId);
    expect(resolvedStatus).toMatchObject({
      status: 'resolved',
      response: 'done',
      respondedAt: resolveResult.respondedAt,
    });
  });

  it('getStatus() returns expired for unknown requestId', () => {
    const hub = new SessionRequestHub();
    expect(hub.getStatus('session-unknown', 'request-unknown')).toEqual({ status: 'expired' });
  });

  it('resolve() returns { resolved: false } for unknown requestId', () => {
    const hub = new SessionRequestHub();
    const result = hub.resolve('session-unknown', 'request-unknown', 'irrelevant');
    expect(result).toEqual({ resolved: false });
  });

  it('multiple sessions can have pending requests simultaneously', async () => {
    const hub = new SessionRequestHub();

    const pending1 = hub.create('session-A', 1000);
    const pending2 = hub.create('session-B', 1000);

    const result1 = hub.resolve('session-A', pending1.requestId, 'answer-A');
    const result2 = hub.resolve('session-B', pending2.requestId, 'answer-B');

    expect(result1.resolved).toBe(true);
    expect(result2.resolved).toBe(true);

    const resolution1 = await pending1.waitForResponse;
    const resolution2 = await pending2.waitForResponse;

    expect(resolution1.response).toBe('answer-A');
    expect(resolution2.response).toBe('answer-B');
  });

  it('creates unique requestId for each call', () => {
    const hub = new SessionRequestHub();

    const pending1 = hub.create('session-1', 1000);
    const pending2 = hub.create('session-1', 1000);

    expect(pending1.requestId).not.toBe(pending2.requestId);
  });

  it('includes expiresAt timestamp in return value', () => {
    const hub = new SessionRequestHub();
    const before = Date.now();
    const pending = hub.create('session-1', 1000);
    const after = Date.now() + 1000;

    const expiresMs = new Date(pending.expiresAt).getTime();
    expect(expiresMs).toBeGreaterThanOrEqual(before + 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + 100); // allow 100ms tolerance
  });

  it('cancelSession() does not affect other sessions', async () => {
    const hub = new SessionRequestHub();

    const pendingA = hub.create('session-A', 1000);
    const pendingB = hub.create('session-B', 1000);

    const cancellationA = expect(pendingA.waitForResponse).rejects.toBeInstanceOf(
      SessionRequestCancelledError,
    );

    hub.cancelSession('session-A');

    await cancellationA;

    // Session B should still be pending
    const statusB = hub.getStatus('session-B', pendingB.requestId);
    expect(statusB?.status).toBe('pending');

    // And can still be resolved
    const resolveResult = hub.resolve('session-B', pendingB.requestId, 'B-response');
    expect(resolveResult.resolved).toBe(true);
    await expect(pendingB.waitForResponse).resolves.toMatchObject({ response: 'B-response' });
  });
});
