import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ServerRegistry } from './server-registry.js';

/**
 * Extracts a Bearer token from the Authorization header.
 * Returns `undefined` when missing or malformed.
 */
export function extractBearerToken(request: FastifyRequest): string | undefined {
  const header = request.headers.authorization;
  if (!header) {
    return undefined;
  }

  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith('Bearer ')) {
    return undefined;
  }

  const token = value.slice(7).trim();
  return token.length > 0 ? token : undefined;
}

/**
 * Extracts a session token from the `sessionToken` query parameter.
 * Used for WebSocket endpoints where browsers cannot send custom headers.
 */
export function extractQueryToken(request: FastifyRequest): string | undefined {
  const query = request.query as Record<string, unknown>;
  const token = typeof query?.sessionToken === 'string' ? query.sessionToken.trim() : undefined;
  return token && token.length > 0 ? token : undefined;
}

/**
 * Validates a bridge session token against a session ID.
 * Sends a 401 response and returns `false` when validation fails.
 */
export function requireSessionAuth(
  request: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply,
  registry: ServerRegistry,
): boolean {
  const { sessionId } = request.params;
  const token = extractBearerToken(request);

  if (!token) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
    return false;
  }

  if (!registry.verifySessionToken(sessionId, token)) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid session token',
    });
    return false;
  }

  return true;
}

/**
 * Validates a bridge session token provided via query parameter (WebSocket).
 * Returns `true` when the token is valid for the given session.
 */
export function verifyWebSocketAuth(
  request: FastifyRequest<{ Params: { sessionId: string } }>,
  registry: ServerRegistry,
): boolean {
  const { sessionId } = request.params;
  const token = extractQueryToken(request);

  if (!token) {
    return false;
  }

  return registry.verifySessionToken(sessionId, token);
}
