/**
 * HTTP 429 end to end: every request the toolset makes is retried, and a 429 that outlasts its
 * retries fails the whole call rather than costing one account. The retry timing itself is
 * covered in utils/fetch-retry.test.ts; here every 429 carries `Retry-After: 0`, so nothing waits.
 */
import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { mockAccounts } from '../mocks/handlers.stackone-accounts';
import { type RecordedToolCall, accountMcpTools, createMcpApp } from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { StackOneToolSet } from './toolsets';
import { StackOneAPIError } from './utils/error-stackone-api';
import { retryTiming } from './utils/fetch-retry';

const newToolSet = (config: ConstructorParameters<typeof StackOneToolSet>[0] = {}) =>
	new StackOneToolSet({ apiKey: 'test-key', baseUrl: TEST_BASE_URL, ...config });

const RATE_LIMITED = { message: 'Too many requests' };

let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
	warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
	vi.restoreAllMocks();
});

const warnings = (): string[] => warnSpy.mock.calls.map(([message]: unknown[]) => String(message));
const retryWarnings = (): string[] => warnings().filter((message) => message.includes('(429)'));

interface Throttle {
	/** Answer 429 to the first `times` requests this matches. Default: every one. */
	times?: number;
	method?: string;
	accountId?: string;
	/** The `Retry-After` each 429 carries. Default: `'0'`. */
	retryAfter?: string;
}

/**
 * Serve the mock MCP app, answering 429 (with `Retry-After: 0`) to the requests the throttle
 * matches, and 412 to account `dead`. Returns the attempts the throttle saw and the tools/calls
 * that reached the app.
 */
const serveThrottled = (throttle: Throttle) => {
	const attempts = { matched: 0 };
	const calls: RecordedToolCall[] = [];
	const app = createMcpApp({
		accountTools: accountMcpTools,
		onToolCall: (call) => calls.push(call),
	});
	server.use(
		http.all(`${TEST_BASE_URL}/mcp`, async ({ request }) => {
			const accountId = request.headers.get('x-account-id') ?? undefined;
			if (accountId === 'dead') {
				return HttpResponse.json({ message: 're-link the account to resume' }, { status: 412 });
			}
			const message =
				request.method === 'POST'
					? ((await request.clone().json()) as { method?: string })
					: undefined;
			const matches =
				(throttle.method === undefined || message?.method === throttle.method) &&
				(throttle.accountId === undefined || accountId === throttle.accountId);
			if (matches && attempts.matched++ < (throttle.times ?? Number.POSITIVE_INFINITY)) {
				return HttpResponse.json(RATE_LIMITED, {
					status: 429,
					headers: { 'Retry-After': throttle.retryAfter ?? '0' },
				});
			}
			return app.fetch(request);
		}),
	);
	return { attempts, calls };
};

const expectRateLimited = (error: unknown) => {
	expect(error).toBeInstanceOf(StackOneAPIError);
	expect((error as StackOneAPIError).statusCode).toBe(429);
	expect((error as StackOneAPIError).responseBody).toEqual(RATE_LIMITED);
};

