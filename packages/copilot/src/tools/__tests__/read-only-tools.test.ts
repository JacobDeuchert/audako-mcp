import { EntityNameService, EntityType } from 'audako-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { listEntityTypeDefinitions } from '../../entity-type-definitions/index.js';
import { createReadOnlyTools } from '../read-only-tools.js';

function getTool(tools: ReturnType<typeof createReadOnlyTools>, name: string) {
  const tool = tools.find(candidate => candidate.name === name);
  expect(tool).toBeDefined();
  return tool!;
}

function createMocks() {
  const sessionContext = {
    getTenantId: vi.fn().mockReturnValue('tenant-1'),
    getGroupId: vi.fn().mockReturnValue('group-1'),
    getEntityType: vi.fn().mockReturnValue('Signal'),
    getApp: vi.fn().mockReturnValue('copilot-ui'),
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
  };

  return {
    sessionContext,
    audakoServices,
    tools: createReadOnlyTools(sessionContext as any, audakoServices as any),
  };
}

describe('createReadOnlyTools', () => {
  it('returns all six read-only tools with MCP-compatible names', () => {
    const { tools } = createMocks();
    expect(tools.map(tool => tool.name)).toEqual([
      'audako_mcp_get_session_info',
      'audako_mcp_list_entity_types',
      'audako_mcp_get_entity_definition',
      'audako_mcp_get_entity_name',
      'audako_mcp_get_group_path',
      'audako_mcp_query_entities',
    ]);
  });
});

describe('audako_mcp_get_session_info', () => {
  it('returns session context as MCP-formatted JSON text', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_get_session_info');

    const result: any = await tool.execute('call-1', {}, new AbortController().signal, vi.fn());

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tenantId: 'tenant-1',
              groupId: 'group-1',
              entityType: 'Signal',
              app: 'copilot-ui',
            },
            null,
            2,
          ),
        },
      ],
    });
  });
});

describe('audako_mcp_list_entity_types', () => {
  it('returns exactly the MCP list payload format', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_list_entity_types');

    const expectedPayload = listEntityTypeDefinitions().map(definition => ({
      key: definition.key,
      aliases: definition.aliases ?? [],
      entityType: definition.entityType,
      description: definition.description,
      fieldCount: definition.fields.length,
    }));

    const result: any = await tool.execute('call-1', {}, new AbortController().signal, vi.fn());

    expect(result.content[0].text).toBe(JSON.stringify(expectedPayload, null, 2));
  });
});

describe('audako_mcp_get_entity_definition', () => {
  it('returns entity definition for supported entity type', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_get_entity_definition');

    const result: any = await tool.execute(
      'call-1',
      { entityType: 'Signal' },
      new AbortController().signal,
      vi.fn(),
    );

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.entityType).toBe(EntityType.Signal);
    expect(Array.isArray(parsed.fields)).toBe(true);
    expect(parsed.fields.length).toBeGreaterThan(0);
  });

  it('returns MCP error payload for unsupported entity type', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_get_entity_definition');

    const result: any = await tool.execute(
      'call-1',
      { entityType: 'InvalidType' },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(
      "Unsupported entity type 'InvalidType'.\n\n" +
        JSON.stringify({ supportedTypes: ['Group', 'Signal'] }, null, 2),
    );
  });
});

describe('audako_mcp_get_entity_name', () => {
  it('returns entity display name for valid lookup', async () => {
    const { tools, audakoServices } = createMocks();
    audakoServices.entityService.getPartialEntityById.mockResolvedValue({
      Name: { Value: 'Main Pump' },
    });
    const tool = getTool(tools, 'audako_mcp_get_entity_name');

    const result: any = await tool.execute(
      'call-1',
      { entityType: 'Signal', entityId: 'sig-1' },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result.content[0].text).toBe('Main Pump');
  });

  it('returns error when entityId is empty', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_get_entity_name');

    const result: any = await tool.execute(
      'call-1',
      { entityType: 'Signal', entityId: '   ' },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result).toEqual({
      content: [{ type: 'text', text: "'entityId' must be a non-empty string." }],
      isError: true,
    });
  });

  it('returns unsupported entity type error with sorted supportedTypes', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_get_entity_name');

    const result: any = await tool.execute(
      'call-1',
      { entityType: 'BadType', entityId: 'id-1' },
      new AbortController().signal,
      vi.fn(),
    );

    const supportedTypes = [...(Object.values(EntityType) as EntityType[])].sort((a, b) =>
      a.localeCompare(b),
    );
    expect(result.content[0].text).toBe(
      `Unsupported entity type 'BadType'.\n\n${JSON.stringify({ supportedTypes }, null, 2)}`,
    );
    expect(result.isError).toBe(true);
  });

  it('returns service failure errors unchanged', async () => {
    const { tools, audakoServices } = createMocks();
    audakoServices.entityService.getPartialEntityById.mockRejectedValue(new Error('Not found'));
    const tool = getTool(tools, 'audako_mcp_get_entity_name');

    const result: any = await tool.execute(
      'call-1',
      { entityType: 'Signal', entityId: 'sig-404' },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Failed to resolve entity name: Not found' }],
      isError: true,
    });
  });
});

