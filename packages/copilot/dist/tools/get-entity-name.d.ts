import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { AudakoServices } from '../services/audako-services.js';
declare const getEntityNameSchema: import("@sinclair/typebox").TObject<{
    entityType: import("@sinclair/typebox").TString;
    entityId: import("@sinclair/typebox").TString;
}>;
export declare function createGetEntityNameTool(audakoServices: AudakoServices): AgentTool<typeof getEntityNameSchema>;
export {};
//# sourceMappingURL=get-entity-name.d.ts.map