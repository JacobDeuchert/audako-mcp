import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { SessionContext } from '../services/session-context.js';
declare const getSessionInfoSchema: import("@sinclair/typebox").TObject<{}>;
export declare function createGetSessionInfoTool(sessionContext: SessionContext): AgentTool<typeof getSessionInfoSchema>;
export {};
//# sourceMappingURL=get-session-info.d.ts.map