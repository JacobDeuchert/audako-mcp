import { getEntityDefinitionTool } from './get-entity-definition.js';
import { createGetEntityNameTool } from './get-entity-name.js';
import { createGetGroupPathTool } from './get-group-path.js';
import { createGetSessionInfoTool } from './get-session-info.js';
import { listEntityTypesTool } from './list-entity-types.js';
import { createQueryEntitiesTool } from './query-entities.js';
export function createReadOnlyTools(sessionContext, audakoServices) {
    return [
        createGetSessionInfoTool(sessionContext),
        listEntityTypesTool,
        getEntityDefinitionTool,
        createGetEntityNameTool(audakoServices),
        createGetGroupPathTool(audakoServices),
        createQueryEntitiesTool(sessionContext, audakoServices),
    ];
}
//# sourceMappingURL=read-only-tools.js.map