/**
 * The shared vectors of StackOneHQ/sdk-conformance, vendored byte for byte in tests/vectors/
 * (scripts/sync-vectors.sh), run against the SDK's own code. The Python SDK runs the same files.
 * `unresolved` cases are not graded; every other case must pass.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { delay, http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { server } from '../mocks/node';
import { describeMcpFailure, listMcpTools, parseToolResult } from './mcp-client';
import { toolParametersFromInputSchema } from './schema';
import { BaseTool, StackOneMcpTool, Tools } from './tool';
import { StackOneToolSet } from './toolsets';
import type { JsonObject } from './types';
import type { StackOneAPIError } from './utils/error-stackone-api';
import { fetchWithRetry, rateLimitDelayMs, retryAfterMs, waitsForRetry } from './utils/fetch-retry';

vi.mock('./mcp-client', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./mcp-client')>();
	return { ...actual, listMcpTools: vi.fn(actual.listMcpTools) };
});
const listMock = vi.mocked(listMcpTools);
const { listMcpTools: realListMcpTools } =
	await vi.importActual<typeof import('./mcp-client')>('./mcp-client');

const VECTORS = join(import.meta.dirname, '..', 'tests', 'vectors');

/** Replace every `{"$number": "NaN" | "Infinity" | "-Infinity"}` with the number it names. */
const decodeNumbers = (value: unknown): unknown => {
	if (Array.isArray(value)) {
		return value.map(decodeNumbers);
	}
	if (typeof value === 'object' && value !== null) {
		const entries = Object.entries(value);
		if (entries.length === 1 && entries[0]?.[0] === '$number') {
			return Number(entries[0][1]);
		}
		// defineProperty, so a `__proto__` key stays an own property, as JSON.parse leaves it.
		const decoded = {};
		for (const [key, entry] of entries) {
			Object.defineProperty(decoded, key, {
				value: decodeNumbers(entry),
				enumerable: true,
				writable: true,
				configurable: true,
			});
		}
		return decoded;
	}
	return value;
};

interface VectorFile<Case> {
	version: number;
	cases: Case[];
	unresolved?: unknown[];
}

/** A vector file, its NaN markers decoded. */
function loadFile<File>(name: string): File {
	return decodeNumbers(JSON.parse(readFileSync(join(VECTORS, name), 'utf8'))) as File;
}
const load = <Case>(name: string): VectorFile<Case> => loadFile<VectorFile<Case>>(name);

/** Every vector file a describe() below grades. */
const GRADED = [
	'account-ids.json',
	'argument-encoding.json',
	'backoff.json',
	'header-arguments.json',
	'header-names.json',
	'header-values.json',
	'messages.json',
	'retry-after.json',
];

// A new vector file fails here until a test loads it, rather than passing ungraded.
it('grades every vector file', () => {
	const files = readdirSync(VECTORS).filter((name) => name.endsWith('.json'));
	expect(files.sort()).toEqual([...GRADED].sort());
});

/** Seconds are compared with a relative tolerance of 1e-9 (README, "Reading the values"). */
const expectSeconds = (actual: number | null, expected: number | null): void => {
	if (expected === null || actual === null || !Number.isFinite(expected)) {
		expect(actual).toBe(expected);
		return;
	}
	expect(Math.abs(actual - expected)).toBeLessThanOrEqual(Math.abs(expected) * 1e-9);
};

// ---------------------------------------------------------------------------------------------
// messages.json: rendering, shared by every file whose cases produce messages.

interface Placeholder {
	format: 'text' | 'json' | 'integer' | 'seconds' | 'seconds-2dp' | 'json-type' | 'reason';
}
interface Message {
	id: string;
	kind: 'error' | 'warning' | 'tool-result';
	error?: { node: string };
	template: string;
	placeholders: Record<string, Placeholder>;
}

const messages = loadFile<{
	version: number;
	reasons: Record<string, string>;
	messages: Message[];
}>('messages.json');
const messageById = new Map(messages.messages.map((message) => [message.id, message]));

