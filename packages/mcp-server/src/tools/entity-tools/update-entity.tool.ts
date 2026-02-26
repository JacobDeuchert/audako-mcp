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
import { publishEntityUpdatedEvent } from '../../services/session-events.js';
import { getContext } from '../../services/session-context.js';
import {
  getRecordStringValue,
  isRecord,
  normalizeOptionalString,
  toErrorResponse,
  toStructuredErrorResponse,
  toTextResponse,
} from '../helpers.js';
import { defineTool } from '../registry.js';

export const toolDefinitions = [
  defineTool({
    name: 'update-entity',
    config: {
      description:
        "Update an existing configuration entity by ID using partial changes. Always use get-entity-definition to understand the structure of the entity and which fields can be updated. This tool will only update the fields specified in 'changes' and leave other fields unchanged.",
      inputSchema: {
        entityType: z.string().describe("Entity type name, for example 'Signal'."),
        entityId: z.string().describe('The ID of the entity to update.'),
        changes: z
          .record(z.unknown())
          .describe('Partial field updates. Use get-entity-definition first.'),
        permissionMode: z
          .enum(['interactive', 'fail_fast'])
          .optional()
          .describe(
            'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
          ),
      },
    },
    handler: async ({ entityType, entityId, changes, permissionMode }) => {
      await logger.trace('update-entity', 'started', { entityType, entityId });

      const normalizedPermissionMode = normalizePermissionMode(permissionMode);
      const toolName = 'update-entity';
      let permission: PermissionResultMetadata | undefined;

      let contextGroupId: string | undefined;
      let tenantId: string;
      const context = await getContext();
      contextGroupId = normalizeOptionalString(context.groupId);

      const resolvedTenantId = normalizeOptionalString(context.tenantId);
      if (!resolvedTenantId) {
        return toErrorResponse('Could not resolve tenant from session info: No tenantId found.');
      }

      tenantId = resolvedTenantId;

      if (!context.tenantView) {
        return toErrorResponse('Session context not yet resolved — tenantView unavailable');
      }

      const tenant = context.tenantView;
      if (!tenant.Root) {
        return toErrorResponse(`Tenant '${tenantId}' has no root group.`);
      }

      const contract = resolveEntityTypeContract(entityType);
      if (!contract) {
        const supportedTypes = getSupportedEntityTypeNames();
        await logger.warn('update-entity: unsupported entity type', {
          entityType,
          supportedTypes,
        });

        return toErrorResponse(`Unsupported entity type '${entityType}'.`, {
          supportedTypes,
        });
      }

      if (!isRecord(changes)) {
        return toErrorResponse("'changes' must be a JSON object.");
      }

      const validationErrors = contract.validate(changes, 'update');
      if (validationErrors.length > 0) {
        await logger.warn('update-entity: validation failed', {
          entityType: contract.key,
          entityId,
          validationErrors,
        });

        return toErrorResponse('Entity update validation failed.', {
          entityType: contract.key,
          errors: validationErrors,
        });
      }

      const tenantRootGroupId = typeof tenant.Root === 'string' ? tenant.Root.trim() : undefined;

      let existingEntity: any;
      let previousPayload: Record<string, unknown>;
      let targetGroupId: string | undefined;

      try {
        existingEntity = await audakoServices.entityService.getEntityById(
          contract.entityType,
          entityId,
        );
        previousPayload = contract.toPayload(existingEntity);

        targetGroupId =
          getRecordStringValue(changes, 'groupId') ||
          getRecordStringValue(previousPayload, 'groupId') ||
          tenantRootGroupId;
      } catch (error) {
        const errorDetails = toErrorLogDetails(error);

        await logger.error('update-entity: failed to resolve existing entity', {
          entityType: contract.key,
          entityId,
          ...errorDetails,
        });

        return toErrorResponse(`Failed to update entity: ${errorDetails.error}`);
      }

      const scopeResult = await evaluateMutationScope({
        contextGroupId,
        targetGroupId,
      });

      if (!scopeResult.allowed) {
        const expectedTargetGroupId = scopeResult.targetGroupId ?? targetGroupId ?? '';
        if (!expectedTargetGroupId) {
          return toErrorResponse(
            'Could not resolve target group for this mutation. Include a valid groupId and retry.',
          );
        }

        const permissionContext = buildGroupPermissionContext(expectedTargetGroupId);

        try {
          const permissionResult = await resolveOutOfContextPermission({
            toolName,
            mode: normalizedPermissionMode,
            reason: scopeResult.reason,
            context: permissionContext,
            entityType: contract.key,
            entityId,
            entityName: getRecordStringValue(previousPayload, 'name'),
            targetGroupId: expectedTargetGroupId,
            targetGroupLabel: scopeResult.targetGroupLabel,
          });

          if (!permissionResult.allowed) {
            return toStructuredErrorResponse(permissionResult.payload);
          }

          permission = permissionResult.permission;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return toErrorResponse(`Failed to request mutation permission: ${errorMessage}`);
        }
      }

      try {
        const updatedEntityInput = contract.applyUpdate(existingEntity, changes, {
          tenantRootGroupId: tenant.Root,
        });

        updatedEntityInput.Id = entityId;

        const updatedEntity = await audakoServices.entityService.updateEntity(
          contract.entityType,
          updatedEntityInput,
        );

        await logger.info('update-entity: entity updated', {
          entityType: contract.key,
          entityId,
          tenantId: tenant.Id,
        });

        const updatedPayload = contract.toPayload(updatedEntity);
        const groupId =
          getRecordStringValue(updatedPayload, 'groupId') ||
          getRecordStringValue(changes, 'groupId') ||
          getRecordStringValue(previousPayload, 'groupId') ||
          tenantRootGroupId;

        if (groupId) {
          await publishEntityUpdatedEvent({
            entityType: contract.key,
            entityId,
            tenantId: tenant.Id,
            groupId,
            changedFields: Object.keys(changes),
            sourceTool: 'update-entity',
            timestamp: new Date().toISOString(),
          });
        } else {
          await logger.warn('update-entity: skipped entity.updated event due to missing groupId', {
            entityType: contract.key,
            entityId,
            tenantId: tenant.Id,
          });
        }

        return toTextResponse({
          message: `${contract.key} updated successfully.`,
          entityType: contract.key,
          entity: updatedPayload,
          ...(permission ? { permission } : {}),
        });
      } catch (error) {
        const errorDetails = toErrorLogDetails(error);
        await logger.error('update-entity: failed', {
          entityType: contract.key,
          entityId,
          changesKeys: Object.keys(changes),
          changes,
          ...errorDetails,
        });

        return toErrorResponse(`Failed to update entity: ${errorDetails.error}`);
      }
    },
  }),
];
