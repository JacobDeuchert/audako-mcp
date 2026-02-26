import { z } from 'zod';
export declare const QuestionOptionSchema: z.ZodObject<{
    label: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    label: string;
    description: string;
}, {
    label: string;
    description: string;
}>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export declare const QuestionRequestSchema: z.ZodObject<{
    text: z.ZodString;
    header: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label: string;
        description: string;
    }, {
        label: string;
        description: string;
    }>, "many">;
    allowMultiple: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    options: {
        label: string;
        description: string;
    }[];
    text: string;
    header: string;
    allowMultiple?: boolean | undefined;
}, {
    options: {
        label: string;
        description: string;
    }[];
    text: string;
    header: string;
    allowMultiple?: boolean | undefined;
}>;
export type QuestionRequest = z.infer<typeof QuestionRequestSchema>;
//# sourceMappingURL=question.d.ts.map