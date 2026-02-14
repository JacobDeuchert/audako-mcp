import { logger } from "../services/logger.js";
import { defineTool } from "./registry.js";

interface BridgeSessionInfoResponse {
  sessionId: string;
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
  updatedAt?: string;
}

interface BridgeErrorResponse {
  error: string;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBridgeErrorResponse(value: unknown): value is BridgeErrorResponse {
  return (
    isRecord(value) &&
    typeof value.error === "string" &&
    typeof value.message === "string"
  );
}

function isBridgeSessionInfoResponse(
  value: unknown,
): value is BridgeSessionInfoResponse {
  return isRecord(value) && typeof value.sessionId === "string";
}

export const toolDefinitions = [
  defineTool({
    name: "get-session-info",
    config: {
      description:
        "Get current client session context from backend bridge (tenantId, groupId, entityType, app).",
      inputSchema: {},
    },
    handler: async () => {
      const sessionId = process.env.AUDAKO_SESSION_ID;
      const bridgeUrl =
        process.env.AUDAKO_BRIDGE_URL?.replace(/\/+$/, "") ??
        "http://127.0.0.1:3000";

      if (!sessionId) {
        await logger.warn("get-session-info: AUDAKO_SESSION_ID is not set");
        return {
          content: [
            {
              type: "text",
              text: "Session is not configured. Missing AUDAKO_SESSION_ID in MCP environment.",
            },
          ],
          isError: true,
        };
      }

      const endpoint = `${bridgeUrl}/api/opencode/sessions/${encodeURIComponent(sessionId)}/info`;
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 5000);

      try {
        await logger.trace("get-session-info", "fetching session info", {
          sessionId,
          endpoint,
        });

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          signal: abortController.signal,
        });

        const payload: unknown = await response.json();

        if (!response.ok) {
          const message = isBridgeErrorResponse(payload)
            ? payload.message
            : `Bridge request failed with status ${response.status}`;

          await logger.warn("get-session-info: bridge request failed", {
            sessionId,
            status: response.status,
            message,
          });

          return {
            content: [
              {
                type: "text",
                text: `Failed to get session info: ${message}`,
              },
            ],
            isError: true,
          };
        }

        if (!isBridgeSessionInfoResponse(payload)) {
          await logger.warn("get-session-info: unexpected bridge payload", {
            sessionId,
          });

          return {
            content: [
              {
                type: "text",
                text: "Failed to get session info: bridge returned an unexpected payload.",
              },
            ],
            isError: true,
          };
        }

        await logger.debug("get-session-info: session info retrieved", {
          sessionId,
          tenantId: payload.tenantId,
          groupId: payload.groupId,
          entityType: payload.entityType,
          app: payload.app,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(payload, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        await logger.error("get-session-info: failed to fetch session info", {
          sessionId,
          endpoint,
          error: errorMessage,
        });

        return {
          content: [
            {
              type: "text",
              text: `Failed to get session info: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  }),
];
