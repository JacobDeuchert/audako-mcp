import type { AgentTool } from '@mariozechner/pi-agent-core';
import { EntityNameService, EntityType } from 'audako-core';
import type { AudakoServices } from '../services/audako-services.js';
import { toErrorResponse, toTextResponse } from './helpers.js';
import { getGroupPathSchema } from './schemas.js';

const PATH_SEPARATOR = ' / ';

type AgentSchema<T> = T & any;

interface TenantServiceWithEntityLookup {
  getTenantViewForEntityId?: (entityId: string) => Promise<{
    Id: string;
    Name: string;
  }>;
}

function normalizePathIds(pathValue: unknown, groupId: string): string[] {
  const pathIds = Array.isArray(pathValue)
    ? pathValue.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];

  if (pathIds[pathIds.length - 1] !== groupId) {
    pathIds.push(groupId);
  }

  return pathIds;
}

async function resolveTenantForEntityId(
  entityId: string,
  audakoServices: AudakoServices,
): Promise<{ Id: string; Name: string }> {
  const tenantService = audakoServices.tenantService as TenantServiceWithEntityLookup;

  if (typeof tenantService.getTenantViewForEntityId !== 'function') {
    throw new Error('TenantHttpService.getTenantViewForEntityId is not available.');
  }

  return tenantService.getTenantViewForEntityId(entityId);
}

export function createGetGroupPathTool(
  audakoServices: AudakoServices,
): AgentTool<AgentSchema<typeof getGroupPathSchema>> {
  return {
    name: 'audako_mcp_get_group_path',
    label: 'Get Group Path',
    description: 'Resolve a group path by groupId and return tenant + path details for that group.',
    parameters: getGroupPathSchema,
    execute: async (_toolCallId, { groupId }) => {
      const normalizedGroupId = groupId.trim();
      if (!normalizedGroupId) {
        return toErrorResponse("'groupId' must be a non-empty string.") as any;
      }

      try {
        const group = await audakoServices.entityService.getPartialEntityById<any>(
          EntityType.Group,
          normalizedGroupId,
          { Path: 1 },
        );

        const fullPathIds = normalizePathIds(group?.Path, normalizedGroupId);
        const entityNameService = new EntityNameService(audakoServices.entityService);
        const pathName = await entityNameService.resolvePathName(fullPathIds, PATH_SEPARATOR);
        const tenant = await resolveTenantForEntityId(normalizedGroupId, audakoServices);

        return toTextResponse({
          tenantName: tenant.Name,
          tenantId: tenant.Id,
          pathName,
          pathIds: fullPathIds.join(PATH_SEPARATOR),
        }) as any;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toErrorResponse(`Failed to resolve group path: ${errorMessage}`) as any;
      }
    },
  };
}
