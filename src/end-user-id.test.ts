/**
 * `x-end-user-id`: the API refuses an MCP request for a non-shared account unless it carries that
 * account's end user, which only `GET /accounts` reports. Every assertion here is on the headers
 * that actually reached the mock server.
 */
import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { accountMcpTools, createMcpApp } from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { StackOneToolSet } from './toolsets';
import type { StackOneTool, Tools } from './tool';
import { StackOneAPIError } from './utils/error-stackone-api';

/** One JSON-RPC message that reached `/mcp`, with the headers it came with. */
interface McpExchange {
	method: string;
	accountId: string | null;
	endUserId: string | null;
}

const ACCOUNTS = [
	{ id: 'acc1', provider: 'mock', status: 'active', shared: false, origin_username: 'alice' },
	{ id: 'acc2', provider: 'mock', status: 'active', shared: true, origin_username: 'bob' },
];

/**
 * Serve `GET /accounts` and `/mcp`, recording every MCP message. `accounts` is read per request,
 * so a test can change what the next `GET /accounts` reports.
 */
const serve = (initial: unknown[] | (() => Response) = ACCOUNTS) => {
	const exchanges: McpExchange[] = [];
	let accounts = initial;
	let accountRequests = 0;
	const app = createMcpApp({
		// acc2 also serves acc1_tool_1, so a tool listed on acc2 can be rebound to acc1.
		accountTools: {
			acc1: accountMcpTools.acc1,
			acc2: [...accountMcpTools.acc2, accountMcpTools.acc1[0]],
		},
		submitFeedback: true,
	});
	server.use(
		http.get(`${TEST_BASE_URL}/accounts`, () => {
			accountRequests += 1;
			return typeof accounts === 'function' ? accounts() : HttpResponse.json(accounts);
		}),
		http.all(`${TEST_BASE_URL}/mcp`, async ({ request }) => {
			if (request.method === 'POST') {
				const body = (await request.clone().json()) as unknown;
				for (const message of Array.isArray(body) ? body : [body]) {
					exchanges.push({
						method: String((message as { method?: unknown }).method),
						accountId: request.headers.get('x-account-id'),
						endUserId: request.headers.get('x-end-user-id'),
					});
				}
			}
			return app.fetch(request);
		}),
	);
	return {
		exchanges,
		accountRequests: () => accountRequests,
		setAccounts: (next: unknown[] | (() => Response)) => {
			accounts = next;
		},
	};
};

const newToolSet = (config: ConstructorParameters<typeof StackOneToolSet>[0] = {}) =>
	new StackOneToolSet({ apiKey: 'test-key', baseUrl: TEST_BASE_URL, ...config });

/** The `x-end-user-id` of every message for one account, by JSON-RPC method. */
const endUserIdsFor = (exchanges: McpExchange[], accountId: string) =>
	exchanges
		.filter((exchange) => exchange.accountId === accountId)
		.map(({ method, endUserId }) => [method, endUserId]);

const getTool = (tools: Tools, name: string): StackOneTool => {
	const tool = tools.getStackOneTools().find((candidate) => candidate.name === name);
	if (!tool) {
		throw new Error(`${name} was not listed`);
	}
	return tool;
};

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
	warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
	vi.restoreAllMocks();
});

