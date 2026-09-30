/**
 * StackOneToolSet: configuration, account discovery, catalog listing and caching, filtering,
 * tool-mode routing and the failure modes of each. Search, execute and feedback live in
 * toolsets.search-execute.test.ts.
 */
import { createServer, type Server as NetServer, type Socket } from 'node:net';
import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import {
	type McpToolDefinition,
	type RecordedToolCall,
	accountMcpTools,
	createMcpApp,
} from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { type McpToolDefinition as ListedTool, listMcpTools } from './mcp-client';
import { StackOneMcpTool, type StackOneTool } from './tool';
import { StackOneToolSet } from './toolsets';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';
import { ToolSetConfigError, ToolSetLoadError } from './utils/error-toolset';

vi.mock('./mcp-client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./mcp-client')>();
	return { ...actual, listMcpTools: vi.fn(actual.listMcpTools) };
});

const listMock = vi.mocked(listMcpTools);
const { listMcpTools: realListMcpTools } =
	await vi.importActual<typeof import('./mcp-client')>('./mcp-client');

type ListRequest = Parameters<typeof listMcpTools>[0];
const accountOf = (request: ListRequest): string | undefined => request.headers['x-account-id'];
const def = (name: string, inputSchema: Record<string, unknown> = {}): ListedTool => ({
	name,
	description: '',
	inputSchema,
});
/** Replace the MCP listing, as the Python suite monkeypatches `fetch_mcp_tools`. */
const fakeListing = (listing: (request: ListRequest) => ListedTool[] | Promise<ListedTool[]>) => {
	listMock.mockImplementation(async (request) => listing(request));
};

const newToolSet = (config: ConstructorParameters<typeof StackOneToolSet>[0] = {}) =>
	new StackOneToolSet({ apiKey: 'test-key', baseUrl: TEST_BASE_URL, ...config });
const names = (tools: { toArray(): Array<{ name: string }> }) =>
	tools.toArray().map((tool) => tool.name);

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
	vi.stubEnv('STACKONE_ACCOUNT_ID', '');
	warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
	listMock.mockReset();
	listMock.mockImplementation(realListMcpTools);
});

describe('configuration', () => {
	it('requires an API key', () => {
		vi.stubEnv('STACKONE_API_KEY', '');
		expect(() => new StackOneToolSet()).toThrow(ToolSetConfigError);
		expect(() => new StackOneToolSet()).toThrow(/API key must be provided/);
	});

	it('reads the API key from STACKONE_API_KEY', async () => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
		const tools = await new StackOneToolSet({
			baseUrl: TEST_BASE_URL,
			accountId: 'acc1',
		}).fetchTools();
		expect(tools.length).toBe(2);
	});

	it('reads the account from STACKONE_ACCOUNT_ID', async () => {
		vi.stubEnv('STACKONE_ACCOUNT_ID', 'acc3');
		expect(names(await newToolSet().fetchTools())).toEqual(['acc3_tool_1']);
	});

	it('refuses both accountId and accountIds', () => {
		expect(() => newToolSet({ accountId: 'a', accountIds: ['b'] } as never)).toThrow(
			/Cannot provide both accountId and accountIds/,
		);
	});

	it.each([
		['accountIds', () => newToolSet({ accountIds: 'acc1' as never })],
		['setAccounts', () => newToolSet().setAccounts('acc1' as never)],
		['fetchTools', () => newToolSet().fetchTools({ accountIds: 'acc1' as never })],
	])('refuses a string where %s expects a list', async (_name, act) => {
		await expect(async () => act()).rejects.toThrow(/not a string. Did you mean \["acc1"\]\?/);
	});

	it('returns itself from setAccounts for chaining', () => {
		const toolset = newToolSet();
		expect(toolset.setAccounts(['acc1'])).toBe(toolset);
	});

	it('warns that it overrides SDK-owned headers passed in config', () => {
		newToolSet({ headers: { Authorization: 'Bearer x', 'X-Trace': 't' } });
		expect(String(warnSpy.mock.calls[0]?.[0])).toContain('"Authorization"');
	});
});

