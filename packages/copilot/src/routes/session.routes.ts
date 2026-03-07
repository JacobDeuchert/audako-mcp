import type {
  ErrorResponse,
  SessionBootstrapRequest,
  SessionBootstrapResponse,
  SessionEventEnvelope,
  SessionInfoFields,
  SessionInfoResponse,
} from '@audako/contracts';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createSessionAgent } from '../agent/agent-factory.js';
import { createWsEventBridge } from '../agent/ws-event-bridge.js';
import { createLogger } from '../config/app-config.js';
import { createAudakoServices } from '../services/audako-services.js';
import { UpstreamAuthError, validateUpstreamToken } from '../services/auth-validator.js';
import { DefaultPermissionService } from '../services/permission-service.js';
import { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import type { SessionRegistry } from '../services/session-registry.js';
import type { SessionRequestHub } from '../services/session-request-hub.js';
import { ToolRequestHub } from '../services/tool-request-hub.js';
import { createSessionWebSocketHandler } from './session-websocket-handler.js';

const logger = createLogger('session-routes');

export async function sessionRoutes(
  fastify: FastifyInstance,
  registry: SessionRegistry,
  eventHub: SessionEventHub,
  requestHub: SessionRequestHub,
) {
  const toolRequestHub = new ToolRequestHub(requestHub, eventHub);
  const permissionService = new DefaultPermissionService(registry, toolRequestHub);
  registry.onSessionRemoved(entry => {
    permissionService.clearSession(entry.sessionId);
  });

  const handleWebSocket = createSessionWebSocketHandler({ registry, eventHub, requestHub });

  // ── Route map ────────────────────────────────────────────────────────
  fastify.post<{ Body: SessionBootstrapRequest; Reply: SessionBootstrapResponse | ErrorResponse }>(
    '/api/session/bootstrap',
    handleBootstrap,
  );
  fastify.get<{ Params: { sessionId: string } }>(
    '/api/session/:sessionId/ws',
    { websocket: true },
    handleWebSocket,
  );
  fastify.get<{ Params: { sessionId: string }; Reply: SessionInfoResponse | ErrorResponse }>(
    '/api/session/:sessionId/info',
    handleGetSessionInfo,
  );

  // ── Helpers ──────────────────────────────────────────────────────────

  function normalizeScadaUrl(value: string): string {
    const trimmed = value.trim();

    try {
      const parsed = new URL(trimmed);
      const path = parsed.pathname.replace(/\/+$/, '');
      return parsed.origin + (path === '/' ? '' : path);
    } catch {
      return trimmed.replace(/\/+$/, '');
    }
  }

  function sanitizeSessionInfoUpdate(body: SessionInfoFields): SessionInfoFields {
    return {
      tenantId: body.tenantId?.trim() || undefined,
      groupId: body.groupId?.trim() || undefined,
      entityType: body.entityType?.trim() || undefined,
      app: body.app?.trim() || undefined,
    };
  }

  function buildSessionEvent<T>(
    type: string,
    sessionId: string,
    payload: T,
  ): SessionEventEnvelope<T> {
    return {
      type,
      sessionId,
      timestamp: new Date().toISOString(),
      payload,
    };
  }

  function toSessionInfoSnapshot(
    tenantId?: string,
    groupId?: string,
    entityType?: string,
    app?: string,
  ) {
    return {
      tenantId,
      groupId,
      entityType,
      app,
      updatedAt: new Date().toISOString(),
    };
  }

  function toSessionInfoResponse(
    sessionId: string,
    tenantId?: string,
    groupId?: string,
    entityType?: string,
    app?: string,
  ): SessionInfoResponse {
    return {
      sessionId,
      tenantId,
      groupId,
      entityType,
      app,
      updatedAt: new Date().toISOString(),
    };
  }

  function requireSessionAuth(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply,
  ): boolean {
    const { sessionId } = request.params;
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authorization header required',
      });
      return false;
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid authorization format',
      });
      return false;
    }

    const token = match[1];
    if (!registry.verifySessionToken(sessionId, token)) {
      reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid session token',
      });
      return false;
    }

    return true;
  }

  // ── Handlers ─────────────────────────────────────────────────────────

  async function handleBootstrap(
    request: FastifyRequest<{ Body: SessionBootstrapRequest }>,
    reply: FastifyReply,
  ) {
    const { scadaUrl, accessToken, sessionInfo } = request.body;

    const normalizedScadaUrl = scadaUrl ? normalizeScadaUrl(scadaUrl) : undefined;
    const normalizedAccessToken = accessToken?.trim();

    if (!normalizedScadaUrl || !normalizedAccessToken) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'scadaUrl and accessToken are required',
      });
    }

    logger.info(
      {
        scadaUrl: normalizedScadaUrl,
        hasSessionInfo: Boolean(sessionInfo),
      },
      'Bootstrap request received',
    );

    // Validate upstream token before provisioning.
    try {
      await validateUpstreamToken(normalizedScadaUrl, normalizedAccessToken);
    } catch (authError) {
      if (authError instanceof UpstreamAuthError) {
        logger.warn(
          { scadaUrl: normalizedScadaUrl, statusCode: authError.statusCode },
          'Bootstrap upstream auth failed',
        );
        return reply.status(authError.statusCode).send({
          error: authError.statusCode === 403 ? 'Forbidden' : 'Unauthorized',
          message: authError.message,
        });
      }
      throw authError;
    }

    try {
      const { entry, isNew, sessionToken } = await registry.getOrCreateSession(
        normalizedScadaUrl,
        normalizedAccessToken,
        async (sessionId: string) => {
          // Create audako services
          const audakoServices = await createAudakoServices(
            normalizedScadaUrl,
            normalizedAccessToken,
          );

          // Create session context and bind services for resolution
          const sessionContext = new SessionContext({
            sessionId,
            scadaUrl: normalizedScadaUrl,
            accessToken: normalizedAccessToken,
            tenantId: sessionInfo?.tenantId,
            groupId: sessionInfo?.groupId,
            entityType: sessionInfo?.entityType,
            app: sessionInfo?.app,
          });
          sessionContext.bindServices(audakoServices);

          const { agent, destroy: agentDestroy } = await createSessionAgent({
            sessionContext,
            audakoServices,
            eventHub,
            requestHub: toolRequestHub,
            permissionService,
          });

          const wsEventBridgeUnsubscribe = createWsEventBridge(agent, sessionId, eventHub);

          return {
            agent,
            agentDestroy,
            wsEventBridgeUnsubscribe,
            sessionContext,
            audakoServices,
          };
        },
      );

      // Update session info if provided
      if (sessionInfo && !isNew) {
        const sanitized = sanitizeSessionInfoUpdate(sessionInfo);
        await entry.sessionContext.update(sanitized);

        eventHub.publish(
          entry.sessionId,
          buildSessionEvent(
            'session.info.updated',
            entry.sessionId,
            toSessionInfoResponse(
              entry.sessionId,
              entry.sessionContext.tenantId,
              entry.sessionContext.groupId,
              entry.sessionContext.entityType,
              entry.sessionContext.app,
            ),
          ),
        );
      }

      const response: SessionBootstrapResponse = {
        websocketPath: `/api/session/${encodeURIComponent(entry.sessionId)}/ws`,
        sessionId: entry.sessionId,
        bridgeSessionToken: sessionToken,
        isNew,
        scadaUrl: entry.scadaUrl,
        sessionInfo: toSessionInfoSnapshot(
          entry.sessionContext.tenantId,
          entry.sessionContext.groupId,
          entry.sessionContext.entityType,
          entry.sessionContext.app,
        ),
      };

      logger.info(
        {
          scadaUrl: entry.scadaUrl,
          sessionId: entry.sessionId,
          isNew,
        },
        'Bootstrap request resolved',
      );

      return reply.send(response);
    } catch (error) {
      logger.error(
        {
          scadaUrl: normalizedScadaUrl,
          error: error instanceof Error ? error.message : String(error),
        },
        'Bootstrap request failed',
      );

      return reply.status(500).send({
        error: 'Failed to bootstrap chat session',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function handleGetSessionInfo(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply,
  ) {
    if (!requireSessionAuth(request, reply)) return;

    const { sessionId } = request.params;
    const entry = registry.getSession(sessionId);

    if (!entry) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    return reply.send(
      toSessionInfoResponse(
        sessionId,
        entry.sessionContext.tenantId,
        entry.sessionContext.groupId,
        entry.sessionContext.entityType,
        entry.sessionContext.app,
      ),
    );
  }
}
