import type {
  ErrorResponse,
  SessionBootstrapRequest,
  SessionBootstrapResponse,
} from '@audako/contracts';
import type { Context, Hono } from 'hono';
import { createSessionAgent } from '../agent/agent-factory.js';
import { createWsEventBridge } from '../agent/ws-event-bridge.js';
import { createLogger } from '../config/app-config.js';
import { createAudakoServices } from '../services/audako-services.js';
import { UpstreamAuthError, validateUpstreamToken } from '../services/auth-validator.js';
import { DefaultPermissionService } from '../services/permission-service.js';
import { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import { buildSessionEvent } from '../services/session-event-utils.js';
import {
  sanitizeSessionInfoUpdate,
  toSessionInfoResponse,
} from '../services/session-info-utils.js';
import type { SessionRegistry } from '../services/session-registry.js';
import type { SessionRequestHub } from '../services/session-request-hub.js';
import { ToolRequestHub } from '../services/tool-request-hub.js';

const logger = createLogger('session-routes');

interface SessionRoutesDependencies {
  registry: SessionRegistry;
  eventHub: SessionEventHub;
  requestHub: SessionRequestHub;
}

export function registerSessionRoutes(app: Hono, deps: SessionRoutesDependencies): void {
  const { registry, eventHub, requestHub } = deps;
  const toolRequestHub = new ToolRequestHub(requestHub, eventHub);
  const permissionService = new DefaultPermissionService(registry, toolRequestHub);
  registry.onSessionRemoved(entry => {
    permissionService.clearSession(entry.sessionId);
  });

  // ── Route map ────────────────────────────────────────────────────────
  app.post('/api/session/bootstrap', handleBootstrap);
  app.get('/api/session/:sessionId/info', handleGetSessionInfo);

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

  function unauthorized(context: Context, message: string): Response {
    const payload: ErrorResponse = {
      error: 'Unauthorized',
      message,
    };

    return context.json(payload, 401);
  }

  function requireSessionAuth(context: Context, sessionId: string): Response | null {
    const authHeader = context.req.header('authorization');

    if (!authHeader) {
      return unauthorized(context, 'Authorization header required');
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      return unauthorized(context, 'Invalid authorization format');
    }

    const token = match[1];
    if (!registry.verifySessionToken(sessionId, token)) {
      return unauthorized(context, 'Invalid session token');
    }

    return null;
  }

  // ── Handlers ─────────────────────────────────────────────────────────

  async function handleBootstrap(context: Context): Promise<Response> {
    let body: SessionBootstrapRequest;

    try {
      body = await context.req.json<SessionBootstrapRequest>();
    } catch {
      return context.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON body',
        } satisfies ErrorResponse,
        400,
      );
    }

    const { scadaUrl, accessToken, sessionInfo } = body;

    const normalizedScadaUrl = scadaUrl ? normalizeScadaUrl(scadaUrl) : undefined;
    const normalizedAccessToken = accessToken?.trim();

    if (!normalizedScadaUrl || !normalizedAccessToken) {
      return context.json(
        {
          error: 'Bad Request',
          message: 'scadaUrl and accessToken are required',
        } satisfies ErrorResponse,
        400,
      );
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
        return context.json(
          {
            error: authError.statusCode === 403 ? 'Forbidden' : 'Unauthorized',
            message: authError.message,
          } satisfies ErrorResponse,
          authError.statusCode === 403 ? 403 : 401,
        );
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
            'session.updated',
            entry.sessionId,
            toSessionInfoResponse(entry.sessionId, {
              tenantId: entry.sessionContext.tenantId,
              groupId: entry.sessionContext.groupId,
              entityType: entry.sessionContext.entityType,
              app: entry.sessionContext.app,
            }),
          ),
        );
      }

      const response: SessionBootstrapResponse = {
        sessionId: entry.sessionId,
        isNew,
        scadaUrl: entry.scadaUrl,
        sessionInfo: toSessionInfoSnapshot(
          entry.sessionContext.tenantId,
          entry.sessionContext.groupId,
          entry.sessionContext.entityType,
          entry.sessionContext.app,
        ),
        realtime: {
          transport: 'socket.io',
          protocolVersion: 'v1',
          namespace: '/session',
          path: '/socket.io',
          auth: {
            type: 'session_token',
            token: sessionToken,
          },
          room: {
            type: 'session',
            id: entry.sessionId,
          },
        },
      };

      logger.info(
        {
          scadaUrl: entry.scadaUrl,
          sessionId: entry.sessionId,
          isNew,
        },
        'Bootstrap request resolved',
      );

      return context.json(response);
    } catch (error) {
      logger.error(
        {
          scadaUrl: normalizedScadaUrl,
          error: error instanceof Error ? error.message : String(error),
        },
        'Bootstrap request failed',
      );

      return context.json(
        {
          error: 'Failed to bootstrap chat session',
          message: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  }

  async function handleGetSessionInfo(context: Context): Promise<Response> {
    const sessionId = context.req.param('sessionId');
    if (!sessionId) {
      return context.json(
        {
          error: 'Bad Request',
          message: 'sessionId is required',
        } satisfies ErrorResponse,
        400,
      );
    }

    const authResponse = requireSessionAuth(context, sessionId);
    if (authResponse) {
      return authResponse;
    }

    const entry = registry.getSession(sessionId);

    if (!entry) {
      return context.json(
        {
          error: 'Not Found',
          message: `Session not found: ${sessionId}`,
        } satisfies ErrorResponse,
        404,
      );
    }

    return context.json(
      toSessionInfoResponse(sessionId, {
        tenantId: entry.sessionContext.tenantId,
        groupId: entry.sessionContext.groupId,
        entityType: entry.sessionContext.entityType,
        app: entry.sessionContext.app,
      }),
    );
  }
}
