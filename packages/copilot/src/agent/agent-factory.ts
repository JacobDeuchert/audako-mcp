import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, streamSimple } from '@mariozechner/pi-ai';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { appConfig, loadSystemPrompt } from '../config/app-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

import type { AudakoServices } from '../services/audako-services.js';
import { createMutationThrottle } from '../services/mutation-throttle.js';
import type { PermissionService } from '../services/permission-service.js';
import type { SessionContext } from '../services/session-context.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import type { ToolRequestHub } from '../services/tool-request-hub.js';
import { loadSkillsFromDir } from '../skills/loader.js';
import { formatSkillsForPrompt } from '../skills/prompt.js';
import type { Skill } from '../skills/types.js';
import { createAskQuestionTool } from '../tools/ask-question.js';
import { createMutationTools } from '../tools/mutation-tools.js';
import { createReadOnlyTools } from '../tools/read-only-tools.js';
import { createReadSkillTool } from '../tools/skill-tools.js';

const SKILLS_DIR = join(__dirname, '../../skills');

export interface CreateSessionAgentConfig {
  sessionContext: SessionContext;
  audakoServices: AudakoServices;
  eventHub: SessionEventHub;
  requestHub: ToolRequestHub;
  permissionService: PermissionService;
}

export interface SessionAgentFactoryResult {
  agent: Agent;
  skills: Skill[];
  destroy: () => void;
}

export async function createSessionAgent(
  config: CreateSessionAgentConfig,
): Promise<SessionAgentFactoryResult> {
  const systemPrompt = await loadSystemPrompt();

  const { skills, diagnostics } = loadSkillsFromDir(SKILLS_DIR);
  if (diagnostics.length > 0) {
    console.warn('[Skills] Loading diagnostics:', diagnostics);
  }

  const skillsSection = formatSkillsForPrompt(skills);
  const fullSystemPrompt = systemPrompt + skillsSection;

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
  const skillTool = createReadSkillTool(skills);
  const allTools = [...readOnlyTools, ...mutationTools, askQuestionTool, skillTool];

  const agent = new Agent({
    initialState: {
      systemPrompt: fullSystemPrompt,
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

  return { agent, skills, destroy };
}
