import { z } from "zod";
import {
  getSupportedEntityTypeNames,
  resolveEntityTypeContract,
} from "../../entity-type-definitions/index.js";
import {
  audakoServices,
  getSelectedTenant,
} from "../../services/audako-services.js";
import { logger } from "../../services/logger.js";
import { defineTool } from "../registry.js";
import { isRecord, toErrorResponse, toTextResponse } from "./helpers.js";

export const toolDefinitions = [
  defineTool({
    name: "update-entity",
    config: {
      description:
        "Update an existing configuration entity by ID using partial changes.",
      inputSchema: {
        entityType: z
          .string()
          .describe("Entity type name, for example 'Signal'."),
        entityId: z.string().describe("The ID of the entity to update."),
        changes: z
          .record(z.unknown())
          .describe("Partial field updates. Use get-entity-definition first."),
      },
    },
    handler: async ({ entityType, entityId, changes }) => {
      await logger.trace("update-entity", "started", { entityType, entityId });

      const tenant = getSelectedTenant();
      if (!tenant) {
        await logger.warn("update-entity: no tenant selected", {
          entityType,
          entityId,
        });
        return toErrorResponse(
          "No tenant selected. Please use the select-tenant tool first.",
        );
      }

      const contract = resolveEntityTypeContract(entityType);
      if (!contract) {
        const supportedTypes = getSupportedEntityTypeNames();
        await logger.warn("update-entity: unsupported entity type", {
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

      const validationErrors = contract.validate(changes, "update");
      if (validationErrors.length > 0) {
        await logger.warn("update-entity: validation failed", {
          entityType: contract.key,
          entityId,
          validationErrors,
        });

        return toErrorResponse("Entity update validation failed.", {
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

        await logger.info("update-entity: entity updated", {
          entityType: contract.key,
          entityId,
          tenantId: tenant.Id,
        });

        return toTextResponse({
          message: `${contract.key} updated successfully.`,
          entityType: contract.key,
          entity: contract.toPayload(updatedEntity),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logger.error("update-entity: failed", {
          entityType: contract.key,
          entityId,
          error: errorMessage,
        });

        return toErrorResponse(`Failed to update entity: ${errorMessage}`);
      }
    },
  }),
];
