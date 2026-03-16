// Import type files to trigger self-registration
import '../entity-type-definitions/Signal/contract.js';
import '../entity-type-definitions/Group/contract.js';
import { StringEnum, Type } from '@mariozechner/pi-ai';
import { resolveContract } from '../entity-type-definitions/contract-registry.js';
import { listTypeKeys } from '../services/type-registry.js';
import { isRecord, toErrorResponse, toTextResponse } from './helpers.js';
const queryEntitiesSchema = Type.Object({
    scope: StringEnum(['global', 'tenant', 'group', 'groupWithSubgroups'], {
        description: 'Scope for the query.',
    }),
    scopeId: Type.Optional(Type.String({
        description: 'Optional scope identifier. If omitted, groupId or tenantId is taken from session info based on scope.',
    })),
    entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
    filter: Type.Object({}, {
        additionalProperties: true,
        description: 'REQUIRED: Mongo-style filter object that supports logical operators like $and, $or, $not, and $nor.',
    }),
});
function hasNonEmptyScopeId(scopeId) {
    return typeof scopeId === 'string' && scopeId.trim().length > 0;
}
function isValidFilter(filter) {
    return isRecord(filter) && !Array.isArray(filter);
}
export function createQueryEntitiesTool(sessionContext, audakoServices) {
    return {
        name: 'query_entities',
        label: 'Query Entities',
        description: 'Query entities by scope with a Mongo-style filter object. Supports $and, $or, $not, and $nor operators.',
        parameters: queryEntitiesSchema,
        execute: async (_toolCallId, { scope, scopeId, entityType, filter }) => {
            const contract = resolveContract(entityType);
            if (!contract) {
                const supportedTypes = listTypeKeys();
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
                    resolvedScopeId = scope === 'tenant' ? sessionContext.tenantId : sessionContext.groupId;
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