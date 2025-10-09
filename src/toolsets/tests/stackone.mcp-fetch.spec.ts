import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import { StreamableHTTPTransport } from '@hono/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StackOne } from '@stackone/stackone-client-ts';
import { Hono } from 'hono';
import { z } from 'zod';
import { server as mswServer } from '../../../mocks/node';
import { ToolSet } from '../base';
import { StackOneToolSet } from '../stackone';

type MockTool = {
  name: string;
  description?: string;
  shape: z.ZodRawShape;
};

async function createMockMcpServer(accountTools: Record<string, MockTool[]>) {
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
          inputSchema: tool.shape,
        },
        async ({ params }) => ({
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
        foo: z.string(),
      } satisfies MockTool['shape'],
    },
  ] as const satisfies MockTool[];

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
        rpcAction: mock(async () => ({ actionsRpcResponse: { data: null } })),
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

    const aiTools = tool.toAISDK({ executable: false });
    const aiToolDefinition = aiTools.dummy_action;
    expect(aiToolDefinition).toBeDefined();
    expect(aiToolDefinition.description).toBe('Dummy tool');
    expect(aiToolDefinition.inputSchema.jsonSchema.properties.foo.type).toBe('string');
    expect(aiToolDefinition.execution).toBeUndefined();

    const executableTool = tool.toAISDK().dummy_action;
    const result = await executableTool.execute({ foo: 'bar' });

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
        rpcAction: mock(async () => ({ actionsRpcResponse: { data: null } })),
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
        rpcAction: mock(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
    });

    const tools = await toolset.fetchTools();
    expect(tools.length).toBe(2);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('default_tool_1');
    expect(toolNames).toContain('default_tool_2');
  });

  it('uses x-account-id header when fetching tools with accountIds', async () => {
    const stackOneClient = {
      actions: {
        rpcAction: mock(async () => ({ actionsRpcResponse: { data: null } })),
      },
    } as unknown as StackOne;

    const toolset = new StackOneToolSet({
      baseUrl: origin,
      apiKey: 'test-key',
      stackOneClient,
    });

    // Fetch tools for acc1
    const tools = await toolset.fetchTools({ accountIds: ['acc1'] });
    expect(tools.length).toBe(2);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('acc1_tool_1');
    expect(toolNames).toContain('acc1_tool_2');
  });

  it('uses setAccounts when no accountIds provided in fetchTools', async () => {
    const stackOneClient = {
      actions: {
        rpcAction: mock(async () => ({ actionsRpcResponse: { data: null } })),
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
    // acc1 has 2 tools, acc2 has 2 tools, so total should be 4
    expect(tools.length).toBe(4);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('acc1_tool_1');
    expect(toolNames).toContain('acc1_tool_2');
    expect(toolNames).toContain('acc2_tool_1');
    expect(toolNames).toContain('acc2_tool_2');
  });

  it('overrides setAccounts when accountIds provided in fetchTools', async () => {
    const stackOneClient = {
      actions: {
        rpcAction: mock(async () => ({ actionsRpcResponse: { data: null } })),
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

    // Should fetch tools only for acc3 (ignoring acc1, acc2)
    expect(tools.length).toBe(1);
    const toolNames = tools.toArray().map((t) => t.name);
    expect(toolNames).toContain('acc3_tool_1');
  });
});
