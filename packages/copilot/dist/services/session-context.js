/**
 * In-process mutable session context manager for copilot.
 *
 * Unlike MCP server (which fetches context via HTTP from bridge),
 * copilot holds context in-memory and updates it directly when UI pushes location changes.
 */
export class SessionContext {
    sessionId;
    tenantId;
    groupId;
    entityType;
    app;
    scadaUrl;
    accessToken;
    constructor(fields) {
        this.sessionId = fields.sessionId;
        this.tenantId = fields.tenantId;
        this.groupId = fields.groupId;
        this.entityType = fields.entityType;
        this.app = fields.app;
        this.scadaUrl = fields.scadaUrl;
        this.accessToken = fields.accessToken;
    }
    /**
     * Updates one or more context fields.
     * Only provided fields are updated; others remain unchanged.
     */
    update(fields) {
        if ('tenantId' in fields) {
            this.tenantId = fields.tenantId;
        }
        if ('groupId' in fields) {
            this.groupId = fields.groupId;
        }
        if ('entityType' in fields) {
            this.entityType = fields.entityType;
        }
        if ('app' in fields) {
            this.app = fields.app;
        }
        if (typeof fields.scadaUrl === 'string') {
            this.scadaUrl = fields.scadaUrl;
        }
        if (typeof fields.accessToken === 'string') {
            this.accessToken = fields.accessToken;
        }
    }
    getSessionId() {
        return this.sessionId;
    }
    getTenantId() {
        return this.tenantId;
    }
    getGroupId() {
        return this.groupId;
    }
    getEntityType() {
        return this.entityType;
    }
    getApp() {
        return this.app;
    }
    getScadaUrl() {
        return this.scadaUrl;
    }
    getAccessToken() {
        return this.accessToken;
    }
    /**
     * Returns a snapshot of all current context fields.
     */
    getSnapshot() {
        return {
            sessionId: this.sessionId,
            tenantId: this.tenantId,
            groupId: this.groupId,
            entityType: this.entityType,
            app: this.app,
            scadaUrl: this.scadaUrl,
            accessToken: this.accessToken,
        };
    }
}
//# sourceMappingURL=session-context.js.map