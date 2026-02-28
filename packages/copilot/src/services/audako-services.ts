import {
  BaseHttpService,
  DataSourceHttpService,
  EntityHttpService,
  type HttpConfig,
  TenantHttpService,
} from 'audako-core';
import axios from 'axios';
import https from 'https';

// Configure axios to ignore self-signed certificates
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export interface AudakoServices {
  httpConfig: HttpConfig;
  accessToken: string;
  tenantService: TenantHttpService;
  entityService: EntityHttpService;
  entityData: DataSourceHttpService;
  group: {
    moveEntity(
      entityType: string,
      entityId: string,
      targetGroupId: string,
    ): Promise<{ fromGroupId?: string; toGroupId?: string }>;
  };
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
export async function createAudakoServices(
  systemUrl: string,
  accessToken: string,
): Promise<AudakoServices> {
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
    group: {
      async moveEntity(entityType: string, entityId: string, targetGroupId: string) {
        // TODO: EntityHttpService doesn't expose moveEntity yet
        // const response = await entityService.moveEntity(entityType, entityId, targetGroupId);
        throw new Error('moveEntity not yet implemented');
      },
    },
    dataSourceService,
  };
}
