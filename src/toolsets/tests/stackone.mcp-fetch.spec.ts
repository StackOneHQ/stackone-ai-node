import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import { StreamableHTTPTransport } from '@hono/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { StackOne } from '@stackone/stackone-client-ts';
import { Hono } from 'hono';
import { z } from 'zod';
import { server as mswServer } from '../../../mocks/node';
import { ToolSet } from '../base';

type MockTool = {
  name: string;
  description?: string;
  shape: z.ZodRawShape;
};

async function createMockMcpServer(tools: MockTool[]) {
  const mcp = new McpServer({ name: 'test-mcp', version: '1.0.0' });

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

  const app = new Hono();
  app.all('/mcp', async (c) => {
    const transport = new StreamableHTTPTransport();
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

    const server = await createMockMcpServer(mockTools);
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
    expect(aiToolDefinition.parameters.jsonSchema.properties.foo.type).toBe('string');
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
