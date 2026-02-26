import { z } from 'zod';
import {
  getSupportedEntityTypeNames,
  resolveEntityTypeContract,
} from '../../entity-type-definitions/index.js';
import { audakoServices } from '../../services/audako-services.js';
import { toErrorLogDetails } from '../../services/error-details.js';
import {
  buildGroupPermissionContext,
  normalizePermissionMode,
  type PermissionResultMetadata,
  resolveOutOfContextPermission,
} from '../../services/inline-mutation-permissions.js';
import { logger } from '../../services/logger.js';
import { evaluateMutationScope } from '../../services/mutation-scope-guard.js';
import { publishEntityMovedEvent } from '../../services/session-events.js';
import { getContext } from '../../services/session-context.js';
import {
  getRecordStringValue,
  normalizeOptionalString,
  toErrorResponse,
  toStructuredErrorResponse,
  toTextResponse,
} from '../helpers.js';
import { defineTool } from '../registry.js';

export const toolDefinitions = [
  defineTool({
    name: 'move-entity',
    config: {
      description:
        'Move a configuration entity from its current group to a different group. Requires permission for both the source group (entity is removed) and the target group (entity is added). Use get-entity-definition to understand supported entity types.',
      inputSchema: {
        entityType: z.string().describe("Entity type name, for example 'Signal'."),
        entityId: z.string().describe('The ID of the entity to move.'),
        targetGroupId: z.string().describe('The ID of the destination group.'),
        permissionMode: z
          .enum(['interactive', 'fail_fast'])
          .optional()
          .describe(
            'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
          ),
      },
    },
    handler: async ({ entityType, entityId, targetGroupId, permissionMode }) => {
      await logger.trace('move-entity', 'started', { entityType, entityId, targetGroupId });

      const normalizedPermissionMode = normalizePermissionMode(permissionMode);
      const toolName = 'move-entity';
      let sourcePermission: PermissionResultMetadata | undefined;
      let targetPermission: PermissionResultMetadata | undefined;

      const context = await getContext();
      const contextGroupId = normalizeOptionalString(context.groupId);
      const resolvedTenantId = normalizeOptionalString(context.tenantId);
      if (!resolvedTenantId) {
        return toErrorResponse('Could not resolve tenant from session info: No tenantId found.');
      }

      const tenantId = resolvedTenantId;

      const contract = resolveEntityTypeContract(entityType);
      if (!contract) {
        const supportedTypes = getSupportedEntityTypeNames();
        await logger.warn('move-entity: unsupported entity type', { entityType, supportedTypes });

        return toErrorResponse(`Unsupported entity type '${entityType}'.`, { supportedTypes });
      }

      let entityName: string | undefined;
      let sourceGroupId: string | undefined;

      try {
        const existingEntity = await audakoServices.entityService.getEntityById(
          contract.entityType,
          entityId,
        );
        const existingPayload = contract.toPayload(existingEntity);
        entityName = getRecordStringValue(existingPayload, 'name');
        sourceGroupId = getRecordStringValue(existingPayload, 'groupId');
      } catch (error) {
        const errorDetails = toErrorLogDetails(error);

        await logger.error('move-entity: failed to fetch existing entity', {
          entityType: contract.key,
          entityId,
          ...errorDetails,
        });

        return toErrorResponse(`Failed to fetch entity: ${errorDetails.error}`);
      }


      if (sourceGroupId) {
        const sourceScopeResult = await evaluateMutationScope({
          contextGroupId,
          targetGroupId: sourceGroupId,
        });

        if (!sourceScopeResult.allowed) {
          const expectedSourceGroupId = sourceScopeResult.targetGroupId ?? sourceGroupId;
          const permissionContext = buildGroupPermissionContext(expectedSourceGroupId);

          try {
            const permissionResult = await resolveOutOfContextPermission({
              toolName,
              mode: normalizedPermissionMode,
              reason: sourceScopeResult.reason,
              context: permissionContext,
              entityType: contract.key,
              entityId,
              entityName,
              targetGroupId: expectedSourceGroupId,
              targetGroupLabel: sourceScopeResult.targetGroupLabel,
            });

            if (!permissionResult.allowed) {
              return toStructuredErrorResponse(permissionResult.payload);
            }

            sourcePermission = permissionResult.permission;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return toErrorResponse(
              `Failed to request source group mutation permission: ${errorMessage}`,
            );
          }
        }
      }


      const targetScopeResult = await evaluateMutationScope({
        contextGroupId,
        targetGroupId,
      });

      if (!targetScopeResult.allowed) {
        const expectedTargetGroupId = targetScopeResult.targetGroupId ?? targetGroupId;
        if (!expectedTargetGroupId) {
          return toErrorResponse(
            'Could not resolve target group for this mutation. Provide a valid targetGroupId and retry.',
          );
        }

        const permissionContext = buildGroupPermissionContext(expectedTargetGroupId);

        try {
          const permissionResult = await resolveOutOfContextPermission({
            toolName,
            mode: normalizedPermissionMode,
            reason: targetScopeResult.reason,
            context: permissionContext,
            entityType: contract.key,
            entityId,
            entityName,
            targetGroupId: expectedTargetGroupId,
            targetGroupLabel: targetScopeResult.targetGroupLabel,
          });

          if (!permissionResult.allowed) {
            return toStructuredErrorResponse(permissionResult.payload);
          }

          targetPermission = permissionResult.permission;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return toErrorResponse(
            `Failed to request target group mutation permission: ${errorMessage}`,
          );
        }
      }

      try {
        await audakoServices.entityService.moveTo(entityId, targetGroupId, contract.entityType);

        await logger.info('move-entity: entity moved', {
          entityType: contract.key,
          entityId,
          sourceGroupId,
          targetGroupId,
          tenantId,
        });

        await publishEntityMovedEvent({
          entityType: contract.key,
          entityId,
          tenantId,
          sourceGroupId,
          targetGroupId,
          sourceTool: 'move-entity',
          timestamp: new Date().toISOString(),
        });

        const permissions: Record<string, PermissionResultMetadata> = {};
        if (sourcePermission) permissions.sourceGroup = sourcePermission;
        if (targetPermission) permissions.targetGroup = targetPermission;

        return toTextResponse({
          message: `${contract.key} moved successfully.`,
          entityType: contract.key,
          entityId,
          sourceGroupId,
          targetGroupId,
          ...(Object.keys(permissions).length > 0 ? { permissions } : {}),
        });
      } catch (error) {
        const errorDetails = toErrorLogDetails(error);

        await logger.error('move-entity: failed', {
          entityType: contract.key,
          entityId,
          sourceGroupId,
          targetGroupId,
          ...errorDetails,
        });

        return toErrorResponse(`Failed to move entity: ${errorDetails.error}`);
      }
    },
  }),
];
