import { EntityNameService, EntityType } from 'audako-core';
import { normalizePathIds } from './path-utils.js';
const PATH_SEPARATOR = ' / ';
export class SessionContext {
    sessionId;
    scadaUrl;
    accessToken;
    tenantId;
    groupId;
    entityType;
    app;
    resolvedTenant;
    resolvedGroup;
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
    bindServices(services) {
        this.services = services;
    }
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