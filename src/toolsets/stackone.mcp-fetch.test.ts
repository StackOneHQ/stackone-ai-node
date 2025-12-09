/**
 * MCP fetch integration tests using MSW + Hono.
 * These tests verify the StackOneToolSet's ability to fetch tools via MCP protocol.
 */
import { http } from 'msw';
import { type McpToolDefinition, createMcpApp } from '../../mocks/mcp-server';
import { server } from '../../mocks/node';
import { ToolSet } from './base';
import { StackOneToolSet } from './stackone';

describe('ToolSet.fetchTools (MCP + RPC integration)', () => {
  it('creates tools from MCP catalog and wires RPC execution', async () => {
    class TestToolSet extends ToolSet {}

    const toolset = new TestToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      authentication: {
        type: 'basic',
        credentials: { username: 'test-key', password: '' },
      },
      headers: { 'x-account-id': 'test-account' },
    });

    const tools = await toolset.fetchTools();
    expect(tools.length).toBe(1);

    const tool = tools.toArray()[0];
    expect(tool.name).toBe('dummy_action');

    const aiTools = await tool.toAISDK({ executable: false });
    const aiToolDefinition = aiTools.dummy_action;
    expect(aiToolDefinition).toBeDefined();
    expect(aiToolDefinition.description).toBe('Dummy tool');
    // @ts-expect-error - jsonSchema is available on Schema wrapper from ai sdk
    expect(aiToolDefinition.inputSchema.jsonSchema.properties).toBeDefined();
    expect(aiToolDefinition.execution).toBeUndefined();

    const executableTool = (await tool.toAISDK()).dummy_action;
    expect(executableTool.execute).toBeDefined();
  });
});

describe('StackOneToolSet account filtering', () => {
  it('supports setAccounts() for chaining', () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
    });

    // Test chaining
    const result = toolset.setAccounts(['acc1', 'acc2']);
    expect(result).toBe(toolset);
  });

  it('fetches tools without account filtering when no accountIds provided', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
    });

    const tools = await toolset.fetchTools();
    // 2 default tools + 1 feedback tool
    expect(tools.length).toBe(3);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('default_tool_1');
    expect(toolNames).toContain('default_tool_2');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });

  it('uses x-account-id header when fetching tools with accountIds', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
    });

    // Fetch tools for acc1
    const tools = await toolset.fetchTools({ accountIds: ['acc1'] });
    // 2 acc1 tools + 1 feedback tool
    expect(tools.length).toBe(3);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('acc1_tool_1');
    expect(toolNames).toContain('acc1_tool_2');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });

  it('uses setAccounts when no accountIds provided in fetchTools', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
    });

    // Set accounts using setAccounts
    toolset.setAccounts(['acc1', 'acc2']);

    // Fetch without accountIds - should use setAccounts
    const tools = await toolset.fetchTools();

    // Should fetch tools for 2 accounts from setAccounts
    // acc1 has 2 tools, acc2 has 2 tools, + 1 feedback tool = 5
    expect(tools.length).toBe(5);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('acc1_tool_1');
    expect(toolNames).toContain('acc1_tool_2');
    expect(toolNames).toContain('acc2_tool_1');
    expect(toolNames).toContain('acc2_tool_2');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });

  it('overrides setAccounts when accountIds provided in fetchTools', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
    });

    // Set accounts using setAccounts
    toolset.setAccounts(['acc1', 'acc2']);

    // Fetch with accountIds - should override setAccounts
    const tools = await toolset.fetchTools({ accountIds: ['acc3'] });

    // Should fetch tools only for acc3 (ignoring acc1, acc2) + 1 feedback tool
    expect(tools.length).toBe(2);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('acc3_tool_1');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });
});

