import type {
  PushSessionEventRequest,
  PushSessionEventResponse,
  RequestSessionEventPendingResponse,
  RequestSessionEventRequest,
  RequestSessionEventResponse,
  ResolveSessionEventResponse,
  ResolveSessionEventResponseRequest,
  SessionBootstrapRequest,
  SessionBootstrapResponse,
  SessionInfoFields,
  SessionInfoResponse,
} from '@audako/contracts';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSessionAgent } from '../agent/agent-factory.js';
import { createWsEventBridge } from '../agent/ws-event-bridge.js';
import { appConfig, createLogger, loadSystemPrompt } from '../config/index.js';
import { createAudakoServices } from '../services/audako-services.js';
import { UpstreamAuthError, validateUpstreamToken } from '../services/auth-validator.js';
import { verifyWebSocketAuth } from '../services/session-auth.js';
import { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import type { SessionRegistry } from '../services/session-registry.js';
import type { SessionRequestHub } from '../services/session-request-hub.js';
import { ToolRequestHub } from '../services/tool-request-hub.js';

const logger = createLogger('session-routes');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface SessionSocket {
  readyState: number;
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  ping?: () => void;
}

interface SessionEventEnvelope<T = unknown> {
  type: string;
  sessionId: string;
  timestamp: string;
  payload: T;
}

interface ErrorResponse {
  error: string;
  message: string;
}

export async function sessionRoutes(
  fastify: FastifyInstance,
  registry: SessionRegistry,
  eventHub: SessionEventHub,
  requestHub: SessionRequestHub,
) {
  // Load system prompt once at startup
  let systemPrompt = '';
  try {
    systemPrompt = await loadSystemPrompt();
    logger.info('System prompt loaded');
  } catch (error) {
    logger.error({ error }, 'Failed to load system prompt');
    throw error;
  }

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
  fastify.put<{
    Params: { sessionId: string };
    Body: SessionInfoFields;
    Reply: SessionInfoResponse | ErrorResponse;
  }>('/api/session/:sessionId/info', handleUpdateSessionInfo);
  fastify.get<{ Params: { sessionId: string }; Reply: SessionInfoResponse | ErrorResponse }>(
    '/api/session/:sessionId/info',
    handleGetSessionInfo,
  );
  fastify.post<{
    Params: { sessionId: string };
    Body: PushSessionEventRequest;
    Reply: PushSessionEventResponse | ErrorResponse;
  }>('/api/session/:sessionId/events', handlePushEvent);
  fastify.post<{
    Params: { sessionId: string };
    Body: RequestSessionEventRequest;
    Reply: RequestSessionEventResponse | RequestSessionEventPendingResponse | ErrorResponse;
  }>('/api/session/:sessionId/events/request', handleRequestEvent);
  fastify.post<{
    Params: { sessionId: string; requestId: string };
    Body: ResolveSessionEventResponseRequest;
    Reply: ResolveSessionEventResponse | ErrorResponse;
  }>('/api/session/:sessionId/events/request/:requestId/response', handleResolveRequest);

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

  function resolvePublicBridgeUrl(request: FastifyRequest): string {
    const host =
      (request.headers['x-forwarded-host'] as string) || (request.headers.host as string);

    if (!host) {
      return `http://127.0.0.1:${appConfig.port}`;
    }

    const protocol = (request.headers['x-forwarded-proto'] as string) || request.protocol;
    return `${protocol}://${host}`;
  }

  function buildWebsocketUrl(bridgeUrl: string, sessionId: string, sessionToken?: string): string {
    const url = new URL(bridgeUrl);
    const basePath = url.pathname.replace(/\/+$/, '');
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.protocol = wsProtocol;
    url.pathname = `${basePath}/api/session/${encodeURIComponent(sessionId)}/ws`.replace(
      /\/+/g,
      '/',
    );
    url.search = '';
    url.hash = '';

    if (sessionToken) {
      url.searchParams.set('sessionToken', sessionToken);
    }

    return url.toString();
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
        async (sessionId: string, sessionToken: string) => {
          // Create audako services
          const audakoServices = await createAudakoServices(
            normalizedScadaUrl,
            normalizedAccessToken,
          );

          // Create session context
          const sessionContext = new SessionContext({
            sessionId,
            scadaUrl: normalizedScadaUrl,
            accessToken: normalizedAccessToken,
            tenantId: sessionInfo?.tenantId,
            groupId: sessionInfo?.groupId,
            entityType: sessionInfo?.entityType,
            app: sessionInfo?.app,
          });

          // Create tool request hub (wraps low-level requestHub for tool use)
          const toolRequestHub = new ToolRequestHub(requestHub, eventHub);


          // Create agent
          const { agent, destroy: agentDestroy } = createSessionAgent({
            sessionContext,
            audakoServices: audakoServices as any,
            eventHub,
            requestHub: toolRequestHub,
            systemPrompt,
            modelConfig: {
              provider: appConfig.llm.provider,
              modelName: appConfig.llm.modelName,
            },
          });

          // Create WS event bridge
          const wsEventBridgeUnsubscribe = createWsEventBridge(agent, sessionId, eventHub);

          return {
            agent,
            agentDestroy,
            wsEventBridgeUnsubscribe,
            sessionContext,
          };
        },
      );

      // Update session info if provided
      if (sessionInfo && !isNew) {
        const sanitized = sanitizeSessionInfoUpdate(sessionInfo);
        entry.sessionContext.update(sanitized);

        eventHub.publish(
          entry.sessionId,
          buildSessionEvent(
            'session.info.updated',
            entry.sessionId,
            toSessionInfoResponse(
              entry.sessionId,
              entry.sessionContext.getTenantId(),
              entry.sessionContext.getGroupId(),
              entry.sessionContext.getEntityType(),
              entry.sessionContext.getApp(),
            ),
          ),
        );
      }

      const publicBridgeUrl = resolvePublicBridgeUrl(request);
      const response: SessionBootstrapResponse = {
        websocketUrl: buildWebsocketUrl(publicBridgeUrl, entry.sessionId, sessionToken),
        sessionId: entry.sessionId,
        bridgeSessionToken: sessionToken,
        isNew,
        scadaUrl: entry.scadaUrl,
        sessionInfo: toSessionInfoSnapshot(
          entry.sessionContext.getTenantId(),
          entry.sessionContext.getGroupId(),
          entry.sessionContext.getEntityType(),
          entry.sessionContext.getApp(),
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

  function handleWebSocket(
    connection: unknown,
    request: FastifyRequest<{ Params: { sessionId: string } }>,
  ) {
    const { sessionId } = request.params;
    const socket = (
      connection && typeof connection === 'object' && 'socket' in connection
        ? (connection as { socket: SessionSocket }).socket
        : (connection as SessionSocket)
    ) as SessionSocket;

    // Authenticate via query parameter (browsers cannot send custom headers on WS).
    const entry = registry.getSession(sessionId);
    if (!entry) {
      socket.close(4404, 'session_not_found');
      return;
    }

    // Extract and verify token from query params
    const token = (request.query as any)?.sessionToken;
    if (!token || !registry.verifySessionToken(sessionId, token)) {
      socket.close(4401, 'unauthorized');
      return;
    }



    const payload = {
      sessionId: entry.sessionId,
      scadaUrl: entry.scadaUrl,
      sessionInfo: toSessionInfoSnapshot(
        entry.sessionContext.getTenantId(),
        entry.sessionContext.getGroupId(),
        entry.sessionContext.getEntityType(),
        entry.sessionContext.getApp(),
      ),
      isActive: true,
    };

    try {
      socket.send(JSON.stringify(buildSessionEvent('session.snapshot', sessionId, payload)));
    } catch {
      eventHub.unsubscribe(sessionId, socket);
      socket.close(1011, 'snapshot_delivery_failed');
      return;
    }

    // Handle incoming user messages
    socket.on?.('message', async (data: Buffer | string) => {
      try {
        const message = typeof data === 'string' ? data : data.toString('utf-8');
        const entry = registry.getSession(sessionId);
        if (!entry) {
          return;
        }

        // Send user message to agent
        await entry.agent.prompt(message);
      } catch (error) {
        logger.error(
          {
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          },
          'Error handling user message',
        );
      }
    });

    let isAlive = true;
    const heartbeat = setInterval(() => {
      if (!isAlive) {
        socket.close(1001, 'heartbeat_timeout');
        return;
      }

      isAlive = false;
      socket.ping?.();
    }, 30000);

    const onDisconnect = () => {
      clearInterval(heartbeat);
      eventHub.unsubscribe(sessionId, socket);
    };

    socket.on?.('pong', () => {
      isAlive = true;
    });
    socket.on?.('close', onDisconnect);
    socket.on?.('error', onDisconnect);
  }

  async function handleUpdateSessionInfo(
    request: FastifyRequest<{ Params: { sessionId: string }; Body: SessionInfoFields }>,
    reply: FastifyReply,
  ) {
    if (!requireSessionAuth(request, reply)) return;

    const { sessionId } = request.params;
    const body = request.body ?? ({} as SessionInfoFields);

    const entry = registry.getSession(sessionId);
    if (!entry) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    const sanitized = sanitizeSessionInfoUpdate(body);
    entry.sessionContext.update(sanitized);

    const response = toSessionInfoResponse(
      sessionId,
      entry.sessionContext.getTenantId(),
      entry.sessionContext.getGroupId(),
      entry.sessionContext.getEntityType(),
      entry.sessionContext.getApp(),
    );
    eventHub.publish(sessionId, buildSessionEvent('session.info.updated', sessionId, response));

    return reply.send(response);
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
        entry.sessionContext.getTenantId(),
        entry.sessionContext.getGroupId(),
        entry.sessionContext.getEntityType(),
        entry.sessionContext.getApp(),
      ),
    );
  }

  async function handlePushEvent(
    request: FastifyRequest<{ Params: { sessionId: string }; Body: PushSessionEventRequest }>,
    reply: FastifyReply,
  ) {
    if (!requireSessionAuth(request, reply)) return;

    const { sessionId } = request.params;

    if (!registry.hasSession(sessionId)) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    const type = request.body?.type?.trim();
    if (!type) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'type is required',
      });
    }

    const deliveredTo = eventHub.publish(
      sessionId,
      buildSessionEvent(type, sessionId, request.body.payload),
    );

    return reply.send({ sessionId, deliveredTo });
  }

  async function handleRequestEvent(
    request: FastifyRequest<{ Params: { sessionId: string }; Body: RequestSessionEventRequest }>,
    reply: FastifyReply,
  ) {
    if (!requireSessionAuth(request, reply)) return;

    const { sessionId } = request.params;

    if (!registry.hasSession(sessionId)) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    const type = request.body?.type?.trim();
    if (!type) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'type is required',
      });
    }

    const timeoutMs = request.body?.timeoutMs ?? 30000;
    const pendingRequest = requestHub.create(sessionId, timeoutMs);

    const deliveredTo = eventHub.publish(
      sessionId,
      buildSessionEvent('hub.request', sessionId, {
        requestId: pendingRequest.requestId,
        requestType: type,
        payload: request.body.payload,
        expiresAt: pendingRequest.expiresAt,
      }),
    );

    if (deliveredTo === 0) {
      // No active subscribers - reject the pending request to clean up
      requestHub.cancelSession(sessionId);

      return reply.status(503).send({
        error: 'Service Unavailable',
        message: 'No active websocket subscribers available for this session',
      });
    }


    try {
      const resolution = await pendingRequest.waitForResponse;

      return reply.send({
        sessionId,
        requestId: pendingRequest.requestId,
        response: resolution.response,
        respondedAt: resolution.respondedAt,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        return reply.status(504).send({
          error: 'Gateway Timeout',
          message: error.message,
        });
      }

      if (error instanceof Error && error.message.includes('cancelled')) {
        return reply.status(409).send({
          error: 'Conflict',
          message: error.message,
        });
      }

      logger.error(
        {
          sessionId,
          type,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to resolve session request',
      );

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to resolve session request',
      });
    }
  }

  async function handleResolveRequest(
    request: FastifyRequest<{
      Params: { sessionId: string; requestId: string };
      Body: ResolveSessionEventResponseRequest;
    }>,
    reply: FastifyReply,
  ) {
    if (!requireSessionAuth(request, reply)) return;

    const { sessionId, requestId } = request.params;

    if (!registry.hasSession(sessionId)) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    const body = request.body ?? ({} as ResolveSessionEventResponseRequest);
    if (!Object.hasOwn(body, 'response')) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'response is required',
      });
    }

    const result = requestHub.resolve(sessionId, requestId, body.response);
    if (!result.resolved) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Pending request not found: ${requestId}`,
      });
    }

    eventHub.publish(
      sessionId,
      buildSessionEvent('hub.response', sessionId, {
        requestId,
        response: body.response,
        respondedAt: result.respondedAt,
      }),
    );

    return reply.send({
      sessionId,
      requestId,
      resolved: true,
    });
  }
}
