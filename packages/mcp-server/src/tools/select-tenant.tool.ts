import { z } from "zod";
import {
  createTenantHttpService,
  getSelectedTenant,
  setSelectedTenant,
} from "../services/audako-services.js";
import { logger } from "../services/logger.js";
import { defineTool } from "./registry.js";

export const toolDefinitions = [
  defineTool({
    name: "list-tenants",
    config: {
      description:
        "List available tenants. Use parentTenantId to get child tenants. If tenant is not selectable, it has no configuration and user must select a child tenant.",
      inputSchema: {
        parentTenantId: z
          .string()
          .optional()
          .describe(
            "Parent tenant ID to get child tenants. Leave empty for top-level tenants.",
          ),
      },
    },
    handler: async ({ parentTenantId }) => {
      await logger.trace("list-tenants", "started", { parentTenantId });

      const tenantService = createTenantHttpService();

      const tenants = parentTenantId
        ? await tenantService.getNextTenants(parentTenantId)
        : await tenantService.getTopTenants();

      
      await logger.info("list-tenants: retrieved tenants", { 
        count: tenants.length,
        parentTenantId: parentTenantId || "top-level"
      });

      const tenantList = tenants.map((t) => ({
        id: t.Id,
        name: t.Name,
        description: t.Description,
        enabled: t.Enabled,
        selectable: !!t.Root,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tenantList, null, 2),
          },
        ],
      };
    },
  }),
  defineTool({
    name: "select-tenant",
    config: {
      description:
        "Select a tenant to work with by ID or name. All subsequent operations will use this tenant.",
      inputSchema: {
        tenantId: z.string().optional().describe("ID of the tenant to select"),
        tenantName: z
          .string()
          .optional()
          .describe("Name of the tenant to select (will search for matching tenant)"),
      },
    },
    handler: async ({ tenantId, tenantName }) => {
      await logger.trace("select-tenant", "started", { tenantId, tenantName });

      if (!tenantId && !tenantName) {
        await logger.warn("select-tenant: missing parameters");
        return {
          content: [
            {
              type: "text",
              text: "Please provide either tenantId or tenantName",
            },
          ],
          isError: true,
        };
      }

      const tenantService = createTenantHttpService();
      let tenant: any;

      try {
        if (tenantId) {
          await logger.debug("select-tenant: fetching by ID", { tenantId });
          tenant = await tenantService.getTenantViewById(tenantId);
        } else {
          await logger.debug("select-tenant: searching by name", { tenantName });
          const tenants = await tenantService.filterTenantsByName(tenantName!);
          // Only consider tenants with a Root
          const tenantsWithRoot = tenants.filter((t) => t.Root);

          if (tenantsWithRoot.length === 0) {
            await logger.warn("select-tenant: no tenant found", { tenantName });
            return {
              content: [
                {
                  type: "text",
                  text: `No tenant with configuration found matching "${tenantName}"`,
                },
              ],
              isError: true,
            };
          }
          if (tenantsWithRoot.length > 1) {
            await logger.warn("select-tenant: multiple tenants found", { 
              tenantName,
              count: tenantsWithRoot.length 
            });
            const tenantList = tenantsWithRoot.map((t) => `- ${t.Name} (${t.Id})`).join("\n");
            return {
              content: [
                {
                  type: "text",
                  text: `Multiple tenants found matching "${tenantName}":\n${tenantList}\n\nPlease use tenantId to select a specific one.`,
                },
              ],
            };
          }
          tenant = tenantsWithRoot[0];
        }

        // Verify tenant has Root
        if (!tenant.Root) {
          await logger.warn("select-tenant: tenant has no root", { 
            tenantId: tenant.Id,
            tenantName: tenant.Name 
          });
          return {
            content: [
              {
                type: "text",
                text: `Tenant "${tenant.Name}" has no configuration (no Root). Please select a tenant with configuration.`,
              },
            ],
            isError: true,
          };
        }

        setSelectedTenant(tenant);

        await logger.info("select-tenant: tenant selected successfully", {
          tenantId: tenant.Id,
          tenantName: tenant.Name,
        });

        return {
          content: [
            {
              type: "text",
              text: `Selected tenant: ${tenant.Name} (${tenant.Id})`,
            },
          ],
        };
      } catch (error) {
        await logger.error("select-tenant: error selecting tenant", {
          tenantId,
          tenantName,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },
  }),
  defineTool({
    name: "get-selected-tenant",
    config: {
      description: "Get the currently selected tenant",
      inputSchema: {},
    },
    handler: async () => {
      await logger.trace("get-selected-tenant", "started");
      
      const tenant = getSelectedTenant();

      if (!tenant) {
        await logger.debug("get-selected-tenant: no tenant selected");
        return {
          content: [
            {
              type: "text",
              text: "No tenant selected. Use select-tenant to select one.",
            },
          ],
        };
      }

      await logger.debug("get-selected-tenant: returning current tenant", {
        tenantId: tenant.Id,
        tenantName: tenant.Name,
      });

      return {
        content: [
          {
            type: "text",
            text: `Selected tenant: ${tenant.Name} (${tenant.Id})`,
          },
        ],
      };
    },
  }),
];
