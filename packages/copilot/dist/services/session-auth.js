import { createHash, randomBytes, timingSafeEqual } from 'crypto';
/**
 * Session token generation and validation service.
 * Generates cryptographically random session tokens and validates them using timing-safe comparison.
 */
/**
 * Hashes a token for storage using SHA-256.
 */
function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}
/**
 * Generates a high-entropy opaque session token (64 hex characters).
 */
export function generateSessionToken() {
    return randomBytes(32).toString('hex');
}
/**
 * Verifies a session token against its stored hash.
 * Uses constant-time comparison on the hash to mitigate timing attacks.
 */
export function verifySessionToken(token, storedHash) {
    if (!token || !storedHash) {
        return false;
    }
    const candidateHash = Buffer.from(hashToken(token), 'hex');
    const storedHashBuffer = Buffer.from(storedHash, 'hex');
    if (candidateHash.length !== storedHashBuffer.length) {
        return false;
    }
    return timingSafeEqual(candidateHash, storedHashBuffer);
}
/**
 * Hashes a session token for storage.
 * Returns the SHA-256 hex digest of the token.
 */
export function hashSessionToken(token) {
    return hashToken(token);
}
/**
 * Extracts a Bearer token from the Authorization header.
 * Returns `undefined` when missing or malformed.
 */
export function extractBearerToken(request) {
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
export function extractQueryToken(request) {
    const query = request.query;
    const token = typeof query?.sessionToken === 'string' ? query.sessionToken.trim() : undefined;
    return token && token.length > 0 ? token : undefined;
}
/**
 * Validates a bridge session token against a stored hash.
 * Sends a 401 response and returns `false` when validation fails.
 */
export function requireSessionAuth(request, reply, storedTokenHash) {
    const token = extractBearerToken(request);
    if (!token) {
        reply.status(401).send({
            error: 'Unauthorized',
            message: 'Missing or invalid Authorization header',
        });
        return false;
    }
    if (!verifySessionToken(token, storedTokenHash)) {
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
export function verifyWebSocketAuth(request, storedTokenHash) {
    const token = extractQueryToken(request);
    if (!token) {
        return false;
    }
    return verifySessionToken(token, storedTokenHash);
}
//# sourceMappingURL=session-auth.js.map