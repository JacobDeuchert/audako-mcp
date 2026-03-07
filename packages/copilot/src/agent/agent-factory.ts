import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, streamSimple } from '@mariozechner/pi-ai';
import { appConfig, loadSystemPrompt } from '../config/app-config.js';
import type { AudakoServices } from '../services/audako-services.js';
import { createMutationThrottle } from '../services/mutation-throttle.js';
import type { PermissionService } from '../services/permission-service.js';
import type { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import type { ToolRequestHub } from '../services/tool-request-hub.js';
import { createAskQuestionTool } from '../tools/ask-question.js';
import { createMutationTools } from '../tools/mutation-tools.js';
import { createReadOnlyTools } from '../tools/read-only-tools.js';

export interface CreateSessionAgentConfig {
  sessionContext: SessionContext;
  audakoServices: AudakoServices;
  eventHub: SessionEventHub;
  requestHub: ToolRequestHub;
  permissionService: PermissionService;
}

export interface SessionAgentFactoryResult {
  agent: Agent;
  destroy: () => void;
}

export async function createSessionAgent(
  config: CreateSessionAgentConfig,
): Promise<SessionAgentFactoryResult> {
  const systemPrompt = await loadSystemPrompt();

  const readOnlyTools = createReadOnlyTools(config.sessionContext, config.audakoServices);
  const mutationTools = createMutationTools(
    config.sessionContext.sessionId,
    config.sessionContext,
    config.audakoServices,
    createMutationThrottle(),
    config.permissionService,
    config.eventHub,
  );
  const askQuestionTool = createAskQuestionTool(config.sessionContext.sessionId, config.requestHub);
  const allTools = [...readOnlyTools, ...mutationTools, askQuestionTool];

  const agent = new Agent({
    initialState: {
      systemPrompt,
      model: getModel(appConfig.llm.provider as any, appConfig.llm.modelName as any),
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
