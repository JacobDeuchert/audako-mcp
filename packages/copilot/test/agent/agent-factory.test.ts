import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  agentConstructor: vi.fn(),
  getModel: vi.fn(() => ({ id: 'model' })),
  loadSystemPrompt: vi.fn(async () => 'SYSTEM_PROMPT\n'),
  loadSkillsFromDir: vi.fn(() => ({
    skills: [
      {
        name: 'mock-skill',
        description: 'Mock skill',
        filePath: '/tmp/SKILL.md',
        baseDir: '/tmp',
        source: 'project',
        disableModelInvocation: false,
      },
    ],
    diagnostics: [],
  })),
  formatSkillsForPrompt: vi.fn(() => '\n<available_skills />'),
  createMutationThrottle: vi.fn(() => ({ run: async <T>(fn: () => Promise<T>) => fn() })),
  createReadOnlyTools: vi.fn(() => [
    { name: 'get_session_info' },
    { name: 'list_entity_types' },
    { name: 'get_type_definition' },
    { name: 'get_entity_name' },
    { name: 'get_group_path' },
    { name: 'query_entities' },
  ]),
  createMutationTools: vi.fn(() => [
    { name: 'create_entity' },
    { name: 'update_entity' },
    { name: 'move_entity' },
  ]),
  createAskQuestionTool: vi.fn(() => ({ name: 'ask_question' })),
  createReadSkillTool: vi.fn(() => ({ name: 'skill' })),
  createTaskTool: vi.fn(() => ({ name: 'task' })),
}));

vi.mock('@mariozechner/pi-agent-core', () => {
  class FakeAgent {
    abort = vi.fn();
    clearAllQueues = vi.fn();
    clearMessages = vi.fn();

    constructor(config: unknown) {
      mocks.agentConstructor(config);
    }
  }

  return { Agent: FakeAgent };
});

vi.mock('@mariozechner/pi-ai', () => ({
  getModel: mocks.getModel,
  streamSimple: vi.fn(),
}));

vi.mock('../../src/config/app-config.js', () => ({
  appConfig: {
    llm: {
      provider: 'anthropic',
      modelName: 'claude-sonnet-4-20250514',
    },
  },
  loadSystemPrompt: mocks.loadSystemPrompt,
}));

vi.mock('../../src/skills/loader.js', () => ({
  loadSkillsFromDir: mocks.loadSkillsFromDir,
}));

vi.mock('../../src/skills/prompt.js', () => ({
  formatSkillsForPrompt: mocks.formatSkillsForPrompt,
}));

vi.mock('../../src/services/mutation-throttle.js', () => ({
  createMutationThrottle: mocks.createMutationThrottle,
}));

vi.mock('../../src/tools/read-only-tools.js', () => ({
  createReadOnlyTools: mocks.createReadOnlyTools,
}));

vi.mock('../../src/tools/mutation-tools.js', () => ({
  createMutationTools: mocks.createMutationTools,
}));

vi.mock('../../src/tools/ask-question.js', () => ({
  createAskQuestionTool: mocks.createAskQuestionTool,
}));

vi.mock('../../src/tools/skill-tools.js', () => ({
  createReadSkillTool: mocks.createReadSkillTool,
}));

vi.mock('../../src/tools/task-tool.js', () => ({
  createTaskTool: mocks.createTaskTool,
}));

import type { CreateSessionAgentConfig } from '../../src/agent/agent-factory.js';
import { createSessionAgent } from '../../src/agent/agent-factory.js';
import { getProfile } from '../../src/agent/profiles.js';

describe('createSessionAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createBaseConfig() {
    return {
      sessionContext: { sessionId: 'session-1' },
      audakoServices: {},
      eventHub: {},
      requestHub: {},
      permissionService: {},
      childSessionExecutor: {},
    } as unknown as Omit<CreateSessionAgentConfig, 'profile' | 'requestedTools'>;
  }

  function getToolNamesFromAgentState(): string[] {
    const config = mocks.agentConstructor.mock.calls[0]?.[0] as {
      initialState: { tools: Array<{ name: string }> };
    };
    return config.initialState.tools.map(tool => tool.name);
  }

  it('builds the primary profile with full default toolset', async () => {
    const profile = getProfile('primary');

    await createSessionAgent({
      ...createBaseConfig(),
      profile,
    });

    expect(mocks.loadSystemPrompt).toHaveBeenCalledTimes(1);
    expect(mocks.getModel).toHaveBeenCalledWith(profile.model.provider, profile.model.modelName);
    expect(mocks.createTaskTool).toHaveBeenCalledTimes(1);
    expect(getToolNamesFromAgentState()).toEqual(profile.toolAllowlist);
  });

  it('applies requested tool narrowing and only creates required tool groups', async () => {
    await createSessionAgent({
      ...createBaseConfig(),
      profile: getProfile('primary'),
      requestedTools: ['get_session_info', 'skill'],
    });

    expect(mocks.createReadOnlyTools).toHaveBeenCalledTimes(1);
    expect(mocks.createMutationTools).not.toHaveBeenCalled();
    expect(mocks.createAskQuestionTool).not.toHaveBeenCalled();
    expect(mocks.createReadSkillTool).toHaveBeenCalledTimes(1);
    expect(mocks.createTaskTool).not.toHaveBeenCalled();
    expect(getToolNamesFromAgentState()).toEqual(['get_session_info', 'skill']);
  });

  it('rejects widening requests outside profile allowlist', async () => {
    await expect(
      createSessionAgent({
        ...createBaseConfig(),
        profile: getProfile('explore'),
        requestedTools: ['get_session_info', 'create_entity'],
      }),
    ).rejects.toThrowError('Requested tools exceed profile "explore" allowlist: create_entity');

    expect(mocks.agentConstructor).not.toHaveBeenCalled();
    expect(mocks.createMutationTools).not.toHaveBeenCalled();
  });

  it('constructs explore profile with read-only and skill tools only', async () => {
    const profile = getProfile('explore');

    await createSessionAgent({
      ...createBaseConfig(),
      profile,
    });

    expect(mocks.createReadOnlyTools).toHaveBeenCalledTimes(1);
    expect(mocks.createMutationTools).not.toHaveBeenCalled();
    expect(mocks.createAskQuestionTool).not.toHaveBeenCalled();
    expect(mocks.createReadSkillTool).toHaveBeenCalledTimes(1);
    expect(mocks.createTaskTool).not.toHaveBeenCalled();
    expect(getToolNamesFromAgentState()).toEqual(profile.toolAllowlist);
  });
});