describe('account scope', () => {
	it('lists the given accounts', async () => {
		const tools = await newToolSet().fetchTools({ accountIds: ['acc1'] });
		expect(names(tools)).toEqual(['acc1_tool_1', 'acc1_tool_2']);
	});

	it('lists every given account', async () => {
		expect((await newToolSet().fetchTools({ accountIds: ['acc1', 'acc2', 'acc3'] })).length).toBe(
			5,
		);
	});

	it('uses setAccounts, the constructor accountIds, execute.accountIds and accountId in turn', async () => {
		expect(names(await newToolSet().setAccounts(['acc3']).fetchTools())).toEqual(['acc3_tool_1']);
		expect(names(await newToolSet({ accountIds: ['acc3'] }).fetchTools())).toEqual(['acc3_tool_1']);
		expect(names(await newToolSet({ execute: { accountIds: ['acc3'] } }).fetchTools())).toEqual([
			'acc3_tool_1',
		]);
		expect(names(await newToolSet({ accountId: 'acc3' }).fetchTools())).toEqual(['acc3_tool_1']);
	});

	it('lets fetchTools override setAccounts without changing it', async () => {
		const toolset = newToolSet().setAccounts(['acc1', 'acc2']);

		expect(names(await toolset.fetchTools({ accountIds: ['acc3'] }))).toEqual(['acc3_tool_1']);
		expect((await toolset.fetchTools()).length).toBe(4);
	});

	it('lets setAccounts override the constructor accounts', async () => {
		const toolset = newToolSet({ accountIds: ['acc1'] }).setAccounts(['acc2', 'acc3']);
		expect(names(await toolset.fetchTools())).toEqual([
			'acc2_tool_1',
			'acc2_tool_2',
			'acc3_tool_1',
		]);
	});

	it('binds each tool to the account it was listed for', async () => {
		const tools = await newToolSet().fetchTools({ accountIds: ['acc1', 'acc2', 'acc3'] });
		for (const tool of tools.toArray() as StackOneTool[]) {
			expect(tool.getAccountId()).toBe(tool.name.split('_')[0]);
		}
	});

	it('keeps accounts apart when two fetchTools calls run concurrently', async () => {
		const toolset = newToolSet();
		const [acc1, acc2] = await Promise.all([
			toolset.fetchTools({ accountIds: ['acc1'] }),
			toolset.fetchTools({ accountIds: ['acc2'] }),
		]);

		expect((acc1.toArray() as StackOneTool[]).map((tool) => tool.getAccountId())).toEqual([
			'acc1',
			'acc1',
		]);
		expect((acc2.toArray() as StackOneTool[]).map((tool) => tool.getAccountId())).toEqual([
			'acc2',
			'acc2',
		]);
	});
});

/**
 * An API key alone must work: /mcp requires an account, so the SDK finds one. The mock used to
 * invent an account when the header was absent, so an SDK that never sent one still got a full
 * catalog — these would all have passed against the SDK that shipped broken.
 */
