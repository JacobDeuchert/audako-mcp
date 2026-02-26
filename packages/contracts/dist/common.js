import { z } from 'zod';
export const ErrorResponseSchema = z.object({
    error: z.string(),
    message: z.string(),
});
export function isErrorResponse(value) {
    return ErrorResponseSchema.safeParse(value).success;
}
//# sourceMappingURL=common.js.map