const jsonType = (value: unknown): string =>
	value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

const formatValue = (value: unknown, format: Placeholder['format']): string => {
	switch (format) {
		case 'json':
			return JSON.stringify(value);
		case 'seconds':
			return String(value);
		case 'seconds-2dp':
			return String(Math.floor((value as number) * 100 + 0.5) / 100);
		case 'json-type':
			return jsonType(value);
		case 'reason': {
			const text = messages.reasons[value as string];
			if (text === undefined) {
				throw new Error(`No reason text for ${String(value)}`);
			}
			return text;
		}
		default:
			return String(value);
	}
};

/** A message's template, rendered with these values. */
const render = (id: string, values: Record<string, unknown> = {}): string => {
	const message = messageById.get(id);
	if (!message) {
		throw new Error(`messages.json has no message ${id}`);
	}
	return message.template.replace(/\{(\w+)\}/g, (_match, name: string) => {
		const placeholder = message.placeholders[name];
		if (!placeholder || !(name in values)) {
			throw new Error(`No value for {${name}} in ${id}`);
		}
		return formatValue(values[name], placeholder.format);
	});
};

/** A message's template as a pattern, with these values and every other placeholder open. */
const pattern = (id: string, values: Record<string, unknown> = {}): RegExp => {
	const message = messageById.get(id);
	if (!message) {
		throw new Error(`messages.json has no message ${id}`);
	}
	const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const source = message.template
		.split(/(\{\w+\})/)
		.map((part) => {
			const name = /^\{(\w+)\}$/.exec(part)?.[1];
			if (name === undefined) {
				return escape(part);
			}
			const placeholder = message.placeholders[name];
			return name in values && placeholder
				? escape(formatValue(values[name], placeholder.format))
				: '.*';
		})
		.join('');
	return new RegExp(`^${source}$`, 's');
};

const PREFIX = '[@stackone/ai] ';

let warnSpy: ReturnType<typeof vi.spyOn>;
const warnings = (): string[] => warnSpy.mock.calls.map(([message]: unknown[]) => String(message));
beforeEach(() => {
	warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
	vi.restoreAllMocks();
	listMock.mockReset();
	listMock.mockImplementation(realListMcpTools);
});

/** A tool with this served input schema, whose calls are dry runs: nothing is sent. */
const toolWith = (inputSchema: Record<string, unknown>, name = 'vector_tool') =>
	new StackOneMcpTool({
		name,
		description: '',
		parameters: toolParametersFromInputSchema(inputSchema as never),
		endpoint: `${TEST_BASE_URL}/mcp`,
		apiKey: 'test-key',
		accountId: 'acc-1',
		timeout: 5_000,
	});

const sentArguments = async (
	inputSchema: Record<string, unknown>,
	args: unknown,
): Promise<JsonObject> => {
	const call = await toolWith(inputSchema).execute(args as JsonObject, { dryRun: true });
	return call.arguments as JsonObject;
};

const OPEN_HEADERS = { type: 'object', properties: { headers: { type: 'object' } } };

// ---------------------------------------------------------------------------------------------

describe('retry-after.json', () => {
	const file = load<{
		id: string;
		header: string | null;
		now: string;
		expected_seconds: number | null;
	}>('retry-after.json');

	it('is the version these tests were written for', () => {
		expect(file.version).toBe(1);
	});

	it.each(file.cases)('$id', ({ header, now, expected_seconds }) => {
		const ms = retryAfterMs(header, Date.parse(now));
		expectSeconds(ms === undefined ? null : ms / 1000, expected_seconds);
	});
});

