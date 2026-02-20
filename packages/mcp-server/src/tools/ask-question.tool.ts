import { z } from 'zod';
import { logger } from '../services/logger.js';
import { requestQuestionAnswer } from '../services/session-events.js';
import { defineTool } from './registry.js';
import { toErrorResponse, toTextResponse } from './helpers.js';

interface QuestionOptionInput {
  label: string;
  value?: string;
  description?: string;
}

interface NormalizedQuestionOption {
  label: string;
  value: string;
  description?: string;
}

function normalizeQuestionOptions(options: QuestionOptionInput[]): NormalizedQuestionOption[] {
  const normalized: NormalizedQuestionOption[] = [];
  const seenValues = new Set<string>();

  for (const option of options) {
    const label = option.label.trim();
    const value = option.value?.trim() || label;
    const description = option.description?.trim() || undefined;

    if (!label) {
      throw new Error('Each option label must be a non-empty string.');
    }

    if (!value) {
      throw new Error('Each option value must be a non-empty string.');
    }

    if (seenValues.has(value)) {
      throw new Error(`Duplicate option value '${value}' is not allowed.`);
    }

    seenValues.add(value);
    normalized.push({
      label,
      value,
      description,
    });
  }

  return normalized;
}

export const toolDefinitions = [
  defineTool({
    name: 'ask-question',
    config: {
      description:
        'Ask the client a single-choice question and wait for exactly one selected answer.',
      inputSchema: {
        question: z.string().describe('Question text shown to the user.'),
        options: z
          .array(
            z.object({
              label: z.string().describe('Option label shown to the user.'),
              value: z
                .string()
                .optional()
                .describe('Stable option value returned by the user selection.'),
              description: z
                .string()
                .optional()
                .describe('Optional extra details for this option.'),
            }),
          )
          .min(1)
          .describe('Available options. Exactly one answer is expected.'),
        timeoutMs: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Optional timeout override in milliseconds (max 180000).'),
      },
    },
    handler: async ({ question, options, timeoutMs }) => {
      const questionText = question.trim();
      if (!questionText) {
        return toErrorResponse("'question' must be a non-empty string.");
      }

      let normalizedOptions: NormalizedQuestionOption[];
      try {
        normalizedOptions = normalizeQuestionOptions(options);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toErrorResponse(errorMessage);
      }

      try {
        await logger.trace('ask-question', 'sending single-choice question', {
          questionLength: questionText.length,
          optionCount: normalizedOptions.length,
          timeoutMs,
        });

        const answers = await requestQuestionAnswer(
          {
            text: questionText,
            options: normalizedOptions,
            allowMultiple: false,
          },
          timeoutMs,
        );

        if (answers.length !== 1) {
          return toErrorResponse(`Expected exactly one answer but received ${answers.length}.`, {
            answers,
          });
        }

        const selectedValue = answers[0];
        const selectedOption = normalizedOptions.find(option => option.value === selectedValue);

        if (!selectedOption) {
          return toErrorResponse('Received an unknown answer value from the client.', {
            selectedValue,
            allowedValues: normalizedOptions.map(option => option.value),
          });
        }

        await logger.info('ask-question: question answered', {
          selectedValue,
          selectedLabel: selectedOption.label,
        });

        return toTextResponse({
          message: 'Question answered successfully.',
          question: questionText,
          selectedAnswer: {
            value: selectedOption.value,
            label: selectedOption.label,
            description: selectedOption.description,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logger.warn('ask-question: failed', {
          error: errorMessage,
          timeoutMs,
        });

        return toErrorResponse(`Failed to ask question: ${errorMessage}`);
      }
    },
  }),
];