describe('account discovery', () => {
	it('lists the active accounts when none is configured', async () => {
		const tools = await newToolSet().fetchTools();

		expect(names(tools)).toEqual(['default_tool_1', 'default_tool_2']);
		expect(listMock.mock.calls.map(([request]) => accountOf(request))).toEqual(['default']);
	});

	it('exposes the linked accounts', async () => {
		const accounts = await newToolSet().fetchAccounts();

		expect(accounts.map((account) => account.id)).toEqual(['default', 'dead']);
		expect(accounts.filter((account) => account.status === 'active').map((a) => a.id)).toEqual([
			'default',
		]);
	});

	it('discovers once, until the cache is cleared', async () => {
		let requests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () => {
				requests += 1;
				return HttpResponse.json([{ id: 'acc1', status: 'active' }]);
			}),
		);
		const toolset = newToolSet();

		await toolset.fetchTools();
		await toolset.fetchTools({ providers: ['acc1'] });
		expect(requests).toBe(1);

		toolset.clearCatalogCache();
		await toolset.fetchTools();
		expect(requests).toBe(2);
	});

	it('shares one discovery between concurrent calls', async () => {
		let requests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () => {
				requests += 1;
				return HttpResponse.json([{ id: 'acc1', status: 'active' }]);
			}),
		);
		fakeListing(() => []);
		const toolset = newToolSet();

		await Promise.all([toolset.search('x'), toolset.fetchTools(), toolset.fetchTools()]);

		expect(requests).toBe(1);
	});

	it('retries a discovery that failed', async () => {
		let requests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () => {
				requests += 1;
				return requests === 1
					? HttpResponse.json({ message: 'busy' }, { status: 503 })
					: HttpResponse.json([{ id: 'acc1', status: 'active' }]);
			}),
		);
		const toolset = newToolSet();

		await expect(toolset.fetchTools()).rejects.toBeInstanceOf(StackOneAPIError);
		expect(names(await toolset.fetchTools())).toEqual(['acc1_tool_1', 'acc1_tool_2']);
		expect(requests).toBe(2);
	});

	it('accepts a { data: [...] } wrapper', async () => {
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json({ data: [{ id: 'acc3', status: 'active' }] }),
			),
		);
		expect(names(await newToolSet().fetchTools())).toEqual(['acc3_tool_1']);
	});

	it('explains a key with no linked accounts', async () => {
		server.use(http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.json([])));
		await expect(newToolSet().fetchTools()).rejects.toThrow(
			new ToolSetConfigError(
				'This API key has no linked accounts. Link one in the StackOne dashboard, or pass accountId explicitly.',
			),
		);
	});

	it('explains a key whose accounts are all inactive', async () => {
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json([{ id: 'x', provider: 'hibob', status: 'error' }]),
			),
		);
		await expect(newToolSet().fetchTools()).rejects.toThrow(
			/None of this API key's 1 linked accounts are active: hibob \(error\)/,
		);
	});

	it('carries the status of a refused /accounts request', async () => {
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json({ message: 'bad key' }, { status: 401, statusText: 'Unauthorized' }),
			),
		);
		const error = (await newToolSet()
			.fetchAccounts()
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(401);
		expect(error.message).toContain('401 Unauthorized: {"message":"bad key"}');
	});

	it.each([
		[
			'a non-list body',
			HttpResponse.json({ results: [{ id: 'a' }] }),
			/Unexpected \/accounts response shape: expected a list, got object/,
		],
		[
			'invalid JSON',
			new HttpResponse('[{', { headers: { 'content-type': 'application/json' } }),
			/Invalid JSON returned by/,
		],
		[
			// `["\xff"]` is valid JSON only if the stray byte is silently replaced, so this
			// fails unless the body is decoded strictly.
			'invalid UTF-8',
			new HttpResponse(new Uint8Array([0x5b, 0x22, 0xff, 0x22, 0x5d])),
			/Invalid JSON returned by/,
		],
	])('reports %s as a ToolSetLoadError', async (_name, response, message) => {
		server.use(http.get(`${TEST_BASE_URL}/accounts`, () => response));
		const error = await newToolSet()
			.fetchAccounts()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetLoadError);
		expect((error as Error).message).toMatch(message);
	});

	it('reports an unreachable API as a ToolSetLoadError', async () => {
		server.use(http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.error()));
		await expect(newToolSet().fetchAccounts()).rejects.toThrow(
			new RegExp(`^Could not reach ${TEST_BASE_URL}/accounts`),
		);
	});
});

