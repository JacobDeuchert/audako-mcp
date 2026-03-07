import type { AgentToolResult } from '@mariozechner/pi-agent-core';
export declare function toTextResponse(payload: unknown): AgentToolResult<undefined>;
export declare function toErrorResponse(message: string, details?: unknown): AgentToolResult<undefined>;
export declare function isRecord(value: unknown): value is Record<string, unknown>;
//# sourceMappingURL=helpers.d.ts.map