describe('a 429 that clears on retry', () => {
	it('retries the MCP handshake', async () => {
		const { attempts } = serveThrottled({ method: 'initialize', times: 1 });

		const tools = await newToolSet().fetchTools({ accountIds: ['acc1'] });

		expect(tools.length).toBe(accountMcpTools.acc1.length);
		expect(attempts.matched).toBe(2);
	});

	it('retries a listing', async () => {
		const { attempts } = serveThrottled({ method: 'tools/list', times: 1 });

		const tools = await newToolSet().fetchTools({ accountIds: ['acc1'] });

		expect(tools.length).toBe(accountMcpTools.acc1.length);
		expect(attempts.matched).toBe(2);
		expect(retryWarnings()).toEqual([
			expect.stringMatching(
				new RegExp(
					`^\\[@stackone/ai\\] POST ${TEST_BASE_URL}/mcp was rate limited \\(429\\) on attempt 1 of 4; retrying in 0s$`,
				),
			),
		]);
	});

	it('retries a tools/call, which reaches the server once', async () => {
		const { attempts, calls } = serveThrottled({ method: 'tools/call', times: 1 });
		const tool = (await newToolSet().fetchTools({ accountIds: ['acc1'] })).getTool('acc1_tool_1');

		const result = await tool?.execute({ fields: 'name' });

		expect(result).toMatchObject({ isError: false, result: { data: { action: 'acc1_tool_1' } } });
		expect(attempts.matched).toBe(2);
		expect(calls).toHaveLength(1);
	});

	it('retries GET /accounts', async () => {
		let requests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				requests++ === 0
					? HttpResponse.json(RATE_LIMITED, { status: 429, headers: { 'Retry-After': '0' } })
					: HttpResponse.json(mockAccounts),
			),
		);

		expect(await newToolSet().fetchAccounts()).toEqual(mockAccounts);
		expect(requests).toBe(2);
		expect(retryWarnings()).toEqual([
			`[@stackone/ai] GET ${TEST_BASE_URL}/accounts was rate limited (429) on attempt 1 of 4; retrying in 0s`,
		]);
	});
});

describe('a 429 that outlasts its retries', () => {
	it('throws a 429 StackOneAPIError from GET /accounts after exactly 4 attempts', async () => {
		let requests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () => {
				requests++;
				return HttpResponse.text('slow down', { status: 429, headers: { 'Retry-After': '0' } });
			}),
		);

		const error = await newToolSet()
			.fetchAccounts()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(429);
		expect((error as StackOneAPIError).responseBody).toBe('slow down');
		expect(requests).toBe(4);
		expect(retryWarnings()).toHaveLength(3);
	});

	it('throws a 429 StackOneAPIError from a listing after exactly 4 attempts', async () => {
		const { attempts } = serveThrottled({ method: 'tools/list' });

		const error = await newToolSet()
			.fetchTools({ accountIds: ['acc1'] })
			.catch((caught: unknown) => caught);

		expectRateLimited(error);
		expect(attempts.matched).toBe(4);
		expect(retryWarnings().map((message) => message.match(/attempt \d of 4/)?.[0])).toEqual([
			'attempt 1 of 4',
			'attempt 2 of 4',
			'attempt 3 of 4',
		]);
	});

	it('throws a 429 StackOneAPIError from a tools/call after exactly 4 attempts', async () => {
		const { attempts, calls } = serveThrottled({ method: 'tools/call' });
		const tool = (await newToolSet().fetchTools({ accountIds: ['acc1'] })).getTool('acc1_tool_1');

		const error = await tool?.execute({ fields: 'name' }).catch((caught: unknown) => caught);

		expectRateLimited(error);
		expect(attempts.matched).toBe(4);
		expect(calls).toHaveLength(0);
	});

	it('fails a multi-account listing instead of returning the other accounts', async () => {
		serveThrottled({ method: 'tools/list', accountId: 'acc2' });

		const error = await newToolSet()
			.fetchTools({ accountIds: ['acc1', 'acc2', 'dead'] })
			.catch((caught: unknown) => caught);

		expectRateLimited(error);
		expect(warnings().filter((message) => message.includes('Skipping'))).toEqual([]);
	});

	it('still skips an account that fails any other way', async () => {
		serveThrottled({ method: 'tools/list', times: 0 });

		const tools = await newToolSet().fetchTools({ accountIds: ['acc1', 'dead'] });

		expect(tools.length).toBe(accountMcpTools.acc1.length);
		expect(warnings()).toEqual([
			expect.stringMatching(/Skipping account that failed to list tools — dead: .*412/),
		]);
	});

	it('fails account discovery, and the listing that needed it', async () => {
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json(RATE_LIMITED, { status: 429, headers: { 'Retry-After': '0' } }),
			),
		);

		const error = await newToolSet()
			.fetchTools()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(429);
		// GET /accounts keeps its error body as text.
		expect((error as StackOneAPIError).responseBody).toBe(JSON.stringify(RATE_LIMITED));
	});

	it('fails a search instead of skipping the throttled connector', async () => {
		serveThrottled({ method: 'tools/call', accountId: 'acc2' });

		const error = await newToolSet()
			.search('list items', { accountIds: ['acc1', 'acc2'] })
			.catch((caught: unknown) => caught);

		expectRateLimited(error);
		expect(warnings().filter((message) => message.includes('Skipping'))).toEqual([]);
	});
});