/** The mock refuses what the real API refuses, so a bug here cannot stay green. */
describe('server refusals', () => {
	it('refuses an unscoped /mcp request (guards the mock itself)', async () => {
		const response = await fetch(`${TEST_BASE_URL}/mcp`, {
			method: 'POST',
			headers: { Authorization: 'Basic dGVzdC1rZXk6', 'Content-Type': 'application/json' },
			body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
		});
		expect(response.status).toBe(400);
		expect(await response.text()).toContain('x-account-id');
	});

	it('refuses an unknown account rather than serving a default catalog', async () => {
		const error = (await newToolSet()
			.fetchTools({ accountIds: ['no-such-account'] })
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(404);
	});

	it('refuses execution without an account', async () => {
		const tool = (await newToolSet().fetchTools({ accountIds: ['test-account'] })).getStackOneTool(
			'dummy_action',
		);
		tool.setAccountId(undefined);

		const error = (await tool
			.execute({ foo: 'bar' })
			.catch((caught: unknown) => caught)) as StackOneAPIError;
		expect(error.statusCode).toBe(400);
	});
});

describe('listing', () => {
	// No param-style pin: tools/call arguments are mapped by the server, whichever style it serves.
	it('lists from the bare MCP endpoint, taking the server’s param-style', async () => {
		fakeListing(() => []);
		await newToolSet({ baseUrl: 'https://api.example.com/' }).fetchTools({ accountIds: ['acc1'] });
		expect(listMock.mock.calls[0]?.[0].endpoint).toBe('https://api.example.com/mcp');
	});

	it('passes the timeout to every listing', async () => {
		fakeListing(() => []);
		await newToolSet({ timeout: 1234 }).fetchTools({ accountIds: ['a', 'b'] });
		expect(listMock.mock.calls.map(([request]) => request.timeout)).toEqual([1234, 1234]);
	});

	it('sends caller headers beneath the SDK-owned ones', async () => {
		fakeListing(() => []);
		await newToolSet({ headers: { 'X-Trace': 't', 'x-account-id': 'spoofed' } }).fetchTools({
			accountIds: ['acc1'],
		});
		expect(listMock.mock.calls[0]?.[0].headers).toMatchObject({
			'X-Trace': 't',
			'x-account-id': 'acc1',
		});
		expect(listMock.mock.calls[0]?.[0].headers).not.toHaveProperty('X-Account-Id');
	});

	it('builds each tool from its served definition', async () => {
		const tool = (await newToolSet().fetchTools({ accountIds: ['test-account'] })).getTool(
			'dummy_action',
		);
		expect(tool?.description).toBe('Dummy tool');
		expect(tool?.toJsonSchema()).toEqual(accountMcpTools['test-account'][0].inputSchema);
	});

	it('runs accounts concurrently, bounded by the slowest', async () => {
		fakeListing(async (request) => {
			await new Promise((resolve) => setTimeout(resolve, 150));
			return [def(`tool_${accountOf(request)}`)];
		});

		const started = performance.now();
		await newToolSet().fetchTools({ accountIds: ['a', 'b', 'c', 'd', 'e'] });

		// Sequential would be 5 × 150ms; give CI generous headroom.
		expect(performance.now() - started).toBeLessThan(450);
	});

	it('keeps at most 10 listings in flight', async () => {
		let inFlight = 0;
		let peak = 0;
		fakeListing(async (request) => {
			inFlight += 1;
			peak = Math.max(peak, inFlight);
			await new Promise((resolve) => setTimeout(resolve, 20));
			inFlight -= 1;
			return [def(`tool_${accountOf(request)}`)];
		});

		const tools = await newToolSet().fetchTools({
			accountIds: Array.from({ length: 25 }, (_, index) => `acc-${index}`),
		});

		expect(tools.length).toBe(25);
		expect(peak).toBe(10);
	});

	it('orders tools by account, whatever order listings complete in', async () => {
		fakeListing(async (request) => {
			const account = accountOf(request) ?? '';
			await new Promise((resolve) => setTimeout(resolve, account === 'a' ? 30 : 0));
			return [def(`tool_${account}`)];
		});
		expect(names(await newToolSet().fetchTools({ accountIds: ['c', 'a', 'b'] }))).toEqual([
			'tool_a',
			'tool_b',
			'tool_c',
		]);
	});

	it('keeps the healthy accounts when one fails, and says which failed', async () => {
		fakeListing((request) => {
			if (accountOf(request) === 'b') {
				throw new Error('boom');
			}
			return [def(`tool_${accountOf(request)}`)];
		});

		const tools = await newToolSet().fetchTools({ accountIds: ['a', 'b'] });

		expect(names(tools)).toEqual(['tool_a']);
		expect(String(warnSpy.mock.calls[0]?.[0])).toMatch(
			/Skipping account that failed to list tools — b: boom/,
		);
	});

	it('treats every account failing as a failure, not an empty catalog', async () => {
		fakeListing((request) => {
			throw new Error(`boom for ${accountOf(request)}`);
		});
		await expect(newToolSet().fetchTools({ accountIds: ['a', 'b'] })).rejects.toThrow(
			'No account returned tools. a: boom for a | b: boom for b',
		);
	});

	it('does not cache a degraded listing', async () => {
		let failB = true;
		fakeListing((request) => {
			if (accountOf(request) === 'b' && failB) {
				throw new Error('boom');
			}
			return [def(`tool_${accountOf(request)}`)];
		});
		const toolset = newToolSet();

		expect((await toolset.fetchTools({ accountIds: ['a', 'b'] })).length).toBe(1);
		failB = false;
		expect((await toolset.fetchTools({ accountIds: ['a', 'b'] })).length).toBe(2);
	});

	it('passes an SDK error through without re-wrapping it', async () => {
		fakeListing(() => {
			throw new ToolSetConfigError('Original config error');
		});
		await expect(newToolSet({ accountId: 'acc1' }).fetchTools()).rejects.toThrow(
			new ToolSetConfigError('Original config error'),
		);
	});

	it('wraps an unexpected error as a ToolSetLoadError', async () => {
		fakeListing(() => [{ name: 'broken' } as ListedTool]);
		listMock.mockImplementationOnce(() => {
			throw new TypeError('unexpected');
		});
		await expect(newToolSet({ accountId: 'acc1' }).fetchTools()).rejects.toThrow(
			new ToolSetLoadError('Error fetching tools: unexpected'),
		);
	});
});

describe('filtering', () => {
	const mixed = () => newToolSet({ accountId: 'mixed' });

	it('filters by provider, case-insensitively', async () => {
		expect(names(await mixed().fetchTools({ providers: ['HiBob', 'bamboohr'] }))).toEqual([
			'hibob_list_employees',
			'hibob_create_employees',
			'bamboohr_list_employees',
			'bamboohr_get_employee',
		]);
	});

	it('matches a provider as a full prefix, not the first token', async () => {
		fakeListing(() => [def('browser_linkedin_search_people'), def('browser_open_page')]);
		expect(
			names(
				await newToolSet({ accountId: 'acc1' }).fetchTools({ providers: ['browser_linkedin'] }),
			),
		).toEqual(['browser_linkedin_search_people']);
	});

	it('filters by exact action name', async () => {
		expect(
			names(
				await mixed().fetchTools({ actions: ['hibob_list_employees', 'hibob_create_employees'] }),
			),
		).toEqual(['hibob_list_employees', 'hibob_create_employees']);
	});

	it.each([
		[
			['*_list_employees'],
			['hibob_list_employees', 'bamboohr_list_employees', 'workday_list_employees'],
		],
		[['hibob_*'], ['hibob_list_employees', 'hibob_create_employees']],
		[['[hb]*_get_*'], ['bamboohr_get_employee']],
		[['[!hb]*'], ['workday_list_employees']],
		[['hibob_list_employee?'], ['hibob_list_employees']],
		[['hibob.list*'], []],
	])('filters by glob %j', async (actions, expected) => {
		expect(names(await mixed().fetchTools({ actions }))).toEqual(expected);
	});

	it('combines accounts, providers and actions', async () => {
		expect(
			names(await newToolSet().fetchTools({ accountIds: ['acc1', 'acc2'], actions: ['*_tool_1'] })),
		).toEqual(['acc1_tool_1', 'acc2_tool_1']);
		expect(
			names(await mixed().fetchTools({ providers: ['hibob'], actions: ['*_list_*'] })),
		).toEqual(['hibob_list_employees']);
	});
});

describe('catalog cache', () => {
	const listingCount = () => listMock.mock.calls.length;

	it('lists once for repeated calls', async () => {
		const toolset = newToolSet({ accountId: 'acc1' });
		await toolset.fetchTools();
		await toolset.fetchTools();
		await toolset.fetchTools();
		expect(listingCount()).toBe(1);
	});

	it('keys on the account scope, not its order', async () => {
		const toolset = newToolSet();
		await toolset.fetchTools({ accountIds: ['acc1'] });
		await toolset.fetchTools({ accountIds: ['acc2'] });
		await toolset.fetchTools({ accountIds: ['acc1'] });
		expect(listingCount()).toBe(2);

		await toolset.fetchTools({ accountIds: ['acc1', 'acc2'] });
		await toolset.fetchTools({ accountIds: ['acc2', 'acc1', 'acc2'] });
		expect(listingCount()).toBe(4);
	});

	it('filters one cached listing without refetching', async () => {
		const toolset = newToolSet({ accountId: 'mixed' });
		await toolset.fetchTools();
		await toolset.fetchTools({ providers: ['hibob'] });
		await toolset.fetchTools({ actions: ['*_list_*'] });
		expect(listingCount()).toBe(1);
	});

	it('keys on the tool mode', async () => {
		const toolset = newToolSet({ accountId: 'acc1' });
		await toolset.fetchTools();
		await toolset.fetchTools({ mode: 'search_execute' });
		await toolset.fetchTools({ mode: 'search_execute' });
		expect(listingCount()).toBe(2);
	});

	it('is invalidated by clearCatalogCache and setAccounts', async () => {
		const toolset = newToolSet({ accountIds: ['acc1'] });
		await toolset.fetchTools();
		toolset.clearCatalogCache();
		await toolset.fetchTools();
		expect(listingCount()).toBe(2);

		toolset.setAccounts(['acc1']);
		await toolset.fetchTools();
		expect(listingCount()).toBe(3);
	});

	// A listing already in flight must not land after the clear that cancelled it — otherwise
	// the stale catalog is written back and served for the life of the process.
	it('is not repopulated by a listing that was in flight when it was cleared', async () => {
		const toolset = newToolSet({ accountId: 'acc1' });
		fakeListing(() => {
			toolset.clearCatalogCache();
			return [def('stale_tool')];
		});

		await toolset.fetchTools();
		fakeListing(() => [def('fresh_tool')]);

		expect(names(await toolset.fetchTools())).toEqual(['fresh_tool']);
	});

	it('hands every caller fresh tools, so rebinding one never rescopes another', async () => {
		const toolset = newToolSet({ accountId: 'acc1' });
		const first = (await toolset.fetchTools()).getStackOneTool('acc1_tool_1');
		first.setAccountId('someone-else');

		const second = (await toolset.fetchTools()).getStackOneTool('acc1_tool_1');

		expect(second).not.toBe(first);
		expect(second.getAccountId()).toBe('acc1');
	});

	it('does not share nested schema between callers', async () => {
		fakeListing(() => [def('t', { properties: { body_x: { type: 'object', properties: {} } } })]);
		const toolset = newToolSet({ accountId: 'acc1' });

		const first = (await toolset.fetchTools()).getTool('t');
		const nested = first?.parameters.properties.body_x?.properties;
		assert(nested);
		(nested as Record<string, unknown>).injected = { type: 'string' };

		const second = (await toolset.fetchTools()).getTool('t');
		expect(second?.parameters.properties.body_x?.properties).toEqual({});
	});
});

describe('tool mode', () => {
	it('builds MCP tools by default', async () => {
		fakeListing(() => [def('t')]);
		expect((await newToolSet({ accountId: 'acc1' }).fetchTools()).getTool('t')).toBeInstanceOf(
			StackOneMcpTool,
		);
	});

	it('builds MCP tools under search_execute, and requests it on the URL', async () => {
		fakeListing(() => [def('t')]);
		const tools = await newToolSet({ accountId: 'acc1', toolMode: 'search_execute' }).fetchTools();

		expect(tools.getTool('t')).toBeInstanceOf(StackOneMcpTool);
		expect(listMock.mock.calls[0]?.[0].endpoint).toBe(
			`${TEST_BASE_URL}/mcp?tool-mode=search_execute`,
		);
	});

	it('lets fetchTools override the configured mode, null meaning the server default', async () => {
		fakeListing(() => [def('t')]);
		const toolset = newToolSet({ accountId: 'acc1', toolMode: 'search_execute' });

		expect((await toolset.fetchTools({ mode: null })).getTool('t')).toBeInstanceOf(StackOneMcpTool);
		expect((await toolset.fetchTools({ mode: 'individual' })).getTool('t')).toBeInstanceOf(
			StackOneMcpTool,
		);
		expect(listMock.mock.calls.map(([request]) => request.endpoint.split('?')[1])).toEqual([
			undefined,
			'tool-mode=individual',
		]);
	});
});

describe('duplicate tool names', () => {
	it('warns when two accounts serve the same name', async () => {
		fakeListing(() => [def('hibob_list_employees'), def('hibob_get_employee')]);

		const tools = await newToolSet().fetchTools({ accountIds: ['a', 'b'] });

		expect(tools.length).toBe(4);
		expect((tools.getTool('hibob_list_employees') as StackOneTool).getAccountId()).toBe('a');
		expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
			'2 tool name(s) are served by more than one account (hibob_get_employee, hibob_list_employees)',
		);
	});

	// Listing order is by account id, whatever order the caller named them in, so which duplicate
	// getTool() returns is predictable.
	it('returns the first listed duplicate from getTool(), by account id', async () => {
		fakeListing(() => [def('hibob_list_employees')]);

		const tools = await newToolSet().fetchTools({ accountIds: ['b', 'a'] });

		expect(tools.toArray().map((tool) => (tool as StackOneTool).getAccountId())).toEqual([
			'a',
			'b',
		]);
		expect(tools.getTool('hibob_list_employees')).toBe(tools.toArray()[0]);
	});

	it('stays quiet when names are unique', async () => {
		await newToolSet().fetchTools({ accountIds: ['acc1', 'acc2'] });
		expect(warnSpy).not.toHaveBeenCalled();
	});
});

