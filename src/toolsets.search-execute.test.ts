/**
 * search(), execute() and submitFeedback(): the recommended surface, over the per-connector
 * `*_search_actions` / `*_execute_action` meta tools and the server's `stackone_submit_feedback`.
 */
import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import {
	MOCK_SEARCH_SESSION_ID,
	type RecordedToolCall,
	accountMcpTools,
	createMcpApp,
} from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { type McpToolDefinition, listMcpTools } from './mcp-client';
import { StackOneMcpTool } from './tool';
import { StackOneToolSet } from './toolsets';
import type { JsonObject } from './types';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';
import { retryTiming } from './utils/fetch-retry';
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

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
	warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
	listMock.mockReset();
	listMock.mockImplementation(realListMcpTools);
});

/**
 * Serve meta tools with these names, each on the account its name embeds, and replace the
 * tools/call with `respond` — as the Python suite monkeypatches `StackOneMcpTool.execute`.
 */
const fakeMetaTools = (
	names: string[],
	respond: (tool: StackOneMcpTool, args: JsonObject) => JsonObject | Promise<JsonObject> = () => ({
		data: {},
	}),
) => {
	listMock.mockImplementation(async ({ headers }) =>
		names
			.filter((name) =>
				name
					.replace(/_(search_actions|execute_action)$/, '')
					.endsWith(`_${headers['x-account-id']}`),
			)
			.map((name): McpToolDefinition => ({ name, description: '', inputSchema: {} })),
	);
	const calls: Array<{ tool: string; args: JsonObject }> = [];
	vi.spyOn(StackOneMcpTool.prototype, 'execute').mockImplementation(
		async function (this: StackOneMcpTool, args) {
			calls.push({ tool: this.name, args: args as JsonObject });
			return respond(this, args as JsonObject);
		},
	);
	return calls;
};

/** Serve the real mock MCP app, recording every tools/call as it reached the wire. */
const serveMock = (
	options: {
		accountTools?: Parameters<typeof createMcpApp>[0]['accountTools'];
		submitFeedback?: boolean;
	} = {},
) => {
	const calls: RecordedToolCall[] = [];
	let rpcRequests = 0;
	const app = createMcpApp({
		accountTools: options.accountTools ?? { default: [], acc1: accountMcpTools.acc1 },
		submitFeedback: options.submitFeedback,
		onToolCall: (call) => calls.push(call),
	});
	server.use(
		http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)),
		http.post(`${TEST_BASE_URL}/actions/rpc`, () => {
			rpcRequests += 1;
			return HttpResponse.json({ data: {} });
		}),
	);
	return { calls, rpcRequests: () => rpcRequests };
};

