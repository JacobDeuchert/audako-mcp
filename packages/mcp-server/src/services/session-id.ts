/**
 * Centralized session ID resolution with built-in validation.
 * All code needing AUDAKO_SESSION_ID should use these functions
 * instead of reading process.env directly.
 */

const SESSION_ID_ENV_VAR = 'AUDAKO_SESSION_ID';

/**
 * Resolves the session ID from environment variables.
 * Returns undefined if the session ID is missing or empty.
 * Use this when session ID is optional.
 */
export function resolveSessionId(): string | undefined {
  const sessionId = process.env[SESSION_ID_ENV_VAR]?.trim();
  return sessionId && sessionId.length > 0 ? sessionId : undefined;
}

/**
 * Gets the session ID from environment variables.
 * Throws an error if the session ID is missing or empty.
 * Use this when session ID is required.
 */
export function getSessionId(): string {
  const sessionId = resolveSessionId();
  if (!sessionId) {
    throw new Error(`Missing ${SESSION_ID_ENV_VAR} in MCP environment.`);
  }
  return sessionId;
}

/**
 * Validates that the session ID exists in the environment.
 * Throws an error if it's missing. Useful for startup validation.
 */
export function validateSessionIdExists(): void {
  getSessionId();
}
