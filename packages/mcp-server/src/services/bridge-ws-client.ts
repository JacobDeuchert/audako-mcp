import type { SessionEventEnvelope, SessionInfoResponse } from '@audako/contracts';
import { WebSocket } from 'ws';
import { resolveBridgeSessionToken, resolveBridgeUrl } from './bridge-client.js';
import { logger } from './logger.js';
import { resolveSessionId } from './session-id.js';

/**
 * Module-level map of pending hub response callbacks keyed by requestId.
 * Populated via onHubResponse(); resolved and cleared when hub.response arrives.
 */
const pendingHubRequests: Map<string, (response: unknown) => void> = new Map();

/**
 * Converts the bridge HTTP base URL into a WebSocket URL for the session WS endpoint.
 * e.g. http://127.0.0.1:3000 → ws://127.0.0.1:3000/api/session/<id>/ws?sessionToken=TOKEN
 */
export function buildWsUrl(): string {
  const bridgeUrl = resolveBridgeUrl();
  const wsBase = bridgeUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');

  const sessionId = resolveSessionId();
  if (!sessionId) {
    throw new Error('AUDAKO_SESSION_ID is required for WebSocket connection');
  }

  const path = `/api/session/${encodeURIComponent(sessionId)}/ws`;
  const token = resolveBridgeSessionToken();
  if (token) {
    return `${wsBase}${path}?sessionToken=${encodeURIComponent(token)}`;
  }
  return `${wsBase}${path}`;
}

type SessionInfoHandler = (sessionInfo: SessionInfoResponse) => void;

class BridgeWsClient {
  private static _instance: BridgeWsClient;

  private ws: WebSocket | null = null;
  private sessionInfoHandlers: SessionInfoHandler[] = [];
  private reconnectAttempt = 0;
  private stopped = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  public static getInstance(): BridgeWsClient {
    if (!BridgeWsClient._instance) {
      BridgeWsClient._instance = new BridgeWsClient();
    }
    return BridgeWsClient._instance;
  }

  /**
   * Initiates a WebSocket connection to the bridge.
   * Non-blocking — returns immediately; connection is async.
   * On failure, logs and schedules a reconnect (unless stopped).
   */
  public connect(): void {
    if (this.stopped) {
      return;
    }

    let url: string;
    try {
      url = buildWsUrl();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('BridgeWsClient: cannot build WS URL — check env vars', { error: message });
      return;
    }

    logger.info('BridgeWsClient: connecting', { url });

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.on('open', () => {
      this.reconnectAttempt = 0;
      logger.info('BridgeWsClient: connected');
    });

    ws.on('message', data => {
      this.handleMessage(data);
    });

    ws.on('close', code => {
      this.ws = null;

      // Non-retriable close codes: unauthorized or session not found
      if (code === 4401 || code === 4404) {
        logger.warn('BridgeWsClient: non-retriable close — stopping reconnect loop', { code });
        this.stopped = true;
        return;
      }

      if (!this.stopped) {
        this.scheduleReconnect();
      }
    });

    ws.on('error', error => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('BridgeWsClient: error', { error: message });
      // The 'close' event fires after 'error', so reconnect is handled there.
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempt += 1;
    const baseDelay = Math.min(1000 * 2 ** this.reconnectAttempt, 30_000);
    // ±20% jitter to spread reconnect storms
    const jitter = baseDelay * 0.2 * (Math.random() * 2 - 1);
    const delay = Math.round(baseDelay + jitter);

    logger.warn('BridgeWsClient: reconnecting...', {
      attempt: this.reconnectAttempt,
      delayMs: delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleMessage(data: unknown): void {
    let event: SessionEventEnvelope;
    try {
      const raw =
        typeof data === 'string'
          ? data
          : Buffer.isBuffer(data)
            ? data.toString('utf-8')
            : String(data);
      event = JSON.parse(raw) as SessionEventEnvelope;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn('BridgeWsClient: failed to parse message', { error: message });
      return;
    }

    if (!event || typeof event.type !== 'string') {
      logger.warn('BridgeWsClient: received malformed event (missing type)');
      return;
    }

    this.onMessage(event);
  }

  /**
   * Routes a parsed event envelope to the appropriate handler.
   */
  private onMessage(event: SessionEventEnvelope): void {
    switch (event.type) {
      case 'session.snapshot': {
        const payload = event.payload as { sessionInfo?: SessionInfoResponse } | undefined;
        if (payload?.sessionInfo) {
          for (const handler of this.sessionInfoHandlers) {
            handler(payload.sessionInfo);
          }
        }
        break;
      }

      case 'session.info.updated': {
        const sessionInfo = event.payload as SessionInfoResponse;
        for (const handler of this.sessionInfoHandlers) {
          handler(sessionInfo);
        }
        break;
      }

      case 'hub.response': {
        const payload = event.payload as
          | { requestId: string; response: unknown; respondedAt: string }
          | undefined;
        if (payload?.requestId) {
          const resolve = pendingHubRequests.get(payload.requestId);
          if (resolve) {
            pendingHubRequests.delete(payload.requestId);
            resolve(payload.response);
          }
        }
        break;
      }

      case 'session.closed': {
        const payload = event.payload as { reason?: string } | undefined;
        logger.info('BridgeWsClient: session closed by bridge', { reason: payload?.reason });
        this.stopped = true;
        break;
      }

      default:
        // Unknown/unhandled event types are silently ignored
        break;
    }
  }

  /**
   * Registers a handler that is called whenever session info arrives
   * (both from session.snapshot and session.info.updated events).
   */
  public onSessionInfo(handler: SessionInfoHandler): void {
    this.sessionInfoHandlers.push(handler);
  }

  /**
   * Registers a one-time callback to be resolved when a hub.response event
   * with the given requestId arrives.
   */
  public onHubResponse(requestId: string, resolve: (response: unknown) => void): void {
    pendingHubRequests.set(requestId, resolve);
  }
}

/** Singleton instance of BridgeWsClient. */
export const bridgeWsClient = BridgeWsClient.getInstance();

/** Returns the singleton BridgeWsClient instance. */
export function getBridgeWsClient(): BridgeWsClient {
  return BridgeWsClient.getInstance();
}
