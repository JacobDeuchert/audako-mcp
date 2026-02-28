import { afterEach, describe, expect, it, vi } from 'vitest';
import { SessionEventHub } from '../../services/session-event-hub.js';
import { SessionRequestHub } from '../../services/session-request-hub.js';
import { createSessionAgent } from '../agent-factory.js';

function createFixture() {
  const eventHub = new SessionEventHub();
  const requestHub = new SessionRequestHub({ eventHub, timeoutMs: 1000 });

  const sessionContext = {
    getSessionId: () => 'session-1',
    getTenantId: () => 'tenant-1',
    getGroupId: () => 'group-1',
    getEntityType: () => 'Signal',
    getApp: () => 'copilot-ui',
  };

  const audakoServices = {
    tenantService: {
      getTenantViewById: vi.fn(),
      getTenantViewForEntityId: vi.fn(),
    },
    entityService: {
      getPartialEntityById: vi.fn(),
      queryConfiguration: vi.fn(),
    },
    entityData: {
      create: vi.fn(),
      update: vi.fn(),
    },
    group: {
      moveEntity: vi.fn(),
    },
  };

  return {
    eventHub,
    requestHub,
    sessionContext,
    audakoServices,
  };
}

describe('createSessionAgent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns { agent, destroy } with agent configured for the session', () => {
    const fixture = createFixture();

    const result = createSessionAgent({
      sessionContext: fixture.sessionContext as any,
      audakoServices: fixture.audakoServices as any,
      eventHub: fixture.eventHub,
      requestHub: fixture.requestHub,
      systemPrompt: 'You are an Audako assistant.',
      modelConfig: {
        provider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
      },
    });

    expect(result.agent).toBeDefined();
    expect(typeof result.destroy).toBe('function');
    expect(result.agent.state.systemPrompt).toBe('You are an Audako assistant.');
  });

  it('wires all 10 tools with expected MCP-compatible names', () => {
    const fixture = createFixture();

    const { agent } = createSessionAgent({
      sessionContext: fixture.sessionContext as any,
      audakoServices: fixture.audakoServices as any,
      eventHub: fixture.eventHub,
      requestHub: fixture.requestHub,
      systemPrompt: 'System prompt',
      modelConfig: {
        provider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
      },
    });

    expect(agent.state.tools).toHaveLength(10);
    expect(agent.state.tools.map(tool => tool.name)).toEqual([
      'audako_mcp_get_session_info',
      'audako_mcp_list_entity_types',
      'audako_mcp_get_entity_definition',
      'audako_mcp_get_entity_name',
      'audako_mcp_get_group_path',
      'audako_mcp_query_entities',
      'audako_mcp_create_entity',
      'audako_mcp_update_entity',
      'audako_mcp_move_entity',
      'audako_mcp_ask_question',
    ]);
  });

  it('uses modelConfig with getModel and sets thinkingLevel to none', () => {
    const fixture = createFixture();

    const { agent } = createSessionAgent({
      sessionContext: fixture.sessionContext as any,
      audakoServices: fixture.audakoServices as any,
      eventHub: fixture.eventHub,
      requestHub: fixture.requestHub,
      systemPrompt: 'System prompt',
      modelConfig: {
        provider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
      },
    });

    expect(agent.state.model.provider).toBe('anthropic');
    expect(agent.state.model.id).toBe('claude-sonnet-4-20250514');
    expect((agent.state as any).thinkingLevel).toBe('none');
  });

  it('destroy aborts agent resources', () => {
    const fixture = createFixture();
    const { agent, destroy } = createSessionAgent({
      sessionContext: fixture.sessionContext as any,
      audakoServices: fixture.audakoServices as any,
      eventHub: fixture.eventHub,
      requestHub: fixture.requestHub,
      systemPrompt: 'System prompt',
      modelConfig: {
        provider: 'anthropic',
        modelName: 'claude-sonnet-4-20250514',
      },
    });
    const abortSpy = vi.spyOn(agent, 'abort');

    destroy();

    expect(abortSpy).toHaveBeenCalledTimes(1);
  });
});
