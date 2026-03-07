import type { QuestionOption, QuestionRequest } from '@audako/contracts';
import type { AgentTool } from '@mariozechner/pi-agent-core';
import { Type } from '@mariozechner/pi-ai';
import type { ToolRequestHub } from '../services/tool-request-hub.js';
import { toTextResponse } from './helpers.js';

const askQuestionSchema = Type.Object({
  question: Type.String({ description: 'Complete question', minLength: 1 }),
  header: Type.String({
    description: 'Very short label (max 30 chars)',
    minLength: 1,
    maxLength: 30,
  }),
  options: Type.Array(
    Type.Object({
      label: Type.String({ description: 'Display text (1-5 words, concise)', minLength: 1 }),
      description: Type.String({ description: 'Explanation of choice', minLength: 1 }),
    }),
    {
      minItems: 1,
      description: 'Available choices',
    },
  ),
  multiple: Type.Optional(Type.Boolean({ description: 'Allow selecting multiple choices' })),
});

function normalizeQuestionOptions(options: QuestionOption[]): QuestionOption[] {
  const normalized: QuestionOption[] = [];
  const seenLabels = new Set<string>();

  for (const option of options) {
    const label = option.label.trim();
    const description = option.description.trim();

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

export function createAskQuestionTool(
  sessionId: string,
  sessionRequestHub: ToolRequestHub,
): AgentTool<typeof askQuestionSchema> {
  return {
    name: 'ask_question',
    label: 'Ask Question',
    description: 'Prompt user with a question and options, wait for response.',
    parameters: askQuestionSchema,
    execute: async (_toolCallId, params, signal) => {
      const questionText = params.question.trim();
      const headerText = params.header.trim();
      const normalizedOptions = normalizeQuestionOptions(params.options);
      const allowMultiple = params.multiple === true;

      const questionRequest: QuestionRequest = {
        text: questionText,
        header: headerText,
        options: normalizedOptions,
        allowMultiple,
      };

      const responsePromise = sessionRequestHub.create(sessionId, questionRequest);

      const abortHandler = () => {
        sessionRequestHub.cancel(sessionId);
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
        );
      } finally {
        signal?.removeEventListener('abort', abortHandler);
      }
    },
  };
}