describe('search()', () => {
	it('finds actions with nothing but an API key', async () => {
		serveMock();
		const actions = await newToolSet().search('list items');
		expect(actions.map((action) => action.action_id)).toEqual(['mock_list_items']);
	});

	it('asks the search_execute catalog, passing top_k through', async () => {
		const { calls } = serveMock();

		await newToolSet().search('list items', { topK: 7 });

		expect(calls).toEqual([
			{
				accountId: 'default',
				toolMode: 'search_execute',
				name: 'mock_default_search_actions',
				arguments: { query: 'list items', top_k: 7 },
			},
		]);
	});

	// Contract §4: each hit carries the session_id of the search that produced it.
	it('copies the search session_id onto every hit', async () => {
		serveMock();
		const [hit] = await newToolSet().search('list items');
		expect(hit?.session_id).toBe(MOCK_SEARCH_SESSION_ID);
	});

	it('omits session_id when the server issues none', async () => {
		fakeMetaTools(['a_acc1_search_actions'], () => ({
			actions: [{ action_id: 'a_x' }],
			session_id: '',
		}));
		const [hit] = await newToolSet({ accountId: 'acc1' }).search('x');
		expect(hit).toEqual({ action_id: 'a_x', account_id: 'acc1' });
	});

	// Without it, a caller who finds the same action on two accounts cannot choose between them.
	it('tags every hit with the account that found it, one hit per account', async () => {
		fakeMetaTools(['linear_acc1_search_actions', 'linear_acc2_search_actions'], (tool) => ({
			actions: [
				{
					action_id: 'linear_list_issues',
					similarity_score: tool.name.includes('acc1') ? 0.5 : 0.9,
					account_id: 'spoofed',
				},
			],
		}));

		const hits = await newToolSet({ accountIds: ['acc1', 'acc2'] }).search('x');

		expect(hits).toEqual([
			{ action_id: 'linear_list_issues', similarity_score: 0.9, account_id: 'acc2' },
			{ action_id: 'linear_list_issues', similarity_score: 0.5, account_id: 'acc1' },
		]);
	});

	// top_k is per connector on the wire; 2.x's topK capped the whole result, and so does this.
	it('cuts the merged ranking to topK, keeping the best across connectors', async () => {
		const perConnector: Record<string, JsonObject[]> = {
			a_acc1_search_actions: [
				{ action_id: 'a_1', similarity_score: 0.8 },
				{ action_id: 'a_2', similarity_score: 0.1 },
			],
			b_acc1_search_actions: [
				{ action_id: 'b_1', similarity_score: 0.9 },
				{ action_id: 'b_2', similarity_score: 0.2 },
			],
			c_acc1_search_actions: [{ action_id: 'c_1', similarity_score: 0.7 }],
		};
		const calls = fakeMetaTools(Object.keys(perConnector), (tool) => ({
			actions: perConnector[tool.name] ?? [],
		}));

		const hits = await newToolSet({ accountId: 'acc1' }).search('x', { topK: 2 });

		expect(hits.map((hit) => hit.action_id)).toEqual(['b_1', 'a_1']);
		expect(calls.map((call) => call.args.top_k)).toEqual([2, 2, 2]);
	});

	it('ranks results across connectors rather than concatenating them, tolerating bad scores', async () => {
		const perConnector: Record<string, JsonObject[]> = {
			a_acc1_search_actions: [
				{ action_id: 'a_low', similarity_score: 0.2 },
				{ action_id: 'a_bad', similarity_score: '0.99' },
			],
			b_acc2_search_actions: [{ action_id: 'b_high', similarity_score: 0.9 }],
		};
		fakeMetaTools(Object.keys(perConnector), (tool) => ({
			actions: perConnector[tool.name] ?? [],
			session_id: `session-${tool.name}`,
		}));

		const actions = await newToolSet({ accountIds: ['acc1', 'acc2'] }).search('x');

		expect(actions.map((action) => action.action_id)).toEqual(['b_high', 'a_low', 'a_bad']);
		// Each hit keeps the session of the connector search that found it.
		expect(actions[0]?.session_id).toBe('session-b_acc2_search_actions');
		expect(actions[1]?.session_id).toBe('session-a_acc1_search_actions');
	});

	it('keeps the connectors that answer when one fails', async () => {
		fakeMetaTools(['a_acc1_search_actions', 'b_acc1_search_actions'], (tool) => {
			if (tool.name.startsWith('b_')) {
				throw new ToolSetLoadError('b is down');
			}
			return { actions: [{ action_id: 'a_x', similarity_score: 1 }] };
		});

		const actions = await newToolSet({ accountId: 'acc1' }).search('x');

		expect(actions.map((action) => action.action_id)).toEqual(['a_x']);
		expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
			'Skipping connector that failed to search — b_acc1_search_actions: b is down',
		);
	});

	it('fails when every connector fails', async () => {
		fakeMetaTools(['a_acc1_search_actions'], () => {
			throw new Error('boom');
		});
		await expect(newToolSet({ accountId: 'acc1' }).search('x')).rejects.toThrow(
			new ToolSetLoadError('No connector returned results. a_acc1_search_actions: boom'),
		);
	});

	it('returns nothing when no connector is linked', async () => {
		fakeMetaTools([]);
		expect(await newToolSet({ accountId: 'acc1' }).search('x')).toEqual([]);
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
		fakeMetaTools([]);
		await expect(newToolSet({ accountId: 'acc1' }).search('x', { topK })).resolves.toEqual([]);
	});

	it('uses the meta tools even when the toolset lists individual tools', async () => {
		serveMock();
		const toolset = newToolSet({ accountId: 'acc1' });

		await toolset.search('x');
		await toolset.fetchTools();

		expect(listMock.mock.calls.map(([request]) => request.endpoint.split('?')[1])).toEqual([
			'tool-mode=search_execute',
			undefined,
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

	// Contract §5: session_id is forwarded as a top-level argument when given, never otherwise,
	// and action_id stays pinned last.
	it('forwards sessionId as a top-level session_id, action_id last', async () => {
		const { calls } = serveMock();

		await newToolSet().execute(
			'mock_list_items',
			{ query: { page_size: 1 } },
			{ sessionId: MOCK_SEARCH_SESSION_ID },
		);

		const [call] = calls;
		expect(call?.name).toBe('mock_default_execute_action');
		expect(call?.arguments).toEqual({
			query: { page_size: 1 },
			session_id: MOCK_SEARCH_SESSION_ID,
			action_id: 'mock_list_items',
		});
		expect(Object.keys(call?.arguments ?? {}).at(-1)).toBe('action_id');
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

	// *_execute_action serves `headers` as an open object, so a host can pass any header the SDK
	// does not own through to the action.
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

	it('routes an account id containing underscores by identity', async () => {
		const calls = fakeMetaTools(['linear_acc_1_execute_action']);
		await newToolSet({ accountId: 'acc_1' }).execute('linear_list_issues');
		expect(calls[0]?.tool).toBe('linear_acc_1_execute_action');
	});

	it('routes to the longest matching connector', async () => {
		const calls = fakeMetaTools([
			'browser_acc1_execute_action',
			'browser_linkedin_acc2_execute_action',
		]);
		await newToolSet({ accountIds: ['acc1', 'acc2'] }).execute('browser_linkedin_search_people');
		expect(calls[0]?.tool).toBe('browser_linkedin_acc2_execute_action');
	});

	// Picking one would run the action on an account the caller never chose.
	it('refuses to choose when the same connector is linked on two accounts', async () => {
		const calls = fakeMetaTools(['linear_acc1_execute_action', 'linear_acc2_execute_action']);

		const error = await newToolSet({ accountIds: ['acc2', 'acc1'] })
			.execute('linear_list_issues')
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetConfigError);
		expect((error as Error).message).toMatch(
			new RegExp(
				'^"linear_list_issues" matches 2 connectors on different accounts \\(linear_acc1_execute_action on acc1, linear_acc2_execute_action on acc2\\)\\. Pass the account id to use',
			),
		);
		expect(calls).toEqual([]);
	});

	it('routes to the account a search hit names', async () => {
		const calls = fakeMetaTools(
			[
				'linear_acc1_search_actions',
				'linear_acc2_search_actions',
				'linear_acc1_execute_action',
				'linear_acc2_execute_action',
			],
			(tool): JsonObject =>
				tool.name.endsWith('_search_actions')
					? { actions: [{ action_id: 'linear_list_issues' }] }
					: { data: {} },
		);
		const toolset = newToolSet();
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json([
					{ id: 'acc1', provider: 'linear', status: 'active' },
					{ id: 'acc2', provider: 'linear', status: 'active' },
				]),
			),
		);

		const hit = (await toolset.search('x')).find((found) => found.account_id === 'acc2');
		await toolset.execute('linear_list_issues', {}, { accountIds: [hit?.account_id as string] });

		expect(calls.at(-1)?.tool).toBe('linear_acc2_execute_action');
	});

	it('matches the connector case-insensitively', async () => {
		const calls = fakeMetaTools(['Linear_acc1_execute_action']);
		await newToolSet({ accountId: 'acc1' }).execute('LINEAR_list_issues');
		expect(calls[0]?.tool).toBe('Linear_acc1_execute_action');
	});

	it('explains an action no connector serves', async () => {
		fakeMetaTools(['linear_acc1_execute_action']);
		await expect(newToolSet({ accountId: 'acc1' }).execute('jira_list_issues')).rejects.toThrow(
			new ToolSetLoadError(
				'No connector found for "jira_list_issues". Use search() to discover valid action ids.',
			),
		);
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

		expect(listMock.mock.calls.map(([request]) => request.endpoint)).toEqual([
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute`,
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

describe('execute() while an account in scope has failed to list', () => {
	const ACCOUNTS = [
		{ id: 'acc1', provider: 'linear', status: 'active' },
		{ id: 'acc2', provider: 'linear', status: 'active' },
		{ id: 'acc3', provider: 'hibob', status: 'active' },
	];
	const failing = new Set<string>();
	const listed: string[] = [];

	/** Serve `accounts` from GET /accounts, and meta tools for each, failing those in `failing`. */
	const serve = (accounts: typeof ACCOUNTS) => {
		server.use(http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.json(accounts)));
		const calls = fakeMetaTools(
			accounts.map(({ id, provider }) => `${provider}_${id}_execute_action`),
		);
		const serveListing = listMock.getMockImplementation();
		listMock.mockImplementation(async (request) => {
			const accountId = request.headers['x-account-id'] as string;
			listed.push(accountId);
			if (failing.has(accountId)) {
				throw new Error(`${accountId} is down`);
			}
			return (serveListing as typeof listMcpTools)(request);
		});
		return calls;
	};

	beforeEach(() => {
		failing.clear();
		listed.length = 0;
	});

	it('refuses when the failed account is on the action’s connector', async () => {
		const calls = serve([ACCOUNTS[0], ACCOUNTS[1]] as typeof ACCOUNTS);
		failing.add('acc1');

		const error = await newToolSet()
			.execute('linear_list_issues')
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetLoadError);
		expect((error as Error).message).toBe(
			`"linear_list_issues" may be served by an account that failed to list (acc1: acc1 is down). Pass the account id to use, such as a search hit's account_id.`,
		);
		expect(calls).toEqual([]);
	});

	it('runs the action when the failed account is on another provider', async () => {
		const calls = serve([ACCOUNTS[0], ACCOUNTS[2]] as typeof ACCOUNTS);
		failing.add('acc3');

		await newToolSet().execute('linear_list_issues');

		expect(calls.map(({ tool }) => tool)).toEqual(['linear_acc1_execute_action']);
	});

	it('is not blocked by a failed account on a shorter provider prefix', async () => {
		// acc2's provider `linear` prefixes `linear_beta_list_items`, but the action's connector is
		// `linear_beta`, the longest prefix, so acc2 could not serve it.
		const calls = serve([
			{ id: 'acc1', provider: 'linear_beta', status: 'active' },
			{ id: 'acc2', provider: 'linear', status: 'active' },
		]);
		failing.add('acc2');

		await newToolSet().execute('linear_beta_list_items');

		expect(calls.map(({ tool }) => tool)).toEqual(['linear_beta_acc1_execute_action']);
	});

	it('looks up the providers of failed accounts named explicitly, then runs the action', async () => {
		const calls = serve([ACCOUNTS[0], ACCOUNTS[2]] as typeof ACCOUNTS);
		failing.add('acc3');

		// Explicit ids, so only the lookup can say acc3 is hibob, which cannot serve a linear action.
		await newToolSet({ accountIds: ['acc1', 'acc3'] }).execute('linear_list_issues');

		expect(calls.map(({ tool }) => tool)).toEqual(['linear_acc1_execute_action']);
	});

	it('refuses when the failed account’s provider is unknown, listing failures by account id', async () => {
		const calls = serve(ACCOUNTS);
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json({ error: 'forbidden' }, { status: 403 }),
			),
		);
		failing.add('acc3');
		failing.add('acc2');

		// Explicit ids, and GET /accounts fails, so neither failed account's provider is known.
		const error = await newToolSet({ accountIds: ['acc3', 'acc1', 'acc2'] })
			.execute('linear_list_issues')
			.catch((caught: unknown) => caught);

		expect((error as Error).message).toBe(
			`"linear_list_issues" may be served by an account that failed to list (acc2: acc2 is down; acc3: acc3 is down). Pass the account id to use, such as a search hit's account_id.`,
		);
		expect(calls).toEqual([]);
	});

	it('throws the 429 when the provider lookup is rate limited', async () => {
		serve([ACCOUNTS[0], ACCOUNTS[1]] as typeof ACCOUNTS);
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json(
					{ statusCode: 429, message: 'Too many requests' },
					{ status: 429, headers: { 'Retry-After': '0' } },
				),
			),
		);
		failing.add('acc2');

		const error = await newToolSet({ accountIds: ['acc1', 'acc2'] })
			.execute('linear_list_issues')
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(429);
	});

	describe('when the provider lookup cannot name a failed account', () => {
		let now = 0;
		let accountRequests = 0;
		/** acc2 always fails to list, and GET /accounts always answers 403. */
		const serveUnnameable = () => {
			serve([ACCOUNTS[0], ACCOUNTS[1]] as typeof ACCOUNTS);
			server.use(
				http.get(`${TEST_BASE_URL}/accounts`, () => {
					accountRequests += 1;
					return HttpResponse.json({ error: 'forbidden' }, { status: 403 });
				}),
			);
			failing.add('acc2');
			return newToolSet({ accountIds: ['acc1', 'acc2'] });
		};
		/** A second after the last call, so its failures are no longer this call's own. */
		const refuses = async (toolset: StackOneToolSet) => {
			now += 1_000;
			const error = await toolset.execute('linear_x').catch((caught: unknown) => caught);
			expect((error as Error).message).toMatch(/may be served by an account that failed to list/);
		};
		const listings = (accountId: string) => listed.filter((id) => id === accountId).length;

		beforeEach(() => {
			now = 0;
			accountRequests = 0;
			vi.spyOn(retryTiming, 'now').mockImplementation(() => now);
		});

		it('neither looks it up nor re-lists it again for 30 seconds', async () => {
			const toolset = serveUnnameable();

			await refuses(toolset);
			await refuses(toolset);
			await refuses(toolset);

			expect(accountRequests).toBe(1);
			expect(listings('acc2')).toBe(1);

			now += 30_000;
			await refuses(toolset);

			expect(accountRequests).toBe(2);
			expect(listings('acc2')).toBe(2);
		});

		it('forgets the miss when the cache is cleared', async () => {
			const toolset = serveUnnameable();
			await refuses(toolset);

			toolset.clearCatalogCache();
			await refuses(toolset);

			expect(accountRequests).toBe(2);
		});

		it('does not re-list it in the call whose lookup missed it', async () => {
			const toolset = serveUnnameable();
			await toolset.fetchTools({ mode: 'search_execute' });

			// Concurrent calls join the one lookup, and none of them waits out acc2 again.
			await Promise.all([refuses(toolset), refuses(toolset)]);

			expect(accountRequests).toBe(1);
			expect(listings('acc2')).toBe(1);
		});

		it('does not record a miss across a clear made during the lookup', async () => {
			const toolset = serveUnnameable();
			let release = () => {};
			const held = new Promise<void>((resolve) => {
				release = resolve;
			});
			server.use(
				http.get(`${TEST_BASE_URL}/accounts`, async () => {
					accountRequests += 1;
					if (accountRequests === 1) {
						await held;
					}
					return HttpResponse.json({ error: 'forbidden' }, { status: 403 });
				}),
			);

			const first = refuses(toolset);
			await vi.waitFor(() => expect(accountRequests).toBe(1));
			toolset.clearCatalogCache();
			release();
			await first;
			await refuses(toolset);

			expect(accountRequests).toBe(2);
		});

		it('forgets the miss once GET /accounts names the account', async () => {
			const toolset = serveUnnameable();
			await refuses(toolset);
			server.use(
				http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.json([ACCOUNTS[0], ACCOUNTS[1]])),
			);
			await toolset.fetchAccounts();

			await refuses(toolset);

			// acc2 is linear's, so it is listed again at once rather than after the window.
			expect(listings('acc2')).toBe(2);
		});
	});

	it('lists a failed account again at once, and then applies to whatever it serves', async () => {
		const calls = serve([ACCOUNTS[0], ACCOUNTS[1]] as typeof ACCOUNTS);
		failing.add('acc1');
		const toolset = newToolSet();
		await toolset.fetchTools({ mode: 'search_execute' });
		expect(listed).toEqual(['acc1', 'acc2']);

		failing.clear();
		const error = await toolset.execute('linear_list_issues').catch((caught: unknown) => caught);

		// Long before the failed account would be due again.
		expect(listed).toEqual(['acc1', 'acc2', 'acc1']);
		expect(error).toBeInstanceOf(ToolSetConfigError);
		expect((error as Error).message).toMatch(/^"linear_list_issues" matches 2 connectors/);
		expect(calls).toEqual([]);
	});

	it('does not re-list a failed account on another provider', async () => {
		const calls = serve([ACCOUNTS[0], ACCOUNTS[2]] as typeof ACCOUNTS);
		// acc3 never answers: listing it again would make every linear action wait out its timeout.
		const listOnce = listMock.getMockImplementation() as typeof listMcpTools;
		listMock.mockImplementation(async (request) => {
			if (request.headers['x-account-id'] === 'acc3' && listed.includes('acc3')) {
				listed.push('acc3');
				return new Promise<never>(() => {});
			}
			return listOnce(request);
		});
		failing.add('acc3');
		const toolset = newToolSet();
		await toolset.fetchTools({ mode: 'search_execute' });

		await toolset.execute('linear_list_issues');

		expect(listed).toEqual(['acc1', 'acc3']);
		expect(calls.map(({ tool }) => tool)).toEqual(['linear_acc1_execute_action']);
	});

	it('does not re-list an account that failed during the same call', async () => {
		serve([ACCOUNTS[0], ACCOUNTS[1]] as typeof ACCOUNTS);
		failing.add('acc1');

		// A fresh toolset: acc1 fails in this call's own listing, so listing it again at once
		// would only double the wait.
		await newToolSet()
			.execute('linear_list_issues')
			.catch(() => undefined);

		expect(listed).toEqual(['acc1', 'acc2']);
	});

	it('does not re-list when no account has failed', async () => {
		serve([ACCOUNTS[0], ACCOUNTS[2]] as typeof ACCOUNTS);
		const toolset = newToolSet();

		await toolset.execute('linear_list_issues');
		await toolset.execute('hibob_list_employees');

		expect(listed).toEqual(['acc1', 'acc3']);
	});
});
