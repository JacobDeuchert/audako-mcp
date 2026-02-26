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
import { publishEntityCreatedEvent } from '../../services/session-events.js';
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
    name: 'create-entity',
    config: {
      description:
        'Create a configuration entity using a typed payload from the entity definition. The entity always has to include a groupId field to specify the parent group for the entity and a name of atleast two characters. Use get-entity-definition to see the expected fields and enums for the entity type.',
      inputSchema: {
        entityType: z.string().describe("Entity type name, for example 'Signal'."),
        payload: z
          .record(z.unknown())
          .describe('REQUIRED: Entity payload. Use get-entity-definition before creating'),
        permissionMode: z
          .enum(['interactive', 'fail_fast'])
          .optional()
          .describe(
            'Permission handling mode for out-of-context mutations. interactive prompts the user inline; fail_fast returns an out-of-context error without prompting.',
          ),
      },
    },
    handler: async ({ entityType, payload, permissionMode }) => {
      await logger.trace('create-entity', 'started', { entityType });

      const normalizedPermissionMode = normalizePermissionMode(permissionMode);
      const toolName = 'create-entity';
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

      const tenantRootGroupId = typeof tenant.Root === 'string' ? tenant.Root.trim() : undefined;
      const targetGroupId = getRecordStringValue(payload, 'groupId') || tenantRootGroupId;

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
            entityName: getRecordStringValue(payload, 'name'),
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
          ...(permission ? { permission } : {}),
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
