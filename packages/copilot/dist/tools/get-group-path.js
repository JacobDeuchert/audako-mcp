import { EntityNameService, EntityType } from 'audako-core';
import { toErrorResponse, toTextResponse } from './helpers.js';
import { getGroupPathSchema } from './schemas.js';
const PATH_SEPARATOR = ' / ';
function normalizePathIds(pathValue, groupId) {
    const pathIds = Array.isArray(pathValue)
        ? pathValue.filter((id) => typeof id === 'string' && id.trim().length > 0)
        : [];
    if (pathIds[pathIds.length - 1] !== groupId) {
        pathIds.push(groupId);
    }
    return pathIds;
}
async function resolveTenantForEntityId(entityId, audakoServices) {
    const tenantService = audakoServices.tenantService;
    if (typeof tenantService.getTenantViewForEntityId !== 'function') {
        throw new Error('TenantHttpService.getTenantViewForEntityId is not available.');
    }
    return tenantService.getTenantViewForEntityId(entityId);
}
export function createGetGroupPathTool(audakoServices) {
    return {
        name: 'audako_mcp_get_group_path',
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