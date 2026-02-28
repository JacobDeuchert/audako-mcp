import type { AgentTool } from '@mariozechner/pi-agent-core';
import { listEntityTypesSchema } from './schemas.js';
type AgentSchema<T> = T & any;
export declare const listEntityTypesTool: AgentTool<AgentSchema<typeof listEntityTypesSchema>>;
export {};
//# sourceMappingURL=list-entity-types.d.ts.map