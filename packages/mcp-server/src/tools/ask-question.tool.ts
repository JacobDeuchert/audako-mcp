import type { QuestionOption } from '@audako/contracts';
import { z } from 'zod';
import { logger } from '../services/logger.js';
import { requestQuestionAnswer } from '../services/session-events.js';
import { toErrorResponse, toTextResponse } from './helpers.js';
import { defineTool } from './registry.js';

const QuestionOptionSchema = z.object({
  label: z.string().describe('Display text (1-5 words, concise)'),
  description: z.string().describe('Explanation of choice'),
});

type QuestionOptionInput = z.infer<typeof QuestionOptionSchema>;

const QuestionInfo = z.object({
  question: z.string().describe('Complete question'),
  header: z.string().describe('Very short label (max 30 chars)'),
  options: z.array(QuestionOptionSchema).min(1).describe('Available choices'),
  multiple: z.boolean().optional().describe('Allow selecting multiple choices'),
});

function normalizeQuestionOptions(options: QuestionOptionInput[]): QuestionOption[] {
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

export const toolDefinitions = [
  defineTool({
    name: 'ask-question',
    config: {
      description: 'Ask the user a question with predefined choices and wait for their selection.',
      inputSchema: QuestionInfo.shape,
    },
    handler: async ({ question, header, options, multiple }) => {
      const questionText = question.trim();
      if (!questionText) {
        return toErrorResponse("'question' must be a non-empty string.");
      }

      const headerText = header.trim();
      if (!headerText) {
        return toErrorResponse("'header' must be a non-empty string.");
      }

      let normalizedOptions: QuestionOption[];
      try {
        normalizedOptions = normalizeQuestionOptions(options);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toErrorResponse(errorMessage);
      }

      const allowMultiple = multiple === true;

      try {
        await logger.trace('ask-question', 'sending question', {
          questionLength: questionText.length,
          headerLength: headerText.length,
          optionCount: normalizedOptions.length,
          allowMultiple,
        });

        const answers = await requestQuestionAnswer({
          text: questionText,
          header: headerText,
          options: normalizedOptions,
          allowMultiple,
        });

        const resolvedAnswers = answers.length === 0 ? ['unanswered'] : answers;

        const formatted = normalizedOptions
          .map(option => {
            const isSelected = resolvedAnswers.includes(option.label);
            return `${option.label}=${isSelected ? option.label : 'unanswered'}`;
          })
          .join(', ');

        await logger.info('ask-question: question answered', {
          selectedLabels: resolvedAnswers,
          allowMultiple,
        });

        return toTextResponse(
          `User has answered your questions: ${formatted}. You can now continue with the user's answers in mind.`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logger.warn('ask-question: failed', {
          error: errorMessage,
        });

        return toErrorResponse(`Failed to ask question: ${errorMessage}`);
      }
    },
  }),
];