describe('x-end-user-id after account discovery', () => {
	it('is sent on every MCP request for a non-shared account, and never for a shared one', async () => {
		const { exchanges } = serve();
		const tools = await newToolSet().fetchTools();

		await getTool(tools, 'acc1_tool_1').execute({ fields: 'name' });
		await getTool(tools, 'acc2_tool_1').execute({ fields: 'name' });

		expect(endUserIdsFor(exchanges, 'acc1')).toEqual([
			['initialize', 'alice'],
			['notifications/initialized', 'alice'],
			['tools/list', 'alice'],
			['initialize', 'alice'],
			['notifications/initialized', 'alice'],
			['tools/call', 'alice'],
		]);
		expect(endUserIdsFor(exchanges, 'acc2').every(([, endUserId]) => endUserId === null)).toBe(
			true,
		);
		expect(endUserIdsFor(exchanges, 'acc2')).toHaveLength(6);
	});

	it('is sent on search(), execute() and submitFeedback()', async () => {
		const { exchanges } = serve();
		const toolset = newToolSet();

		await toolset.search('list items');
		await toolset.execute('mock_list_items', {}, { accountIds: ['acc1'] });
		await toolset.submitFeedback({ rating: 'positive', toolNames: ['mock_list_items'] });

		const calls = exchanges
			.filter((exchange) => exchange.method === 'tools/call')
			.sort((left, right) => String(left.accountId).localeCompare(String(right.accountId)));
		expect(calls).toEqual([
			{ method: 'tools/call', accountId: 'acc1', endUserId: 'alice' },
			{ method: 'tools/call', accountId: 'acc1', endUserId: 'alice' },
			{ method: 'tools/call', accountId: 'acc1', endUserId: 'alice' },
			{ method: 'tools/call', accountId: 'acc2', endUserId: null },
		]);
		for (const exchange of exchanges) {
			expect(exchange.endUserId).toBe(exchange.accountId === 'acc1' ? 'alice' : null);
		}
	});

	it("replaces a caller's x-end-user-id, in any case, rather than joining the two", async () => {
		const { exchanges } = serve();
		const toolset = newToolSet({
			accountId: 'acc1',
			headers: { 'X-End-User-Id': 'mallory', 'x-end-user-id': 'eve' },
		});
		await toolset.fetchAccounts();
		await getTool(await toolset.fetchTools(), 'acc1_tool_1').execute({});

		expect(exchanges.map((exchange) => exchange.endUserId)).toEqual(exchanges.map(() => 'alice'));
	});

	it('follows a tool rebound with setAccountId to its new account', async () => {
		const { exchanges } = serve();
		const toolset = newToolSet();
		await toolset.fetchAccounts();
		const tool = getTool(await toolset.fetchTools({ accountIds: ['acc2'] }), 'acc1_tool_1');

		await tool.execute({});
		expect(exchanges.at(-1)).toEqual({ method: 'tools/call', accountId: 'acc2', endUserId: null });

		await tool.setAccountId('acc1').execute({});
		expect(exchanges.at(-1)).toEqual({
			method: 'tools/call',
			accountId: 'acc1',
			endUserId: 'alice',
		});
	});

	it.each([
		['shared is missing', { origin_username: 'alice' }],
		['shared is true', { shared: true, origin_username: 'alice' }],
		['shared is not a boolean', { shared: 'false', origin_username: 'alice' }],
		['origin_username is missing', { shared: false }],
		['origin_username is empty', { shared: false, origin_username: '' }],
		['origin_username is null', { shared: false, origin_username: null }],
		['origin_username is not a string', { shared: false, origin_username: 42 }],
	])('is not sent when %s', async (_case, fields) => {
		const { exchanges } = serve([{ id: 'acc1', status: 'active', ...fields }]);
		const tools = await newToolSet().fetchTools();
		await getTool(tools, 'acc1_tool_1').execute({});

		expect(exchanges.length).toBeGreaterThan(0);
		expect(exchanges.every((exchange) => exchange.endUserId === null)).toBe(true);
	});
});

describe('x-end-user-id after fetchAccounts()', () => {
	it('is sent for an explicit account once fetchAccounts() has reported its end user', async () => {
		const { exchanges } = serve();
		const toolset = newToolSet({ accountId: 'acc1' });

		await toolset.fetchAccounts();
		const tools = await toolset.fetchTools();
		await getTool(tools, 'acc1_tool_1').execute({});

		expect(exchanges.length).toBeGreaterThan(0);
		expect(exchanges.every((exchange) => exchange.endUserId === 'alice')).toBe(true);
	});

	it('reaches tools fetched before the GET /accounts that reported it', async () => {
		const { exchanges } = serve();
		const toolset = newToolSet({ accountId: 'acc1' });
		const tool = getTool(await toolset.fetchTools(), 'acc1_tool_1');

		await toolset.fetchAccounts();
		await tool.execute({});

		expect(exchanges.at(-1)?.endUserId).toBe('alice');
	});

	it('is replaced by each successful GET /accounts, and kept through a failed one', async () => {
		const { exchanges, setAccounts } = serve();
		const toolset = newToolSet({ accountId: 'acc1' });
		const tool = getTool(await toolset.fetchTools(), 'acc1_tool_1');
		const lastEndUserId = async () => {
			await tool.execute({});
			return exchanges.at(-1)?.endUserId;
		};

		await toolset.fetchAccounts();
		expect(await lastEndUserId()).toBe('alice');

		setAccounts([{ ...ACCOUNTS[0], origin_username: 'carol' }]);
		await toolset.fetchAccounts();
		expect(await lastEndUserId()).toBe('carol');

		setAccounts(() => HttpResponse.json({ message: 'boom' }, { status: 500 }));
		await expect(toolset.fetchAccounts()).rejects.toThrow(StackOneAPIError);
		expect(await lastEndUserId()).toBe('carol');

		setAccounts([{ ...ACCOUNTS[0], shared: true }]);
		await toolset.fetchAccounts();
		expect(await lastEndUserId()).toBeNull();
	});

	it('is kept by clearCatalogCache()', async () => {
		const { exchanges, accountRequests } = serve();
		const toolset = newToolSet({ accountId: 'acc1' });
		await toolset.fetchAccounts();

		toolset.clearCatalogCache();
		await toolset.fetchTools();

		expect(accountRequests()).toBe(1);
		expect(exchanges.every((exchange) => exchange.endUserId === 'alice')).toBe(true);
	});
});

