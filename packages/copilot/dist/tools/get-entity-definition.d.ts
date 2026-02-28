import type { AgentTool } from '@mariozechner/pi-agent-core';
import { getEntityDefinitionSchema } from './schemas.js';
type AgentSchema<T> = T & any;
export declare const getEntityDefinitionTool: AgentTool<AgentSchema<typeof getEntityDefinitionSchema>>;
export {};
//# sourceMappingURL=get-entity-definition.d.ts.map