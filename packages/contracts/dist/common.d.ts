import { z } from 'zod';
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    error: string;
}, {
    message: string;
    error: string;
}>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export declare function isErrorResponse(value: unknown): value is ErrorResponse;
//# sourceMappingURL=common.d.ts.map