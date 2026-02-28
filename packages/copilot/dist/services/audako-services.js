import { BaseHttpService, DataSourceHttpService, EntityHttpService, TenantHttpService, } from 'audako-core';
import axios from 'axios';
import https from 'https';
// Configure axios to ignore self-signed certificates
axios.defaults.httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});
/**
 * Factory function to create fresh Audako service instances.
 * Each call returns a new set of service instances with no shared state.
 *
 * @param systemUrl - The Audako SCADA backend URL
 * @param accessToken - The access token for authentication
 * @returns Object containing all initialized service instances
 */
export async function createAudakoServices(systemUrl, accessToken) {
    if (!systemUrl) {
        throw new Error('systemUrl parameter is required');
    }
    if (!accessToken) {
        throw new Error('accessToken parameter is required');
    }
    const httpConfig = await BaseHttpService.requestHttpConfig(systemUrl);
    return {
        httpConfig,
        accessToken,
        tenantService: new TenantHttpService(httpConfig, accessToken),
        entityService: new EntityHttpService(httpConfig, accessToken),
        dataSourceService: new DataSourceHttpService(httpConfig, accessToken),
    };
}
//# sourceMappingURL=audako-services.js.map