describe('audako_mcp_get_group_path', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns group breadcrumb payload exactly as MCP format', async () => {
    const { tools, audakoServices } = createMocks();
    audakoServices.entityService.getPartialEntityById.mockResolvedValue({
      Path: ['root-1', 'group-1'],
    });
    audakoServices.tenantService.getTenantViewForEntityId.mockResolvedValue({
      Id: 'tenant-1',
      Name: 'Tenant One',
    });
    vi.spyOn(EntityNameService.prototype, 'resolvePathName').mockResolvedValue(
      'Tenant One / Area A / Pump Group',
    );
    const tool = getTool(tools, 'audako_mcp_get_group_path');

    const result: any = await tool.execute(
      'call-1',
      { groupId: 'group-1' },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result.content[0].text).toBe(
      JSON.stringify(
        {
          tenantName: 'Tenant One',
          tenantId: 'tenant-1',
          pathName: 'Tenant One / Area A / Pump Group',
          pathIds: 'root-1 / group-1',
        },
        null,
        2,
      ),
    );
  });

  it('returns error when groupId is empty', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_get_group_path');

    const result: any = await tool.execute(
      'call-1',
      { groupId: '   ' },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result).toEqual({
      content: [{ type: 'text', text: "'groupId' must be a non-empty string." }],
      isError: true,
    });
  });

  it('returns service failure errors unchanged', async () => {
    const { tools, audakoServices } = createMocks();
    audakoServices.entityService.getPartialEntityById.mockRejectedValue(new Error('Missing group'));
    const tool = getTool(tools, 'audako_mcp_get_group_path');

    const result: any = await tool.execute(
      'call-1',
      { groupId: 'group-404' },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Failed to resolve group path: Missing group' }],
      isError: true,
    });
  });
});

describe('audako_mcp_query_entities', () => {
  it('returns unsupported entity type error', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_query_entities');

    const result: any = await tool.execute(
      'call-1',
      { scope: 'global', entityType: 'Unknown', filter: {} },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text:
            "Unsupported entity type 'Unknown'.\n\n" +
            JSON.stringify({ supportedTypes: ['Group', 'Signal'] }, null, 2),
        },
      ],
      isError: true,
    });
  });

  it('returns error for invalid filter object', async () => {
    const { tools } = createMocks();
    const tool = getTool(tools, 'audako_mcp_query_entities');

    const result: any = await tool.execute(
      'call-1',
      { scope: 'global', entityType: 'Signal', filter: [] as any },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result).toEqual({
      content: [{ type: 'text', text: "'filter' must be a JSON object." }],
      isError: true,
    });
  });

  it('returns scope violation-style error when group scope id is unavailable', async () => {
    const { tools, sessionContext } = createMocks();
    sessionContext.getGroupId.mockReturnValue(undefined);
    const tool = getTool(tools, 'audako_mcp_query_entities');

    const result: any = await tool.execute(
      'call-1',
      { scope: 'group', entityType: 'Signal', filter: {} },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result.content[0].text).toBe(
      "No 'group' scope ID provided and none found in session info.",
    );
    expect(result.isError).toBe(true);
  });

  it('returns tenant root scope error for invalid tenant metadata', async () => {
    const { tools, audakoServices } = createMocks();
    audakoServices.tenantService.getTenantViewById.mockResolvedValue({ Id: 'tenant-1', Root: '' });
    const tool = getTool(tools, 'audako_mcp_query_entities');

    const result: any = await tool.execute(
      'call-1',
      { scope: 'tenant', entityType: 'Signal', filter: {} },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: "Tenant 'tenant-1' has no root group and cannot be queried.",
        },
      ],
      isError: true,
    });
  });

  it('queries by group scope and returns MCP payload with mapped entities', async () => {
    const { tools, audakoServices } = createMocks();
    audakoServices.entityService.queryConfiguration.mockResolvedValue({
      data: [
        {
          Id: 'sig-1',
          Name: { Value: 'Pressure' },
          GroupId: { Value: 'group-1' },
          Type: { Value: 'AnalogInput' },
          DataConnectionId: { Value: 'virtual' },
        },
      ],
      total: 1,
    });
    const tool = getTool(tools, 'audako_mcp_query_entities');

    const result: any = await tool.execute(
      'call-1',
      { scope: 'group', entityType: 'Signal', filter: { Name: 'Pressure' } },
      new AbortController().signal,
      vi.fn(),
    );

    expect(audakoServices.entityService.queryConfiguration).toHaveBeenCalledWith(
      EntityType.Signal,
      {
        $and: [{ GroupId: 'group-1' }, { Name: 'Pressure' }],
      },
    );

    expect(result.content[0].text).toBe(
      JSON.stringify(
        {
          message: 'Signal query completed successfully.',
          entityType: 'Signal',
          scope: {
            scope: 'group',
            groupId: 'group-1',
          },
          count: 1,
          total: 1,
          entities: [
            {
              id: 'sig-1',
              name: 'Pressure',
              groupId: 'group-1',
              type: 'AnalogInput',
              dataConnectionId: 'virtual',
            },
          ],
        },
        null,
        2,
      ),
    );
  });

  it('returns query failure errors unchanged', async () => {
    const { tools, audakoServices } = createMocks();
    audakoServices.entityService.queryConfiguration.mockRejectedValue(
      new Error('Backend unavailable'),
    );
    const tool = getTool(tools, 'audako_mcp_query_entities');

    const result = await tool.execute(
      'call-1',
      { scope: 'global', entityType: 'Signal', filter: {} },
      new AbortController().signal,
      vi.fn(),
    );

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Failed to query entities: Backend unavailable' }],
      isError: true,
    });
  });
});
