import type { TenantView } from 'audako-core';
import { z } from 'zod';
import {
  getSupportedEntityTypeNames,
  resolveEntityTypeContract,
} from '../../entity-type-definitions/index.js';
import { audakoServices } from '../../services/audako-services.js';
import { resolveTenantFromSessionInfo } from '../../services/context-resolvers.js';
import { toErrorLogDetails } from '../../services/error-details.js';
import { logger } from '../../services/logger.js';
import { publishEntityUpdatedEvent } from '../../services/session-events.js';
import { getRecordStringValue, isRecord, toErrorResponse, toTextResponse } from '../helpers.js';
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
      },
    },
    handler: async ({ entityType, entityId, changes }) => {
      await logger.trace('update-entity', 'started', { entityType, entityId });

      let tenant: TenantView;
      try {
        tenant = await resolveTenantFromSessionInfo();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logger.warn('update-entity: failed to resolve tenant from session', {
          entityType,
          entityId,
          error: errorMessage,
        });

        return toErrorResponse(`Could not resolve tenant from session info: ${errorMessage}`);
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

      try {
        const existingEntity = await audakoServices.entityService.getEntityById(
          contract.entityType,
          entityId,
        );

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
        const previousPayload = contract.toPayload(existingEntity);
        const tenantRootGroupId = typeof tenant.Root === 'string' ? tenant.Root.trim() : undefined;
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
