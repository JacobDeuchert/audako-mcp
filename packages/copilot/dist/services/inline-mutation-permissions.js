const ALLOW_OPTION = 'Allow';
const DENY_OPTION = 'Deny';
function normalizeNonEmptyString(value, fieldName) {
    const normalized = value.trim();
    if (!normalized) {
        throw new Error(`${fieldName} must be a non-empty string.`);
    }
    return normalized;
}
function toPermissionQuestion(entityType) {
    return {
        text: `Allow mutation of ${entityType} entities?`,
        header: 'Mutation Permission',
        options: [
            {
                label: ALLOW_OPTION,
                description: 'Allow mutation operations for this entity type in this session.',
            },
            {
                label: DENY_OPTION,
                description: 'Block this mutation operation.',
            },
        ],
    };
}
function isAllowDecision(response) {
    if (typeof response === 'string') {
        return response.trim() === ALLOW_OPTION;
    }
    if (!Array.isArray(response)) {
        return false;
    }
    return response.some(choice => typeof choice === 'string' && choice.trim() === ALLOW_OPTION);
}
export async function ensureInlineMutationPermission(input) {
    const sessionId = normalizeNonEmptyString(input.sessionId, 'sessionId');
    const entityType = normalizeNonEmptyString(input.entityType, 'entityType');
    if (input.permissionStore.hasPermission(entityType)) {
        return;
    }
    let response;
    try {
        response = await input.sessionRequestHub.create(sessionId, toPermissionQuestion(entityType));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Mutation permission request failed for ${entityType}: ${message}`);
    }
    if (!isAllowDecision(response)) {
        throw new Error(`Mutation blocked: permission denied for ${entityType}.`);
    }
    input.permissionStore.grantPermission(entityType);
}
//# sourceMappingURL=inline-mutation-permissions.js.map