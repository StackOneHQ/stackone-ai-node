import { StreamableHTTPTransport } from '@hono/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StackOne } from '@stackone/stackone-client-ts';
import { Hono } from 'hono';
import { assert, vi } from 'vitest';
import { z } from 'zod';
import { server as mswServer } from '../../../mocks/node';
import { ToolSet } from '../base';
import { StackOneToolSet } from '../stackone';

// Bun runtime types for test environment
declare const Bun: {
  serve(options: { port: number; fetch: (req: Request) => Response | Promise<Response> }): {
    url: URL;
    stop(): void;
  };
};

type MockTool = {
  name: string;
  description?: string;
  shape: Record<string, unknown>; // JSON Schema object
};

async function createMockMcpServer(accountTools: Record<string, readonly MockTool[]>) {
  const app = new Hono();

  app.all('/mcp', async (c) => {
    // Get account ID from header
    const accountId = c.req.header('x-account-id') || 'default';
    const tools = accountTools[accountId] || [];

    // Create a new MCP server instance per account
    const mcp = new McpServer({ name: 'test-mcp', version: '1.0.0' });
    const transport = new StreamableHTTPTransport();

    for (const tool of tools) {
      mcp.registerTool(
        tool.name,
        {
          description: tool.description,
          // TODO: Remove type assertion - MCP SDK expects Zod schema but we're using JSON Schema objects in tests
          // biome-ignore lint/suspicious/noExplicitAny: MCP SDK type mismatch - using JSON Schema instead of Zod
          inputSchema: tool.shape as any,
        },
        async ({ params }: { params: { arguments?: Record<string, unknown> } }) => ({
          content: [],
          structuredContent: params.arguments ?? {},
          _meta: undefined,
        })
      );
    }

    await mcp.connect(transport);
    return transport.handleRequest(c);
  });

  const server = Bun.serve({ port: 0, fetch: app.fetch });
  const origin = server.url.toString().replace(/\/$/, '');

  return {
    origin,
    close: () => server.stop(),
  } as const;
}

describe('ToolSet.fetchTools (MCP + RPC integration)', () => {
  const mockTools = [
    {
      name: 'dummy_action',
      description: 'Dummy tool',
      shape: {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            description: 'A string parameter',
          },
        },
        required: ['foo'],
        additionalProperties: false,
      },
    },
  ] as const;

  let origin: string;
  let closeServer: () => void;
  let restoreMsw: (() => void) | undefined;

  beforeAll(async () => {
    mswServer.close();
    restoreMsw = () => mswServer.listen({ onUnhandledRequest: 'warn' });

    const server = await createMockMcpServer({
      default: mockTools,
      'test-account': mockTools,
    });
    origin = server.origin;
    closeServer = server.close;
  });

  afterAll(() => {
    closeServer();
    restoreMsw?.();
  });

  it('creates tools from MCP catalog and wires RPC execution', async () => {
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    class TestToolSet extends ToolSet {}

    const toolset = new TestToolSet({
      baseUrl: origin,
      headers: { 'x-account-id': 'test-account' },
      stackOneClient,
    });

    const tools = await toolset.fetchTools();
    expect(tools.length).toBe(1);

    const tool = tools.toArray()[0];
    expect(tool.name).toBe('dummy_action');

    const aiTools = await tool.toAISDK({ executable: false });
    const aiToolDefinition = aiTools.dummy_action;
    expect(aiToolDefinition).toBeDefined();
    expect(aiToolDefinition.description).toBe('Dummy tool');
    // TODO: Remove ts-ignore once AISDKToolDefinition properly types inputSchema.jsonSchema
    // @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
    expect(aiToolDefinition.inputSchema.jsonSchema.properties).toBeDefined();
    expect(aiToolDefinition.execution).toBeUndefined();

    const executableTool = (await tool.toAISDK()).dummy_action;
    assert(executableTool.execute, 'execute should be defined');
    const result = await executableTool.execute(
      { foo: 'bar' },
      { toolCallId: 'test-id', messages: [] }
    );

    expect(stackOneClient.actions.rpcAction).toHaveBeenCalledWith({
      action: 'dummy_action',
      body: { foo: 'bar' },
      headers: { 'x-account-id': 'test-account' },
      path: undefined,
      query: undefined,
    });
    expect(result).toEqual({ data: null });
  });
});

