import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, streamSimple } from '@mariozechner/pi-ai';
import { appConfig, loadSystemPrompt } from '../config/app-config.js';
import { createMutationThrottle } from '../services/mutation-throttle.js';
import { createAskQuestionTool } from '../tools/ask-question.js';
import { createMutationTools } from '../tools/mutation-tools.js';
import { createReadOnlyTools } from '../tools/read-only-tools.js';
export async function createSessionAgent(config) {
    const systemPrompt = await loadSystemPrompt();
    const readOnlyTools = createReadOnlyTools(config.sessionContext, config.audakoServices);
    const mutationTools = createMutationTools(config.sessionContext.sessionId, config.sessionContext, config.audakoServices, createMutationThrottle(), config.permissionService, config.eventHub);
    const askQuestionTool = createAskQuestionTool(config.sessionContext.sessionId, config.requestHub);
    const allTools = [...readOnlyTools, ...mutationTools, askQuestionTool];
    const agent = new Agent({
        initialState: {
            systemPrompt,
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
    return { agent, destroy };
}
//# sourceMappingURL=agent-factory.js.map