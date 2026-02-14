import https from "https";
import axios from "axios";
import {
  BaseHttpService,
  HttpConfig,
  TenantHttpService,
  EntityHttpService,
  DataSourceHttpService,
  TenantView,
} from "audako-core";
import { logger } from "./logger.js";

// Configure axios to ignore self-signed certificates
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

class AudakoServices {
  private static instance: AudakoServices;

  private _httpConfig: HttpConfig | undefined;
  private _accessToken: string | undefined;
  private _selectedTenant: TenantView | undefined;

  // Service singletons
  private _tenantService: TenantHttpService | undefined;
  private _entityService: EntityHttpService | undefined;
  private _dataSourceService: DataSourceHttpService | undefined;

  private constructor() {}

  public static getInstance(): AudakoServices {
    if (!AudakoServices.instance) {
      AudakoServices.instance = new AudakoServices();
    }
    return AudakoServices.instance;
  }

  public async initialize(): Promise<void> {
    await logger.debug("AudakoServices: initializing");

    const systemUrl = process.env.AUDAKO_SYSTEM_URL;
    const token = process.env.AUDAKO_TOKEN;

    if (!systemUrl) {
      await logger.error("AudakoServices: AUDAKO_SYSTEM_URL not configured");
      throw new Error("AUDAKO_SYSTEM_URL environment variable is required");
    }

    if (!token) {
      await logger.error("AudakoServices: AUDAKO_TOKEN not configured");
      throw new Error("AUDAKO_TOKEN environment variable is required");
    }

    await logger.debug("AudakoServices: requesting HTTP config", { systemUrl });

    try {
      this._httpConfig = await BaseHttpService.requestHttpConfig(systemUrl);
      this._accessToken = token;

      await logger.debug("AudakoServices: HTTP config received");

      // Initialize service singletons
      this._tenantService = new TenantHttpService(this._httpConfig, this._accessToken);
      this._entityService = new EntityHttpService(this._httpConfig, this._accessToken);
      this._dataSourceService = new DataSourceHttpService(this._httpConfig, this._accessToken);

      await logger.info("AudakoServices: all services initialized successfully");
    } catch (error) {
      await logger.error("AudakoServices: initialization failed", {
        systemUrl,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public get httpConfig(): HttpConfig {
    if (!this._httpConfig) {
      throw new Error("Services not initialized. Call initialize() first.");
    }
    return this._httpConfig;
  }

  public get accessToken(): string {
    if (!this._accessToken) {
      throw new Error("Services not initialized. Call initialize() first.");
    }
    return this._accessToken;
  }

  public get selectedTenant(): TenantView | undefined {
    return this._selectedTenant;
  }

  public set selectedTenant(tenant: TenantView | undefined) {
    this._selectedTenant = tenant;
    if (tenant) {
      logger.info("AudakoServices: tenant selected", {
        tenantId: tenant.Id,
        tenantName: tenant.Name,
      });
    } else {
      logger.debug("AudakoServices: tenant deselected");
    }
  }

  public get selectedTenantId(): string | undefined {
    return this._selectedTenant?.Id;
  }

  public get tenantService(): TenantHttpService {
    if (!this._tenantService) {
      throw new Error("Services not initialized. Call initialize() first.");
    }
    return this._tenantService;
  }

  public get entityService(): EntityHttpService {
    if (!this._entityService) {
      throw new Error("Services not initialized. Call initialize() first.");
    }
    return this._entityService;
  }

  public get dataSourceService(): DataSourceHttpService {
    if (!this._dataSourceService) {
      throw new Error("Services not initialized. Call initialize() first.");
    }
    return this._dataSourceService;
  }
}

// Export singleton instance
export const audakoServices = AudakoServices.getInstance();

// Convenience exports for backwards compatibility
export async function initializeServices(): Promise<void> {
  return audakoServices.initialize();
}

export function getSelectedTenantId(): string | undefined {
  return audakoServices.selectedTenantId;
}

export function getSelectedTenant(): TenantView | undefined {
  return audakoServices.selectedTenant;
}

export function setSelectedTenant(tenant: TenantView): void {
  audakoServices.selectedTenant = tenant;
}

export function createTenantHttpService(): TenantHttpService {
  return audakoServices.tenantService;
}
