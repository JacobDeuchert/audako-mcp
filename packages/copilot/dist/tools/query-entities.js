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
        description: 'Required for non-global scopes. Use get_session_info to resolve the correct ID.',
    })),
    entityType: Type.String({ description: "Entity type name, for example 'Signal'." }),
    filter: Type.Object({}, {
        additionalProperties: true,
        description: 'REQUIRED: Mongo-style filter object that supports logical operators like $and, $or, $not, and $nor.',
    }),
    skip: Type.Optional(Type.Number({ description: 'Number of entities to skip for pagination.', minimum: 0 })),
    limit: Type.Optional(Type.Number({ description: 'Maximum number of entities to return. Defaults to returning all.', minimum: 1 })),
    includeFullEntity: Type.Optional(Type.Boolean({ description: 'Return full entity. Defaults to false, returning only Id, Name, Description, and GroupId.' })),
});
function hasNonEmptyScopeId(scopeId) {
    return typeof scopeId === 'string' && scopeId.trim().length > 0;
}
function isValidFilter(filter) {
    return isRecord(filter) && !Array.isArray(filter);
}
export function createQueryEntitiesTool(audakoServices) {
    return {
        name: 'query_entities',
        label: 'Query Entities',
        description: 'Query entities by scope with a Mongo-style filter object. Supports $and, $or, $not, and $nor operators.',
        parameters: queryEntitiesSchema,
        execute: async (_toolCallId, { scope, scopeId, entityType, filter, skip, limit, includeFullEntity }) => {
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
                if (!hasNonEmptyScopeId(scopeId)) {
                    return toErrorResponse(`'scopeId' is required for scope '${scope}'. Call get_session_info first to resolve the correct ID.`);
                }
                resolvedScopeId = scopeId.trim();
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
                const paging = skip !== undefined || limit !== undefined
                    ? { skip: skip ?? 0, limit: limit ?? 0 }
                    : undefined;
                const projection = includeFullEntity ? undefined : { Id: 1, Name: 1, Description: 1, GroupId: 1 };
                const queryResult = await audakoServices.entityService.queryConfiguration(contract.entityType, scopedFilter, paging, projection);
                const entities = includeFullEntity
                    ? queryResult.data.map(entity => {
                        try {
                            return contract.toPayload(entity);
                        }
                        catch {
                            return entity;
                        }
                    })
                    : queryResult.data;
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