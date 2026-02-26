import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return ErrorResponseSchema.safeParse(value).success;
}