describe('stackone_submit_feedback in the catalog', () => {
	const serveFeedback = (submitFeedback: boolean) => {
		const rpcRequests: string[] = [];
		const app = createMcpApp({
			accountTools: { acc1: accountMcpTools.acc1, acc2: accountMcpTools.acc2 },
			submitFeedback,
		});
		server.use(
			http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)),
			http.post(`${TEST_BASE_URL}/actions/rpc`, async ({ request }) => {
				rpcRequests.push(((await request.json()) as { action: string }).action);
				return HttpResponse.json({ data: {} });
			}),
		);
		return rpcRequests;
	};

	it('appears once however many accounts list it, without a duplicate warning', async () => {
		serveFeedback(true);

		const tools = await newToolSet({ accountIds: ['acc1', 'acc2'] }).fetchTools();

		expect(names(tools).filter((name) => name === 'stackone_submit_feedback')).toHaveLength(1);
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it.each([undefined, 'search_execute'] as const)(
		'is an MCP tool executed over tools/call in %s mode, never RPC',
		async (toolMode) => {
			const rpcRequests = serveFeedback(true);
			const tool = (await newToolSet({ accountId: 'acc1', toolMode }).fetchTools()).getTool(
				'stackone_submit_feedback',
			);

			expect(tool).toBeInstanceOf(StackOneMcpTool);
			expect(
				await tool?.execute({ rating: 'positive', tool_names: ['acc1_tool_1'] }),
			).toMatchObject({ isError: false, result: { message: 'Feedback recorded' } });
			expect(rpcRequests).toEqual([]);
		},
	);

	it('is absent when the server does not serve it — the SDK never invents one', async () => {
		serveFeedback(false);
		const tools = await newToolSet({ accountId: 'acc1' }).fetchTools();
		expect(tools.getTool('stackone_submit_feedback')).toBeUndefined();
		expect(tools.getTool('tool_feedback')).toBeUndefined();
	});
});

