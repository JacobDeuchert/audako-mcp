import type { SessionInfoFields, SessionInfoResponse } from '@audako/contracts';

export function sanitizeSessionInfoUpdate(body: SessionInfoFields): SessionInfoFields {
  return {
    tenantId: body.tenantId?.trim() || undefined,
    groupId: body.groupId?.trim() || undefined,
    entityType: body.entityType?.trim() || undefined,
    app: body.app?.trim() || undefined,
  };
}

export function toSessionInfoResponse(
  sessionId: string,
  sessionInfo: SessionInfoFields,
): SessionInfoResponse {
  return {
    sessionId,
    tenantId: sessionInfo.tenantId,
    groupId: sessionInfo.groupId,
    entityType: sessionInfo.entityType,
    app: sessionInfo.app,
    updatedAt: new Date().toISOString(),
  };
}
