import https from 'node:https';
import { BaseHttpService, DataSourceHttpService, EntityHttpService, TenantHttpService, } from 'audako-core';
import axios from 'axios';
const allowSelfSignedHttpsAgent = new https.Agent({
    rejectUnauthorized: false,
});
axios.defaults.httpsAgent = allowSelfSignedHttpsAgent;
export async function createAudakoServices(systemUrl, accessToken) {
    if (!systemUrl) {
        throw new Error('systemUrl parameter is required');
    }
    if (!accessToken) {
        throw new Error('accessToken parameter is required');
    }
    const httpConfig = await BaseHttpService.requestHttpConfig(systemUrl);
    const dataSourceService = new DataSourceHttpService(httpConfig, accessToken);
    const entityService = new EntityHttpService(httpConfig, accessToken);
    return {
        httpConfig,
        accessToken,
        tenantService: new TenantHttpService(httpConfig, accessToken),
        entityService,
        entityData: dataSourceService,
        dataSourceService,
    };
}
//# sourceMappingURL=audako-services.js.map