describe('backoff.json', () => {
	const file = loadFile<
		VectorFile<{
			id: string;
			retry: number;
			random: number;
			retry_after_seconds: number | null;
			expected_delay_seconds: number;
		}> & {
			deadline_cases: Array<{
				id: string;
				delay_seconds: number;
				remaining_seconds: number;
				expected: 'wait' | 'return-429';
			}>;
		}
	>('backoff.json');

	it('is the version these tests were written for', () => {
		expect(file.version).toBe(1);
	});

	it.each(file.cases)('$id', ({ retry, random, retry_after_seconds, expected_delay_seconds }) => {
		const delay = rateLimitDelayMs(
			retry,
			retry_after_seconds === null ? undefined : retry_after_seconds * 1000,
			() => random,
		);
		expectSeconds(delay / 1000, expected_delay_seconds);
	});

	it.each(file.deadline_cases)('$id', ({ delay_seconds, remaining_seconds, expected }) => {
		const waits = waitsForRetry(delay_seconds * 1000, remaining_seconds * 1000);
		expect(waits ? 'wait' : 'return-429').toBe(expected);
	});
});

describe('header-values.json', () => {
	const file = load<{ id: string; value: unknown; expected: string | { dropped: true } }>(
		'header-values.json',
	);

	it('is the version these tests were written for', () => {
		expect(file.version).toBe(1);
	});

	it.each(file.cases)('$id', async ({ value, expected }) => {
		const sent = await sentArguments(OPEN_HEADERS, { headers: { 'x-probe': value } });
		const headers = sent.headers as Record<string, string>;
		if (typeof expected === 'string') {
			expect(headers).toEqual({ 'x-probe': expected });
		} else {
			expect(headers).toEqual({});
		}
	});
});

describe('header-names.json', () => {
	const file = load<{
		id: string;
		name: string;
		expected: { forwarded: string } | { dropped: string };
	}>('header-names.json');

	it('is the version these tests were written for', () => {
		expect(file.version).toBe(1);
	});

	it.each(file.cases)('$id', async ({ name, expected }) => {
		const sent = await sentArguments(OPEN_HEADERS, { headers: { [name]: 'v' } });
		if ('forwarded' in expected) {
			expect(Object.entries(sent.headers as object)).toEqual([[expected.forwarded, 'v']]);
			expect(warnings()).toEqual([]);
		} else {
			expect(sent.headers).toEqual({});
			expect(warnings()).toEqual([
				PREFIX + render('header-dropped', { header: name.trim(), reason: expected.dropped }),
			]);
		}
	});
});

describe('header-arguments.json', () => {
	const file = load<{
		id: string;
		schema: Record<string, unknown>;
		arguments: JsonObject;
		expected_arguments: JsonObject;
		expected_warnings: Array<{ argument: string; header?: string; reason: string }>;
	}>('header-arguments.json');

	it('is the version these tests were written for', () => {
		expect(file.version).toBe(1);
	});

	it.each(file.cases)(
		'$id',
		async ({ schema, arguments: args, expected_arguments, expected_warnings }) => {
			const sent = await sentArguments(schema, args);
			// Key order too: arguments are forwarded in the order the model gave them.
			expect(JSON.stringify(sent)).toBe(JSON.stringify(expected_arguments));
			expect(warnings()).toEqual(
				expected_warnings.map(
					({ argument, header, reason }) =>
						PREFIX +
						(header === undefined
							? render('header-argument-dropped', { argument, reason })
							: render('header-dropped', { header, reason })),
				),
			);
		},
	);
});

describe('argument-encoding.json', () => {
	const file = load<{
		id: string;
		arguments?: unknown;
		arguments_json?: string;
		expected: 'ok' | { error: string; reason: string };
	}>('argument-encoding.json');

	const TOOL = 'vector_tool';
	const messageFor = (reason: string, input: unknown): RegExp => {
		switch (reason) {
			case 'not-finite':
				return pattern('arguments-not-finite', { tool: TOOL });
			case 'invalid-json': {
				let detail = '';
				try {
					JSON.parse(input as string);
				} catch (error) {
					detail = (error as Error).message;
				}
				return pattern('arguments-invalid-json', { tool: TOOL, detail });
			}
			case 'not-an-object':
				return pattern('arguments-not-an-object', { tool: TOOL });
			case 'unencodable':
				return pattern('arguments-not-encodable', { tool: TOOL });
			default:
				throw new Error(`Unknown reason ${reason}`);
		}
	};

	it('is the version these tests were written for', () => {
		expect(file.version).toBe(1);
	});

	it.each(file.cases)('$id', async (testCase) => {
		const input = 'arguments_json' in testCase ? testCase.arguments_json : testCase.arguments;
		const outcome = await toolWith({ type: 'object', properties: {} }, TOOL)
			.execute(input as JsonObject, { dryRun: true })
			.then(
				(call) => ({ ok: call }),
				(error: unknown) => ({ error: error as Error }),
			);
		if (testCase.expected === 'ok') {
			expect(outcome).toHaveProperty('ok');
			return;
		}
		expect('error' in outcome && outcome.error.name).toBe(testCase.expected.error);
		expect('error' in outcome && outcome.error.message).toMatch(
			messageFor(testCase.expected.reason, input),
		);
	});
});

