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

export class SessionContext {
  private tenantId?: string;
  private groupId?: string;
  private entityType?: string;
  private app?: string;
  private scadaUrl: string;
  private accessToken: string;

  constructor(fields: SessionContextFields) {
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
  public update(fields: Partial<SessionContextFields>): void {
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

  public getTenantId(): string | undefined {
    return this.tenantId;
  }

  public getGroupId(): string | undefined {
    return this.groupId;
  }

  public getEntityType(): string | undefined {
    return this.entityType;
  }

  public getApp(): string | undefined {
    return this.app;
  }

  public getScadaUrl(): string {
    return this.scadaUrl;
  }

  public getAccessToken(): string {
    return this.accessToken;
  }

  /**
   * Returns a snapshot of all current context fields.
   */
  public getSnapshot(): SessionContextFields {
    return {
      tenantId: this.tenantId,
      groupId: this.groupId,
      entityType: this.entityType,
      app: this.app,
      scadaUrl: this.scadaUrl,
      accessToken: this.accessToken,
    };
  }
}