describe('execution through fetched tools', () => {
	it('executes an action tool over tools/call against its account', async () => {
		const tools = await newToolSet({ accountId: 'your-bamboohr-account-id' }).fetchTools();
		const result = await tools.getTool('bamboohr_get_employee')?.execute({ id: 'emp-123' });
		expect(result).toEqual({
			isError: false,
			result: {
				data: {
					action: 'bamboohr_get_employee',
					account_id: 'your-bamboohr-account-id',
					arguments: { id: 'emp-123' },
				},
			},
		});
	});
});

describe('model-supplied headers', () => {
	const serveTool = (inputSchema: McpToolDefinition['inputSchema']) => {
		const calls: RecordedToolCall[] = [];
		const app = createMcpApp({
			accountTools: {
				'tenant-a': [{ name: 'crm_list_contacts', description: 'List contacts', inputSchema }],
			},
			onToolCall: (call) => calls.push(call),
		});
		server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));
		return calls;
	};
	const fetchTool = async () => {
		const tool = (await newToolSet({ accountId: 'tenant-a' }).fetchTools()).getTool(
			'crm_list_contacts',
		);
		assert(tool, 'tool should be listed');
		return tool;
	};

	// Regression: the RPC envelope's headers were merged OVER the tool's own, so a model-supplied
	// x-account-id replaced the account the tool was fetched for. Over tools/call the tenant is
	// the transport's x-account-id, which the SDK sets; the argument never reaches the server.
	it('cannot switch tenant with headers_x-account-id, even when the schema declares it', async () => {
		const calls = serveTool({
			type: 'object',
			properties: { 'headers_x-account-id': { type: 'string' }, query_limit: { type: 'number' } },
		});
		const tool = await fetchTool();

		await tool.execute({ 'headers_x-account-id': 'tenant-b', query_limit: 1 });

		expect(calls[0]?.accountId).toBe('tenant-a');
		expect(calls[0]?.arguments).toEqual({ query_limit: 1 });
	});

	it('cannot switch tenant with a nested headers object', async () => {
		const calls = serveTool({
			type: 'object',
			properties: { headers: { type: 'object', properties: {} } },
		});
		const tool = await fetchTool();

		await tool.execute({ headers: { 'X-Account-Id': 'tenant-b', Authorization: 'Bearer stolen' } });

		expect(calls[0]?.accountId).toBe('tenant-a');
		expect(calls[0]?.arguments.headers).toEqual({});
	});

	it('drops a headers_* argument the served schema does not declare', async () => {
		const calls = serveTool({ type: 'object', properties: { query_limit: { type: 'number' } } });
		const tool = await fetchTool();

		await tool.execute({ headers_foo: 'bar', query_limit: 1 });

		expect(calls[0]?.arguments).toEqual({ query_limit: 1 });
		expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
			'"headers_foo" from a tool call: not declared by the schema',
		);
	});

	it('forwards a headers_* argument the served schema declares', async () => {
		const calls = serveTool({
			type: 'object',
			properties: { 'headers_x-trace': { type: 'string' }, query_limit: { type: 'number' } },
		});
		const tool = await fetchTool();

		await tool.execute({ 'headers_x-trace': 'abc', query_limit: 1 });

		expect(calls[0]?.arguments).toEqual({ 'headers_x-trace': 'abc', query_limit: 1 });
	});

	it('forwards a header the served schema declares', async () => {
		const calls = serveTool({
			type: 'object',
			properties: { headers: { type: 'object', properties: { 'x-trace': { type: 'string' } } } },
		});
		const tool = await fetchTool();

		await tool.execute({ headers: { 'x-trace': 'abc', 'x-other': 'dropped' } });

		expect(calls[0]?.arguments.headers).toEqual({ 'x-trace': 'abc' });
	});

	it('forwards any header through an open headers object, except the ones the SDK owns', async () => {
		const calls = serveTool({ type: 'object', properties: { headers: { type: 'object' } } });
		const tool = await fetchTool();

		await tool.execute({
			headers: { 'x-custom': 'yes', Authorization: 'Bearer stolen', 'x-account-id': 'tenant-b' },
		});

		expect(calls[0]?.accountId).toBe('tenant-a');
		expect(calls[0]?.arguments.headers).toEqual({ 'x-custom': 'yes' });
		expect(warnSpy.mock.calls.map((args: unknown[]) => String(args[0]))).toEqual([
			'[@stackone/ai] Dropping header "Authorization" from a tool call: set by the SDK',
			'[@stackone/ai] Dropping header "x-account-id" from a tool call: set by the SDK',
		]);
	});

	it('sends every argument that is not a header argument unchanged', async () => {
		const calls = serveTool({
			type: 'object',
			properties: {
				query_limit: { type: 'number' },
				path: { type: 'object' },
				body: { type: 'object' },
			},
		});
		const tool = await fetchTool();
		const args = {
			query_limit: 1,
			path: { id: 'c1' },
			body: { headers: { Authorization: 'kept' }, headers_x: 'kept' },
			x_account_id: 'kept',
		};

		await tool.execute(args);

		expect(calls[0]?.arguments).toEqual(args);
	});
});