describe('account-ids.json', () => {
	const file = load<{
		id: string;
		parameter: 'account_ids' | 'account_id';
		value: unknown;
		expected: 'ok' | { error: { node: string } };
	}>('account-ids.json');

	const newToolSet = (config: Record<string, unknown> = {}) =>
		new StackOneToolSet({ apiKey: 'test-key', baseUrl: TEST_BASE_URL, ...config });

	/** Every place that takes an account-id list, each refusing before any request. */
	const listTakers: Array<[string, (value: unknown) => Promise<unknown>]> = [
		['the constructor', async (value) => newToolSet({ accountIds: value })],
		['execute.accountIds', async (value) => newToolSet({ execute: { accountIds: value } })],
		['setAccounts()', async (value) => newToolSet().setAccounts(value as string[])],
		['fetchTools()', async (value) => newToolSet().fetchTools({ accountIds: value as string[] })],
	];

	const outcomeOf = (act: () => Promise<unknown>) =>
		act().then(
			() => 'ok' as const,
			(error: unknown) => error as Error,
		);

	it('is the version these tests were written for', () => {
		expect(file.version).toBe(1);
	});

	describe.each(file.cases)('$id', ({ parameter, value, expected }) => {
		const takers: Array<[string, (value: unknown) => Promise<unknown>]> =
			parameter === 'account_id'
				? [['the constructor', async (id) => newToolSet({ accountId: id })]]
				: listTakers;

		it.each(takers)('in %s', async (_where, take) => {
			listMock.mockResolvedValue([]);
			const outcome = await outcomeOf(() => take(value));
			if (expected === 'ok') {
				expect(outcome).toBe('ok');
			} else {
				expect(outcome).toBeInstanceOf(Error);
				expect((outcome as Error).name).toBe(expected.error.node);
			}
			if (expected !== 'ok' || parameter === 'account_id') {
				expect(listMock).not.toHaveBeenCalled();
			}
		});
	});
});

// ---------------------------------------------------------------------------------------------
// messages.json: every shared message, through the code that emits it.

const newToolSet = (config: Record<string, unknown> = {}) =>
	new StackOneToolSet({ apiKey: 'test-key', baseUrl: TEST_BASE_URL, ...config });

/** Serve these tools on the accounts their names end in, as `<name>_<account>[_<suffix>]`. */
const listByAccount = (names: string[]) => {
	listMock.mockImplementation(async ({ headers }) =>
		names
			.filter((name) =>
				name
					.replace(/_(search_actions|execute_action)$/, '')
					.endsWith(`_${headers['x-account-id']}`),
			)
			.map((name) => ({ name, description: '', inputSchema: {} })),
	);
};

/** Answer every tools/call with `respond`, without a server. */
const respondToCalls = (respond: (tool: StackOneMcpTool) => JsonObject | Promise<JsonObject>) => {
	vi.spyOn(StackOneMcpTool.prototype, 'execute').mockImplementation(
		async function (this: StackOneMcpTool) {
			return respond(this);
		},
	);
};

const errorOf = (act: () => unknown): Promise<Error> =>
	Promise.resolve()
		.then(act)
		.then(
			() => {
				throw new Error('expected an error');
			},
			(error: unknown) => error as Error,
		);

