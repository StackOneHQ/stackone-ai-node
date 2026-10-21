/**
 * search(), execute() and submitFeedback(): the recommended surface, over the account-spanning
 * `stackone_search_actions` / `stackone_execute_action` and the server's `stackone_submit_feedback`.
 */
import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { MOCK_SEARCH_SESSION_ID, type RecordedToolCall, createMcpApp } from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { type McpToolDefinition, listMcpTools } from './mcp-client';
import { StackOneMcpTool } from './tool';
import { StackOneToolSet } from './toolsets';
import type { JsonObject } from './types';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';
import { ToolArgumentsError } from './utils/error-tool-arguments';
import { ToolSetConfigError, ToolSetLoadError } from './utils/error-toolset';

vi.mock('./mcp-client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./mcp-client')>();
	return { ...actual, listMcpTools: vi.fn(actual.listMcpTools) };
});
const listMock = vi.mocked(listMcpTools);
const { listMcpTools: realListMcpTools } =
	await vi.importActual<typeof import('./mcp-client')>('./mcp-client');

const newToolSet = (config: ConstructorParameters<typeof StackOneToolSet>[0] = {}) =>
	new StackOneToolSet({ apiKey: 'test-key', baseUrl: TEST_BASE_URL, ...config });

beforeEach(() => {
	vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
	listMock.mockReset();
	listMock.mockImplementation(realListMcpTools);
});

const SESSION_TOOL_NAMES = [
	'stackone_list_accounts',
	'stackone_search_actions',
	'stackone_execute_action',
];

/**
 * Serve these tool names on every listing and replace the tools/call with `respond` — as the
 * Python suite monkeypatches `StackOneMcpTool.execute`.
 */
const fakeSessionTools = (
	respond: (tool: StackOneMcpTool, args: JsonObject) => JsonObject | Promise<JsonObject> = () => ({
		data: {},
	}),
	names: string[] = SESSION_TOOL_NAMES,
) => {
	listMock.mockImplementation(async () =>
		names.map((name): McpToolDefinition => ({ name, description: '', inputSchema: {} })),
	);
	const calls: Array<{ tool: string; args: JsonObject }> = [];
	vi.spyOn(StackOneMcpTool.prototype, 'execute').mockImplementation(async function (
		this: StackOneMcpTool,
		args,
	) {
		calls.push({ tool: this.name, args: args as JsonObject });
		return respond(this, args as JsonObject);
	});
	return calls;
};

/** Serve the real mock MCP app, recording every tools/call as it reached the wire. */
const serveMock = (
	options: {
		accountTools?: Parameters<typeof createMcpApp>[0]['accountTools'];
		accountProviders?: Record<string, string>;
		submitFeedback?: boolean;
	} = {},
) => {
	const calls: RecordedToolCall[] = [];
	const requests: Request[] = [];
	let rpcRequests = 0;
	const app = createMcpApp({
		accountTools: options.accountTools ?? { default: [], acc1: [] },
		accountProviders: options.accountProviders,
		submitFeedback: options.submitFeedback,
		onToolCall: (call) => calls.push(call),
	});
	server.use(
		http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => {
			requests.push(request.clone());
			return app.fetch(request);
		}),
		http.post(`${TEST_BASE_URL}/actions/rpc`, () => {
			rpcRequests += 1;
			return HttpResponse.json({ data: {} });
		}),
	);
	return { calls, requests, rpcRequests: () => rpcRequests };
};

/** Serve `accounts` from GET /accounts. */
const serveAccounts = (accounts: JsonObject[]) =>
	server.use(http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.json(accounts)));

/** The endpoint of every listing so far. */
const listedEndpoints = () => listMock.mock.calls.map(([request]) => request.endpoint);

