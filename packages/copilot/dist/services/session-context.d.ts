/**
 * In-process mutable session context manager for copilot.
 *
 * Unlike MCP server (which fetches context via HTTP from bridge),
 * copilot holds context in-memory and updates it directly when UI pushes location changes.
 */
export interface SessionContextFields {
    tenantId?: string;
    groupId?: string;
    entityType?: string;
    app?: string;
    scadaUrl: string;
    accessToken: string;
}
export declare class SessionContext {
    private tenantId?;
    private groupId?;
    private entityType?;
    private app?;
    private scadaUrl;
    private accessToken;
    constructor(fields: SessionContextFields);
    /**
     * Updates one or more context fields.
     * Only provided fields are updated; others remain unchanged.
     */
    update(fields: Partial<SessionContextFields>): void;
    getTenantId(): string | undefined;
    getGroupId(): string | undefined;
    getEntityType(): string | undefined;
    getApp(): string | undefined;
    getScadaUrl(): string;
    getAccessToken(): string;
    /**
     * Returns a snapshot of all current context fields.
     */
    getSnapshot(): SessionContextFields;
}
//# sourceMappingURL=session-context.d.ts.map