describe('StackOneToolSet account filtering', () => {
  const acc1Tools = [
    {
      name: 'acc1_tool_1',
      description: 'Account 1 Tool 1',
      shape: { fields: z.string().optional() },
    },
    {
      name: 'acc1_tool_2',
      description: 'Account 1 Tool 2',
      shape: { id: z.string() },
    },
  ] as const satisfies MockTool[];

  const acc2Tools = [
    {
      name: 'acc2_tool_1',
      description: 'Account 2 Tool 1',
      shape: { fields: z.string().optional() },
    },
    {
      name: 'acc2_tool_2',
      description: 'Account 2 Tool 2',
      shape: { id: z.string() },
    },
  ] as const satisfies MockTool[];

  const acc3Tools = [
    {
      name: 'acc3_tool_1',
      description: 'Account 3 Tool 1',
      shape: { fields: z.string().optional() },
    },
  ] as const satisfies MockTool[];

  const defaultTools = [
    {
      name: 'default_tool_1',
      description: 'Default Tool 1',
      shape: { fields: z.string().optional() },
    },
    {
      name: 'default_tool_2',
      description: 'Default Tool 2',
      shape: { id: z.string() },
    },
  ] as const satisfies MockTool[];

  let origin: string;
  let closeServer: () => void;
  let restoreMsw: (() => void) | undefined;

  beforeAll(async () => {
    mswServer.close();
    restoreMsw = () => mswServer.listen({ onUnhandledRequest: 'warn' });

    const server = await createMockMcpServer({
      default: defaultTools,
      acc1: acc1Tools,
      acc2: acc2Tools,
      acc3: acc3Tools,
    });
    origin = server.origin;
    closeServer = server.close;
  });

  afterAll(() => {
    closeServer();
    restoreMsw?.();
  });

  it('supports setAccounts() for chaining', async () => {
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
    });

    // Test chaining
    const result = toolset.setAccounts(['acc1', 'acc2']);
    expect(result).toBe(toolset);
  });

  it('fetches tools without account filtering when no accountIds provided', async () => {
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
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
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
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
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
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
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
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
  const mixedTools = [
    {
      name: 'hibob_list_employees',
      description: 'HiBob List Employees',
      shape: { fields: z.string().optional() },
    },
    {
      name: 'hibob_create_employees',
      description: 'HiBob Create Employees',
      shape: { name: z.string() },
    },
    {
      name: 'bamboohr_list_employees',
      description: 'BambooHR List Employees',
      shape: { fields: z.string().optional() },
    },
    {
      name: 'bamboohr_get_employee',
      description: 'BambooHR Get Employee',
      shape: { id: z.string() },
    },
    {
      name: 'workday_list_employees',
      description: 'Workday List Employees',
      shape: { fields: z.string().optional() },
    },
  ] as const satisfies MockTool[];

  let origin: string;
  let closeServer: () => void;
  let restoreMsw: (() => void) | undefined;

  beforeAll(async () => {
    mswServer.close();
    restoreMsw = () => mswServer.listen({ onUnhandledRequest: 'warn' });

    const server = await createMockMcpServer({
      default: mixedTools,
    });
    origin = server.origin;
    closeServer = server.close;
  });

  afterAll(() => {
    closeServer();
    restoreMsw?.();
  });

  it('filters tools by providers', async () => {
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
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
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
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
    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
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
    const acc1Tools = [
      {
        name: 'hibob_list_employees',
        description: 'HiBob List Employees',
        shape: { fields: z.string().optional() },
      },
      {
        name: 'hibob_create_employees',
        description: 'HiBob Create Employees',
        shape: { name: z.string() },
      },
    ] as const satisfies MockTool[];

    const acc2Tools = [
      {
        name: 'bamboohr_list_employees',
        description: 'BambooHR List Employees',
        shape: { fields: z.string().optional() },
      },
      {
        name: 'bamboohr_get_employee',
        description: 'BambooHR Get Employee',
        shape: { id: z.string() },
      },
    ] as const satisfies MockTool[];

    const server = await createMockMcpServer({
      acc1: acc1Tools,
      acc2: acc2Tools,
    });

    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: server.origin,
      apiKey: 'test-key',
      stackOneClient,
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

    server.close();
  });

  it('combines all filters: accountIds, providers, and actions', async () => {
    const acc1Tools = [
      {
        name: 'hibob_list_employees',
        description: 'HiBob List Employees',
        shape: { fields: z.string().optional() },
      },
      {
        name: 'hibob_create_employees',
        description: 'HiBob Create Employees',
        shape: { name: z.string() },
      },
      {
        name: 'workday_list_employees',
        description: 'Workday List Employees',
        shape: { fields: z.string().optional() },
      },
    ] as const satisfies MockTool[];

    const server = await createMockMcpServer({
      acc1: acc1Tools,
    });

    const stackOneClient = {
      actions: {
        rpcAction: vi.fn(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: server.origin,
      apiKey: 'test-key',
      stackOneClient,
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

    server.close();
  });
});
