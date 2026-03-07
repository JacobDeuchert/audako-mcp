/**
 * In-process mutable session context manager for copilot.
 *
 * Unlike MCP server (which fetches context via HTTP from bridge),
 * copilot holds context in-memory and updates it directly when UI pushes location changes.
 *
 * When tenantId or groupId change, the context automatically resolves
 * additional metadata (tenant name, group path) from Audako services.
 */
import { EntityNameService, EntityType } from 'audako-core';
const PATH_SEPARATOR = ' / ';
function normalizePathIds(pathValue, groupId) {
    const pathIds = Array.isArray(pathValue)
        ? pathValue.filter((id) => typeof id === 'string' && id.trim().length > 0)
        : [];
    if (pathIds[pathIds.length - 1] !== groupId) {
        pathIds.push(groupId);
    }
    return pathIds;
}
export class SessionContext {
    /** Static — set once at session creation, never change. */
    sessionId;
    scadaUrl;
    accessToken;
    /** Dynamic — updated via `update()` as the user navigates. */
    tenantId;
    groupId;
    entityType;
    app;
    /** Resolved metadata — automatically populated on update(). */
    resolvedTenant;
    resolvedGroup;
    /** Audako services reference — set via bindServices(). */
    services;
    constructor(fields) {
        this.sessionId = fields.sessionId;
        this.scadaUrl = fields.scadaUrl;
        this.accessToken = fields.accessToken;
        this.tenantId = fields.tenantId;
        this.groupId = fields.groupId;
        this.entityType = fields.entityType;
        this.app = fields.app;
    }
    /**
     * Bind Audako services so update() can resolve tenant/group metadata.
     * Must be called once after construction before the first update().
     */
    bindServices(services) {
        this.services = services;
    }
    /**
     * Updates dynamic context fields.
     * Only provided fields are updated; others remain unchanged.
     *
     * When tenantId changes, resolves tenant view (name, root group).
     * When groupId changes, resolves group path (IDs and human-readable name).
     * Resolution failures clear the resolved data silently.
     */
    async update(fields) {
        const tenantChanged = 'tenantId' in fields && fields.tenantId !== this.tenantId;
        const groupChanged = 'groupId' in fields && fields.groupId !== this.groupId;
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
        if (tenantChanged) {
            await this.resolveTenant();
        }
        if (groupChanged) {
            await this.resolveGroup();
        }
    }
    async resolveTenant() {
        if (!this.tenantId || !this.services) {
            this.resolvedTenant = undefined;
            return;
        }
        try {
            const tenant = await this.services.tenantService.getTenantViewById(this.tenantId);
            this.resolvedTenant = {
                tenantId: this.tenantId,
                tenantName: tenant.Name,
                tenantRootGroupId: tenant.Root,
            };
        }
        catch {
            this.resolvedTenant = undefined;
        }
    }
    async resolveGroup() {
        if (!this.groupId || !this.services) {
            this.resolvedGroup = undefined;
            return;
        }
        try {
            const group = await this.services.entityService.getPartialEntityById(EntityType.Group, this.groupId, { Path: 1 });
            const pathIds = normalizePathIds(group?.Path, this.groupId);
            const entityNameService = new EntityNameService(this.services.entityService);
            const pathName = await entityNameService.resolvePathName(pathIds, PATH_SEPARATOR);
            this.resolvedGroup = {
                groupId: this.groupId,
                groupPath: pathIds,
                groupPathName: pathName,
            };
        }
        catch {
            this.resolvedGroup = undefined;
        }
    }
}
//# sourceMappingURL=session-context.js.map