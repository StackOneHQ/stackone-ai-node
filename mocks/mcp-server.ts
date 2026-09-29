/**
 * Mock MCP server for testing using Hono's app.request() method.
 * This creates an MCP-compatible handler that can be used with MSW
 * without starting a real HTTP server.
 *
 * It refuses what the real endpoint refuses — an unscoped request, an unknown account — so a
 * client bug that sends no account, or the wrong one, fails here instead of in production.
 */
import type { Hono as HonoApp } from 'hono';
import { StreamableHTTPTransport } from '@hono/mcp';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
	CallToolRequestSchema,
	type CallToolResult,
	ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
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
		[keyword: string]: unknown;
	};
}

/** A `tools/call` exactly as it reached the server. */
export interface RecordedToolCall {
	accountId: string;
	toolMode: string | undefined;
	name: string;
	arguments: Record<string, unknown>;
}

export interface MockMcpServerOptions {
	/** Tools available per account ID. An account not listed here is refused with a 404. */
	accountTools: Record<string, readonly McpToolDefinition[]>;
	/**
	 * Serve the global `stackone_submit_feedback` tool, in every tool mode, the way the real
	 * endpoint does when the org flag and project setting are on. Off models a project without
	 * it: the tool is simply absent, so the SDK has nothing to call.
	 */
	submitFeedback?: boolean;
	/** Observe every `tools/call` as it arrived, before any schema parsing. */
	onToolCall?: (call: RecordedToolCall) => void;
	/** Answer a `tools/call` for these tool names with this literal result, verbatim. */
	toolResults?: Record<string, CallToolResult>;
}

/** Mirrors the real `session_id` minted per search, so tests can assert it is carried through. */
export const MOCK_SEARCH_SESSION_ID = 'mock-session-1';

/** The schema the real endpoint serves for its feedback tool, field for field. */
const submitFeedbackTool = {
	name: 'stackone_submit_feedback',
	description: 'Records a structured verdict on how well the tools served this session.',
	inputSchema: {
		type: 'object',
		properties: {
			rating: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
			feedback: { type: 'string' },
			tool_names: { type: 'array', items: { type: 'string' } },
			source: { type: 'string', enum: ['model', 'user', 'system'], default: 'model' },
			category: {
				type: 'string',
				enum: ['search', 'execute', 'defender', 'connection', 'general'],
			},
			session_id: { type: 'string' },
		},
		required: ['rating', 'tool_names'],
	},
} as const satisfies McpToolDefinition;

/** The two meta tools the real endpoint serves per connector under `tool-mode=search_execute`. */
const metaTools = (accountId: string): McpToolDefinition[] => [
	{
		name: `mock_${accountId}_search_actions`,
		description: 'Search for available actions in natural language.',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string' },
				top_k: { type: 'integer', minimum: 1, maximum: 50 },
				session_id: { type: 'string' },
			},
			required: ['query'],
		},
	},
	{
		name: `mock_${accountId}_execute_action`,
		description: 'Execute an action by its action_id.',
		inputSchema: {
			type: 'object',
			properties: {
				action_id: { type: 'string' },
				path: { type: 'object' },
				query: { type: 'object' },
				body: { type: 'object' },
				headers: { type: 'object' },
				session_id: { type: 'string' },
			},
			required: ['action_id'],
		},
	},
];

const text = (payload: unknown, isError = false): CallToolResult => ({
	isError,
	content: [{ type: 'text', text: JSON.stringify(payload) }],
});

/**
 * A success the way the real endpoint answers every action tool, `*_execute_action` and feedback:
 * `{ isError: false, result }` in `structuredContent`, mirrored as a text part.
 */
const wrapped = (result: unknown): CallToolResult => {
	const structuredContent = { isError: false, result };
	return {
		isError: false,
		content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
		structuredContent,
	};
};

const callMetaTool = (name: string, args: Record<string, unknown>): CallToolResult | undefined => {
	if (name.endsWith('_search_actions')) {
		return text({
			session_id: MOCK_SEARCH_SESSION_ID,
			actions: [
				{
					action_id: 'mock_list_items',
					description: 'List items',
					similarity_score: 0.8,
					example_request: { query: { page_size: 25 } },
				},
			],
		});
	}
	if (name.endsWith('_execute_action')) {
		// An unknown action must come back as isError — a normal response with the flag set —
		// the way the real endpoint reports it.
		if (args.action_id !== 'mock_list_items') {
			return text({ error: `Unknown action ${String(args.action_id)}`, status_code: 404 }, true);
		}
		return wrapped({
			data: { nodes: [] },
			echoed_query: args.query ?? null,
			echoed_session_id: args.session_id ?? null,
		});
	}
	return undefined;
};

