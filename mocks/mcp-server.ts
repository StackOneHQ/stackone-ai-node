/**
 * Mock MCP server for testing using Hono's app.request() method.
 * This creates an MCP-compatible handler that can be used with MSW
 * without starting a real HTTP server.
 */
import type { Hono as HonoApp } from 'hono';
import { http, HttpResponse } from 'msw';
import { StreamableHTTPTransport } from '@hono/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';

export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface MockMcpServerOptions {
  /** Tools available per account ID. Use 'default' for tools when no account header is provided. */
  accountTools: Record<string, readonly McpToolDefinition[]>;
}

/**
 * Creates an MSW handler for mocking MCP protocol requests.
 * Uses Hono's app.request() to handle requests without starting a server.
 *
 * @example
 * ```ts
 * import { server } from './mocks/node';
 * import { createMcpHandler, defaultMcpTools, accountMcpTools } from './mocks/mcp-server';
 *
 * // In your test setup
 * server.use(
 *   createMcpHandler({
 *     accountTools: {
 *       default: defaultMcpTools,
 *       'account-1': accountMcpTools.acc1,
 *     },
 *   })
 * );
 * ```
 */
export function createMcpApp(options: MockMcpServerOptions): HonoApp {
  const { accountTools } = options;

  // Create a Hono app that handles MCP protocol
  const app = new Hono();

  // Apply Basic Auth middleware with hardcoded test credentials
  app.use(
    '/mcp',
    basicAuth({
      username: 'test-key',
      password: '',
    })
  );

  app.all('/mcp', async (c) => {
    // Get account ID from header
    const accountId = c.req.header('x-account-id') ?? 'default';
    const tools = accountTools[accountId] ?? accountTools.default ?? [];

    // Create a new MCP server instance per request
    const mcp = new McpServer({ name: 'test-mcp-server', version: '1.0.0' });
    const transport = new StreamableHTTPTransport();

    for (const tool of tools) {
      mcp.registerTool(
        tool.name,
        {
          description: tool.description,
          // MCP SDK expects Zod-like schema but accepts JSON Schema objects
          // biome-ignore lint/suspicious/noExplicitAny: MCP SDK type mismatch
          inputSchema: tool.inputSchema as any,
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

  return app;
}

// Pre-defined tool sets for common test scenarios

export const defaultMcpTools = [
  {
    name: 'default_tool_1',
    description: 'Default Tool 1',
    inputSchema: {
      type: 'object',
      properties: { fields: { type: 'string' } },
    },
  },
  {
    name: 'default_tool_2',
    description: 'Default Tool 2',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
] as const satisfies McpToolDefinition[];

export const accountMcpTools = {
  acc1: [
    {
      name: 'acc1_tool_1',
      description: 'Account 1 Tool 1',
      inputSchema: {
        type: 'object',
        properties: { fields: { type: 'string' } },
      },
    },
    {
      name: 'acc1_tool_2',
      description: 'Account 1 Tool 2',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  ] as const satisfies McpToolDefinition[],
  acc2: [
    {
      name: 'acc2_tool_1',
      description: 'Account 2 Tool 1',
      inputSchema: {
        type: 'object',
        properties: { fields: { type: 'string' } },
      },
    },
    {
      name: 'acc2_tool_2',
      description: 'Account 2 Tool 2',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  ] as const satisfies McpToolDefinition[],
  acc3: [
    {
      name: 'acc3_tool_1',
      description: 'Account 3 Tool 1',
      inputSchema: {
        type: 'object',
        properties: { fields: { type: 'string' } },
      },
    },
  ] as const satisfies McpToolDefinition[],
  'test-account': [
    {
      name: 'dummy_action',
      description: 'Dummy tool',
      inputSchema: {
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
  ] as const satisfies McpToolDefinition[],
} as const;

export const mixedProviderTools = [
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
  {
    name: 'workday_list_employees',
    description: 'Workday List Employees',
    inputSchema: {
      type: 'object',
      properties: { fields: { type: 'string' } },
    },
  },
] as const satisfies McpToolDefinition[];
