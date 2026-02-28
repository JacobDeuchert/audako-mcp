import type { AgentTool } from '@mariozechner/pi-agent-core';
import type { AudakoServices } from '../services/audako-services.js';
import type { SessionContext } from '../services/session-context.js';
import { getEntityDefinitionTool } from './get-entity-definition.js';
import { createGetEntityNameTool } from './get-entity-name.js';
import { createGetGroupPathTool } from './get-group-path.js';
import { createGetSessionInfoTool } from './get-session-info.js';
import { listEntityTypesTool } from './list-entity-types.js';
import { createQueryEntitiesTool } from './query-entities.js';

export function createReadOnlyTools(
  sessionContext: SessionContext,
  audakoServices: AudakoServices,
): AgentTool<any>[] {
  return [
    createGetSessionInfoTool(sessionContext),
    listEntityTypesTool,
    getEntityDefinitionTool,
    createGetEntityNameTool(audakoServices),
    createGetGroupPathTool(audakoServices),
    createQueryEntitiesTool(sessionContext, audakoServices),
  ];
}
