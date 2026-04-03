import { appConfig } from '../config/app-config.js';
const DEFAULT_MODEL = {
    provider: appConfig.llm.provider,
    modelName: appConfig.llm.modelName,
};
const PROFILE_REGISTRY = [
    {
        name: 'primary',
        description: 'Default full-capability session agent profile.',
        systemPrompt: 'prompts/scada-agent.md',
        model: DEFAULT_MODEL,
        toolAllowlist: [
            'get_session_info',
            'list_entity_types',
            'get_type_definition',
            'get_entity_name',
            'get_group_path',
            'query_entities',
            'create_entity',
            'update_entity',
            'move_entity',
            'ask_question',
            'skill',
            'task',
        ],
        callableAsSubagent: false,
    },
    {
        name: 'explore',
        description: 'Read-only exploration profile for delegated subagent tasks.',
        systemPrompt: 'prompts/scada-agent.md',
        model: DEFAULT_MODEL,
        toolAllowlist: [
            'get_session_info',
            'list_entity_types',
            'get_type_definition',
            'get_entity_name',
            'get_group_path',
            'query_entities',
            'skill',
        ],
        callableAsSubagent: true,
    },
];
const PROFILES_BY_NAME = new Map();
for (const profile of PROFILE_REGISTRY) {
    if (PROFILES_BY_NAME.has(profile.name)) {
        throw new Error(`Duplicate profile name: "${profile.name}"`);
    }
    if (profile.callableAsSubagent && profile.toolAllowlist.includes('task')) {
        throw new Error(`Profile "${profile.name}" cannot allow recursive "task" tool`);
    }
    PROFILES_BY_NAME.set(profile.name, profile);
}
export function listCallableProfiles() {
    return PROFILE_REGISTRY.filter(profile => profile.callableAsSubagent).map(profile => structuredClone(profile));
}
export function getProfile(name) {
    if (!name.trim()) {
        throw new Error('Profile name is required');
    }
    const profile = PROFILES_BY_NAME.get(name);
    if (!profile) {
        throw new Error(`Unknown agent profile: "${name}"`);
    }
    return structuredClone(profile);
}
export function resolveEffectiveTools(profile, requestedTools) {
    const profileFromRegistry = getProfile(profile.name);
    const allowedTools = new Set(profileFromRegistry.toolAllowlist);
    if (!requestedTools) {
        return [...profileFromRegistry.toolAllowlist];
    }
    const uniqueRequested = new Set();
    for (const requestedTool of requestedTools) {
        if (!requestedTool.trim()) {
            throw new Error('Requested tool names must be non-empty');
        }
        if (uniqueRequested.has(requestedTool)) {
            continue;
        }
        uniqueRequested.add(requestedTool);
    }
    return [...uniqueRequested].filter(toolName => allowedTools.has(toolName));
}
//# sourceMappingURL=profiles.js.map