import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, streamSimple } from '@mariozechner/pi-ai';
import { join } from 'path';
import { appConfig, loadSystemPrompt } from '../config/app-config.js';
import { createMutationThrottle } from '../services/mutation-throttle.js';
import { loadSkillsFromDir } from '../skills/loader.js';
import { formatSkillsForPrompt } from '../skills/prompt.js';
import { createAskQuestionTool } from '../tools/ask-question.js';
import { createMutationTools } from '../tools/mutation-tools.js';
import { createReadOnlyTools } from '../tools/read-only-tools.js';
const SKILLS_DIR = join(__dirname, '../../skills');
export async function createSessionAgent(config) {
    const systemPrompt = await loadSystemPrompt();
    const { skills, diagnostics } = loadSkillsFromDir(SKILLS_DIR);
    if (diagnostics.length > 0) {
        console.warn('[Skills] Loading diagnostics:', diagnostics);
    }
    const skillsSection = formatSkillsForPrompt(skills);
    const fullSystemPrompt = systemPrompt + skillsSection;
    const readOnlyTools = createReadOnlyTools(config.sessionContext, config.audakoServices);
    const mutationTools = createMutationTools(config.sessionContext.sessionId, config.sessionContext, config.audakoServices, createMutationThrottle(), config.permissionService, config.eventHub);
    const askQuestionTool = createAskQuestionTool(config.sessionContext.sessionId, config.requestHub);
    const allTools = [...readOnlyTools, ...mutationTools, askQuestionTool];
    const agent = new Agent({
        initialState: {
            systemPrompt: fullSystemPrompt,
            model: getModel(appConfig.llm.provider, appConfig.llm.modelName),
            tools: allTools,
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
    return { agent, skills, destroy };
}
//# sourceMappingURL=agent-factory.js.map