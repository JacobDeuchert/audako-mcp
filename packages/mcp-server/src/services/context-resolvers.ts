import { type DataSource, EntityType, type Group, type TenantView } from 'audako-core';
import { audakoServices } from './audako-services.js';
import { fetchSessionInfo } from './session-info.js';

function normalizeGroupPath(pathValue: unknown, groupId: string): string[] {
  const normalizedPath = Array.isArray(pathValue)
    ? pathValue
        .filter((pathId): pathId is string => typeof pathId === 'string')
        .map(pathId => pathId.trim())
        .filter(pathId => pathId.length > 0)
    : [];

  if (normalizedPath[normalizedPath.length - 1] !== groupId) {
    normalizedPath.push(groupId);
  }

  return normalizedPath;
}

function resolveDataSourceName(dataSource: Partial<DataSource>): string {
  const rawName = dataSource.Name;

  if (rawName && typeof rawName === 'object' && 'Value' in rawName) {
    const value = (rawName as { Value?: unknown }).Value;
    if (typeof value === 'string') {
      const normalizedValue = value.trim();
      return normalizedValue.length > 0 ? normalizedValue : 'unknown';
    }
  }

  return 'unknown';
}

export async function resolveTenantFromSessionInfo(): Promise<TenantView> {
  const sessionInfo = await fetchSessionInfo();
  const tenantId = sessionInfo.tenantId?.trim();

  if (!tenantId) {
    throw new Error('No tenantId found in session info.');
  }

  const tenant = await audakoServices.tenantService.getTenantViewById(tenantId);
  if (!tenant.Root) {
    throw new Error(`Tenant '${tenantId}' has no root group.`);
  }

  return tenant;
}

export async function resolveDataSourceFromContext(): Promise<Partial<DataSource>> {
  const sessionInfo = await fetchSessionInfo();
  const groupId = sessionInfo.groupId?.trim();

  if (!groupId) {
    throw new Error('No groupId found in session info.');
  }

  const group = await audakoServices.entityService.getPartialEntityById<Group>(
    EntityType.Group,
    groupId,
    {
      Path: 1,
    },
  );

  const pathGroupIds = normalizeGroupPath(group.Path, groupId);
  const dataSourcesById = new Map<string, Partial<DataSource>>();

  for (const pathGroupId of pathGroupIds) {
    const queryResult = await audakoServices.entityService.queryConfiguration<DataSource>(
      EntityType.DataSource,
      {
        GroupId: pathGroupId,
      },
    );

    for (const dataSource of queryResult.data) {
      const dataSourceId = typeof dataSource.Id === 'string' ? dataSource.Id.trim() : '';
      if (!dataSourceId || dataSourcesById.has(dataSourceId)) {
        continue;
      }

      dataSourcesById.set(dataSourceId, dataSource);
    }
  }

  const resolvedDataSourceEntries = Array.from(dataSourcesById.entries());
  const resolvedDataSources = resolvedDataSourceEntries.map(([, dataSource]) => dataSource);

  if (resolvedDataSources.length === 1) {
    return resolvedDataSources[0];
  }

  if (resolvedDataSources.length === 0) {
    throw new Error(`No data source found for group path: ${pathGroupIds.join(' -> ')}`);
  }

  const dataSourceSummary = resolvedDataSourceEntries
    .map(([dataSourceId, dataSource]) => `${resolveDataSourceName(dataSource)} (${dataSourceId})`)
    .join(', ');

  throw new Error(`Ambiguous data sources: ${dataSourceSummary}`);
}
