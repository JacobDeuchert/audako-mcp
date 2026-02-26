import type { SessionInfoResponse } from '@audako/contracts';
import { isSessionInfoResponse } from '@audako/contracts';
import {
  bridgeRequest,
  getSessionId,
  getSessionInfoEndpoint,
  validateBridgeResponse,
} from './bridge-client.js';

/**
 * Fetches session info from the backend bridge.
 * @param timeoutMs Request timeout in milliseconds (default: 5000)
 * @returns Session info response
 * @throws Error if the session ID is missing or the request fails
 */
export async function fetchSessionInfo(timeoutMs: number = 5000): Promise<SessionInfoResponse> {
  const sessionId = getSessionId();
  const endpoint = getSessionInfoEndpoint(sessionId);

  const result = await bridgeRequest(endpoint, {
    method: 'GET',
    timeoutMs,
  });

  return validateBridgeResponse(result, isSessionInfoResponse, 'SessionInfoResponse');
}

export { getSessionInfoEndpoint };
