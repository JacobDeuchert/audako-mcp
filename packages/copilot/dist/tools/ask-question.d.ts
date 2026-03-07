import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { ToolRequestHub } from '../services/tool-request-hub.js';
declare const askQuestionSchema: import("@sinclair/typebox").TObject<{
    question: import("@sinclair/typebox").TString;
    header: import("@sinclair/typebox").TString;
    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        label: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
    }>>;
    multiple: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare function createAskQuestionTool(sessionId: string, sessionRequestHub: ToolRequestHub): AgentTool<typeof askQuestionSchema>;
export {};
//# sourceMappingURL=ask-question.d.ts.map