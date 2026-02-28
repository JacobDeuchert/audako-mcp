export interface ToolTextResponse {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
export declare function toTextResponse(payload: unknown): ToolTextResponse;
export declare function toErrorResponse(message: string, details?: unknown): ToolTextResponse;
export declare function isRecord(value: unknown): value is Record<string, unknown>;
//# sourceMappingURL=helpers.d.ts.map