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

/** The 400 UCA's ActiveAccountGuard answers a request without the account's end user with. */
const endUserMismatch = (accountId: string) =>
	HttpResponse.json(
		{
			statusCode: 400,
			message: `x-end-user-id header does not match account end user id for account ${accountId}`,
			timestamp: '2026-01-01T00:00:00.000Z',
		},
		{ status: 400 },
	);

/**
 * Serve `GET /accounts` and `/mcp`, recording every MCP message. `accounts` is read per request,
 * so a test can change what the next `GET /accounts` reports. `guard` maps accounts to the end
 * user `/mcp` requires, as UCA's ActiveAccountGuard does.
 */
const serve = (
	initial: unknown[] | (() => Response | Promise<Response>) = ACCOUNTS,
	guard: Record<string, string> = {},
) => {
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
			const accountId = request.headers.get('x-account-id') ?? '';
			const required = guard[accountId];
			if (required !== undefined && request.headers.get('x-end-user-id') !== required) {
				return endUserMismatch(accountId);
			}
			return app.fetch(request);
		}),
	);
	return {
		exchanges,
		accountRequests: () => accountRequests,
		setAccounts: (next: unknown[] | (() => Response | Promise<Response>)) => {
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
		const tools = await newToolSet({ includeNonShared: true }).fetchTools();

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
		const toolset = newToolSet({ includeNonShared: true });

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
		const toolset = newToolSet({ includeNonShared: true });
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
		const tools = await newToolSet({ includeNonShared: true }).fetchTools();
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

	it('keeps the end user from the most recently started GET /accounts, even if an older one resolves later', async () => {
		const exchanges: McpExchange[] = [];
		const app = createMcpApp({ accountTools: { acc1: accountMcpTools.acc1 } });
		let requests = 0;
		let releaseFirst!: () => void;
		const firstReleased = new Promise<void>((resolve) => {
			releaseFirst = resolve;
		});
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, async () => {
				requests += 1;
				if (requests === 1) {
					await firstReleased;
					return HttpResponse.json([{ ...ACCOUNTS[0], origin_username: 'alice' }]);
				}
				return HttpResponse.json([{ ...ACCOUNTS[0], origin_username: 'carol' }]);
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

		const toolset = newToolSet({ accountId: 'acc1' });
		const older = toolset.fetchAccounts();
		await vi.waitFor(() => expect(requests).toBe(1));
		await toolset.fetchAccounts();
		releaseFirst();
		await older;

		const tools = await toolset.fetchTools();
		await getTool(tools, 'acc1_tool_1').execute({});

		expect(exchanges.at(-1)?.endUserId).toBe('carol');
	});

	it('is recorded by an older GET /accounts when a newer one fails', async () => {
		let requests = 0;
		let releaseFirst!: () => void;
		const firstReleased = new Promise<void>((resolve) => {
			releaseFirst = resolve;
		});
		const { exchanges } = serve(async () => {
			requests += 1;
			if (requests === 1) {
				await firstReleased;
				return HttpResponse.json(ACCOUNTS);
			}
			return HttpResponse.json({ message: 'boom' }, { status: 500 });
		});
		const toolset = newToolSet({ includeNonShared: true });

		const discovering = toolset.fetchTools();
		await vi.waitFor(() => expect(requests).toBe(1));
		await expect(toolset.fetchAccounts()).rejects.toThrow(StackOneAPIError);
		releaseFirst();
		await discovering;

		expect(endUserIdsFor(exchanges, 'acc1')).toEqual([
			['initialize', 'alice'],
			['notifications/initialized', 'alice'],
			['tools/list', 'alice'],
		]);
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

describe('non-shared accounts in discovery', () => {
	const skipped = (accounts: string) =>
		`[@stackone/ai] Discovery skipped ${accounts.split(', ').length} non-shared account(s) (${accounts}): each belongs to a single end user. Pass their account ids, or opt in to non-shared accounts, to use them.`;
	const warnings = (): string[] => warnSpy.mock.calls.map((args: unknown[]) => String(args[0]));
	const accountsOf = (tools: Tools) =>
		[...new Set(tools.getStackOneTools().map((tool) => String(tool.getAccountId())))].sort();

	it('are skipped by default, with one warning per discovery', async () => {
		const { exchanges } = serve([
			...ACCOUNTS,
			{ id: 'acc0', provider: 'mock', status: 'active', shared: false, origin_username: 'dan' },
		]);
		const toolset = newToolSet();

		expect(accountsOf(await toolset.fetchTools())).toEqual(['acc2']);
		await toolset.search('list items');
		expect(warnings()).toEqual([skipped('acc0, acc1')]);
		expect(exchanges.every((exchange) => exchange.accountId === 'acc2')).toBe(true);

		toolset.clearCatalogCache();
		await toolset.fetchTools();
		expect(warnings()).toEqual([skipped('acc0, acc1'), skipped('acc0, acc1')]);
	});

	it('still have their end user recorded, for when their id is passed', async () => {
		const { exchanges, accountRequests } = serve();
		const toolset = newToolSet();
		await toolset.fetchTools();

		await toolset.fetchTools({ accountIds: ['acc1'] });

		expect(accountRequests()).toBe(1);
		expect(endUserIdsFor(exchanges, 'acc1').every(([, endUserId]) => endUserId === 'alice')).toBe(
			true,
		);
	});

	it('are included, without a warning, with includeNonShared', async () => {
		serve();
		const tools = await newToolSet({ includeNonShared: true }).fetchTools();

		expect(accountsOf(tools)).toEqual(['acc1', 'acc2']);
		expect(warnings().filter((warning) => warning.includes('non-shared'))).toEqual([]);
	});

	it('leave an empty catalog when they are all there is', async () => {
		serve([ACCOUNTS[0]]);
		const toolset = newToolSet();

		expect((await toolset.fetchTools()).toArray()).toEqual([]);
		expect(await toolset.search('list items')).toEqual([]);
		expect(warnings()).toEqual([skipped('acc1')]);
	});
});

describe('x-end-user-id for an explicit account the API says is not shared', () => {
	it('is looked up once and the listing sent again with it', async () => {
		const { exchanges, accountRequests } = serve(ACCOUNTS, { acc1: 'alice' });
		const toolset = newToolSet({ accountId: 'acc1' });

		const tools = await toolset.fetchTools();
		await getTool(tools, 'acc1_tool_1').execute({});

		expect(accountRequests()).toBe(1);
		expect(endUserIdsFor(exchanges, 'acc1')).toEqual([
			['initialize', null],
			['initialize', 'alice'],
			['notifications/initialized', 'alice'],
			['tools/list', 'alice'],
			['initialize', 'alice'],
			['notifications/initialized', 'alice'],
			['tools/call', 'alice'],
		]);
	});

	it('is looked up once and the tools/call sent again with it', async () => {
		const { exchanges, accountRequests } = serve(ACCOUNTS, { acc1: 'alice' });
		const toolset = newToolSet({ accountId: 'acc2' });
		const tool = getTool(await toolset.fetchTools(), 'acc1_tool_1').setAccountId('acc1');

		await tool.execute({});

		expect(accountRequests()).toBe(1);
		expect(endUserIdsFor(exchanges, 'acc1')).toEqual([
			['initialize', null],
			['initialize', 'alice'],
			['notifications/initialized', 'alice'],
			['tools/call', 'alice'],
		]);
	});

	it('shares a GET /accounts already in flight', async () => {
		let release!: () => void;
		const released = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { accountRequests } = serve(
			async () => {
				await released;
				return HttpResponse.json(ACCOUNTS);
			},
			{ acc1: 'alice' },
		);
		const toolset = newToolSet({ accountId: 'acc1' });

		const fetching = toolset.fetchAccounts();
		const listing = toolset.fetchTools();
		await new Promise((resolve) => setTimeout(resolve, 20));
		release();
		await Promise.all([fetching, listing]);

		expect(accountRequests()).toBe(1);
	});

	it('shares the newest GET /accounts in flight, even once an older one settles', async () => {
		const releases: Array<() => void> = [];
		let requests = 0;
		const { accountRequests } = serve(
			async () => {
				requests += 1;
				if (requests === 1) {
					await new Promise<void>((resolve) => releases.push(resolve));
					return HttpResponse.json([ACCOUNTS[1]]);
				}
				if (requests === 2) {
					await new Promise<void>((resolve) => releases.push(resolve));
				}
				return HttpResponse.json(ACCOUNTS);
			},
			{ acc1: 'alice' },
		);
		const toolset = newToolSet({ accountId: 'acc1' });

		const older = toolset.fetchAccounts();
		await vi.waitFor(() => expect(requests).toBe(1));
		const newer = toolset.fetchAccounts();
		await vi.waitFor(() => expect(requests).toBe(2));
		releases[0]?.();
		await older;
		const listing = toolset.fetchTools();
		await new Promise((resolve) => setTimeout(resolve, 50));
		releases[1]?.();
		await Promise.all([newer, listing]);

		expect(accountRequests()).toBe(2);
	});

	it.each([
		['GET /accounts reports no end user for it', () => HttpResponse.json([ACCOUNTS[1]])],
		['GET /accounts fails', () => HttpResponse.json({ message: 'boom' }, { status: 500 })],
	])('throws the 400 as it came when %s', async (_case, accounts) => {
		const { exchanges, accountRequests } = serve(accounts, { acc1: 'alice' });

		const error = await newToolSet({ accountId: 'acc1' })
			.fetchTools()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(400);
		expect((error as Error).message).toContain(
			'x-end-user-id header does not match account end user id for account acc1',
		);
		expect(accountRequests()).toBe(1);
		expect(endUserIdsFor(exchanges, 'acc1')).toEqual([['initialize', null]]);
	});

	it('throws the 400 with the failed lookup as its cause', async () => {
		serve(() => HttpResponse.json({ message: 'missing scope platform.read' }, { status: 403 }), {
			acc1: 'alice',
		});

		const error = await newToolSet({ accountId: 'acc1' })
			.fetchTools()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(400);
		expect((error as Error).message).toContain(
			'x-end-user-id header does not match account end user id for account acc1',
		);
		const cause = (error as Error).cause;
		expect(cause).toBeInstanceOf(StackOneAPIError);
		expect((cause as StackOneAPIError).statusCode).toBe(403);
		expect((cause as Error).message).toContain('missing scope platform.read');
	});

	it('is not looked up again when one is already recorded', async () => {
		const { exchanges, accountRequests } = serve([{ ...ACCOUNTS[0], origin_username: 'carol' }], {
			acc1: 'alice',
		});
		const toolset = newToolSet({ accountId: 'acc1' });
		await toolset.fetchAccounts();

		await expect(toolset.fetchTools()).rejects.toThrow(StackOneAPIError);

		expect(accountRequests()).toBe(1);
		expect(endUserIdsFor(exchanges, 'acc1')).toEqual([['initialize', 'carol']]);
	});

	it('stays fatal to a fan-out when the lookup is rate limited', async () => {
		serve(ACCOUNTS, { acc1: 'alice' });
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json(
					{ statusCode: 429, message: 'Too many requests' },
					{ status: 429, headers: { 'Retry-After': '0' } },
				),
			),
		);

		// acc2 lists fine; acc1 needs the lookup, which is rate limited. Skipping acc1 would hand
		// back a partial catalog, so the call fails with the 429 instead.
		const error = await newToolSet({ accountIds: ['acc1', 'acc2'] })
			.fetchTools()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(429);
	});

	it('is looked up whatever the refusal names the account as', async () => {
		serve(ACCOUNTS, { acc1: 'alice' });
		server.use(
			// With the header, fall through to serve()'s own guard and catalog.
			http.all(`${TEST_BASE_URL}/mcp`, ({ request }) =>
				request.headers.get('x-end-user-id')
					? undefined
					: HttpResponse.json(
							{
								statusCode: 400,
								message:
									'x-end-user-id header does not match account end user id for account "acc1"',
							},
							{ status: 400 },
						),
			),
		);

		// Without the lookup, the reworded refusal would be thrown; with it, acc1 lists.
		const tools = await newToolSet({ accountId: 'acc1' }).fetchTools();
		expect(tools.toArray().length).toBeGreaterThan(0);
	});

	it('is not looked up for any other 400', async () => {
		const { accountRequests } = serve();
		server.use(
			http.all(`${TEST_BASE_URL}/mcp`, () =>
				HttpResponse.json({ statusCode: 400, message: 'Bad request' }, { status: 400 }),
			),
		);

		await expect(newToolSet({ accountId: 'acc1' }).fetchTools()).rejects.toThrow(StackOneAPIError);
		expect(accountRequests()).toBe(0);
	});
});
