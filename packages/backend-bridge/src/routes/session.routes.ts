import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { appConfig, createLogger } from '../config/index.js';
import type { OpencodeFactory } from '../services/opencode-factory.js';
import type { ServerRegistry } from '../services/server-registry.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import {
  SessionRequestCancelledError,
  type SessionRequestHub,
  SessionRequestTimeoutError,
} from '../services/session-request-hub.js';
import type {
  ErrorResponse,
  PushSessionEventPayload,
  PushSessionEventRequest,
  PushSessionEventResponse,
  RequestSessionEventRequest,
  RequestSessionEventResponse,
  ResolveSessionEventResponse,
  ResolveSessionEventResponseRequest,
  ServerListEntry,
  ServerListResponse,
  SessionBootstrapRequest,
  SessionBootstrapResponse,
  SessionEventEnvelope,
  SessionInfo,
  SessionInfoFields,
  SessionInfoResponse,
  SessionInfoSnapshot,
  SessionSnapshotPayload,
  SessionSocket,
} from '../types/index.js';
import { getErrorMessage } from '../utils.js';

export async function sessionRoutes(
  fastify: FastifyInstance,
  registry: ServerRegistry,
  opencodeFactory: OpencodeFactory,
  eventHub: SessionEventHub,
  sessionRequestHub: SessionRequestHub,
) {
  const logger = createLogger('session-routes');

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
    Reply: RequestSessionEventResponse | ErrorResponse;
  }>('/api/session/:sessionId/events/request', handleRequestEvent);
  fastify.post<{
    Params: { sessionId: string; requestId: string };
    Body: ResolveSessionEventResponseRequest;
    Reply: ResolveSessionEventResponse | ErrorResponse;
  }>('/api/session/:sessionId/events/request/:requestId/response', handleResolveRequest);
  fastify.get<{ Reply: ServerListResponse }>('/api/session/servers', handleListServers);

  // ── Constants ────────────────────────────────────────────────────────
  const DEFAULT_EVENT_REQUEST_TIMEOUT_MS = 180000;
  const MIN_EVENT_REQUEST_TIMEOUT_MS = 1000;
  const MAX_EVENT_REQUEST_TIMEOUT_MS = 180000;

  // ── Helpers ──────────────────────────────────────────────────────────

  function toSessionInfoSnapshot(sessionInfo: SessionInfo | null | undefined): SessionInfoSnapshot {
    return {
      tenantId: sessionInfo?.tenantId,
      groupId: sessionInfo?.groupId,
      entityType: sessionInfo?.entityType,
      app: sessionInfo?.app,
      updatedAt: sessionInfo?.updatedAt?.toISOString(),
    };
  }

  function toSessionInfoResponse(
    sessionId: string,
    sessionInfo: SessionInfo | null | undefined,
  ): SessionInfoResponse {
    return {
      sessionId,
      ...toSessionInfoSnapshot(sessionInfo),
    };
  }

  function sanitizeSessionInfoUpdate(body: SessionInfoFields): SessionInfoFields {
    return {
      tenantId: body.tenantId?.trim() || undefined,
      groupId: body.groupId?.trim() || undefined,
      entityType: body.entityType?.trim() || undefined,
      app: body.app?.trim() || undefined,
    };
  }

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

  function normalizeEventRequestTimeoutMs(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return DEFAULT_EVENT_REQUEST_TIMEOUT_MS;
    }

    const normalized = Math.floor(value);
    if (normalized < MIN_EVENT_REQUEST_TIMEOUT_MS) {
      return MIN_EVENT_REQUEST_TIMEOUT_MS;
    }

    if (normalized > MAX_EVENT_REQUEST_TIMEOUT_MS) {
      return MAX_EVENT_REQUEST_TIMEOUT_MS;
    }

    return normalized;
  }

  function getHeaderValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  function getForwardedValue(value: string | undefined): string | undefined {
    if (!value) {
      return undefined;
    }

    const first = value.split(',')[0]?.trim();
    return first || undefined;
  }

  function resolvePublicBridgeUrl(request: FastifyRequest): string {
    let url: string;

    if (appConfig.bridge.publicUrl?.trim()) {
      url = appConfig.bridge.publicUrl.trim();
    } else {
      const host =
        getForwardedValue(getHeaderValue(request.headers['x-forwarded-host'])) ||
        getHeaderValue(request.headers.host);

      if (!host) {
        url = appConfig.bridge.internalUrl;
      } else {
        const protocol =
          getForwardedValue(getHeaderValue(request.headers['x-forwarded-proto'])) ||
          request.protocol;
        url = `${protocol}://${host}`;
      }
    }

    return url.replace(/\/+$/, '');
  }

  function buildWebsocketUrl(bridgeUrl: string, sessionId: string): string {
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

    return url.toString();
  }

  // ── Handlers ─────────────────────────────────────────────────────────

  async function handleBootstrap(
    request: FastifyRequest<{ Body: SessionBootstrapRequest }>,
    reply: FastifyReply,
  ) {
    const { scadaUrl, accessToken, sessionInfo } = request.body;
    const requestOrigin = Array.isArray(request.headers.origin)
      ? request.headers.origin[0]
      : request.headers.origin;

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

    try {
      const { entry, isNew } = await registry.getOrCreateServer(
        normalizedScadaUrl,
        normalizedAccessToken,
        async (port: number, sessionId: string) => {
          return opencodeFactory.createServer(
            normalizedScadaUrl,
            normalizedAccessToken,
            port,
            sessionId,
            requestOrigin ? [requestOrigin] : undefined,
          );
        },
      );

      const effectiveSessionInfo = sessionInfo
        ? registry.updateSessionInfo(entry.sessionId, sanitizeSessionInfoUpdate(sessionInfo))
        : registry.getSessionInfo(entry.sessionId);

      if (sessionInfo && effectiveSessionInfo) {
        eventHub.publish(
          entry.sessionId,
          buildSessionEvent(
            'session.info.updated',
            entry.sessionId,
            toSessionInfoResponse(entry.sessionId, effectiveSessionInfo),
          ),
        );
      }

      const response: SessionBootstrapResponse = {
        opencodeUrl: entry.opencodeUrl,
        websocketUrl: buildWebsocketUrl(resolvePublicBridgeUrl(request), entry.sessionId),
        sessionId: entry.sessionId,
        isNew,
        scadaUrl: entry.scadaUrl,
        sessionInfo: toSessionInfoSnapshot(effectiveSessionInfo),
      };

      logger.info(
        {
          scadaUrl: entry.scadaUrl,
          sessionId: entry.sessionId,
          isNew,
          opencodeUrl: entry.opencodeUrl,
        },
        'Bootstrap request resolved',
      );

      return reply.send(response);
    } catch (error) {
      logger.error(
        {
          scadaUrl: normalizedScadaUrl,
          error: getErrorMessage(error),
        },
        'Bootstrap request failed',
      );

      return reply.status(500).send({
        error: 'Failed to bootstrap chat session',
        message: getErrorMessage(error),
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

    if (!registry.hasSession(sessionId)) {
      socket.close(4404, 'session_not_found');
      return;
    }

    eventHub.subscribe(sessionId, socket);

    const snapshot = registry.getSessionSnapshot(sessionId);
    if (!snapshot) {
      eventHub.unsubscribe(sessionId, socket);
      socket.close(4404, 'session_not_found');
      return;
    }

    const payload: SessionSnapshotPayload = {
      sessionId: snapshot.sessionId,
      scadaUrl: snapshot.scadaUrl,
      opencodeUrl: snapshot.opencodeUrl,
      sessionInfo: toSessionInfoSnapshot(snapshot.sessionInfo),
      isActive: true,
    };

    try {
      socket.send(JSON.stringify(buildSessionEvent('session.snapshot', sessionId, payload)));
    } catch {
      eventHub.unsubscribe(sessionId, socket);
      socket.close(1011, 'snapshot_delivery_failed');
      return;
    }

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

    socket.on('pong', () => {
      isAlive = true;
    });
    socket.on('close', onDisconnect);
    socket.on('error', onDisconnect);
  }

  async function handleUpdateSessionInfo(
    request: FastifyRequest<{ Params: { sessionId: string }; Body: SessionInfoFields }>,
    reply: FastifyReply,
  ) {
    const { sessionId } = request.params;
    const body = request.body ?? ({} as SessionInfoFields);

    const sessionInfo = registry.updateSessionInfo(sessionId, sanitizeSessionInfoUpdate(body));

    if (!sessionInfo) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    const response = toSessionInfoResponse(sessionId, sessionInfo);
    eventHub.publish(sessionId, buildSessionEvent('session.info.updated', sessionId, response));

    return reply.send(response);
  }

  async function handleGetSessionInfo(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply,
  ) {
    const { sessionId } = request.params;
    const sessionInfo = registry.getSessionInfo(sessionId);

    if (!sessionInfo) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    return reply.send(toSessionInfoResponse(sessionId, sessionInfo));
  }

  async function handlePushEvent(
    request: FastifyRequest<{ Params: { sessionId: string }; Body: PushSessionEventRequest }>,
    reply: FastifyReply,
  ) {
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

    const payload: PushSessionEventPayload = {
      type,
      payload: request.body.payload,
    };

    const deliveredTo = eventHub.publish(
      sessionId,
      buildSessionEvent('session.event', sessionId, payload),
    );

    return reply.send({ sessionId, deliveredTo });
  }

  async function handleRequestEvent(
    request: FastifyRequest<{ Params: { sessionId: string }; Body: RequestSessionEventRequest }>,
    reply: FastifyReply,
  ) {
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

    const timeoutMs = normalizeEventRequestTimeoutMs(request.body?.timeoutMs);
    const pendingRequest = sessionRequestHub.create(sessionId, timeoutMs);

    const deliveredTo = eventHub.publish(
      sessionId,
      buildSessionEvent('session.event', sessionId, {
        type: 'hub.request',
        payload: {
          requestId: pendingRequest.requestId,
          requestType: type,
          payload: request.body.payload,
          expiresAt: pendingRequest.expiresAt,
        },
      }),
    );

    if (deliveredTo === 0) {
      sessionRequestHub.discard(sessionId, pendingRequest.requestId);

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
      if (error instanceof SessionRequestTimeoutError) {
        return reply.status(504).send({
          error: 'Gateway Timeout',
          message: error.message,
        });
      }

      if (error instanceof SessionRequestCancelledError) {
        return reply.status(409).send({
          error: 'Conflict',
          message: error.message,
        });
      }

      logger.error(
        {
          sessionId,
          requestId: pendingRequest.requestId,
          type,
          error: getErrorMessage(error),
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

    const result = sessionRequestHub.resolve(sessionId, requestId, body.response);
    if (!result.resolved) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Pending request not found: ${requestId}`,
      });
    }

    return reply.send({
      sessionId,
      requestId,
      resolved: true,
    });
  }

  async function handleListServers(_request: FastifyRequest, reply: FastifyReply) {
    const servers = registry.getAllServers();
    const now = Date.now();

    const serverList: ServerListEntry[] = servers.map(entry => {
      const idleMinutes = Math.floor((now - entry.lastAccessedAt.getTime()) / 60000);

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
  }
}
