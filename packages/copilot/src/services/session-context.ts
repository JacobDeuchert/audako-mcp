import { EntityNameService, EntityType, type Group } from 'audako-core';
import type { AudakoServices } from './audako-services.js';
import { normalizePathIds } from './path-utils.js';

const PATH_SEPARATOR = ' / ';

export interface SessionDynamicFields {
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
}

export interface SessionContextSnapshot {
  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;
  resolvedTenant?: ResolvedTenant;
  resolvedGroup?: ResolvedGroup;
}

export interface ResolvedTenant {
  tenantId: string;
  tenantName: string;
  tenantRootGroupId?: string;
}

export interface ResolvedGroup {
  groupId: string;
  groupPath: string[];
  groupPathName: string;
}

interface SessionContextFields extends SessionDynamicFields {
  sessionId: string;
  scadaUrl: string;
  accessToken: string;
}

export class SessionContext {
  readonly sessionId: string;
  readonly scadaUrl: string;
  readonly accessToken: string;

  tenantId?: string;
  groupId?: string;
  entityType?: string;
  app?: string;

  resolvedTenant?: ResolvedTenant;
  resolvedGroup?: ResolvedGroup;

  private _promptSnapshot?: SessionContextSnapshot;
  private services?: AudakoServices;

  constructor(fields: SessionContextFields) {
    this.sessionId = fields.sessionId;
    this.scadaUrl = fields.scadaUrl;
    this.accessToken = fields.accessToken;
    this.tenantId = fields.tenantId;
    this.groupId = fields.groupId;
    this.entityType = fields.entityType;
    this.app = fields.app;
  }

  bindServices(services: AudakoServices): void {
    this.services = services;
  }

  /**
   * Freeze the current dynamic fields into a snapshot.
   * Call this before each agent prompt so tools see a consistent view
   * throughout the entire tool-call chain.
   */
  takePromptSnapshot(): void {
    this._promptSnapshot = {
      tenantId: this.tenantId,
      groupId: this.groupId,
      entityType: this.entityType,
      app: this.app,
      resolvedTenant: this.resolvedTenant,
      resolvedGroup: this.resolvedGroup,
    };
  }

  get promptSnapshot(): SessionContextSnapshot {
    return this._promptSnapshot ?? {
      tenantId: this.tenantId,
      groupId: this.groupId,
      entityType: this.entityType,
      app: this.app,
      resolvedTenant: this.resolvedTenant,
      resolvedGroup: this.resolvedGroup,
    };
  }

  async update(fields: SessionDynamicFields): Promise<void> {
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

  private async resolveTenant(): Promise<void> {
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
    } catch {
      this.resolvedTenant = undefined;
    }
  }

  private async resolveGroup(): Promise<void> {
    if (!this.groupId || !this.services) {
      this.resolvedGroup = undefined;
      return;
    }

    try {
      const group = await this.services.entityService.getPartialEntityById<Group>(
        EntityType.Group,
        this.groupId,
        { Path: 1 },
      );
      const pathIds = normalizePathIds(group?.Path, this.groupId);
      const entityNameService = new EntityNameService(this.services.entityService);
      const pathName = await entityNameService.resolvePathName(pathIds, PATH_SEPARATOR);

      this.resolvedGroup = {
        groupId: this.groupId,
        groupPath: pathIds,
        groupPathName: pathName,
      };
    } catch {
      this.resolvedGroup = undefined;
    }
  }
}
