import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, streamSimple } from '@mariozechner/pi-ai';
import { MutationPermissions } from '../services/mutation-permissions.js';
import { createMutationThrottle } from '../services/mutation-throttle.js';
import { createAskQuestionTool } from '../tools/ask-question.js';
import { createMutationTools } from '../tools/mutation-tools.js';
import { createReadOnlyTools } from '../tools/read-only-tools.js';
export function createSessionAgent(config) {
    const readOnlyTools = createReadOnlyTools(config.sessionContext, config.audakoServices);
    const mutationTools = createMutationTools(config.sessionContext, config.audakoServices, createMutationThrottle(), {
        validate: () => {
            return;
        },
    }, new MutationPermissions(), config.eventHub, config.requestHub);
    const askQuestionTool = createAskQuestionTool(config.sessionContext.getSessionId(), config.requestHub);
    const allTools = [...readOnlyTools, ...mutationTools, askQuestionTool];
    const agent = new Agent({
        initialState: {
            systemPrompt: config.systemPrompt,
            model: getModel(config.modelConfig.provider, config.modelConfig.modelName),
            tools: allTools,
            thinkingLevel: 'none',
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