import { createGetEntityNameTool } from './get-entity-name.js';
import { createGetGroupPathTool } from './get-group-path.js';
import { createGetSessionInfoTool } from './get-session-info.js';
import { getTypeDefinitionTool } from './get-type-definition.js';
import { listEntityTypesTool } from './list-entity-types.js';
import { createQueryEntitiesTool } from './query-entities.js';
export function createReadOnlyTools(sessionContext, audakoServices) {
    return [
        createGetSessionInfoTool(sessionContext),
        listEntityTypesTool,
        getTypeDefinitionTool,
        createGetEntityNameTool(audakoServices),
        createGetGroupPathTool(audakoServices),
        createQueryEntitiesTool(audakoServices),
    ];
}
//# sourceMappingURL=read-only-tools.js.map