describe('the search_execute listing', () => {
	it('lists the trio once for the whole scope, the accounts as one comma-separated query value', async () => {
		const { requests } = serveMock({ accountTools: { acc1: [], acc2: [], acc3: [] } });

		const tools = await newToolSet({ accountIds: ['acc3', 'acc1', 'acc3', 'acc2'] }).fetchTools({
			mode: 'search_execute',
		});

		expect(tools.toArray().map((tool) => tool.name)).toEqual(SESSION_TOOL_NAMES);
		expect(listedEndpoints()).toEqual([
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc1%2Cacc2%2Cacc3`,
		]);
		expect(requests.every((request) => request.headers.get('x-account-id') === null)).toBe(true);
	});

	it('refuses more than 50 accounts before any request', async () => {
		const accountIds = Array.from({ length: 51 }, (_, index) => `acc${index}`);

		const error = await newToolSet({ accountIds })
			.fetchTools({ mode: 'search_execute' })
			.catch((caught: unknown) => caught);

		expect(error).toEqual(
			new ToolSetConfigError(
				'51 accounts are in scope, but search and execute span at most 50 in one request. Pass account ids to narrow the scope.',
			),
		);
		expect(error).toBeInstanceOf(ToolSetConfigError);
		expect(listMock).not.toHaveBeenCalled();
	});

	it('lists 50 accounts in one request', async () => {
		fakeSessionTools();
		const accountIds = Array.from({ length: 50 }, (_, index) => `acc${index}`);

		await newToolSet({ accountIds }).search('x');

		expect(listMock).toHaveBeenCalledOnce();
	});

	it('binds its tools to no account, executing on the endpoint that listed them', async () => {
		const { calls, requests } = serveMock({ accountTools: { acc1: [], acc2: [] } });
		const tools = await newToolSet({ accountIds: ['acc1', 'acc2'] }).fetchTools({
			mode: 'search_execute',
		});
		const execute = tools
			.getStackOneTools()
			.find((tool) => tool.name === 'stackone_execute_action');
		requests.length = 0;

		await execute?.execute({ action_id: 'mock_list_items', stackone_account_id: 'acc2' });

		expect(execute?.getAccountId()).toBeUndefined();
		expect(calls.map((call) => call.accountId)).toEqual(['acc1,acc2']);
		expect(new Set(requests.map((request) => request.url))).toEqual(
			new Set([listedEndpoints()[0]]),
		);
	});

	it('sends each recorded end user of a non-shared account in scope, once', async () => {
		serveMock({ accountTools: { acc1: [], acc2: [], acc3: [] } });
		serveAccounts([
			{ id: 'acc1', provider: 'mock', status: 'active', shared: false, origin_username: 'bob' },
			{ id: 'acc2', provider: 'mock', status: 'active', shared: true, origin_username: 'zed' },
			{ id: 'acc3', provider: 'mock', status: 'active', shared: false, origin_username: 'bob' },
		]);
		const toolset = newToolSet({ includeNonShared: true });

		await toolset.fetchTools({ mode: 'search_execute' });

		expect(listedEndpoints()).toEqual([
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc1%2Cacc2%2Cacc3&x-end-user-id=bob`,
		]);
	});

	it('looks up an end user the server asks for, then lists again with it', async () => {
		const app = createMcpApp({ accountTools: { acc1: [], acc2: [] } });
		let accountRequests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () => {
				accountRequests += 1;
				return HttpResponse.json([
					{ id: 'acc1', provider: 'mock', status: 'active', shared: true },
					{ id: 'acc2', provider: 'mock', status: 'active', shared: false, origin_username: 'eve' },
				]);
			}),
			http.all(`${TEST_BASE_URL}/mcp`, ({ request }) =>
				new URL(request.url).searchParams.getAll('x-end-user-id').includes('eve')
					? app.fetch(request)
					: HttpResponse.json(
							{
								statusCode: 400,
								message: 'x-end-user-id header does not match account end user id for account acc2',
							},
							{ status: 400 },
						),
			),
		);

		const tools = await newToolSet({ accountIds: ['acc1', 'acc2'] }).fetchTools({
			mode: 'search_execute',
		});

		expect(tools.toArray().map((tool) => tool.name)).toEqual(SESSION_TOOL_NAMES);
		expect(accountRequests).toBe(1);
		expect(listedEndpoints().at(-1)).toBe(
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc1%2Cacc2&x-end-user-id=eve`,
		);
	});

	// One request lists the whole scope, so there is no account to skip.
	it('fails the call when the listing fails', async () => {
		serveMock({ accountTools: { acc1: [] } });

		const error = await newToolSet({ accountIds: ['acc1', 'gone'] })
			.fetchTools({ mode: 'search_execute' })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(404);
	});

	it('is cached per scope', async () => {
		serveMock({ accountTools: { acc1: [], acc2: [] } });
		const toolset = newToolSet({ accountIds: ['acc1', 'acc2'] });

		await toolset.fetchTools({ mode: 'search_execute' });
		await toolset.fetchTools({ mode: 'search_execute', accountIds: ['acc2', 'acc1'] });
		await toolset.fetchTools({ mode: 'search_execute', accountIds: ['acc1'] });

		expect(listedEndpoints()).toEqual([
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc1%2Cacc2`,
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc1`,
		]);
	});

	it('narrows the scope to the accounts on the given providers', async () => {
		serveMock({ accountTools: { acc1: [], acc2: [], acc3: [] } });
		serveAccounts([
			{ id: 'acc1', provider: 'linear', status: 'active' },
			{ id: 'acc2', provider: 'HiBob', status: 'active' },
			{ id: 'acc3', provider: 'jira', status: 'active' },
		]);

		const tools = await newToolSet({ accountIds: ['acc1', 'acc2', 'acc3'] }).fetchTools({
			mode: 'search_execute',
			providers: ['hibob', 'Linear'],
		});

		expect(tools.toArray().map((tool) => tool.name)).toEqual(SESSION_TOOL_NAMES);
		expect(listedEndpoints()).toEqual([
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc1%2Cacc2`,
		]);
	});

	it('lists nothing when no account in scope is on the given providers', async () => {
		serveMock({ accountTools: { acc1: [] } });
		serveAccounts([{ id: 'acc1', provider: 'linear', status: 'active' }]);

		const tools = await newToolSet({ accountId: 'acc1' }).fetchTools({
			mode: 'search_execute',
			providers: ['jira'],
		});

		expect(tools.length).toBe(0);
		expect(listMock).not.toHaveBeenCalled();
	});

	it('still filters tool names by actions', async () => {
		serveMock();
		const tools = await newToolSet({ accountId: 'acc1' }).fetchTools({
			mode: 'search_execute',
			actions: ['*_search_actions'],
		});
		expect(tools.toArray().map((tool) => tool.name)).toEqual(['stackone_search_actions']);
	});
});