describe('a 429 whose wait would outlast the timeout', () => {
	/**
	 * Replace the retry clock with a fake one that each wait advances, so nothing really waits.
	 * Returns the waits requested.
	 */
	const fakeClock = () => {
		const clock = { now: 0 };
		const waits: number[] = [];
		vi.spyOn(retryTiming, 'now').mockImplementation(() => clock.now);
		vi.spyOn(retryTiming, 'sleep').mockImplementation(async (ms) => {
			waits.push(ms);
			clock.now += ms;
		});
		return waits;
	};

	it('fails a multi-account listing with the 429 instead of timing the account out', async () => {
		const waits = fakeClock();
		const { attempts } = serveThrottled({ accountId: 'acc2', retryAfter: '2' });

		const error = await newToolSet({ timeout: 3_000 })
			.fetchTools({ accountIds: ['acc1', 'acc2'] })
			.catch((caught: unknown) => caught);

		expectRateLimited(error);
		// One 2s wait fits in 3s; the second would end at 4s, so the 429 is returned instead.
		expect(waits).toEqual([2_000]);
		expect(attempts.matched).toBe(2);
		expect(warnings().filter((message) => message.includes('Skipping'))).toEqual([]);
	});

	it('throws the 429 from GET /accounts without waiting', async () => {
		const waits = fakeClock();
		let requests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () => {
				requests++;
				return HttpResponse.json(RATE_LIMITED, { status: 429, headers: { 'Retry-After': '3' } });
			}),
		);

		const error = await newToolSet({ timeout: 1_000 })
			.fetchAccounts()
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect((error as StackOneAPIError).statusCode).toBe(429);
		expect(requests).toBe(1);
		expect(waits).toEqual([]);
		expect(retryWarnings()).toEqual([
			`[@stackone/ai] GET ${TEST_BASE_URL}/accounts was rate limited (429) on attempt 1 of 4; not retrying, because waiting 3s would pass the deadline`,
		]);
	});

	it('measures the GET /accounts deadline from the first attempt', async () => {
		const waits = fakeClock();
		let requests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () => {
				requests++;
				return HttpResponse.json(RATE_LIMITED, { status: 429, headers: { 'Retry-After': '1' } });
			}),
		);

		const error = await newToolSet({ timeout: 2_500 })
			.fetchAccounts()
			.catch((caught: unknown) => caught);

		expect((error as StackOneAPIError).statusCode).toBe(429);
		expect(waits).toEqual([1_000, 1_000]);
		expect(requests).toBe(3);
	});
});

describe('other statuses', () => {
	it.each([400, 500])('does not retry a %i', async (status) => {
		let requests = 0;
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () => {
				requests++;
				return HttpResponse.json({ message: 'no' }, { status, headers: { 'Retry-After': '0' } });
			}),
		);

		const error = await newToolSet()
			.fetchAccounts()
			.catch((caught: unknown) => caught);

		expect((error as StackOneAPIError).statusCode).toBe(status);
		expect(requests).toBe(1);
		expect(retryWarnings()).toEqual([]);
	});

	it('does not retry a 500 from the MCP endpoint', async () => {
		let requests = 0;
		server.use(
			http.post(`${TEST_BASE_URL}/mcp`, () => {
				requests++;
				return HttpResponse.json({ message: 'down' }, { status: 500 });
			}),
		);

		const error = await newToolSet()
			.fetchTools({ accountIds: ['acc1'] })
			.catch((caught: unknown) => caught);

		expect((error as StackOneAPIError).statusCode).toBe(500);
		expect(requests).toBe(1);
	});
});
