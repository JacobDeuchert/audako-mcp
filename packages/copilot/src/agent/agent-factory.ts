import { Agent } from '@mariozechner/pi-agent-core';
import { getModel, streamSimple } from '@mariozechner/pi-ai';
import { MutationPermissions } from '../services/mutation-permissions.js';
import { createMutationThrottle } from '../services/mutation-throttle.js';
import type { SessionEventHub } from '../services/session-event-hub.js';
import type { SessionRequestHub } from '../services/session-request-hub.js';
import { createAskQuestionTool } from '../tools/ask-question.js';
import { createMutationTools } from '../tools/mutation-tools.js';
import { createReadOnlyTools } from '../tools/read-only-tools.js';

interface SessionContextLike {
  getSessionId(): string;
  getTenantId(): string | undefined;
  getGroupId(): string | undefined;
  getEntityType(): string | undefined;
  getApp(): string | undefined;
}

interface AudakoServicesLike {
  tenantService: {
    getTenantViewById(tenantId: string): Promise<unknown>;
    getTenantViewForEntityId(entityId: string): Promise<unknown>;
  };
  entityService: {
    getPartialEntityById<T>(
      entityType: string,
      id: string,
      queryParameters: Record<string, unknown>,
    ): Promise<T>;
    queryConfiguration(entityType: string, filter: Record<string, unknown>): Promise<unknown>;
  };
  entityData: {
    create(entityType: string, payload: Record<string, unknown>): Promise<Record<string, unknown>>;
    update(
      entityType: string,
      entityId: string,
      changes: Record<string, unknown>,
    ): Promise<Record<string, unknown>>;
  };
  group: {
    moveEntity(
      entityType: string,
      entityId: string,
      targetGroupId: string,
    ): Promise<{ fromGroupId?: string; toGroupId?: string }>;
  };
}

interface ModelConfig {
  provider: string;
  modelName: string;
}

export interface CreateSessionAgentConfig {
  sessionContext: SessionContextLike;
  audakoServices: AudakoServicesLike;
  eventHub: SessionEventHub;
  requestHub: SessionRequestHub;
  systemPrompt: string;
  modelConfig: ModelConfig;
}

export interface SessionAgentFactoryResult {
  agent: Agent;
  destroy: () => void;
}

export function createSessionAgent(config: CreateSessionAgentConfig): SessionAgentFactoryResult {
  const readOnlyTools = createReadOnlyTools(
    config.sessionContext as any,
    config.audakoServices as any,
  );
  const mutationTools = createMutationTools(
    config.sessionContext,
    config.audakoServices,
    createMutationThrottle(),
    {
      validate: () => {
        return;
      },
    },
    new MutationPermissions(),
    config.eventHub,
    config.requestHub,
  );
  const askQuestionTool = createAskQuestionTool(
    config.sessionContext.getSessionId(),
    config.requestHub,
  );
  const allTools = [...readOnlyTools, ...mutationTools, askQuestionTool];

  const agent = new Agent({
    initialState: {
      systemPrompt: config.systemPrompt,
      model: getModel(config.modelConfig.provider as any, config.modelConfig.modelName as any),
      tools: allTools,
      thinkingLevel: 'none' as any,
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