describe('openai()', () => {
	it('returns the catalog in OpenAI function format', async () => {
		const tools = await newToolSet({ accountId: 'test-account' }).openai();

		expect(tools).toEqual([
			{
				type: 'function',
				function: {
					name: 'dummy_action',
					description: 'Dummy tool',
					parameters: accountMcpTools['test-account'][0].inputSchema,
				},
			},
		]);
	});

	it('scopes to the given accounts', async () => {
		const tools = await newToolSet({ accountId: 'test-account' }).openai({ accountIds: ['acc3'] });
		expect(tools.map((tool) => tool.function.name)).toEqual(['acc3_tool_1']);
	});
});

describe('timeouts', () => {
	let silent: NetServer;
	const sockets: Socket[] = [];
	let port = 0;

	beforeAll(async () => {
		silent = createServer((socket) => sockets.push(socket));
		await new Promise<void>((resolve) => silent.listen(0, '127.0.0.1', resolve));
		port = (silent.address() as { port: number }).port;
	});
	afterAll(async () => {
		for (const socket of sockets) {
			socket.destroy();
		}
		await new Promise((resolve) => silent.close(resolve));
	});

	it('bounds a listing against a host that never answers', async () => {
		const toolset = new StackOneToolSet({
			apiKey: 'k',
			accountId: 'a',
			baseUrl: `http://127.0.0.1:${port}`,
			timeout: 300,
		});
		const started = Date.now();
		const error = await toolset.fetchTools().catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolSetLoadError);
		expect(Date.now() - started).toBeLessThan(5_000);
	});

	it('bounds account discovery too', async () => {
		const toolset = new StackOneToolSet({
			apiKey: 'k',
			baseUrl: `http://127.0.0.1:${port}`,
			timeout: 300,
		});
		await expect(toolset.fetchAccounts()).rejects.toThrow(ToolSetLoadError);
	});

	it('uses execute.timeout when no top-level timeout is given', async () => {
		fakeListing(() => []);
		await newToolSet({ accountId: 'acc1', execute: { timeout: 42 } }).fetchTools();
		expect(listMock.mock.calls[0]?.[0].timeout).toBe(42);
	});
});

it('is caught by `instanceof StackOneError`, whatever goes wrong', async () => {
	vi.stubEnv('STACKONE_API_KEY', '');
	expect(() => new StackOneToolSet()).toThrow(StackOneError);
	await expect(newToolSet().fetchTools({ accountIds: ['no-such-account'] })).rejects.toThrow(
		StackOneError,
	);
});