describe('x-end-user-id with explicit accounts and no GET /accounts', () => {
	it('makes no GET /accounts and sends no x-end-user-id', async () => {
		const { exchanges, accountRequests } = serve();
		const tools = await newToolSet({ accountIds: ['acc1'] }).fetchTools();
		await getTool(tools, 'acc1_tool_1').execute({});

		expect(accountRequests()).toBe(0);
		expect(exchanges.length).toBeGreaterThan(0);
		expect(exchanges.every((exchange) => exchange.endUserId === null)).toBe(true);
	});

	it("passes the caller's own x-end-user-id through, without a warning", async () => {
		const { exchanges, accountRequests } = serve();
		const toolset = newToolSet({ accountId: 'acc1', headers: { 'X-End-User-Id': 'carol' } });
		const tools = await toolset.fetchTools();
		await getTool(tools, 'acc1_tool_1').execute({});
		await toolset.search('list items');

		expect(accountRequests()).toBe(0);
		expect(exchanges.length).toBeGreaterThan(0);
		expect(exchanges.every((exchange) => exchange.endUserId === 'carol')).toBe(true);
		expect(warnSpy).not.toHaveBeenCalled();
	});
});

describe('x-end-user-id as a model-supplied header argument', () => {
	it.each(['x-end-user-id', 'X-End-User-Id', ' X-END-USER-ID\t'])(
		'drops %j from an open headers object, keeping the SDK-set value',
		async (name) => {
			const { exchanges } = serve();
			const toolset = newToolSet();
			await toolset.fetchAccounts();

			await toolset.execute(
				'mock_list_items',
				{ headers: { [name]: 'mallory', 'x-trace': 't' } },
				{ accountIds: ['acc1'] },
			);

			expect(exchanges.at(-1)).toEqual({
				method: 'tools/call',
				accountId: 'acc1',
				endUserId: 'alice',
			});
			expect(warnSpy.mock.calls.map((args: unknown[]) => String(args[0]))).toEqual([
				`[@stackone/ai] Dropping header ${JSON.stringify(name.trim())} from a tool call: set by the SDK`,
			]);
		},
	);

	it('drops it from a declared nested header and a declared flat headers_ argument', async () => {
		const declaring = {
			name: 'acc1_declares_end_user',
			description: '',
			inputSchema: {
				type: 'object' as const,
				properties: {
					headers: { type: 'object', properties: { 'x-end-user-id': { type: 'string' } } },
					'headers_x-end-user-id': { type: 'string' },
					'headers_X-End-User-Id ': { type: 'string' },
				},
			},
		};
		const calls: Record<string, unknown>[] = [];
		const app = createMcpApp({
			accountTools: { acc1: [declaring] },
			onToolCall: (call) => calls.push(call.arguments),
		});
		server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));
		const tools = await newToolSet({ accountId: 'acc1' }).fetchTools();

		await getTool(tools, 'acc1_declares_end_user').execute({
			headers: { 'x-end-user-id': 'mallory' },
			'headers_x-end-user-id': 'mallory',
			'headers_X-End-User-Id ': 'mallory',
		});

		expect(calls).toEqual([{ headers: {} }]);
		expect(warnSpy.mock.calls.map((args: unknown[]) => String(args[0]))).toEqual([
			'[@stackone/ai] Dropping header "x-end-user-id" from a tool call: set by the SDK',
			'[@stackone/ai] Dropping header argument "headers_x-end-user-id" from a tool call: set by the SDK',
			'[@stackone/ai] Dropping header argument "headers_X-End-User-Id " from a tool call: set by the SDK',
		]);
	});
});
