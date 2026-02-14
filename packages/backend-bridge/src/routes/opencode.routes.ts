import type { FastifyInstance } from "fastify";
import type {
  CreateServerRequest,
  CreateServerResponse,
  ErrorResponse,
  SessionInfoResponse,
  SessionInfoUpdateRequest,
  ServerListResponse,
  ServerListEntry,
} from "../types/index.js";
import type { ServerRegistry } from "../services/server-registry.js";
import type { OpencodeFactory } from "../services/opencode-factory.js";

export async function opencodeRoutes(
  fastify: FastifyInstance,
  registry: ServerRegistry,
  factory: OpencodeFactory,
) {
  const toSessionInfoResponse = (
    sessionId: string,
    sessionInfo: ReturnType<ServerRegistry["getSessionInfo"]>,
  ): SessionInfoResponse => ({
    sessionId,
    tenantId: sessionInfo?.tenantId,
    groupId: sessionInfo?.groupId,
    entityType: sessionInfo?.entityType,
    app: sessionInfo?.app,
    updatedAt: sessionInfo?.updatedAt?.toISOString(),
  });

  // POST /api/opencode/create - Create or get OpenCode server
  fastify.post<{
    Body: CreateServerRequest;
    Reply: CreateServerResponse | ErrorResponse;
  }>("/api/opencode/create", async (request, reply) => {
    const { scadaUrl, accessToken, model } = request.body;
    const requestOrigin = Array.isArray(request.headers.origin)
      ? request.headers.origin[0]
      : request.headers.origin;

    // Validate request
    if (!scadaUrl || !accessToken) {
      return reply.status(400).send({
        error: "Bad Request",
        message: "scadaUrl and accessToken are required",
      });
    }

    try {
      const { entry, isNew } = await registry.getOrCreateServer(
        scadaUrl,
        accessToken,
        model,
        async (port: number, sessionId: string) => {
          return factory.createServer(
            scadaUrl,
            accessToken,
            port,
            sessionId,
            model,
            requestOrigin ? [requestOrigin] : undefined,
          );
        },
      );

      const response: CreateServerResponse = {
        opencodeUrl: entry.opencodeUrl,
        sessionId: entry.sessionId,
        isNew,
        scadaUrl: entry.scadaUrl,
      };

      return reply.send(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return reply.status(500).send({
        error: "Failed to create OpenCode server",
        message: errorMessage,
      });
    }
  });

  // PUT /api/opencode/sessions/:sessionId/info - Update client location context
  fastify.put<{
    Params: { sessionId: string };
    Body: SessionInfoUpdateRequest;
    Reply: SessionInfoResponse | ErrorResponse;
  }>("/api/opencode/sessions/:sessionId/info", async (request, reply) => {
    const { sessionId } = request.params;
    const body = request.body ?? ({} as SessionInfoUpdateRequest);
    const tenantId = body.tenantId?.trim();
    const groupId = body.groupId?.trim() || undefined;
    const entityType = body.entityType?.trim() || undefined;
    const app = body.app?.trim() || undefined;

    const sessionInfo = registry.updateSessionInfo(sessionId, {
      tenantId,
      groupId,
      entityType,
      app,
    });

    if (!sessionInfo) {
      return reply.status(404).send({
        error: "Not Found",
        message: `Session not found: ${sessionId}`,
      });
    }

    return reply.send(toSessionInfoResponse(sessionId, sessionInfo));
  });

  // GET /api/opencode/sessions/:sessionId/info - Read session context (used by MCP)
  fastify.get<{
    Params: { sessionId: string };
    Reply: SessionInfoResponse | ErrorResponse;
  }>("/api/opencode/sessions/:sessionId/info", async (request, reply) => {
    const { sessionId } = request.params;
    const sessionInfo = registry.getSessionInfo(sessionId);

    if (!sessionInfo) {
      return reply.status(404).send({
        error: "Not Found",
        message: `Session not found: ${sessionId}`,
      });
    }

    return reply.send(toSessionInfoResponse(sessionId, sessionInfo));
  });

  // GET /api/opencode/servers - List active servers (for debugging)
  fastify.get<{ Reply: ServerListResponse }>(
    "/api/opencode/servers",
    async (_request, reply) => {
      const servers = registry.getAllServers();
      const now = Date.now();

      const serverList: ServerListEntry[] = servers.map((entry) => {
        const idleMinutes = Math.floor(
          (now - entry.lastAccessedAt.getTime()) / 60000,
        );

        return {
          sessionId: entry.sessionId,
          scadaUrl: entry.scadaUrl,
          opencodeUrl: entry.opencodeUrl,
          port: entry.port,
          createdAt: entry.createdAt.toISOString(),
          lastAccessedAt: entry.lastAccessedAt.toISOString(),
          idleMinutes,
        };
      });

      return reply.send({ servers: serverList });
    },
  );
}
