import type { FastifyInstance, FastifyRequest } from 'fastify';
import { appConfig } from '../config/index.js';
import type { OpencodeFactory } from '../services/opencode-factory.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import {
  SessionRequestCancelledError,
  type SessionRequestHub,
  SessionRequestTimeoutError,
} from '../services/session-request-hub.js';
import type { ServerRegistry } from '../services/server-registry.js';
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
  SessionInfoResponse,
  SessionInfoSnapshot,
  SessionInfoUpdateRequest,
  SessionSnapshotPayload,
} from '../types/index.js';

interface SessionSocket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  ping?: () => void;
}

export async function sessionRoutes(
  fastify: FastifyInstance,
  registry: ServerRegistry,
  opencodeFactory: OpencodeFactory,
  eventHub: SessionEventHub,
  sessionRequestHub: SessionRequestHub,
) {
  const DEFAULT_EVENT_REQUEST_TIMEOUT_MS = 180000;
  const MIN_EVENT_REQUEST_TIMEOUT_MS = 1000;
  const MAX_EVENT_REQUEST_TIMEOUT_MS = 180000;

  const toSessionInfoSnapshot = (
    sessionInfo: SessionInfo | null | undefined,
  ): SessionInfoSnapshot => ({
    tenantId: sessionInfo?.tenantId,
    groupId: sessionInfo?.groupId,
    entityType: sessionInfo?.entityType,
    app: sessionInfo?.app,
    updatedAt: sessionInfo?.updatedAt?.toISOString(),
  });

  const toSessionInfoResponse = (
    sessionId: string,
    sessionInfo: SessionInfo | null | undefined,
  ): SessionInfoResponse => ({
    sessionId,
    ...toSessionInfoSnapshot(sessionInfo),
  });

  const sanitizeSessionInfoUpdate = (body: SessionInfoUpdateRequest): SessionInfoUpdateRequest => ({
    tenantId: body.tenantId?.trim() || undefined,
    groupId: body.groupId?.trim() || undefined,
    entityType: body.entityType?.trim() || undefined,
    app: body.app?.trim() || undefined,
  });

  const normalizeScadaUrl = (value: string): string => {
    const trimmed = value.trim();

    try {
      const parsed = new URL(trimmed);
      const normalizedPath = parsed.pathname.replace(/\/+$/, '');
      const pathSuffix = normalizedPath && normalizedPath !== '/' ? normalizedPath : '';

      return `${parsed.protocol}//${parsed.host}${pathSuffix}`;
    } catch {
      return trimmed.replace(/\/+$/, '');
    }
  };

  const buildSessionEvent = <T>(
    type: string,
    sessionId: string,
    payload: T,
  ): SessionEventEnvelope<T> => ({
    type,
    sessionId,
    timestamp: new Date().toISOString(),
    payload,
  });

  const normalizeEventRequestTimeoutMs = (value: number | undefined): number => {
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
  };

  const getHeaderValue = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

  const getForwardedValue = (value: string | undefined): string | undefined => {
    if (!value) {
      return undefined;
    }

    const first = value.split(',')[0]?.trim();
    return first || undefined;
  };

  const resolvePublicBridgeUrl = (request: FastifyRequest): string => {
    if (appConfig.bridge.publicUrl?.trim()) {
      return appConfig.bridge.publicUrl.trim().replace(/\/+$/, '');
    }

    const host =
      getForwardedValue(getHeaderValue(request.headers['x-forwarded-host'])) ||
      getHeaderValue(request.headers.host);

    if (!host) {
      return appConfig.bridge.internalUrl.replace(/\/+$/, '');
    }

    const protocol =
      getForwardedValue(getHeaderValue(request.headers['x-forwarded-proto'])) || request.protocol;

    return `${protocol}://${host}`.replace(/\/+$/, '');
  };

  const buildWebsocketUrl = (bridgeUrl: string, sessionId: string): string => {
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
  };

  // POST /api/session/bootstrap - Create or reuse a chat session
  fastify.post<{
    Body: SessionBootstrapRequest;
    Reply: SessionBootstrapResponse | ErrorResponse;
  }>('/api/session/bootstrap', async (request, reply) => {
    const { scadaUrl, accessToken, model, sessionInfo } = request.body;
    const requestOrigin = Array.isArray(request.headers.origin)
      ? request.headers.origin[0]
      : request.headers.origin;

    const normalizedScadaUrl = scadaUrl ? normalizeScadaUrl(scadaUrl) : undefined;
    const normalizedAccessToken = accessToken?.trim();
    const normalizedModel = model?.trim() || undefined;

    if (!normalizedScadaUrl || !normalizedAccessToken) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'scadaUrl and accessToken are required',
      });
    }

    fastify.log.info(
      {
        scadaUrl: normalizedScadaUrl,
        model: normalizedModel,
        hasSessionInfo: Boolean(sessionInfo),
      },
      'Bootstrap request received',
    );

    try {
      const { entry, isNew } = await registry.getOrCreateServer(
        normalizedScadaUrl,
        normalizedAccessToken,
        normalizedModel,
        async (port: number, sessionId: string) => {
          return opencodeFactory.createServer(
            normalizedScadaUrl,
            normalizedAccessToken,
            port,
            sessionId,
            normalizedModel,
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

      fastify.log.info(
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
      fastify.log.error(
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
  });

  // GET /api/session/:sessionId/ws - Session scoped websocket stream
  fastify.get<{ Params: { sessionId: string } }>(
    '/api/session/:sessionId/ws',
    { websocket: true },
    (connection: unknown, request) => {
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
    },
  );

  // PUT /api/session/:sessionId/info - Update client location context
  fastify.put<{
    Params: { sessionId: string };
    Body: SessionInfoUpdateRequest;
    Reply: SessionInfoResponse | ErrorResponse;
  }>('/api/session/:sessionId/info', async (request, reply) => {
    const { sessionId } = request.params;
    const body = request.body ?? ({} as SessionInfoUpdateRequest);

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
  });

  // GET /api/session/:sessionId/info - Read session context (used by MCP)
  fastify.get<{
    Params: { sessionId: string };
    Reply: SessionInfoResponse | ErrorResponse;
  }>('/api/session/:sessionId/info', async (request, reply) => {
    const { sessionId } = request.params;
    const sessionInfo = registry.getSessionInfo(sessionId);

    if (!sessionInfo) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    return reply.send(toSessionInfoResponse(sessionId, sessionInfo));
  });

  // POST /api/session/:sessionId/events - Publish generic event to subscribers
  fastify.post<{
    Params: { sessionId: string };
    Body: PushSessionEventRequest;
    Reply: PushSessionEventResponse | ErrorResponse;
  }>('/api/session/:sessionId/events', async (request, reply) => {
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
  });

  // POST /api/session/:sessionId/events/request - Publish event and wait for response
  fastify.post<{
    Params: { sessionId: string };
    Body: RequestSessionEventRequest;
    Reply: RequestSessionEventResponse | ErrorResponse;
  }>('/api/session/:sessionId/events/request', async (request, reply) => {
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

      fastify.log.error(
        {
          sessionId,
          requestId: pendingRequest.requestId,
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
  });

  // POST /api/session/:sessionId/events/request/:requestId/response - Resolve pending event request
  fastify.post<{
    Params: { sessionId: string; requestId: string };
    Body: ResolveSessionEventResponseRequest;
    Reply: ResolveSessionEventResponse | ErrorResponse;
  }>('/api/session/:sessionId/events/request/:requestId/response', async (request, reply) => {
    const { sessionId, requestId } = request.params;

    if (!registry.hasSession(sessionId)) {
      return reply.status(404).send({
        error: 'Not Found',
        message: `Session not found: ${sessionId}`,
      });
    }

    const body = request.body ?? ({} as ResolveSessionEventResponseRequest);
    if (!Object.prototype.hasOwnProperty.call(body, 'response')) {
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
  });

  // GET /api/session/servers - List active servers (for debugging)
  fastify.get<{ Reply: ServerListResponse }>('/api/session/servers', async (_request, reply) => {
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
  });
}
