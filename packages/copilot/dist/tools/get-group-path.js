import { Type } from '@mariozechner/pi-ai';
import { EntityNameService, EntityType } from 'audako-core';
import { normalizePathIds } from '../services/path-utils.js';
import { toErrorResponse, toTextResponse } from './helpers.js';
const getGroupPathSchema = Type.Object({
    groupId: Type.String({ description: 'The group ID to resolve.' }),
});
const PATH_SEPARATOR = ' / ';
async function resolveTenantForEntityId(entityId, audakoServices) {
    const tenantService = audakoServices.tenantService;
    if (typeof tenantService.getTenantViewForEntityId !== 'function') {
        throw new Error('TenantHttpService.getTenantViewForEntityId is not available.');
    }
    return tenantService.getTenantViewForEntityId(entityId);
}
export function createGetGroupPathTool(audakoServices) {
    return {
        name: 'get_group_path',
        label: 'Get Group Path',
        description: 'Resolve a group path by groupId and return tenant + path details for that group.',
        parameters: getGroupPathSchema,
        execute: async (_toolCallId, { groupId }) => {
            const normalizedGroupId = groupId.trim();
            if (!normalizedGroupId) {
                return toErrorResponse("'groupId' must be a non-empty string.");
            }
            try {
                const group = await audakoServices.entityService.getPartialEntityById(EntityType.Group, normalizedGroupId, { Path: 1 });
                const fullPathIds = normalizePathIds(group?.Path, normalizedGroupId);
                const entityNameService = new EntityNameService(audakoServices.entityService);
                const pathName = await entityNameService.resolvePathName(fullPathIds, PATH_SEPARATOR);
                const tenant = await resolveTenantForEntityId(normalizedGroupId, audakoServices);
                return toTextResponse({
                    tenantName: tenant.Name,
                    tenantId: tenant.Id,
                    pathName,
                    pathIds: fullPathIds.join(PATH_SEPARATOR),
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return toErrorResponse(`Failed to resolve group path: ${errorMessage}`);
            }
        },
    };
}
//# sourceMappingURL=get-group-path.js.map