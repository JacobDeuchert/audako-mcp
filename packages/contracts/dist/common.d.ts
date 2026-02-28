import { z } from 'zod';
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    error: string;
    message: string;
}, {
    error: string;
    message: string;
}>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export declare function isErrorResponse(value: unknown): value is ErrorResponse;
//# sourceMappingURL=common.d.ts.map