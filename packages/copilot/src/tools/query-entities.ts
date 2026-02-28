import type { AgentTool } from '@mariozechner/pi-agent-core';
import {
  getSupportedEntityTypeNames,
  resolveEntityTypeContract,
} from '../entity-type-definitions/index.js';
import type { AudakoServices } from '../services/audako-services.js';
import type { SessionContext } from '../services/session-context.js';
import { isRecord, toErrorResponse, toTextResponse } from './helpers.js';
import { queryEntitiesSchema } from './schemas.js';

type AgentSchema<T> = T & any;

function hasNonEmptyScopeId(scopeId?: string): scopeId is string {
  return typeof scopeId === 'string' && scopeId.trim().length > 0;
}

function isValidFilter(filter: unknown): filter is Record<string, unknown> {
  return isRecord(filter) && !Array.isArray(filter);
}

export function createQueryEntitiesTool(
  sessionContext: SessionContext,
  audakoServices: AudakoServices,
): AgentTool<AgentSchema<typeof queryEntitiesSchema>> {
  return {
    name: 'audako_mcp_query_entities',
    label: 'Query Entities',
    description:
      'Query entities by scope with a Mongo-style filter object. Supports $and, $or, $not, and $nor operators.',
    parameters: queryEntitiesSchema,
    execute: async (_toolCallId, { scope, scopeId, entityType, filter }) => {
      const contract = resolveEntityTypeContract(entityType);
      if (!contract) {
        const supportedTypes = getSupportedEntityTypeNames();
        return toErrorResponse(`Unsupported entity type '${entityType}'.`, {
          supportedTypes,
        }) as any;
      }

      if (!isValidFilter(filter)) {
        return toErrorResponse("'filter' must be a JSON object.") as any;
      }

      let resolvedScopeId: string | undefined;
      if (scope !== 'global') {
        if (hasNonEmptyScopeId(scopeId)) {
          resolvedScopeId = scopeId.trim();
        } else {
          resolvedScopeId =
            scope === 'tenant' ? sessionContext.getTenantId() : sessionContext.getGroupId();
        }

        if (!resolvedScopeId) {
          return toErrorResponse(
            `No '${scope}' scope ID provided and none found in session info.`,
          ) as any;
        }
      }

      let scopedFilter: Record<string, unknown> = filter;
      const scopePayload: Record<string, unknown> = {
        scope,
      };

      if (scope === 'group') {
        scopePayload.groupId = resolvedScopeId;
        scopedFilter = {
          $and: [{ GroupId: resolvedScopeId }, filter],
        };
      }

      if (scope === 'tenant') {
        try {
          const tenant = await audakoServices.tenantService.getTenantViewById(resolvedScopeId!);

          if (!tenant.Root) {
            return toErrorResponse(
              `Tenant '${resolvedScopeId}' has no root group and cannot be queried.`,
            ) as any;
          }

          scopePayload.tenantId = tenant.Id;
          scopePayload.tenantRootGroupId = tenant.Root;

          scopedFilter = {
            $and: [{ Path: tenant.Root }, filter],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return toErrorResponse(
            `Failed to resolve tenant '${resolvedScopeId}': ${errorMessage}`,
          ) as any;
        }
      }

      try {
        const queryResult = await audakoServices.entityService.queryConfiguration(
          contract.entityType,
          scopedFilter,
        );

        const entities = queryResult.data.map(entity => {
          try {
            return contract.toPayload(entity as any);
          } catch {
            return entity as Record<string, unknown>;
          }
        });

        return toTextResponse({
          message: `${contract.key} query completed successfully.`,
          entityType: contract.key,
          scope: scopePayload,
          count: entities.length,
          total: queryResult.total,
          entities,
        }) as any;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toErrorResponse(`Failed to query entities: ${errorMessage}`) as any;
      }
    },
  };
}
