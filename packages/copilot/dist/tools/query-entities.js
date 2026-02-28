import { getSupportedEntityTypeNames, resolveEntityTypeContract, } from '../entity-type-definitions/index.js';
import { isRecord, toErrorResponse, toTextResponse } from './helpers.js';
import { queryEntitiesSchema } from './schemas.js';
function hasNonEmptyScopeId(scopeId) {
    return typeof scopeId === 'string' && scopeId.trim().length > 0;
}
function isValidFilter(filter) {
    return isRecord(filter) && !Array.isArray(filter);
}
export function createQueryEntitiesTool(sessionContext, audakoServices) {
    return {
        name: 'audako_mcp_query_entities',
        label: 'Query Entities',
        description: 'Query entities by scope with a Mongo-style filter object. Supports $and, $or, $not, and $nor operators.',
        parameters: queryEntitiesSchema,
        execute: async (_toolCallId, { scope, scopeId, entityType, filter }) => {
            const contract = resolveEntityTypeContract(entityType);
            if (!contract) {
                const supportedTypes = getSupportedEntityTypeNames();
                return toErrorResponse(`Unsupported entity type '${entityType}'.`, {
                    supportedTypes,
                });
            }
            if (!isValidFilter(filter)) {
                return toErrorResponse("'filter' must be a JSON object.");
            }
            let resolvedScopeId;
            if (scope !== 'global') {
                if (hasNonEmptyScopeId(scopeId)) {
                    resolvedScopeId = scopeId.trim();
                }
                else {
                    resolvedScopeId =
                        scope === 'tenant' ? sessionContext.getTenantId() : sessionContext.getGroupId();
                }
                if (!resolvedScopeId) {
                    return toErrorResponse(`No '${scope}' scope ID provided and none found in session info.`);
                }
            }
            let scopedFilter = filter;
            const scopePayload = {
                scope,
            };
            if (scope === 'group') {
                scopePayload.groupId = resolvedScopeId;
                scopedFilter = {
                    $and: [{ GroupId: resolvedScopeId }, filter],
                };
            }
            if (scope === 'tenant') {
                try {
                    const tenant = await audakoServices.tenantService.getTenantViewById(resolvedScopeId);
                    if (!tenant.Root) {
                        return toErrorResponse(`Tenant '${resolvedScopeId}' has no root group and cannot be queried.`);
                    }
                    scopePayload.tenantId = tenant.Id;
                    scopePayload.tenantRootGroupId = tenant.Root;
                    scopedFilter = {
                        $and: [{ Path: tenant.Root }, filter],
                    };
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    return toErrorResponse(`Failed to resolve tenant '${resolvedScopeId}': ${errorMessage}`);
                }
            }
            try {
                const queryResult = await audakoServices.entityService.queryConfiguration(contract.entityType, scopedFilter);
                const entities = queryResult.data.map(entity => {
                    try {
                        return contract.toPayload(entity);
                    }
                    catch {
                        return entity;
                    }
                });
                return toTextResponse({
                    message: `${contract.key} query completed successfully.`,
                    entityType: contract.key,
                    scope: scopePayload,
                    count: entities.length,
                    total: queryResult.total,
                    entities,
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return toErrorResponse(`Failed to query entities: ${errorMessage}`);
            }
        },
    };
}
//# sourceMappingURL=query-entities.js.map