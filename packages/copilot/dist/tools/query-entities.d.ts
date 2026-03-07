import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { AudakoServices } from '../services/audako-services.js';
import type { SessionContext } from '../services/session-context.js';
declare const queryEntitiesSchema: import("@sinclair/typebox").TObject<{
    scope: import("@sinclair/typebox").TEnum<{
        group: "group";
        tenant: "tenant";
        global: "global";
    }>;
    scopeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    entityType: import("@sinclair/typebox").TString;
    filter: import("@sinclair/typebox").TObject<{}>;
}>;
export declare function createQueryEntitiesTool(sessionContext: SessionContext, audakoServices: AudakoServices): AgentTool<typeof queryEntitiesSchema>;
export {};
//# sourceMappingURL=query-entities.d.ts.map