import { EntityNameService, EntityType } from 'audako-core';
import { z } from 'zod';
import { audakoServices } from '../../services/audako-services.js';
import { logger } from '../../services/logger.js';
import { defineTool } from '../registry.js';
import { toErrorResponse, toTextResponse } from '../helpers.js';

const PATH_SEPARATOR = ' / ';

function normalizePathIds(pathValue: unknown, groupId: string): string[] {
  const pathIds = Array.isArray(pathValue)
    ? pathValue.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    : [];

  if (pathIds[pathIds.length - 1] !== groupId) {
    pathIds.push(groupId);
  }

  return pathIds;
}

interface TenantServiceWithEntityLookup {
  getTenantViewForEntityId?: (entityId: string) => Promise<{
    Id: string;
    Name: string;
  }>;
}

async function resolveTenantForEntityId(entityId: string): Promise<{
  Id: string;
  Name: string;
}> {
  const tenantService = audakoServices.tenantService as TenantServiceWithEntityLookup;

  if (typeof tenantService.getTenantViewForEntityId !== 'function') {
    throw new Error('TenantHttpService.getTenantViewForEntityId is not available.');
  }

  return tenantService.getTenantViewForEntityId(entityId);
}

export const toolDefinitions = [
  defineTool({
    name: 'get-group-path',
    config: {
      description:
        'Resolve a group path by groupId and return tenant + path details for that group.',
      inputSchema: {
        groupId: z.string().describe('The group ID to resolve.'),
      },
    },
    handler: async ({ groupId }) => {
      const normalizedGroupId = groupId.trim();
      await logger.trace('get-group-path', 'started', { groupId: normalizedGroupId });

      if (!normalizedGroupId) {
        return toErrorResponse("'groupId' must be a non-empty string.");
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
        const tenant = await resolveTenantForEntityId(normalizedGroupId);

        const payload = {
          tenantName: tenant.Name,
          tenantId: tenant.Id,
          pathName,
          pathIds: fullPathIds.join(PATH_SEPARATOR),
        };

        await logger.info('get-group-path: resolved successfully', {
          groupId: normalizedGroupId,
          tenantId: tenant.Id,
          tenantName: tenant.Name,
        });

        return toTextResponse(payload);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logger.error('get-group-path: failed', {
          groupId: normalizedGroupId,
          error: errorMessage,
        });

        return toErrorResponse(`Failed to resolve group path: ${errorMessage}`);
      }
    },
  }),
];
