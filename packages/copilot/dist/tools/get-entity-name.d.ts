import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { AudakoServices } from '../services/audako-services.js';
import { getEntityNameSchema } from './schemas.js';
type AgentSchema<T> = T & any;
export declare function createGetEntityNameTool(audakoServices: AudakoServices): AgentTool<AgentSchema<typeof getEntityNameSchema>>;
export {};
//# sourceMappingURL=get-entity-name.d.ts.map