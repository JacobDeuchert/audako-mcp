import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { AudakoServices } from '../services/audako-services.js';
import { getGroupPathSchema } from './schemas.js';
type AgentSchema<T> = T & any;
export declare function createGetGroupPathTool(audakoServices: AudakoServices): AgentTool<AgentSchema<typeof getGroupPathSchema>>;
export {};
//# sourceMappingURL=get-group-path.d.ts.map