/**
 * Creates a Hono app speaking the MCP protocol at `/mcp`, for use from an MSW handler.
 *
 * @example
 * ```ts
 * import { server } from './mocks/node';
 * import { createMcpApp, accountMcpTools } from './mocks/mcp-server';
 *
 * const app = createMcpApp({ accountTools: { acc1: accountMcpTools.acc1 } });
 * server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));
 * ```
 */
export function createMcpApp(options: MockMcpServerOptions): HonoApp {
	const { accountTools, submitFeedback = false, onToolCall, toolResults = {} } = options;

	// Create a Hono app that handles MCP protocol
	const app = new Hono();

	// Apply Basic Auth middleware with hardcoded test credentials
	app.use(
		'/mcp',
		basicAuth({
			username: 'test-key',
			password: '',
		}),
	);

	app.all('/mcp', async (c) => {
		// The real endpoint rejects a request with no account. Defaulting here made the mock more
		// permissive than production and hid a fatal SDK bug: an SDK that never sent the header
		// still got a full catalog.
		const accountId = c.req.header('x-account-id') ?? c.req.query('x-account-id');
		if (!accountId) {
			return c.json(
				{ statusCode: 400, message: 'Missing x-account-id header or query parameter in request' },
				400,
			);
		}
		// No fallback catalog either: serving one for an account that does not exist would hide
		// any bug that sends a wrong, stale or mangled account id.
		if (!Object.hasOwn(accountTools, accountId)) {
			return c.json({ statusCode: 404, message: `Unknown account ${accountId}` }, 404);
		}

		const toolMode = c.req.query('tool-mode');
		const listed: McpToolDefinition[] = [
			...(submitFeedback ? [submitFeedbackTool] : []),
			...(toolMode === 'search_execute' ? metaTools(accountId) : (accountTools[accountId] ?? [])),
		];

		// A low-level Server rather than McpServer: McpServer.registerTool expects a Zod shape and
		// lists a plain JSON Schema as `properties: {}`. The real endpoint serves each schema
		// verbatim, and so does this.
		const mcp = new Server(
			{ name: 'test-mcp-server', version: '1.0.0' },
			{ capabilities: { tools: {} } },
		);
		mcp.setRequestHandler(ListToolsRequestSchema, () => ({
			tools: listed.map((tool) => ({ ...tool, inputSchema: structuredClone(tool.inputSchema) })),
		}));
		mcp.setRequestHandler(CallToolRequestSchema, (request): CallToolResult => {
			const { name } = request.params;
			const args = request.params.arguments ?? {};
			onToolCall?.({ accountId, toolMode, name, arguments: structuredClone(args) });

			if (!listed.some((tool) => tool.name === name)) {
				return text({ error: `Unknown tool ${name}`, status_code: 404 }, true);
			}
			const literal = toolResults[name];
			if (literal) {
				return structuredClone(literal);
			}
			if (name === submitFeedbackTool.name) {
				return wrapped({
					message: 'Feedback recorded',
					submitted_at: new Date(0).toISOString(),
					session_id: args.session_id ?? null,
				});
			}
			// An action tool echoes what reached it, so a test can see the arguments and account.
			return (
				callMetaTool(name, args) ??
				wrapped({ data: { action: name, account_id: accountId, arguments: args } })
			);
		});

		const transport = new StreamableHTTPTransport();
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
	],
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
	],
	acc3: [
		{
			name: 'acc3_tool_1',
			description: 'Account 3 Tool 1',
			inputSchema: {
				type: 'object',
				properties: { fields: { type: 'string' } },
			},
		},
	],
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
	],
} as const satisfies Record<string, McpToolDefinition[]>;

/** Tools for the quickstart and example tests */
export const exampleBamboohrTools = [
	{
		name: 'bamboohr_list_employees',
		description: 'List all employees from BambooHR',
		inputSchema: {
			type: 'object',
			properties: {
				query: {
					type: 'object',
					properties: {
						limit: { type: 'number', description: 'Limit the number of results' },
					},
				},
			},
		},
	},
	{
		name: 'bamboohr_get_employee',
		description: 'Get a single employee by ID from BambooHR',
		inputSchema: {
			type: 'object',
			properties: {
				id: { type: 'string', description: 'The employee ID' },
				fields: { type: 'string', description: 'Fields to retrieve' },
			},
			required: ['id'],
		},
	},
	{
		name: 'bamboohr_create_employee',
		description: 'Create a new employee in BambooHR',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Employee name' },
				personal_email: { type: 'string', description: 'Employee email' },
				department: { type: 'string', description: 'Department name' },
				start_date: { type: 'string', description: 'Start date' },
				hire_date: { type: 'string', description: 'Hire date' },
			},
			required: ['name'],
		},
	},
] as const satisfies McpToolDefinition[];

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
