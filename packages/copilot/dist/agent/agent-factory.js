import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, streamSimple } from '@mariozechner/pi-ai';
import { createMutationThrottle } from '../services/mutation-throttle.js';
import { loadSkillsFromDir } from '../skills/loader.js';
import { createAskQuestionTool } from '../tools/ask-question.js';
import { createMutationTools } from '../tools/mutation-tools.js';
import { createReadOnlyTools } from '../tools/read-only-tools.js';
import { createReadSkillTool } from '../tools/skill-tools.js';
import { createTaskTool } from '../tools/task-tool.js';
import { createTodowriteTool } from '../tools/todowrite.js';
import { resolveEffectiveTools } from './profiles.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
async function loadSystemPrompt(systemPromptPath) {
    try {
        const absolutePath = resolve(__dirname, '../../', systemPromptPath);
        return await readFile(absolutePath, 'utf-8');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to load system prompt "${systemPromptPath}": ${message}`);
    }
}
const SKILLS_DIR = join(__dirname, '../../skills');
export async function createSessionAgent(config) {
    const systemPrompt = await loadSystemPrompt(config.profile.systemPrompt);
    const { skills, diagnostics } = loadSkillsFromDir(SKILLS_DIR);
    if (diagnostics.length > 0) {
        console.warn('[Skills] Loading diagnostics:', diagnostics);
    }
    const effectiveToolNames = resolveEffectiveTools(config.profile, config.requestedTools);
    if (config.requestedTools) {
        const requestedToolNames = new Set(config.requestedTools);
        const deniedTools = [...requestedToolNames].filter(toolName => !effectiveToolNames.includes(toolName));
        if (deniedTools.length > 0) {
            throw new Error(`Requested tools exceed profile "${config.profile.name}" allowlist: ${deniedTools.join(', ')}`);
        }
    }
    const effectiveToolNameSet = new Set(effectiveToolNames);
    const selectedTools = [];
    const readOnlyTools = createReadOnlyTools(config.sessionContext, config.audakoServices);
    selectedTools.push(...readOnlyTools.filter(tool => effectiveToolNameSet.has(tool.name)));
    const mutationTools = createMutationTools(config.sessionContext.sessionId, config.sessionContext, config.audakoServices, createMutationThrottle(), config.permissionService, config.eventHub);
    selectedTools.push(...mutationTools.filter(tool => effectiveToolNameSet.has(tool.name)));
    if (effectiveToolNameSet.has('ask_question')) {
        const askQuestionTool = createAskQuestionTool(config.sessionContext.sessionId, config.requestHub);
        selectedTools.push(askQuestionTool);
    }
    if (effectiveToolNameSet.has('todowrite')) {
        const todowriteTool = createTodowriteTool(config.sessionContext.sessionId, config.sessionTodoStore);
        selectedTools.push(todowriteTool);
    }
    if (effectiveToolNameSet.has('skill')) {
        const skillTool = createReadSkillTool(skills);
        selectedTools.push(skillTool);
    }
    if (effectiveToolNameSet.has('task')) {
        if (!config.childSessionExecutor) {
            throw new Error('Task tool is enabled but child session executor is unavailable');
        }
        const taskTool = createTaskTool(config.sessionContext.sessionId, config.childSessionExecutor);
        selectedTools.push(taskTool);
    }
    const toolsByName = new Map(selectedTools.map(tool => [tool.name, tool]));
    const tools = effectiveToolNames.map(toolName => {
        const tool = toolsByName.get(toolName);
        if (!tool) {
            throw new Error(`Resolved tool "${toolName}" is not registered by the factory for profile "${config.profile.name}"`);
        }
        return tool;
    });
    const agent = new Agent({
        initialState: {
            systemPrompt,
            model: getModel(config.profile.model.provider, config.profile.model.modelName),
            tools,
            thinkingLevel: 'off',
        },
        convertToLlm: messages => messages,
        streamFn: streamSimple,
    });
    const destroy = () => {
        agent.abort();
        agent.clearAllQueues();
        agent.clearMessages();
    };
    return { agent, destroy };
}
//# sourceMappingURL=agent-factory.js.map