describe('StackOneToolSet provider and action filtering', () => {
  it('filters tools by providers', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
      accountId: 'mixed',
    });

    // Filter by providers
    const tools = await toolset.fetchTools({ providers: ['hibob', 'bamboohr'] });

    // 4 filtered tools + 1 feedback tool
    expect(tools.length).toBe(5);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('hibob_list_employees');
    expect(toolNames).toContain('hibob_create_employees');
    expect(toolNames).toContain('bamboohr_list_employees');
    expect(toolNames).toContain('bamboohr_get_employee');
    expect(toolNames).not.toContain('workday_list_employees');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });

  it('filters tools by actions with exact match', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
      accountId: 'mixed',
    });

    // Filter by exact action names
    const tools = await toolset.fetchTools({
      actions: ['hibob_list_employees', 'hibob_create_employees'],
    });

    // 2 filtered tools + 1 feedback tool
    expect(tools.length).toBe(3);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('hibob_list_employees');
    expect(toolNames).toContain('hibob_create_employees');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });

  it('filters tools by actions with glob pattern', async () => {
    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
      accountId: 'mixed',
    });

    // Filter by glob pattern
    const tools = await toolset.fetchTools({ actions: ['*_list_employees'] });

    // 3 filtered tools + 1 feedback tool
    expect(tools.length).toBe(4);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('hibob_list_employees');
    expect(toolNames).toContain('bamboohr_list_employees');
    expect(toolNames).toContain('workday_list_employees');
    expect(toolNames).not.toContain('hibob_create_employees');
    expect(toolNames).not.toContain('bamboohr_get_employee');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });

  it('combines accountIds and actions filters', async () => {
    const acc1Tools: McpToolDefinition[] = [
      {
        name: 'hibob_list_employees',
        description: 'HiBob List Employees',
        inputSchema: {
          type: 'object',
          properties: { fields: { type: 'string' } },
        },
      },
      {
        name: 'hibob_create_employees',
        description: 'HiBob Create Employees',
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
    ];

    const acc2Tools: McpToolDefinition[] = [
      {
        name: 'bamboohr_list_employees',
        description: 'BambooHR List Employees',
        inputSchema: {
          type: 'object',
          properties: { fields: { type: 'string' } },
        },
      },
      {
        name: 'bamboohr_get_employee',
        description: 'BambooHR Get Employee',
        inputSchema: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
      },
    ];

    // Override the handler for this specific test
    const testMcpApp = createMcpApp({
      accountTools: {
        acc1: acc1Tools,
        acc2: acc2Tools,
      },
    });
    server.use(
      http.all('https://api.stackone-dev.com/mcp', async ({ request }) => {
        return testMcpApp.fetch(request);
      })
    );

    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
    });

    // Combine account and action filters
    const tools = await toolset.fetchTools({
      accountIds: ['acc1', 'acc2'],
      actions: ['*_list_employees'],
    });

    // 2 filtered tools + 1 feedback tool
    expect(tools.length).toBe(3);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('hibob_list_employees');
    expect(toolNames).toContain('bamboohr_list_employees');
    expect(toolNames).not.toContain('hibob_create_employees');
    expect(toolNames).not.toContain('bamboohr_get_employee');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });

  it('combines all filters: accountIds, providers, and actions', async () => {
    const acc1Tools: McpToolDefinition[] = [
      {
        name: 'hibob_list_employees',
        description: 'HiBob List Employees',
        inputSchema: {
          type: 'object',
          properties: { fields: { type: 'string' } },
        },
      },
      {
        name: 'hibob_create_employees',
        description: 'HiBob Create Employees',
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      {
        name: 'workday_list_employees',
        description: 'Workday List Employees',
        inputSchema: {
          type: 'object',
          properties: { fields: { type: 'string' } },
        },
      },
    ];

    // Override the handler for this specific test
    const testMcpApp = createMcpApp({
      accountTools: {
        acc1: acc1Tools,
      },
    });
    server.use(
      http.all('https://api.stackone-dev.com/mcp', async ({ request }) => {
        return testMcpApp.fetch(request);
      })
    );

    const toolset = new StackOneToolSet({
      baseUrl: 'https://api.stackone-dev.com',
      apiKey: 'test-key',
    });

    // Combine all filters
    const tools = await toolset.fetchTools({
      accountIds: ['acc1'],
      providers: ['hibob'],
      actions: ['*_list_*'],
    });

    // Should only return hibob_list_employees (matches all filters) + 1 feedback tool
    expect(tools.length).toBe(2);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('hibob_list_employees');
    expect(toolNames).toContain('meta_collect_tool_feedback');
  });
});
