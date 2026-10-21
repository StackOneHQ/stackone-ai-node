/**
 * Mock MCP server for testing using Hono's app.request() method.
 * This creates an MCP-compatible handler that can be used with MSW
 * without starting a real HTTP server.
 *
 * It refuses what the real endpoint refuses — an unscoped request, an unknown account — so a
 * client bug that sends no account, or the wrong one, fails here instead of in production.
 *
 * `x-account-id` may name several accounts, comma-separated, in the header or the query, as the
 * real endpoint allows; more than 50 is refused with a 400. Under `tool-mode=search_execute` it
 * serves what the real endpoint serves, with its handlers' shapes and error texts: for two or more
 * accounts the account-spanning trio — `stackone_list_accounts`, `stackone_search_actions`,
 * `stackone_execute_action` — and for one account that account's pair,
 * `<provider>_<accountId>_search_actions` and `<provider>_<accountId>_execute_action`.
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
	/** Every account the request named, deduplicated and comma-joined. */
	accountId: string;
	toolMode: string | undefined;
	name: string;
	arguments: Record<string, unknown>;
}

export interface MockMcpServerOptions {
	/** Tools available per account ID. An account not listed here is refused with a 404. */
	accountTools: Record<string, readonly McpToolDefinition[]>;
	/**
	 * The provider of each account, for `search_execute`: `mock` unless named here. Each provider
	 * serves one action, `<provider>_list_items`.
	 */
	accountProviders?: Record<string, string>;
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

/** The account-spanning tools the real endpoint serves under `tool-mode=search_execute`, for 2+ accounts. */
const sessionTools: McpToolDefinition[] = [
	{
		name: 'stackone_list_accounts',
		description:
			'Lists the accounts connected to this session as `{ id, name, connector }` objects.',
		inputSchema: { type: 'object', properties: {} },
	},
	{
		name: 'stackone_search_actions',
		description: 'Search for available actions across every connected integration.',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string' },
				top_k: { type: 'integer', minimum: 1, maximum: 50 },
				session_id: { type: 'string' },
				provider: { type: 'string' },
				stackone_account_id: { type: 'string' },
			},
			required: ['query'],
		},
	},
	{
		name: 'stackone_execute_action',
		description: 'Execute an action by its action_id.',
		inputSchema: {
			type: 'object',
			properties: {
				action_id: { type: 'string' },
				path: { type: 'object', additionalProperties: {} },
				query: { type: 'object', additionalProperties: {} },
				body: { type: 'object', additionalProperties: {} },
				headers: { type: 'object', additionalProperties: { type: 'string' } },
				session_id: { type: 'string' },
				stackone_account_id: { type: 'string' },
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

/** An account of a `search_execute` session, as the real handlers name it. */
interface SessionAccount {
	id: string;
	provider: string;
}

/** `name (id)` for each account, as the real handlers list the choices. The mock's name is the id. */
const choices = (accounts: readonly SessionAccount[]): string =>
	accounts.map(({ id }) => `${id} (${id})`).join(', ');

/** An `isError` result shaped as the real handlers' `buildErrorCallToolResult`. */
const invalid = (error: string, errorCode: string): CallToolResult =>
	text(
		{
			error,
			status_code: 400,
			error_code: errorCode,
			error_category: 'validation',
			retryable: false,
		},
		true,
	);

/** A requested `stackone_account_id`, trimmed, or undefined when none was given. */
const requestedAccount = (args: Record<string, unknown>): string | undefined =>
	typeof args.stackone_account_id === 'string' && args.stackone_account_id.trim()
		? args.stackone_account_id.trim()
		: undefined;

/**
 * A trio tool call, answered as the real session handlers answer it: search ranks one
 * `<provider>_list_items` per provider in scope; execute routes an action to the one account on
 * its provider, or asks for `stackone_account_id` when there are several.
 */
const callTrioTool = (
	name: string,
	args: Record<string, unknown>,
	accounts: readonly SessionAccount[],
): CallToolResult | undefined => {
	const providers = [...new Set(accounts.map(({ provider }) => provider))].sort();
	const unknownAccount = (id: string) =>
		invalid(
			`Account "${id}" is not part of this session. Choose one of [${choices(accounts)}] (or call stackone_list_accounts to list them).`,
			'INVALID_ACCOUNT',
		);

	if (name === 'stackone_list_accounts') {
		return wrapped({
			accounts: accounts.map(({ id, provider }) => ({ id, name: id, connector: provider })),
		});
	}

	if (name === 'stackone_search_actions') {
		const pinned = requestedAccount(args);
		if (pinned !== undefined && !accounts.some(({ id }) => id === pinned)) {
			return unknownAccount(pinned);
		}
		const searched = accounts.filter(
			({ id, provider }) =>
				(pinned === undefined || id === pinned) &&
				(typeof args.provider !== 'string' || provider === args.provider),
		);
		const searchedProviders = [...new Set(searched.map(({ provider }) => provider))].sort();
		const topK = typeof args.top_k === 'number' ? args.top_k : 10;
		const actions = searchedProviders.slice(0, topK).map((provider) => ({
			action_id: `${provider}_list_items`,
			provider,
			available_accounts: searched
				.filter((account) => account.provider === provider)
				.map(({ id }) => ({ id, name: id })),
			description: 'List items',
			similarity_score: 0.8,
			example_request: { query: { page_size: 25 } },
		}));
		return text({
			providers_searched: searchedProviders,
			session_id: MOCK_SEARCH_SESSION_ID,
			actions,
			total_count: actions.length,
			hint: 'To run an action, call stackone_execute_action with its action_id exactly as shown above.',
		});
	}

	if (name === 'stackone_execute_action') {
		const actionId = typeof args.action_id === 'string' ? args.action_id.trim() : '';
		const provider = providers
			.filter((candidate) => actionId.startsWith(`${candidate}_`))
			.sort((left, right) => right.length - left.length)[0];
		if (provider === undefined) {
			return invalid(
				`Unknown action_id "${actionId}" — it does not match any integration connected to this session ([${providers.join(', ')}]). Call stackone_search_actions first and use an action_id exactly as returned.`,
				'INVALID_ACTION',
			);
		}
		const pinned = requestedAccount(args);
		const onProvider = accounts.filter((account) => account.provider === provider);
		let account: SessionAccount | undefined;
		if (pinned !== undefined) {
			account = accounts.find(({ id }) => id === pinned);
			if (!account) {
				return unknownAccount(pinned);
			}
			if (account.provider !== provider) {
				return invalid(
					`Account "${pinned}" belongs to the ${account.provider} integration, but action "${actionId}" belongs to ${provider}. Pass a ${provider} account id (or call stackone_list_accounts to list the connected accounts).`,
					'INVALID_ACCOUNT',
				);
			}
		} else if (onProvider.length === 1) {
			account = onProvider[0];
		} else {
			return invalid(
				`stackone_execute_action runs against multiple accounts — pass "stackone_account_id", one of [${choices(onProvider)}] (or call stackone_list_accounts to list them).`,
				'INVALID_ACCOUNT',
			);
		}
		// An unknown action must come back as isError — a normal response with the flag set —
		// the way the real endpoint reports it.
		if (actionId !== `${provider}_list_items`) {
			return text({ error: `Unknown action ${actionId}`, status_code: 404 }, true);
		}
		return wrapped({
			data: { nodes: [] },
			account_id: account?.id ?? null,
			echoed_query: args.query ?? null,
			echoed_session_id: args.session_id ?? null,
		});
	}
	return undefined;
};

/**
 * The pair the real endpoint serves for a single account under `search_execute`: named for the
 * account's provider and id, each description naming the other tool, and with no
 * `stackone_account_id` or `provider` argument.
 */
const pairTools = ({ id, provider }: SessionAccount): McpToolDefinition[] => [
	{
		name: `${provider}_${id}_search_actions`,
		description: `Search the ${provider} actions of account ${id}. Run one with ${provider}_${id}_execute_action.`,
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
		name: `${provider}_${id}_execute_action`,
		description: `Execute an action found by ${provider}_${id}_search_actions.`,
		inputSchema: {
			type: 'object',
			properties: {
				action_id: {
					type: 'string',
					description: `An action_id exactly as ${provider}_${id}_search_actions returned it.`,
				},
				path: { type: 'object', additionalProperties: {} },
				query: { type: 'object', additionalProperties: {} },
				body: { type: 'object', additionalProperties: {} },
				headers: { type: 'object', additionalProperties: { type: 'string' } },
				session_id: { type: 'string' },
			},
			required: ['action_id'],
		},
	},
];

/**
 * A pair tool call, answered as the real per-account handlers answer it: search returns the
 * account's one action, without `provider` or `available_accounts` on the hit; execute runs it on
 * the account. An argument the pair does not serve is refused, so a client that forwards the
 * trio's `stackone_account_id` or `provider` fails here.
 */
const callPairTool = (
	name: string,
	args: Record<string, unknown>,
	{ id, provider }: SessionAccount,
): CallToolResult | undefined => {
	const unserved = ['stackone_account_id', 'provider'].find((key) => Object.hasOwn(args, key));
	if (unserved !== undefined) {
		return invalid(`Unexpected argument "${unserved}"`, 'INVALID_ARGUMENT');
	}

	if (name === `${provider}_${id}_search_actions`) {
		return text({
			provider,
			session_id: MOCK_SEARCH_SESSION_ID,
			actions: [
				{
					action_id: `${provider}_list_items`,
					description: 'List items',
					similarity_score: 0.8,
					example_request: { query: { page_size: 25 } },
				},
			],
			total_count: 1,
			hint: `To run an action, call ${provider}_${id}_execute_action with its action_id exactly as shown above.`,
		});
	}

	if (name === `${provider}_${id}_execute_action`) {
		const actionId = typeof args.action_id === 'string' ? args.action_id.trim() : '';
		if (actionId !== `${provider}_list_items`) {
			return text({ error: `Unknown action ${actionId}`, status_code: 404 }, true);
		}
		return wrapped({
			data: { nodes: [] },
			account_id: id,
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
	const {
		accountTools,
		accountProviders = {},
		submitFeedback = false,
		onToolCall,
		toolResults = {},
	} = options;

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
		const headerAccountId = c.req.header('x-account-id');
		const accountIds = [
			...new Set(
				(headerAccountId ? [headerAccountId] : (c.req.queries('x-account-id') ?? []))
					.flatMap((value) => value.split(','))
					.map((id) => id.trim())
					.filter(Boolean),
			),
		];
		if (accountIds.length === 0) {
			return c.json(
				{ statusCode: 400, message: 'Missing x-account-id header or query parameter in request' },
				400,
			);
		}
		// No fallback catalog either: serving one for an account that does not exist would hide
		// any bug that sends a wrong, stale or mangled account id.
		if (accountIds.length > 50) {
			return c.json({ statusCode: 400, message: 'x-account-id names more than 50 accounts' }, 400);
		}
		const unknown = accountIds.find((id) => !Object.hasOwn(accountTools, id));
		if (unknown !== undefined) {
			return c.json({ statusCode: 404, message: `Unknown account ${unknown}` }, 404);
		}
		const accountId = accountIds.join(',');
		const sessionAccounts = accountIds.map((id) => ({
			id,
			provider: accountProviders[id] ?? 'mock',
		}));
		const [onlyAccount] = sessionAccounts.length === 1 ? sessionAccounts : [];

		const toolMode = c.req.query('tool-mode');
		const searchExecuteTools = onlyAccount ? pairTools(onlyAccount) : sessionTools;
		const listed: McpToolDefinition[] = [
			...(submitFeedback ? [submitFeedbackTool] : []),
			...(toolMode === 'search_execute'
				? searchExecuteTools
				: accountIds.flatMap((id) => accountTools[id] ?? [])),
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
				(toolMode !== 'search_execute'
					? undefined
					: onlyAccount
						? callPairTool(name, args, onlyAccount)
						: callTrioTool(name, args, sessionAccounts)) ??
				wrapped({ data: { action: name, account_id: accountId, arguments: args } })
			);
		});

		// Recorded from the raw body: the server's schema parsing rebuilds the arguments, and drops
		// a `__proto__` key on the way, so a call recorded after it is not what was sent.
		if (onToolCall && c.req.method === 'POST') {
			const body = (await c.req.raw.clone().json()) as unknown;
			for (const message of Array.isArray(body) ? body : [body]) {
				const { method, params } = (message ?? {}) as {
					method?: string;
					params?: { name?: string; arguments?: Record<string, unknown> };
				};
				if (method === 'tools/call' && typeof params?.name === 'string') {
					onToolCall({ accountId, toolMode, name: params.name, arguments: params.arguments ?? {} });
				}
			}
		}

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

/** A per-action tool whose name ends like a meta tool's, served in individual mode. */
export const metaLookalikeTools = [
	{
		name: 'lookalike_execute_action',
		description: 'An action named like a meta tool',
		inputSchema: { type: 'object', properties: { action_id: { type: 'string' } } },
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
