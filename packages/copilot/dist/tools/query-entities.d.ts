import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { AudakoServices } from '../services/audako-services.js';
import type { SessionContext } from '../services/session-context.js';
import { queryEntitiesSchema } from './schemas.js';
type AgentSchema<T> = T & any;
export declare function createQueryEntitiesTool(sessionContext: SessionContext, audakoServices: AudakoServices): AgentTool<AgentSchema<typeof queryEntitiesSchema>>;
export {};
//# sourceMappingURL=query-entities.d.ts.map