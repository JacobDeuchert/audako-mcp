import {
  BaseHttpService,
  DataSourceHttpService,
  EntityHttpService,
  type HttpConfig,
  TenantHttpService,
  type TenantView,
} from 'audako-core';
import axios from 'axios';
import https from 'https';
import { toErrorLogDetails } from './error-details.js';
import { logger } from './logger.js';

// Configure axios to ignore self-signed certificates
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

let httpDiagnosticsEnabled = false;

function enableHttpErrorDiagnostics(): void {
  if (httpDiagnosticsEnabled) {
    return;
  }

  httpDiagnosticsEnabled = true;

  axios.interceptors.response.use(
    response => response,
    async (error: unknown) => {
      await logger.error('Audako HTTP request failed', toErrorLogDetails(error));
      return Promise.reject(error);
    },
  );
}

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
    await logger.debug('AudakoServices: initializing');

    enableHttpErrorDiagnostics();

    const systemUrl = process.env.AUDAKO_SYSTEM_URL;
    const token = process.env.AUDAKO_TOKEN;

    if (!systemUrl) {
      await logger.error('AudakoServices: AUDAKO_SYSTEM_URL not configured');
      throw new Error('AUDAKO_SYSTEM_URL environment variable is required');
    }

    if (!token) {
      await logger.error('AudakoServices: AUDAKO_TOKEN not configured');
      throw new Error('AUDAKO_TOKEN environment variable is required');
    }

    await logger.debug('AudakoServices: requesting HTTP config', { systemUrl });

    try {
      this._httpConfig = await BaseHttpService.requestHttpConfig(systemUrl);
      this._accessToken = token;

      await logger.debug('AudakoServices: HTTP config received');

      // Initialize service singletons
      this._tenantService = new TenantHttpService(this._httpConfig, this._accessToken);
      this._entityService = new EntityHttpService(this._httpConfig, this._accessToken);
      this._dataSourceService = new DataSourceHttpService(this._httpConfig, this._accessToken);

      await logger.info('AudakoServices: all services initialized successfully');
    } catch (error) {
      await logger.error('AudakoServices: initialization failed', {
        systemUrl,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  public get httpConfig(): HttpConfig {
    if (!this._httpConfig) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this._httpConfig;
  }

  public get accessToken(): string {
    if (!this._accessToken) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this._accessToken;
  }

  public get tenantService(): TenantHttpService {
    if (!this._tenantService) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this._tenantService;
  }

  public get entityService(): EntityHttpService {
    if (!this._entityService) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this._entityService;
  }

  public get dataSourceService(): DataSourceHttpService {
    if (!this._dataSourceService) {
      throw new Error('Services not initialized. Call initialize() first.');
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
