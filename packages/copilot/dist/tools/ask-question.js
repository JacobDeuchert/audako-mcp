import { toTextResponse } from './helpers.js';
import { askQuestionSchema } from './schemas.js';
function normalizeQuestionOptions(options) {
    const normalized = [];
    const seenLabels = new Set();
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
function toSelectedLabels(response) {
    if (typeof response === 'string') {
        const answer = response.trim();
        return answer ? [answer] : [];
    }
    if (!Array.isArray(response)) {
        throw new Error('Invalid question response payload from hub');
    }
    const selected = [];
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
export function createAskQuestionTool(sessionId, sessionRequestHub) {
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
            const questionRequest = {
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
                return toTextResponse(`User has answered your questions: ${formatted}. You can now continue with the user's answers in mind.`);
            }
            finally {
                signal?.removeEventListener('abort', abortHandler);
            }
        },
    };
}
//# sourceMappingURL=ask-question.js.map