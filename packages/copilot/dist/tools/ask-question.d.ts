import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { ToolRequestHub } from '../services/tool-request-hub.js';
import { askQuestionSchema } from './schemas.js';
type AgentSchema<T> = T & any;
export declare function createAskQuestionTool(sessionId: string, sessionRequestHub: ToolRequestHub): AgentTool<AgentSchema<typeof askQuestionSchema>>;
export {};
//# sourceMappingURL=ask-question.d.ts.map