type Emitted = { error: Error } | { warnings: string[] } | { toolResult: string };

/**
 * How to make the SDK emit each message, and the values it should be rendered with. A value
 * left out is a placeholder whose text is not the SDK's to choose (a parser's message).
 */
const emitters: Record<
	string,
	() => Promise<{ emitted: Emitted; values: Record<string, unknown> }>
> = {
	'header-dropped': async () => {
		await sentArguments(OPEN_HEADERS, { headers: { Authorization: 'x' } });
		return {
			emitted: { warnings: warnings() },
			values: { header: 'Authorization', reason: 'set-by-sdk' },
		};
	},
	'header-argument-dropped': async () => {
		await sentArguments(OPEN_HEADERS, { headers: 'abc' });
		return {
			emitted: { warnings: warnings() },
			values: { argument: 'headers', reason: 'not-an-object' },
		};
	},
	'rate-limit-retry': async () => {
		const url = `${TEST_BASE_URL}/limited`;
		let requests = 0;
		server.use(
			http.post(url, () =>
				requests++ === 0
					? HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '2' } })
					: HttpResponse.json({}),
			),
		);
		await fetchWithRetry(
			url,
			{ method: 'POST' },
			{ timing: { sleep: async () => {}, random: () => 0.5, now: () => 0 } },
		);
		return {
			emitted: { warnings: warnings() },
			values: { method: 'POST', url, attempt: 1, max_attempts: 4, delay: 2 },
		};
	},
	'rate-limit-deadline': async () => {
		const url = `${TEST_BASE_URL}/limited`;
		server.use(
			http.post(url, () => HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '3' } })),
		);
		await fetchWithRetry(
			url,
			{ method: 'POST' },
			{
				deadline: 1_000,
				timing: { sleep: async () => {}, random: () => 0.5, now: () => 0 },
			},
		);
		return {
			emitted: { warnings: warnings() },
			values: { method: 'POST', url, attempt: 1, max_attempts: 4, delay: 3 },
		};
	},
	'skip-account': async () => {
		listMock.mockImplementation(async ({ headers }) => {
			if (headers['x-account-id'] === 'acc-2') {
				throw new Error('boom');
			}
			return [{ name: 't_acc-1', description: '', inputSchema: {} }];
		});
		await newToolSet().fetchTools({ accountIds: ['acc-1', 'acc-2'] });
		return { emitted: { warnings: warnings() }, values: { account_id: 'acc-2', error: 'boom' } };
	},
	'skip-connector': async () => {
		listByAccount(['a_acc-1_search_actions', 'b_acc-1_search_actions']);
		respondToCalls((tool) => {
			if (tool.name.startsWith('b_')) {
				throw new Error('boom');
			}
			return { actions: [{ action_id: 'a_x' }] };
		});
		await newToolSet({ accountId: 'acc-1' }).search('q');
		return {
			emitted: { warnings: warnings() },
			values: { tool: 'b_acc-1_search_actions', error: 'boom' },
		};
	},
	'duplicate-tool-names': async () => {
		listMock.mockResolvedValue([{ name: 'dup', description: '', inputSchema: {} }]);
		await newToolSet().fetchTools({ accountIds: ['acc-1', 'acc-2'] });
		return { emitted: { warnings: warnings() }, values: { count: 1, names: 'dup' } };
	},
	'ambiguous-connector': async () => {
		listByAccount(['linear_acc1_execute_action', 'linear_acc2_execute_action']);
		respondToCalls(() => ({ data: {} }));
		return {
			emitted: {
				error: await errorOf(() =>
					newToolSet({ accountIds: ['acc2', 'acc1'] }).execute('linear_list_issues'),
				),
			},
			values: {
				action_id: 'linear_list_issues',
				count: 2,
				tools: 'linear_acc1_execute_action on acc1, linear_acc2_execute_action on acc2',
			},
		};
	},
	'account-id-env-ignored': async () => {
		vi.stubEnv('STACKONE_ACCOUNT_ID', 'acc-1');
		try {
			newToolSet();
			return { emitted: { warnings: warnings() }, values: {} };
		} finally {
			vi.unstubAllEnvs();
		}
	},
	'mcp-timeout': async () => {
		const endpoint = `${TEST_BASE_URL}/mcp`;
		return {
			emitted: {
				error: describeMcpFailure(
					new McpError(ErrorCode.RequestTimeout, 'timed out'),
					endpoint,
					1_500,
				),
			},
			values: { endpoint, timeout: 1.5 },
		};
	},
	'mcp-rate-limit-timeout': async () => {
		const endpoint = `${TEST_BASE_URL}/mcp`;
		const timeout = 300;
		let requests = 0;
		server.use(
			http.all(endpoint, async () => {
				if (requests++ === 0) {
					return HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '0' } });
				}
				await delay('infinite');
			}),
		);
		const error = await errorOf(() =>
			realListMcpTools({ endpoint, headers: { 'x-account-id': 'acc-1' }, timeout }),
		);
		expect((error as StackOneAPIError).statusCode).toBe(429);
		return { emitted: { error }, values: { endpoint, timeout: timeout / 1_000 } };
	},
	'accounts-rate-limit-timeout': async () => {
		const url = `${TEST_BASE_URL}/accounts`;
		const timeout = 300;
		let requests = 0;
		server.use(
			http.get(url, async () => {
				if (requests++ === 0) {
					return HttpResponse.json({}, { status: 429, headers: { 'Retry-After': '0' } });
				}
				await delay('infinite');
			}),
		);
		const error = await errorOf(() => newToolSet({ timeout }).fetchAccounts());
		expect((error as StackOneAPIError).statusCode).toBe(429);
		return { emitted: { error }, values: { url, timeout: timeout / 1_000 } };
	},
	'mcp-http-failure': async () => {
		const endpoint = `${TEST_BASE_URL}/mcp`;
		server.use(
			http.post(endpoint, () => HttpResponse.json({ message: 're-link' }, { status: 412 })),
		);
		const error = await errorOf(() =>
			realListMcpTools({ endpoint, headers: { 'x-account-id': 'acc-1' }, timeout: 5_000 }),
		);
		return {
			emitted: { error },
			values: {
				endpoint,
				status: 412,
				reason_phrase: 'Precondition Failed',
				body: '{"message":"re-link"}',
			},
		};
	},
	'mcp-failure': async () => {
		const endpoint = `${TEST_BASE_URL}/mcp`;
		const error = describeMcpFailure(
			new Error('fetch failed', { cause: new TypeError('connection refused') }),
			endpoint,
			5_000,
		);
		return {
			emitted: { error },
			values: { endpoint, error_type: 'TypeError', error_message: 'connection refused' },
		};
	},
	'accounts-http-failure': async () => {
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json({ message: 'bad key' }, { status: 401 }),
			),
		);
		return {
			emitted: { error: await errorOf(() => newToolSet().fetchAccounts()) },
			values: {
				url: `${TEST_BASE_URL}/accounts`,
				status: 401,
				reason_phrase: 'Unauthorized',
				body: '{"message":"bad key"}',
			},
		};
	},
	'accounts-unreachable': async () => {
		server.use(http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.error()));
		return {
			emitted: { error: await errorOf(() => newToolSet().fetchAccounts()) },
			values: { url: `${TEST_BASE_URL}/accounts` },
		};
	},
	'accounts-invalid-json': async () => {
		server.use(
			http.get(
				`${TEST_BASE_URL}/accounts`,
				() => new HttpResponse('[{', { headers: { 'content-type': 'application/json' } }),
			),
		);
		return {
			emitted: { error: await errorOf(() => newToolSet().fetchAccounts()) },
			values: { url: `${TEST_BASE_URL}/accounts` },
		};
	},
	'accounts-unexpected-shape': async () => {
		server.use(http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.json('acc-1')));
		return {
			emitted: { error: await errorOf(() => newToolSet().fetchAccounts()) },
			values: { json_type: 'acc-1' },
		};
	},
	'no-linked-accounts': async () => {
		server.use(http.get(`${TEST_BASE_URL}/accounts`, () => HttpResponse.json([])));
		return { emitted: { error: await errorOf(() => newToolSet().fetchTools()) }, values: {} };
	},
	'no-active-accounts': async () => {
		server.use(
			http.get(`${TEST_BASE_URL}/accounts`, () =>
				HttpResponse.json([{ id: 'dead', provider: 'hibob', status: 'error' }]),
			),
		);
		return {
			emitted: { error: await errorOf(() => newToolSet().fetchTools()) },
			values: { count: 1, accounts: 'hibob (error)' },
		};
	},
	'all-accounts-failed': async () => {
		listMock.mockImplementation(async ({ headers }) => {
			throw new Error(`down ${headers['x-account-id']}`);
		});
		return {
			emitted: {
				error: await errorOf(() => newToolSet().fetchTools({ accountIds: ['acc-1', 'acc-2'] })),
			},
			values: { failures: 'acc-1: down acc-1; acc-2: down acc-2' },
		};
	},
	'no-connector-returned-results': async () => {
		listByAccount(['a_acc-1_search_actions', 'b_acc-1_search_actions']);
		respondToCalls((tool) => {
			throw new Error(`down ${tool.name}`);
		});
		return {
			emitted: { error: await errorOf(() => newToolSet({ accountId: 'acc-1' }).search('q')) },
			values: {
				failures:
					'a_acc-1_search_actions: down a_acc-1_search_actions | b_acc-1_search_actions: down b_acc-1_search_actions',
			},
		};
	},
	'fetch-tools-failed': async () => {
		listMock.mockRejectedValue(new Error('boom'));
		return {
			emitted: { error: await errorOf(() => newToolSet({ accountId: 'acc-1' }).fetchTools()) },
			values: { detail: 'boom' },
		};
	},
	'missing-api-key': async () => {
		vi.stubEnv('STACKONE_API_KEY', '');
		try {
			return { emitted: { error: await errorOf(() => new StackOneToolSet()) }, values: {} };
		} finally {
			vi.unstubAllEnvs();
		}
	},
	'empty-account-id': async () => ({
		emitted: { error: await errorOf(() => newToolSet({ accountId: '' })) },
		values: { parameter: 'accountId' },
	}),
	'account-ids-not-a-list': async () => ({
		emitted: { error: await errorOf(() => newToolSet({ accountIds: 'acc-1' })) },
		values: { parameter: 'accountIds', value: 'acc-1' },
	}),
	'account-ids-not-strings': async () => ({
		emitted: { error: await errorOf(() => newToolSet({ accountIds: [1] })) },
		values: { parameter: 'accountIds' },
	}),
	'account-ids-empty-id': async () => ({
		emitted: { error: await errorOf(() => newToolSet({ accountIds: [''] })) },
		values: { parameter: 'accountIds' },
	}),
	'invalid-session-id': async () => ({
		emitted: {
			error: await errorOf(() =>
				newToolSet({ accountId: 'acc-1' }).execute('x_y', {}, { sessionId: '' }),
			),
		},
		values: { parameter: 'sessionId', value: '' },
	}),
	'invalid-action-id': async () => ({
		emitted: { error: await errorOf(() => newToolSet({ accountId: 'acc-1' }).execute('')) },
		values: { parameter: 'actionId', value: '' },
	}),
	'execute-arguments-not-an-object': async () => ({
		emitted: {
			error: await errorOf(() => newToolSet({ accountId: 'acc-1' }).execute('x_y', [1] as never)),
		},
		values: { json_type: [1] },
	}),
	'top-k-out-of-range': async () => ({
		emitted: {
			error: await errorOf(() => newToolSet({ accountId: 'acc-1' }).search('q', { topK: 51 })),
		},
		values: { parameter: 'topK', max: 50, value: 51 },
	}),
	'tool-names-not-a-list': async () => ({
		emitted: {
			error: await errorOf(() =>
				newToolSet({ accountId: 'acc-1' }).submitFeedback({
					rating: 'positive',
					toolNames: 'a' as never,
				}),
			),
		},
		values: { parameter: 'toolNames', value: 'a' },
	}),
	'feedback-not-enabled': async () => {
		listMock.mockResolvedValue([]);
		return {
			emitted: {
				error: await errorOf(() =>
					newToolSet({ accountId: 'acc-1' }).submitFeedback({
						rating: 'positive',
						toolNames: ['a'],
					}),
				),
			},
			values: {},
		};
	},
	'no-connector-for-action': async () => {
		listByAccount(['linear_acc1_execute_action']);
		return {
			emitted: {
				error: await errorOf(() => newToolSet({ accountId: 'acc1' }).execute('jira_list_issues')),
			},
			values: { action_id: 'jira_list_issues' },
		};
	},
	'arguments-not-finite': async () => ({
		emitted: {
			error: await errorOf(() =>
				toolWith({ type: 'object', properties: {} }).execute({ a: Number.NaN }),
			),
		},
		values: { tool: 'vector_tool', value: 'NaN' },
	}),
	'arguments-not-encodable': async () => {
		const args: JsonObject = {};
		args.self = args;
		return {
			emitted: {
				error: await errorOf(() => toolWith({ type: 'object', properties: {} }).execute(args)),
			},
			values: { tool: 'vector_tool' },
		};
	},
	'arguments-invalid-json': async () => {
		let detail = '';
		try {
			JSON.parse('{');
		} catch (error) {
			detail = (error as Error).message;
		}
		return {
			emitted: {
				error: await errorOf(() => toolWith({ type: 'object', properties: {} }).execute('{')),
			},
			values: { tool: 'vector_tool', detail },
		};
	},
	'arguments-not-an-object': async () => ({
		emitted: {
			error: await errorOf(() => toolWith({ type: 'object', properties: {} }).execute(5 as never)),
		},
		values: { tool: 'vector_tool' },
	}),
	'tool-call-failed': async () => ({
		emitted: {
			error: await errorOf(() =>
				parseToolResult({ isError: true, content: [{ type: 'text', text: 'boom' }] }, 'a_b'),
			),
		},
		values: { tool: 'a_b', detail: 'boom' },
	}),
	'no-executor': async () => ({
		emitted: {
			error: await errorOf(() =>
				new BaseTool('hand_built', '', { type: 'object', properties: {} }, {
					kind: 'local',
				} as never).execute({}),
			),
		},
		values: { tool: 'hand_built' },
	}),
	'unknown-tool': async () => {
		const [message] = await new Tools([]).executeOpenAIToolCalls([
			{ id: 'c', type: 'function', function: { name: 'invented', arguments: '{}' } },
		]);
		return {
			emitted: { toolResult: JSON.parse(message?.content as string).error },
			values: { name: 'invented' },
		};
	},
};

describe('messages.json', () => {
	it('is the version these tests were written for', () => {
		expect(messages.version).toBe(1);
	});

	it('has an emitter for every shared message', () => {
		expect(Object.keys(emitters).sort()).toEqual(
			messages.messages.map((message) => message.id).sort(),
		);
	});

	it.each(messages.messages)('$id', async ({ id, kind, error: errorClass }) => {
		const emit = emitters[id];
		if (!emit) {
			throw new Error(`No emitter for ${id}`);
		}
		const { emitted, values } = await emit();
		const expected = pattern(id, values);
		if (kind === 'warning') {
			expect('warnings' in emitted && emitted.warnings).toEqual([
				expect.stringMatching(
					new RegExp(`^${PREFIX.replace(/[[\]]/g, '\\$&')}${expected.source.slice(1)}`, 's'),
				),
			]);
		} else if (kind === 'tool-result') {
			expect('toolResult' in emitted && emitted.toolResult).toMatch(expected);
		} else {
			const { error } = emitted as { error: Error };
			expect(error.name).toBe(errorClass?.node);
			expect(error.message).toMatch(expected);
		}
	});
});
