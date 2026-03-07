import type { SessionEventEnvelope } from '@audako/contracts';

export function buildSessionEvent<T>(
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
