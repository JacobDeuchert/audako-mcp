export function sanitizeSessionInfoUpdate(body) {
    return {
        tenantId: body.tenantId?.trim() || undefined,
        groupId: body.groupId?.trim() || undefined,
        entityType: body.entityType?.trim() || undefined,
        app: body.app?.trim() || undefined,
    };
}
export function toSessionInfoResponse(sessionId, sessionInfo) {
    return {
        sessionId,
        tenantId: sessionInfo.tenantId,
        groupId: sessionInfo.groupId,
        entityType: sessionInfo.entityType,
        app: sessionInfo.app,
        updatedAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=session-info-utils.js.map