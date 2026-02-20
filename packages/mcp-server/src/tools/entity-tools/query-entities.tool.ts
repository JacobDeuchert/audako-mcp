import { z } from 'zod';
import {
  getSupportedEntityTypeNames,
  resolveEntityTypeContract,
} from '../../entity-type-definitions/index.js';
import { audakoServices } from '../../services/audako-services.js';
import { logger } from '../../services/logger.js';
import { fetchSessionInfo } from '../../services/session-info.js';
import { defineTool } from '../registry.js';
import { isRecord, toErrorResponse, toTextResponse } from '../helpers.js';

function hasNonEmptyScopeId(scopeId?: string): scopeId is string {
  return typeof scopeId === 'string' && scopeId.trim().length > 0;
}

function isValidFilter(filter: unknown): filter is Record<string, unknown> {
  return isRecord(filter) && !Array.isArray(filter);
}

export const toolDefinitions = [
  defineTool({
    name: 'query-entities',
    config: {
      description:
        'Query entities by scope with a Mongo-style filter object. Supports $and, $or, $not, and $nor operators.',
      inputSchema: {
        scope: z.enum(['group', 'tenant', 'global']).describe('Scope for the query.'),
        scopeId: z
          .string()
          .optional()
          .describe(
            'Optional scope identifier. If omitted, groupId or tenantId is taken from session info based on scope.',
          ),
        entityType: z.string().describe("Entity type name, for example 'Signal'."),
        filter: z
          .record(z.unknown())
          .describe(
            'REQUIRED: Mongo-style filter object that supports logical operators like $and, $or, $not, and $nor.',
          ),
      },
    },
    handler: async ({ scope, scopeId, entityType, filter }) => {
      await logger.trace('query-entities', 'started', {
        scope,
        scopeId,
        entityType,
      });

      const contract = resolveEntityTypeContract(entityType);
      if (!contract) {
        const supportedTypes = getSupportedEntityTypeNames();
        await logger.warn('query-entities: unsupported entity type', {
          entityType,
          supportedTypes,
        });

        return toErrorResponse(`Unsupported entity type '${entityType}'.`, {
          supportedTypes,
        });
      }

      if (!isValidFilter(filter)) {
        return toErrorResponse("'filter' must be a JSON object.");
      }

      let resolvedScopeId: string | undefined;
      if (scope !== 'global') {
        if (hasNonEmptyScopeId(scopeId)) {
          resolvedScopeId = scopeId.trim();
        } else {
          try {
            const sessionInfo = await fetchSessionInfo();
            resolvedScopeId = scope === 'tenant' ? sessionInfo.tenantId : sessionInfo.groupId;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            await logger.warn('query-entities: failed to resolve scope from session', {
              scope,
              error: errorMessage,
            });

            return toErrorResponse(
              `Could not resolve '${scope}' scope ID from session info: ${errorMessage}`,
            );
          }
        }

        if (!resolvedScopeId) {
          return toErrorResponse(`No '${scope}' scope ID provided and none found in session info.`);
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
            );
          }

          scopePayload.tenantId = tenant.Id;
          scopePayload.tenantRootGroupId = tenant.Root;

          scopedFilter = {
            $and: [{ Path: tenant.Root }, filter],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await logger.error('query-entities: failed to resolve tenant scope', {
            tenantId: resolvedScopeId,
            error: errorMessage,
          });

          return toErrorResponse(`Failed to resolve tenant '${resolvedScopeId}': ${errorMessage}`);
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

        await logger.info('query-entities: query completed', {
          entityType: contract.key,
          scope,
          count: entities.length,
          total: queryResult.total,
        });

        return toTextResponse({
          message: `${contract.key} query completed successfully.`,
          entityType: contract.key,
          scope: scopePayload,
          count: entities.length,
          total: queryResult.total,
          entities,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logger.error('query-entities: failed', {
          entityType: contract.key,
          scope,
          error: errorMessage,
        });

        return toErrorResponse(`Failed to query entities: ${errorMessage}`);
      }
    },
  }),
];
