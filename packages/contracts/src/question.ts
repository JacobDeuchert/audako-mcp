import { z } from 'zod';

export const QuestionOptionSchema = z.object({
  label: z.string(),
  description: z.string(),
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

export const QuestionRequestSchema = z.object({
  text: z.string(),
  header: z.string(),
  options: z.array(QuestionOptionSchema),
  allowMultiple: z.boolean().optional(),
});

export type QuestionRequest = z.infer<typeof QuestionRequestSchema>;
