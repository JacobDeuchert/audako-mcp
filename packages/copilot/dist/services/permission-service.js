import { EntityType } from 'audako-core';
import { createLogger } from '../config/app-config.js';
const logger = createLogger('permission-service');
export function normalizePermissionMode(mode) {
    return mode === 'fail_fast' ? 'fail_fast' : 'interactive';
}
const ALLOW_OPTION = 'Allow';
const DENY_OPTION = 'Deny';
function isAllowDecision(response) {
    if (typeof response === 'string') {
        return response.trim() === ALLOW_OPTION;
    }
    if (!Array.isArray(response)) {
        return false;
    }
    return response.some(choice => typeof choice === 'string' && choice.trim() === ALLOW_OPTION);
}
function normalizeGroupPath(pathValue, targetGroupId) {
    const normalizedPath = Array.isArray(pathValue)
        ? pathValue
            .filter((pathId) => typeof pathId === 'string')
            .map(pathId => pathId.trim())
            .filter(pathId => pathId.length > 0)
        : [];
    if (normalizedPath[normalizedPath.length - 1] !== targetGroupId) {
        normalizedPath.push(targetGroupId);
    }
    return normalizedPath;
}
export class DefaultPermissionService {
    sessionRegistry;
    toolRequestHub;
    grants = new Map();
    constructor(sessionRegistry, toolRequestHub) {
        this.sessionRegistry = sessionRegistry;
        this.toolRequestHub = toolRequestHub;
    }
    async hasPermission(sessionId, entityType, requestedGroupId, permissionMode, tool) {
        const session = this.sessionRegistry.getSession(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const contextGroupId = session.sessionContext.groupId;
        if (!requestedGroupId || !contextGroupId) {
            return true;
        }
        const inScope = await this.isGroupInScope(session.audakoServices.entityService, contextGroupId, requestedGroupId);
        if (inScope) {
            return true;
        }
        const grantKey = `${tool}:${entityType}:${requestedGroupId}`;
        const sessionGrants = this.grants.get(sessionId);
        if (sessionGrants?.has(grantKey)) {
            return true;
        }
        if (permissionMode === 'fail_fast') {
            throw new Error(`Mutation blocked: ${tool} targets ${entityType} in group ${requestedGroupId} which is outside the current context group. Use permissionMode 'interactive' to prompt the user.`);
        }
        const question = {
            text: `The ${tool} operation targets ${entityType} in group ${requestedGroupId} which is outside your current context group. Allow this operation?`,
            header: 'Out-of-Scope Permission',
            options: [
                {
                    label: ALLOW_OPTION,
                    description: 'Allow this operation outside the current context group.',
                },
                { label: DENY_OPTION, description: 'Block this operation.' },
            ],
        };
        let response;
        try {
            response = await this.toolRequestHub.create(sessionId, question);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Permission request failed for ${tool} on ${entityType}: ${message}`);
        }
        if (!isAllowDecision(response)) {
            throw new Error(`Mutation blocked: user denied ${tool} on ${entityType} in group ${requestedGroupId}.`);
        }
        if (!this.grants.has(sessionId)) {
            this.grants.set(sessionId, new Set());
        }
        this.grants.get(sessionId)?.add(grantKey);
        logger.info({ sessionId, entityType, requestedGroupId, tool }, 'Out-of-scope permission granted by user');
        return true;
    }
    async isGroupInScope(entityService, contextGroupId, targetGroupId) {
        try {
            const targetGroup = await entityService.getPartialEntityById(EntityType.Group, targetGroupId, {
                Path: 1,
            });
            const pathIds = normalizeGroupPath(targetGroup?.Path, targetGroupId);
            return pathIds.includes(contextGroupId);
        }
        catch {
            return false;
        }
    }
    clearSession(sessionId) {
        this.grants.delete(sessionId);
    }
}
//# sourceMappingURL=permission-service.js.map