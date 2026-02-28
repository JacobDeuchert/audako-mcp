import { DataSourceHttpService, EntityHttpService, type HttpConfig, TenantHttpService } from 'audako-core';
export interface AudakoServices {
    httpConfig: HttpConfig;
    accessToken: string;
    tenantService: TenantHttpService;
    entityService: EntityHttpService;
    dataSourceService: DataSourceHttpService;
}
/**
 * Factory function to create fresh Audako service instances.
 * Each call returns a new set of service instances with no shared state.
 *
 * @param systemUrl - The Audako SCADA backend URL
 * @param accessToken - The access token for authentication
 * @returns Object containing all initialized service instances
 */
export declare function createAudakoServices(systemUrl: string, accessToken: string): Promise<AudakoServices>;
//# sourceMappingURL=audako-services.d.ts.map