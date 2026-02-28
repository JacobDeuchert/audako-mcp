import type { QuestionRequest } from '@audako/contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  SessionRequestCancelledError,
  SessionRequestTimeoutError,
} from '../../services/session-request-hub.js';
import { createAskQuestionTool } from '../ask-question.js';

function firstText(result: { content: Array<{ type: string; text?: string }> }): string {
  const first = result.content[0];
  if (!first || first.type !== 'text' || typeof first.text !== 'string') {
    throw new Error('Expected text tool response');
  }

  return first.text;
}

describe('createAskQuestionTool', () => {
  it('submits question and returns formatted user response', async () => {
    const create = vi.fn<[string, QuestionRequest], Promise<unknown>>(() =>
      Promise.resolve(['Blue']),
    );
    const cancel = vi.fn<[string], boolean>(() => true);

    const tool = createAskQuestionTool('session-1', {
      create,
      cancel,
    } as any);

    const result = await tool.execute(
      'call-1',
      {
        question: 'Pick color',
        header: 'Color choice',
        options: [
          { label: 'Red', description: 'Red color' },
          { label: 'Blue', description: 'Blue color' },
        ],
        multiple: false,
      },
      new AbortController().signal,
    );

    expect(create).toHaveBeenCalledWith('session-1', {
      text: 'Pick color',
      header: 'Color choice',
      options: [
        { label: 'Red', description: 'Red color' },
        { label: 'Blue', description: 'Blue color' },
      ],
      allowMultiple: false,
    });
    const text = firstText(result as any);
    expect(text).toContain('User has answered your questions:');
    expect(text).toContain('Red=unanswered');
    expect(text).toContain('Blue=Blue');
    expect(cancel).not.toHaveBeenCalled();
  });

  it('returns all selected options for multiple choice answers', async () => {
    const create = vi.fn<[string, QuestionRequest], Promise<unknown>>(() =>
      Promise.resolve(['Option A', 'Option C']),
    );

    const tool = createAskQuestionTool('session-2', {
      create,
      cancel: vi.fn<[string], boolean>(() => true),
    } as any);

    const result = await tool.execute(
      'call-2',
      {
        question: 'Select options',
        header: 'Multiple',
        options: [
          { label: 'Option A', description: 'A' },
          { label: 'Option B', description: 'B' },
          { label: 'Option C', description: 'C' },
        ],
        multiple: true,
      },
      new AbortController().signal,
    );

    const text = firstText(result as any);
    expect(text).toContain('Option A=Option A');
    expect(text).toContain('Option B=unanswered');
    expect(text).toContain('Option C=Option C');
  });

  it('cancels pending request when execution is aborted', async () => {
    const controller = new AbortController();
    const pending = new Map<string, { sessionId: string }>();
    const requestId = 'req-abort';

    let rejectPending: ((error: Error) => void) | undefined;
    const create = vi.fn<[string, QuestionRequest], Promise<unknown>>((sessionId: string) => {
      pending.set(requestId, { sessionId });
      return new Promise((_, reject) => {
        rejectPending = reject;
      });
    });

    const cancel = vi.fn<[string], boolean>((id: string) => {
      if (id !== requestId) {
        return false;
      }

      pending.delete(id);
      rejectPending?.(new SessionRequestCancelledError(id, 'cancelled'));
      return true;
    });

    const tool = createAskQuestionTool('session-3', {
      create,
      cancel,
      pending,
    } as any);

    const execution = tool.execute(
      'call-3',
      {
        question: 'Continue?',
        header: 'Confirm',
        options: [{ label: 'Yes', description: 'Continue' }],
        multiple: false,
      },
      controller.signal,
    );

    controller.abort();

    await expect(execution).rejects.toBeInstanceOf(SessionRequestCancelledError);
    expect(cancel).toHaveBeenCalledWith(requestId);
  });

  it('propagates timeout errors from request hub', async () => {
    const timeoutError = new SessionRequestTimeoutError('session-timeout', 'req-timeout', 1500);
    const create = vi.fn<[string, QuestionRequest], Promise<unknown>>(() =>
      Promise.reject(timeoutError),
    );

    const tool = createAskQuestionTool('session-timeout', {
      create,
      cancel: vi.fn<[string], boolean>(() => true),
    } as any);

    await expect(
      tool.execute(
        'call-4',
        {
          question: 'Will this timeout?',
          header: 'Timeout',
          options: [{ label: 'A', description: 'Option A' }],
          multiple: false,
        },
        new AbortController().signal,
      ),
    ).rejects.toBe(timeoutError);
  });
});
