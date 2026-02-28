import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { SessionContext } from '../services/session-context.js';
import { getSessionInfoSchema } from './schemas.js';
type AgentSchema<T> = T & any;
export declare function createGetSessionInfoTool(sessionContext: SessionContext): AgentTool<AgentSchema<typeof getSessionInfoSchema>>;
export {};
//# sourceMappingURL=get-session-info.d.ts.map