/**
 * Contract v2 rule 3: for one account the server serves `<provider>_<accountId>_search_actions` and
 * `_execute_action`, which the SDK presents under the trio's names.
 */
describe('one account: the served pair under the trio’s names', () => {
	const pairTool = async (name: string, accountId = 'acc1') => {
		const tools = await newToolSet({ accountId }).fetchTools({ mode: 'search_execute' });
		return tools.getStackOneTool(name);
	};

	it('presents the pair as stackone_search_actions and stackone_execute_action', async () => {
		serveMock({ submitFeedback: true });

		const tools = await newToolSet({ accountId: 'acc1' }).fetchTools({ mode: 'search_execute' });

		expect(tools.toArray().map((tool) => tool.name)).toEqual([
			'stackone_submit_feedback',
			'stackone_search_actions',
			'stackone_execute_action',
		]);
	});

	it('shows a model the same tools for one account as for several, but stackone_list_accounts', async () => {
		serveMock({ accountTools: { acc1: [], acc2: [] } });
		const toolset = newToolSet();

		const one = await toolset.fetchTools({ mode: 'search_execute', accountIds: ['acc1'] });
		const many = await toolset.fetchTools({ mode: 'search_execute', accountIds: ['acc1', 'acc2'] });

		expect(one.toArray().map((tool) => tool.name)).toEqual(
			many
				.toArray()
				.map((tool) => tool.name)
				.filter((name) => name !== 'stackone_list_accounts'),
		);
	});

	it('reads the trio’s names wherever its description and schema name the served tools', async () => {
		serveMock();

		const search = await pairTool('stackone_search_actions');
		const execute = await pairTool('stackone_execute_action');

		expect(search.description).toBe(
			'Search the mock actions of account acc1. Run one with stackone_execute_action.',
		);
		expect(execute.description).toBe('Execute an action found by stackone_search_actions.');
		expect(execute.toJsonSchema().properties?.action_id?.description).toBe(
			'An action_id exactly as stackone_search_actions returned it.',
		);
		expect(JSON.stringify([search.toJsonSchema(), execute.toJsonSchema()])).not.toMatch(
			/mock_acc1_/,
		);
	});

	it('calls the served tool on the same endpoint, and renames it in the result’s strings', async () => {
		const { calls } = serveMock();
		const search = await pairTool('stackone_search_actions');

		const result = await search.execute({ query: 'list items' });

		expect(calls.map((call) => [call.name, call.accountId])).toEqual([
			['mock_acc1_search_actions', 'acc1'],
		]);
		expect(result.hint).toBe(
			'To run an action, call stackone_execute_action with its action_id exactly as shown above.',
		);
	});

	it('gives each hit the account and connector it runs on', async () => {
		serveMock();

		const hits = await newToolSet({ accountId: 'acc1' }).search('list items');

		expect(hits).toEqual([
			{
				action_id: 'mock_list_items',
				description: 'List items',
				similarity_score: 0.8,
				example_request: { query: { page_size: 25 } },
				provider: 'mock',
				available_accounts: [{ id: 'acc1' }],
				session_id: MOCK_SEARCH_SESSION_ID,
			},
		]);
	});

	it('keeps the account and connector a hit already names', async () => {
		fakeSessionTools(
			(): JsonObject => ({
				actions: [
					{
						action_id: 'linear_a',
						provider: 'Linear',
						available_accounts: [{ id: 'acc1', name: 'A' }],
					},
					{ action_id: 'linear_b' },
				],
			}),
			['linear_acc1_search_actions', 'linear_acc1_execute_action'],
		);

		const hits = await newToolSet({ accountId: 'acc1' }).search('x');

		expect(hits).toEqual([
			{
				action_id: 'linear_a',
				provider: 'Linear',
				available_accounts: [{ id: 'acc1', name: 'A' }],
			},
			{ action_id: 'linear_b', provider: 'linear', available_accounts: [{ id: 'acc1' }] },
		]);
	});

	it('runs execute() on the one account, dropping the stackone_account_id it names', async () => {
		const { calls } = serveMock({ accountTools: { acc1: [], acc2: [] } });

		const result = await newToolSet({ accountIds: ['acc1', 'acc2'] }).execute(
			'mock_list_items',
			{ query: { page_size: 1 } },
			{ sessionId: MOCK_SEARCH_SESSION_ID, accountIds: ['acc2'] },
		);

		expect((result.result as JsonObject).account_id).toBe('acc2');
		expect(calls).toEqual([
			{
				accountId: 'acc2',
				toolMode: 'search_execute',
				name: 'mock_acc2_execute_action',
				arguments: {
					query: { page_size: 1 },
					session_id: MOCK_SEARCH_SESSION_ID,
					action_id: 'mock_list_items',
				},
			},
		]);
	});

	it.each([
		['stackone_search_actions', { query: 'x' }],
		['stackone_execute_action', { action_id: 'mock_list_items' }],
	])(
		'%s drops a stackone_account_id and provider naming its own account and connector',
		async (name, args) => {
			const { calls } = serveMock();
			const tool = await pairTool(name);

			await tool.execute({ ...args, stackone_account_id: 'acc1', provider: 'MOCK' });
			await tool.execute({ ...args, stackone_account_id: null, provider: null });

			expect(calls.map((call) => call.arguments)).toEqual([args, args]);
		},
	);

	it('reports a failed call in the trio’s names', async () => {
		serveMock();
		const tool = await pairTool('stackone_execute_action');

		const error = await tool
			.execute({ action_id: 'mock_unknown' })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		const text = `${(error as Error).message} ${JSON.stringify((error as StackOneAPIError).responseBody)}`;
		expect(text).not.toContain('mock_acc1_');
		expect((error as Error).message).toContain('"stackone_execute_action"');
		expect((error as StackOneAPIError).statusCode).toBe(404);
	});

	it('refuses a stackone_account_id outside the scope, before any call', async () => {
		const { calls } = serveMock();
		const tool = await pairTool('stackone_execute_action');

		const error = await tool
			.execute({ action_id: 'mock_list_items', stackone_account_id: 'acc2' })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolArgumentsError);
		expect((error as Error).message).toBe(
			'stackone_account_id "acc2" is not an account "stackone_execute_action" can run on; it runs on "acc1".',
		);
		expect(calls).toEqual([]);
	});

	it('refuses a provider outside the scope, before any call', async () => {
		const { calls } = serveMock();
		const tool = await pairTool('stackone_search_actions');

		const error = await tool
			.execute({ query: 'x', provider: 'jira' })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolArgumentsError);
		expect((error as Error).message).toBe(
			'provider "jira" is not linked in this account scope, which has "mock".',
		);
		expect(calls).toEqual([]);
	});

	it('reads the connector of a provider whose name holds underscores', async () => {
		const { calls } = serveMock({ accountProviders: { acc1: 'browser_linkedin' } });
		const tool = await pairTool('stackone_search_actions');

		const result = await tool.execute({ query: 'x', provider: 'browser_linkedin' });

		expect(calls.map((call) => call.name)).toEqual(['browser_linkedin_acc1_search_actions']);
		expect(result.actions).toEqual([
			expect.objectContaining({
				provider: 'browser_linkedin',
				available_accounts: [{ id: 'acc1' }],
			}),
		]);
	});
});

