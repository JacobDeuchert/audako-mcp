import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { AudakoServices } from '../services/audako-services.js';
declare const getGroupPathSchema: import("@sinclair/typebox").TObject<{
    groupId: import("@sinclair/typebox").TString;
}>;
export declare function createGetGroupPathTool(audakoServices: AudakoServices): AgentTool<typeof getGroupPathSchema>;
export {};
//# sourceMappingURL=get-group-path.d.ts.map