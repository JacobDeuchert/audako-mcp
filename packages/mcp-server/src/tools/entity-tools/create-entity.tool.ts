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
    name: "create-entity",
    config: {
      description:
        "Create a configuration entity using a typed payload from the entity definition.",
      inputSchema: {
        entityType: z
          .string()
          .describe("Entity type name, for example 'Signal'."),
        payload: z
          .record(z.unknown())
          .describe("Entity payload. Use get-entity-definition before creating."),
      },
    },
    handler: async ({ entityType, payload }) => {
      await logger.trace("create-entity", "started", { entityType });

      const tenant = getSelectedTenant();
      if (!tenant) {
        await logger.warn("create-entity: no tenant selected", { entityType });
        return toErrorResponse(
          "No tenant selected. Please use the select-tenant tool first.",
        );
      }

      const contract = resolveEntityTypeContract(entityType);
      if (!contract) {
        const supportedTypes = getSupportedEntityTypeNames();
        await logger.warn("create-entity: unsupported entity type", {
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

      const validationErrors = contract.validate(payload, "create");
      if (validationErrors.length > 0) {
        await logger.warn("create-entity: validation failed", {
          entityType: contract.key,
          validationErrors,
        });

        return toErrorResponse("Entity payload validation failed.", {
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

        await logger.info("create-entity: entity created", {
          entityType: contract.key,
          entityId: createdEntity.Id,
          tenantId: tenant.Id,
        });

        return toTextResponse({
          message: `${contract.key} created successfully.`,
          entityType: contract.key,
          entity: contract.toPayload(createdEntity),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logger.error("create-entity: failed", {
          entityType: contract.key,
          error: errorMessage,
        });

        return toErrorResponse(`Failed to create entity: ${errorMessage}`);
      }
    },
  }),
];
