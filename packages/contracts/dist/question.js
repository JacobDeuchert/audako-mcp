import { z } from 'zod';
export const QuestionOptionSchema = z.object({
    label: z.string(),
    description: z.string(),
});
export const QuestionRequestSchema = z.object({
    text: z.string(),
    header: z.string(),
    options: z.array(QuestionOptionSchema),
    allowMultiple: z.boolean().optional(),
});
//# sourceMappingURL=question.js.map