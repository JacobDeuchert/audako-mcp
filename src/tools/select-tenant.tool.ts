import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  createTenantHttpService,
  getSelectedTenant,
  setSelectedTenant,
} from "../services/audako-services.js";

export function registerSelectTenantTool(server: McpServer) {
  server.registerTool(
    "list-tenants",
    {
      description: "List available tenants. Use parentTenantId to get child tenants.",
      inputSchema: {
        parentTenantId: z
          .string()
          .optional()
          .describe("Parent tenant ID to get child tenants. Leave empty for top-level tenants."),
      },
    },
    async ({ parentTenantId }) => {
      const tenantService = createTenantHttpService();

      const tenants = parentTenantId
        ? await tenantService.getNextTenants(parentTenantId)
        : await tenantService.getTopTenants();

      // Only show tenants with a Root (have config behind them)
      const tenantsWithRoot = tenants.filter((t) => t.Root);

      const tenantList = tenantsWithRoot.map((t) => ({
        id: t.Id,
        name: t.Name,
        description: t.Description,
        enabled: t.Enabled,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tenantList, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "select-tenant",
    {
      description: "Select a tenant to work with by ID or name. All subsequent operations will use this tenant.",
      inputSchema: {
        tenantId: z.string().optional().describe("ID of the tenant to select"),
        tenantName: z.string().optional().describe("Name of the tenant to select (will search for matching tenant)"),
      },
    },
    async ({ tenantId, tenantName }) => {
      if (!tenantId && !tenantName) {
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
      let tenant;

      if (tenantId) {
        tenant = await tenantService.getTenantViewById(tenantId);
      } else {
        const tenants = await tenantService.filterTenantsByName(tenantName!);
        // Only consider tenants with a Root
        const tenantsWithRoot = tenants.filter((t) => t.Root);

        if (tenantsWithRoot.length === 0) {
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

      return {
        content: [
          {
            type: "text",
            text: `Selected tenant: ${tenant.Name} (${tenant.Id})`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "get-selected-tenant",
    {
      description: "Get the currently selected tenant",
      inputSchema: {},
    },
    async () => {
      const tenant = getSelectedTenant();

      if (!tenant) {
        return {
          content: [
            {
              type: "text",
              text: "No tenant selected. Use select-tenant to select one.",
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Selected tenant: ${tenant.Name} (${tenant.Id})`,
          },
        ],
      };
    }
  );
}