describe('search()', () => {
	it('finds actions with nothing but an API key', async () => {
		serveMock();
		const actions = await newToolSet().search('list items');
		expect(actions.map((action) => action.action_id)).toEqual(['mock_list_items']);
	});

	it('makes one stackone_search_actions call, passing top_k through', async () => {
		const { calls } = serveMock({ accountTools: { acc1: [], acc2: [] } });

		await newToolSet({ accountIds: ['acc2', 'acc1'] }).search('list items', { topK: 7 });

		expect(calls).toEqual([
			{
				accountId: 'acc1,acc2',
				toolMode: 'search_execute',
				name: 'stackone_search_actions',
				arguments: { query: 'list items', top_k: 7 },
			},
		]);
	});

	// Contract §4: each hit as served, plus the session_id of the search that produced it.
	it('returns each hit as served, with the accounts that can run it and the session_id', async () => {
		serveMock({ accountTools: { acc1: [], acc2: [] } });

		const hits = await newToolSet({ accountIds: ['acc1', 'acc2'] }).search('list items');

		expect(hits).toEqual([
			{
				action_id: 'mock_list_items',
				provider: 'mock',
				available_accounts: [
					{ id: 'acc1', name: 'acc1' },
					{ id: 'acc2', name: 'acc2' },
				],
				description: 'List items',
				similarity_score: 0.8,
				example_request: { query: { page_size: 25 } },
				session_id: MOCK_SEARCH_SESSION_ID,
			},
		]);
	});

	it('omits session_id when the server issues none', async () => {
		fakeSessionTools(() => ({ actions: [{ action_id: 'a_x' }], session_id: '' }));
		const [hit] = await newToolSet({ accountId: 'acc1' }).search('x');
		expect(hit).toEqual({ action_id: 'a_x' });
	});

	// The server lists a synced copy or a prerequisite beside the hits it ranked.
	it('cuts the result to topK, in the order served', async () => {
		fakeSessionTools(() => ({
			actions: [{ action_id: 'a_1' }, { action_id: 'b_1' }, { action_id: 'c_1' }],
		}));
		const hits = await newToolSet({ accountId: 'acc1' }).search('x', { topK: 2 });
		expect(hits.map((hit) => hit.action_id)).toEqual(['a_1', 'b_1']);
	});

	it('raises the server’s error rather than returning nothing', async () => {
		fakeSessionTools(() => {
			throw new StackOneAPIError('Tool "stackone_search_actions" failed: down', 503, {});
		});
		await expect(newToolSet({ accountId: 'acc1' }).search('x')).rejects.toBeInstanceOf(
			StackOneAPIError,
		);
	});

	it('explains a listing without stackone_search_actions', async () => {
		fakeSessionTools(undefined, ['stackone_list_accounts']);
		await expect(newToolSet({ accountId: 'acc1' }).search('x')).rejects.toThrow(
			new ToolSetLoadError(
				'The server did not serve stackone_search_actions for this account scope.',
			),
		);
	});

	it.each([0, -1, 51, 1000, 1.5, Number.NaN, '10', null, true])(
		'rejects topK=%j before any round trip',
		async (topK) => {
			await expect(
				newToolSet({ accountId: 'acc1' }).search('x', { topK: topK as never }),
			).rejects.toThrow(/topK must be an integer between 1 and 50/);
			expect(listMock).not.toHaveBeenCalled();
		},
	);

	it.each([1, 50])('accepts topK=%i', async (topK) => {
		fakeSessionTools(() => ({ actions: [] }));
		await expect(newToolSet({ accountId: 'acc1' }).search('x', { topK })).resolves.toEqual([]);
	});

	it('uses the search_execute listing even when the toolset lists individual tools', async () => {
		serveMock();
		const toolset = newToolSet({ accountId: 'acc1' });

		await toolset.search('x');
		await toolset.fetchTools();

		expect(listedEndpoints()).toEqual([
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc1`,
			`${TEST_BASE_URL}/mcp`,
		]);
	});
});

describe('execute()', () => {
	it('runs a searched action', async () => {
		serveMock();
		const toolset = newToolSet();
		const [hit] = await toolset.search('list items');

		expect(await toolset.execute(hit?.action_id ?? '')).toMatchObject({
			isError: false,
			result: { data: { nodes: [] } },
		});
	});

	it('passes the nested envelope through verbatim', async () => {
		serveMock();
		const toolset = newToolSet();
		const [hit] = await toolset.search('list items');
		expect(hit?.example_request).toEqual({ query: { page_size: 25 } });

		const result = await toolset.execute(hit?.action_id ?? '', hit?.example_request as JsonObject);

		expect((result.result as JsonObject).echoed_query).toEqual({ page_size: 25 });
	});

	// Contract §5: stackone_account_id for exactly one account, session_id when given, action_id last.
	it('sends the one account as stackone_account_id, then session_id, then action_id', async () => {
		const calls = fakeSessionTools();

		await newToolSet({ accountIds: ['acc1', 'acc2'] }).execute(
			'mock_list_items',
			{ query: { page_size: 1 }, stackone_account_id: 'acc1' },
			{ sessionId: MOCK_SEARCH_SESSION_ID, accountIds: ['acc2', 'acc2'] },
		);

		expect(calls.map((call) => call.tool)).toEqual(['stackone_execute_action']);
		expect(Object.entries(calls[0]?.args ?? {})).toEqual([
			['query', { page_size: 1 }],
			['stackone_account_id', 'acc2'],
			['session_id', MOCK_SEARCH_SESSION_ID],
			['action_id', 'mock_list_items'],
		]);
		expect(listedEndpoints()).toEqual([
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc2`,
		]);
	});

	it('leaves the account to the server, and the arguments alone, for several accounts', async () => {
		const { calls } = serveMock({
			accountTools: { acc1: [], acc2: [] },
			accountProviders: { acc1: 'linear', acc2: 'mock' },
		});

		await newToolSet().execute(
			'mock_list_items',
			{ stackone_account_id: 'acc2' },
			{ accountIds: ['acc1', 'acc2'] },
		);

		expect(calls[0]?.arguments).toEqual({
			stackone_account_id: 'acc2',
			action_id: 'mock_list_items',
		});
	});

	// Picking one would run the action on an account the caller never chose.
	it('raises the server’s request for an account when the connector is linked twice', async () => {
		serveMock({ accountTools: { acc1: [], acc2: [] } });

		const error = (await newToolSet({ accountIds: ['acc2', 'acc1'] })
			.execute('mock_list_items')
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(400);
		expect((error.responseBody as JsonObject).error).toBe(
			'stackone_execute_action runs against multiple accounts — pass "stackone_account_id", one of [acc1 (acc1), acc2 (acc2)] (or call stackone_list_accounts to list them).',
		);
	});

	it('runs on the account a search hit names', async () => {
		serveMock({ accountTools: { acc1: [], acc2: [] } });
		const toolset = newToolSet({ accountIds: ['acc1', 'acc2'] });

		const [hit] = await toolset.search('list items');
		const chosen = hit?.available_accounts?.[1]?.id as string;
		const result = await toolset.execute(hit?.action_id ?? '', {}, { accountIds: [chosen] });

		expect((result.result as JsonObject).account_id).toBe('acc2');
	});

	it('keeps an argument named __proto__ while pinning action_id and session_id', async () => {
		const { calls } = serveMock();

		await newToolSet().execute(
			'mock_list_items',
			JSON.parse('{"__proto__":"p","constructor":"c","action_id":"other","q":1}') as JsonObject,
			{ sessionId: 'real' },
		);

		expect(Object.entries(calls[0]?.arguments ?? {})).toEqual([
			['__proto__', 'p'],
			['constructor', 'c'],
			['q', 1],
			['session_id', 'real'],
			['action_id', 'mock_list_items'],
		]);
	});

	it('sends no session_id when none is given', async () => {
		const { calls } = serveMock();
		await newToolSet().execute('mock_list_items');
		expect(calls[0]?.arguments).toEqual({ action_id: 'mock_list_items' });
	});

	// `null` means "not given", matching Python's `None`, rather than being sent as a literal null.
	it('treats a null sessionId as not given', async () => {
		const { calls } = serveMock();
		await newToolSet().execute('mock_list_items', {}, { sessionId: null });
		expect(calls[0]?.arguments).toEqual({ action_id: 'mock_list_items' });
	});

	it('lets sessionId win over a session_id in the arguments', async () => {
		const { calls } = serveMock();
		await newToolSet().execute(
			'mock_list_items',
			{ session_id: 'model-supplied' },
			{ sessionId: 'real' },
		);
		expect(calls[0]?.arguments.session_id).toBe('real');
	});

	// A prompt-injected call must not be able to swap the action a host app pinned.
	it('pins the caller’s action_id over one in the arguments', async () => {
		const { calls } = serveMock();

		await newToolSet().execute('mock_list_items', { action_id: 'mock_delete_everything' });

		expect(calls[0]?.arguments).toEqual({ action_id: 'mock_list_items' });
	});

	it('drops model-supplied credentials in the envelope', async () => {
		const { calls } = serveMock();

		await newToolSet().execute('mock_list_items', {
			headers: { Authorization: 'Bearer stolen', 'x-account-id': 'victim' },
		});

		expect(calls[0]?.arguments.headers).toEqual({});
	});

	// stackone_execute_action serves `headers` as an open object, so a host can pass any header
	// the SDK does not own through to the action.
	it('forwards host-set headers the SDK does not own', async () => {
		const { calls } = serveMock();

		await newToolSet().execute('mock_list_items', {
			headers: { 'x-custom': 'yes', Authorization: 'Bearer stolen' },
		});

		expect(calls[0]?.arguments.headers).toEqual({ 'x-custom': 'yes' });
	});

	it('raises on an isError result rather than returning it as data', async () => {
		serveMock();
		const error = (await newToolSet()
			.execute('mock_not_a_real_action')
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.message).toContain('Unknown action mock_not_a_real_action');
		expect(error.statusCode).toBe(404);
	});

	it('raises the server’s error for an action no linked connector serves', async () => {
		serveMock();
		const error = (await newToolSet({ accountIds: ['default', 'acc1'] })
			.execute('jira_list_issues')
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(400);
		expect((error.responseBody as JsonObject).error).toMatch(
			/^Unknown action_id "jira_list_issues"/,
		);
	});

	it('explains a listing without stackone_execute_action', async () => {
		const calls = fakeSessionTools(undefined, ['stackone_search_actions']);
		await expect(newToolSet({ accountId: 'acc1' }).execute('linear_list_issues')).rejects.toThrow(
			new ToolSetLoadError(
				'The server did not serve stackone_execute_action for this account scope.',
			),
		);
		expect(calls).toEqual([]);
	});

	it.each([
		[
			'an empty action id',
			() => newToolSet({ accountId: 'acc1' }).execute(''),
			/actionId must be a non-empty string/,
		],
		[
			'array arguments',
			() => newToolSet({ accountId: 'acc1' }).execute('x_y', [1, 2] as never),
			/arguments must be a JSON object, got array/,
		],
		[
			'a string sessionId that is empty',
			() => newToolSet({ accountId: 'acc1' }).execute('x_y', {}, { sessionId: '' }),
			/sessionId must be a non-empty string/,
		],
		[
			'a numeric sessionId',
			() => newToolSet({ accountId: 'acc1' }).execute('x_y', {}, { sessionId: 42 as never }),
			/sessionId must be a non-empty string/,
		],
		[
			'an empty account id',
			() => newToolSet({ accountId: 'acc1' }).execute('x_y', {}, { accountIds: [''] }),
			/accountIds must not contain an empty account id/,
		],
	])('rejects %s before any round trip', async (_name, act, message) => {
		await expect(act()).rejects.toThrow(message);
		await expect(act()).rejects.toBeInstanceOf(ToolSetConfigError);
		expect(listMock).not.toHaveBeenCalled();
	});
});

describe('submitFeedback()', () => {
	// Contract §6: snake_case wire arguments, optional keys omitted rather than null.
	it('calls stackone_submit_feedback over tools/call with snake_case arguments', async () => {
		const { calls, rpcRequests } = serveMock({ submitFeedback: true });

		const result = await newToolSet({ accountId: 'acc1' }).submitFeedback({
			rating: 'negative',
			toolNames: ['mock_list_items'],
			feedback: 'Needed two calls',
			category: 'execute',
			sessionId: MOCK_SEARCH_SESSION_ID,
			source: 'user',
		});

		expect(result).toMatchObject({
			isError: false,
			result: { message: 'Feedback recorded', session_id: MOCK_SEARCH_SESSION_ID },
		});
		expect(calls).toEqual([
			{
				accountId: 'acc1',
				toolMode: 'search_execute',
				name: 'stackone_submit_feedback',
				arguments: {
					rating: 'negative',
					tool_names: ['mock_list_items'],
					feedback: 'Needed two calls',
					category: 'execute',
					session_id: MOCK_SEARCH_SESSION_ID,
					source: 'user',
				},
			},
		]);
		expect(rpcRequests()).toBe(0);
	});

	it('omits unset optional fields and defaults source to model', async () => {
		const { calls } = serveMock({ submitFeedback: true });

		await newToolSet({ accountId: 'acc1' }).submitFeedback({
			rating: 'positive',
			toolNames: ['a'],
			feedback: undefined,
			sessionId: undefined,
		});

		expect(calls[0]?.arguments).toEqual({ rating: 'positive', tool_names: ['a'], source: 'model' });
	});

	// `null` means "not given", matching Python's `None`, rather than being sent as a literal null.
	it('treats a null sessionId as not given', async () => {
		const { calls } = serveMock({ submitFeedback: true });

		await newToolSet({ accountId: 'acc1' }).submitFeedback({
			rating: 'positive',
			toolNames: ['a'],
			sessionId: null,
		});

		expect(calls[0]?.arguments).toEqual({ rating: 'positive', tool_names: ['a'], source: 'model' });
	});

	it('works from a search_execute toolset, once across accounts', async () => {
		const { calls } = serveMock({
			accountTools: { acc1: [], acc2: [] },
			submitFeedback: true,
		});

		await newToolSet({ accountIds: ['acc1', 'acc2'], toolMode: 'search_execute' }).submitFeedback({
			rating: 'neutral',
			toolNames: ['x'],
		});

		expect(calls.map((call) => call.name)).toEqual(['stackone_submit_feedback']);
	});

	// The tool is global, so one call per account would record the same verdict once per account.
	it('lists search_execute and calls once, on the lowest of the given accounts', async () => {
		const { calls } = serveMock({
			accountTools: { acc1: [], acc2: [] },
			submitFeedback: true,
		});

		await newToolSet({ accountIds: ['acc1'] }).submitFeedback({
			rating: 'positive',
			toolNames: ['x'],
			accountIds: ['acc2', 'acc1'],
		});

		expect(listedEndpoints()).toEqual([
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute&x-account-id=acc1`,
		]);
		expect(calls.map((call) => [call.name, call.accountId, call.toolMode])).toEqual([
			['stackone_submit_feedback', 'acc1', 'search_execute'],
		]);
	});

	it('calls on the lowest account id, not the first GET /accounts lists', async () => {
		const { calls } = serveMock({
			accountTools: { zeta: [], alpha: [] },
			submitFeedback: true,
		});
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json([
					{ id: 'gone', provider: 'p', status: 'error' },
					{ id: 'zeta', provider: 'p', status: 'active' },
					{ id: 'alpha', provider: 'p', status: 'active' },
				]),
			),
		);

		await newToolSet().submitFeedback({ rating: 'positive', toolNames: ['x'] });

		expect(calls.map((call) => [call.name, call.accountId])).toEqual([
			['stackone_submit_feedback', 'alpha'],
		]);
	});

	it('sends actionRunId as action_run_id, only when given', async () => {
		const { calls } = serveMock({ submitFeedback: true });
		const toolset = newToolSet({ accountId: 'acc1' });

		await toolset.submitFeedback({ rating: 'positive', toolNames: ['a'], actionRunId: 'run-1' });
		await toolset.submitFeedback({ rating: 'positive', toolNames: ['a'] });

		expect(calls.map((call) => call.arguments.action_run_id)).toEqual(['run-1', undefined]);
		expect(Object.keys(calls[1]?.arguments ?? {})).not.toContain('action_run_id');
	});

	it('explains that feedback is not enabled when the server does not serve the tool', async () => {
		serveMock({ submitFeedback: false });
		const error = await newToolSet({ accountId: 'acc1' })
			.submitFeedback({ rating: 'positive', toolNames: ['a'] })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetLoadError);
		expect((error as Error).message).toBe(
			'The server did not serve stackone_submit_feedback: feedback is not enabled for this project.',
		);
	});

	it('treats accountIds: null as not given in search, execute and submitFeedback', async () => {
		const { calls } = serveMock({ submitFeedback: true });
		const toolset = newToolSet({ accountId: 'acc1' });

		await toolset.search('list items', { accountIds: null });
		await toolset.execute('mock_list_items', {}, { accountIds: null });
		await toolset.submitFeedback({ rating: 'positive', toolNames: ['a'], accountIds: null });

		expect(calls.map((call) => [call.name, call.accountId])).toEqual([
			['mock_acc1_search_actions', 'acc1'],
			['mock_acc1_execute_action', 'acc1'],
			['stackone_submit_feedback', 'acc1'],
		]);
	});

	it('refuses an empty account id rather than switch to another account', async () => {
		const { calls } = serveMock({ submitFeedback: true });
		const error = await newToolSet({ accountId: 'acc1' })
			.submitFeedback({ rating: 'positive', toolNames: ['a'], accountIds: [''] })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetConfigError);
		expect((error as Error).message).toBe('accountIds must not contain an empty account id');
		expect(calls).toEqual([]);
	});

	it('refuses a string where toolNames expects a list', async () => {
		await expect(
			newToolSet({ accountId: 'acc1' }).submitFeedback({
				rating: 'positive',
				toolNames: 'a' as never,
			}),
		).rejects.toThrow(
			new ToolSetConfigError(
				'toolNames must be a list of tool names, not a string. Did you mean ["a"]?',
			),
		);
	});

	it.each([
		['an empty string', ''],
		['a number', 42],
	])('rejects %s as sessionId, as execute() does, before any round trip', async (_name, bad) => {
		const error = await newToolSet({ accountId: 'acc1' })
			.submitFeedback({ rating: 'positive', toolNames: ['a'], sessionId: bad as never })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetConfigError);
		expect((error as Error).message).toMatch(/sessionId must be a non-empty string/);
		expect(listMock).not.toHaveBeenCalled();
	});

	it('links search, execute and feedback with one session id', async () => {
		const { calls } = serveMock({ submitFeedback: true });
		const toolset = newToolSet();

		const [hit] = await toolset.search('list items');
		await toolset.execute(hit?.action_id ?? '', {}, { sessionId: hit?.session_id });
		await toolset.submitFeedback({
			rating: 'positive',
			toolNames: [hit?.action_id ?? ''],
			sessionId: hit?.session_id,
		});

		expect(calls.map((call) => [call.name, call.arguments.session_id])).toEqual([
			['mock_default_search_actions', undefined],
			['mock_default_execute_action', MOCK_SEARCH_SESSION_ID],
			['stackone_submit_feedback', MOCK_SEARCH_SESSION_ID],
		]);
	});
});

it('keeps every search/execute error inside the StackOneError hierarchy', async () => {
	await expect(newToolSet({ accountId: 'acc1' }).search('x', { topK: 0 })).rejects.toBeInstanceOf(
		StackOneError,
	);
	serveMock();
	await expect(newToolSet().execute('mock_nope')).rejects.toBeInstanceOf(StackOneError);
});
