import type { FastifyReply, FastifyRequest } from 'fastify';
/**
 * Generates a high-entropy opaque session token (64 hex characters).
 */
export declare function generateSessionToken(): string;
/**
 * Verifies a session token against its stored hash.
 * Uses constant-time comparison on the hash to mitigate timing attacks.
 */
export declare function verifySessionToken(token: string, storedHash: string): boolean;
/**
 * Hashes a session token for storage.
 * Returns the SHA-256 hex digest of the token.
 */
export declare function hashSessionToken(token: string): string;
/**
 * Extracts a Bearer token from the Authorization header.
 * Returns `undefined` when missing or malformed.
 */
export declare function extractBearerToken(request: FastifyRequest): string | undefined;
/**
 * Extracts a session token from the `sessionToken` query parameter.
 * Used for WebSocket endpoints where browsers cannot send custom headers.
 */
export declare function extractQueryToken(request: FastifyRequest): string | undefined;
/**
 * Validates a bridge session token against a stored hash.
 * Sends a 401 response and returns `false` when validation fails.
 */
export declare function requireSessionAuth(request: FastifyRequest, reply: FastifyReply, storedTokenHash: string): boolean;
/**
 * Validates a bridge session token provided via query parameter (WebSocket).
 * Returns `true` when the token is valid for the given session.
 */
export declare function verifyWebSocketAuth(request: FastifyRequest, storedTokenHash: string): boolean;
//# sourceMappingURL=session-auth.d.ts.map