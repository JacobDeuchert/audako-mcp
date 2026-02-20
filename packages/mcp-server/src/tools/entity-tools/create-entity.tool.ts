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
import { publishEntityCreatedEvent } from '../../services/session-events.js';
import { getRecordStringValue, isRecord, toErrorResponse, toTextResponse } from '../helpers.js';
import { defineTool } from '../registry.js';

export const toolDefinitions = [
  defineTool({
    name: 'create-entity',
    config: {
      description:
        'Create a configuration entity using a typed payload from the entity definition. The entity always has to include a groupId field to specify the parent group for the entity and a name of atleast two characters. Use get-entity-definition to see the expected fields and enums for the entity type.',
      inputSchema: {
        entityType: z.string().describe("Entity type name, for example 'Signal'."),
        payload: z
          .record(z.unknown())
          .describe('REQUIRED: Entity payload. Use get-entity-definition before creating'),
      },
    },
    handler: async ({ entityType, payload }) => {
      await logger.trace('create-entity', 'started', { entityType });

      let tenant: TenantView;
      try {
        tenant = await resolveTenantFromSessionInfo();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        await logger.warn('create-entity: failed to resolve tenant from session', {
          entityType,
          error: errorMessage,
        });

        return toErrorResponse(`Could not resolve tenant from session info: ${errorMessage}`);
      }

      const contract = resolveEntityTypeContract(entityType);
      if (!contract) {
        const supportedTypes = getSupportedEntityTypeNames();
        await logger.warn('create-entity: unsupported entity type', {
          entityType,
          supportedTypes,
        });

        return toErrorResponse(`Unsupported entity type '${entityType}'.`, {
          supportedTypes,
        });
      }

      if (!isRecord(payload)) {
        return toErrorResponse("'payload' must be a JSON object.");
      }

      const validationErrors = contract.validate(payload, 'create');
      if (validationErrors.length > 0) {
        await logger.warn('create-entity: validation failed', {
          entityType: contract.key,
          validationErrors,
        });

        return toErrorResponse('Entity payload validation failed.', {
          entityType: contract.key,
          errors: validationErrors,
        });
      }

      try {
        const entity = contract.fromPayload(payload, {
          tenantRootGroupId: tenant.Root,
        });

        const createdEntity = await audakoServices.entityService.addEntity(
          contract.entityType,
          entity,
        );

        await logger.info('create-entity: entity created', {
          entityType: contract.key,
          entityId: createdEntity.Id,
          tenantId: tenant.Id,
        });

        const createdPayload = contract.toPayload(createdEntity);
        const tenantRootGroupId = typeof tenant.Root === 'string' ? tenant.Root.trim() : undefined;
        const groupId =
          getRecordStringValue(createdPayload, 'groupId') ||
          getRecordStringValue(payload, 'groupId') ||
          tenantRootGroupId;

        if (groupId) {
          await publishEntityCreatedEvent({
            entityType: contract.key,
            entityId: createdEntity.Id,
            tenantId: tenant.Id,
            groupId,
            sourceTool: 'create-entity',
            timestamp: new Date().toISOString(),
          });
        } else {
          await logger.warn('create-entity: skipped entity.created event due to missing groupId', {
            entityType: contract.key,
            entityId: createdEntity.Id,
            tenantId: tenant.Id,
          });
        }

        return toTextResponse({
          message: `${contract.key} created successfully.`,
          entityType: contract.key,
          entity: createdPayload,
        });
      } catch (error) {
        const errorDetails = toErrorLogDetails(error);

        await logger.error('create-entity: failed', {
          entityType: contract.key,
          payloadKeys: Object.keys(payload),
          payload,
          ...errorDetails,
        });

        return toErrorResponse(`Failed to create entity: ${errorDetails.error}`);
      }
    },
  }),
];
