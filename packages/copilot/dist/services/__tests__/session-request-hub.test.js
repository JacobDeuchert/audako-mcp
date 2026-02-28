import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionRequestCancelledError, SessionRequestHub, SessionRequestTimeoutError, } from '../session-request-hub.js';
const TEST_REQUEST = {
    text: 'Choose one option',
    header: 'Question',
    options: [
        { label: 'Option A', description: 'First option' },
        { label: 'Option B', description: 'Second option' },
    ],
};
function extractRequestId(publishMock) {
    const event = publishMock.mock.calls[0]?.[1];
    if (!event) {
        throw new Error('Expected publish to be called');
    }
    return event.payload.requestId;
}
describe('SessionRequestHub', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it('resolves create() promise when resolve() is called for matching requestId', async () => {
        const publish = vi.fn(() => 1);
        const hub = new SessionRequestHub({ eventHub: { publish }, timeoutMs: 1000 });
        const responsePromise = hub.create('session-1', TEST_REQUEST);
        const requestId = extractRequestId(publish);
        const resolved = hub.resolve(requestId, { choice: 'Option A' });
        expect(resolved).toBe(true);
        await expect(responsePromise).resolves.toEqual({ choice: 'Option A' });
    });
    it('rejects with timeout error when no response arrives in time', async () => {
        const publish = vi.fn(() => 1);
        const hub = new SessionRequestHub({ eventHub: { publish }, timeoutMs: 50 });
        const responsePromise = hub.create('session-timeout', TEST_REQUEST);
        const requestId = extractRequestId(publish);
        const timeoutRejection = expect(responsePromise).rejects.toBeInstanceOf(SessionRequestTimeoutError);
        await vi.advanceTimersByTimeAsync(60);
        await timeoutRejection;
        const status = hub.getStatus(requestId);
        expect(status).toMatchObject({ status: 'cancelled', reason: 'timeout' });
    });
    it('cancel() rejects pending promise with cancellation error', async () => {
        const publish = vi.fn(() => 1);
        const hub = new SessionRequestHub({ eventHub: { publish }, timeoutMs: 1000 });
        const responsePromise = hub.create('session-cancel', TEST_REQUEST);
        const requestId = extractRequestId(publish);
        const cancellationRejection = expect(responsePromise).rejects.toBeInstanceOf(SessionRequestCancelledError);
        const cancelled = hub.cancel(requestId);
        expect(cancelled).toBe(true);
        await cancellationRejection;
        expect(hub.getStatus(requestId)).toMatchObject({ status: 'cancelled', reason: 'cancelled' });
    });
    it('getStatus() tracks pending then resolved lifecycle', async () => {
        const publish = vi.fn(() => 1);
        const hub = new SessionRequestHub({ eventHub: { publish }, timeoutMs: 1000 });
        const responsePromise = hub.create('session-status', TEST_REQUEST);
        const requestId = extractRequestId(publish);
        const pendingStatus = hub.getStatus(requestId);
        expect(pendingStatus?.status).toBe('pending');
        hub.resolve(requestId, 'done');
        await expect(responsePromise).resolves.toBe('done');
        const resolvedStatus = hub.getStatus(requestId);
        expect(resolvedStatus).toMatchObject({ status: 'resolved', response: 'done' });
    });
    it('handles concurrent requests without cross-resolution', async () => {
        const publish = vi.fn(() => 1);
        const hub = new SessionRequestHub({ eventHub: { publish }, timeoutMs: 1000 });
        const p1 = hub.create('session-1', TEST_REQUEST);
        const id1 = extractRequestId(publish);
        const p2 = hub.create('session-1', {
            ...TEST_REQUEST,
            text: 'Second question',
        });
        const id2 = publish.mock.calls[1]?.[1].payload.requestId;
        expect(id2).toBeDefined();
        expect(id2).not.toBe(id1);
        hub.resolve(id2, { answer: 2 });
        hub.resolve(id1, { answer: 1 });
        await expect(p1).resolves.toEqual({ answer: 1 });
        await expect(p2).resolves.toEqual({ answer: 2 });
    });
    it('publishes hub.request event on create()', () => {
        const publish = vi.fn(() => 1);
        const hub = new SessionRequestHub({ eventHub: { publish }, timeoutMs: 1000 });
        void hub.create('session-event', TEST_REQUEST);
        expect(publish).toHaveBeenCalledTimes(1);
        const [sessionId, event] = publish.mock.calls[0];
        expect(sessionId).toBe('session-event');
        expect(event.type).toBe('hub.request');
        expect(event.sessionId).toBe('session-event');
        expect(event.payload.requestType).toBe('question.ask');
        expect(event.payload.payload).toEqual(TEST_REQUEST);
        expect(typeof event.payload.requestId).toBe('string');
        expect(typeof event.payload.expiresAt).toBe('string');
    });
    it('returns false when resolve() or cancel() is called for unknown request id', () => {
        const publish = vi.fn(() => 1);
        const hub = new SessionRequestHub({ eventHub: { publish } });
        expect(hub.resolve('missing', 'ignored')).toBe(false);
        expect(hub.cancel('missing')).toBe(false);
        expect(hub.getStatus('missing')).toBeUndefined();
    });
});
//# sourceMappingURL=session-request-hub.test.js.map