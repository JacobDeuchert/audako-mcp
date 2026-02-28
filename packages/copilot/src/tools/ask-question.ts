import type { QuestionOption, QuestionRequest } from '@audako/contracts';
import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { SessionRequestHub } from '../services/session-request-hub.js';
import { toTextResponse } from './helpers.js';
import { askQuestionSchema } from './schemas.js';

type AgentSchema<T> = T & any;

interface InternalPendingRequest {
  sessionId: string;
}

interface InternalSessionRequestHub {
  pending?: Map<string, InternalPendingRequest>;
}

function normalizeQuestionOptions(options: QuestionOption[]): QuestionOption[] {
  const normalized: QuestionOption[] = [];
  const seenLabels = new Set<string>();

  for (const option of options) {
    const label = option.label.trim();
    const description = option.description.trim();

    if (!label) {
      throw new Error('Each option label must be a non-empty string.');
    }

    if (!description) {
      throw new Error('Each option description must be a non-empty string.');
    }

    if (seenLabels.has(label)) {
      throw new Error(`Duplicate option label '${label}' is not allowed.`);
    }

    seenLabels.add(label);
    normalized.push({ label, description });
  }

  return normalized;
}

function toSelectedLabels(response: unknown): string[] {
  if (typeof response === 'string') {
    const answer = response.trim();
    return answer ? [answer] : [];
  }

  if (!Array.isArray(response)) {
    throw new Error('Invalid question response payload from hub');
  }

  const selected: string[] = [];
  for (const item of response) {
    if (typeof item !== 'string') {
      throw new Error('Invalid question response payload from hub');
    }

    const answer = item.trim();
    if (answer) {
      selected.push(answer);
    }
  }

  return selected;
}

function getPendingRequestId(
  sessionRequestHub: SessionRequestHub,
  previousPending: Set<string>,
  sessionId: string,
): string | undefined {
  const pending = (sessionRequestHub as unknown as InternalSessionRequestHub).pending;
  if (!pending) {
    return undefined;
  }

  for (const [requestId, request] of pending.entries()) {
    if (previousPending.has(requestId)) {
      continue;
    }

    if (request.sessionId === sessionId) {
      return requestId;
    }
  }

  return undefined;
}

export function createAskQuestionTool(
  sessionId: string,
  sessionRequestHub: SessionRequestHub,
): AgentTool<AgentSchema<typeof askQuestionSchema>> {
  return {
    name: 'audako_mcp_ask_question',
    label: 'Ask Question',
    description: 'Prompt user with a question and options, wait for response.',
    parameters: askQuestionSchema,
    execute: async (_toolCallId, params, signal) => {
      const questionText = params.question.trim();
      if (!questionText) {
        throw new Error("'question' must be a non-empty string.");
      }

      const headerText = params.header.trim();
      if (!headerText) {
        throw new Error("'header' must be a non-empty string.");
      }

      const normalizedOptions = normalizeQuestionOptions(params.options);
      const allowMultiple = params.multiple === true;

      const questionRequest: QuestionRequest = {
        text: questionText,
        header: headerText,
        options: normalizedOptions,
        allowMultiple,
      };

      const previousPending = new Set(
        ((sessionRequestHub as unknown as InternalSessionRequestHub).pending?.keys() ??
          []) as Iterable<string>,
      );

      const responsePromise = sessionRequestHub.create(sessionId, questionRequest);
      const requestId = getPendingRequestId(sessionRequestHub, previousPending, sessionId);

      const abortHandler = () => {
        if (requestId) {
          sessionRequestHub.cancel(requestId);
        }
      };

      signal?.addEventListener('abort', abortHandler);

      try {
        if (signal?.aborted) {
          abortHandler();
        }

        const answers = toSelectedLabels(await responsePromise);
        const resolvedAnswers = answers.length === 0 ? ['unanswered'] : answers;

        const formatted = normalizedOptions
          .map(option => {
            const isSelected = resolvedAnswers.includes(option.label);
            return `${option.label}=${isSelected ? option.label : 'unanswered'}`;
          })
          .join(', ');

        return toTextResponse(
          `User has answered your questions: ${formatted}. You can now continue with the user's answers in mind.`,
        ) as any;
      } finally {
        signal?.removeEventListener('abort', abortHandler);
      }
    },
  };
}
