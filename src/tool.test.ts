import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { jsonSchema } from 'ai';
import { http } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { type RecordedToolCall, createMcpApp } from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { toolParametersFromInputSchema } from './schema';
import { BaseTool, StackOneMcpTool, StackOneTool, Tools } from './tool';
import type { AISDKToolResult, JsonObject, JSONSchema, ToolParameters } from './types';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';
import { ToolArgumentsError } from './utils/error-tool-arguments';

// Calls an AI SDK tool's `execute` through a plain signature rather than the
// `ai` type. v5/v6 expect `ToolCallOptions`, v7 requires an extra `context`
// field, and v7's `Tool` is a union whose call signatures reduce to `never`, so
// a directly typed call site can only ever satisfy one major at a time.
const executeAISDKTool = (
	tools: AISDKToolResult,
	name: string,
	args: Record<string, unknown>,
): Promise<unknown> => {
	const execute = tools[name]?.execute as unknown as (
		args: Record<string, unknown>,
		options?: unknown,
	) => Promise<unknown>;

	return execute(args, { toolCallId: 'test-tool-call-id', messages: [] });
};

/** The conformance suite's `rich-schema` fixture: every root keyword a server may send. */
const richSchema = {
	$schema: 'https://json-schema.org/draft/2020-12/schema',
	title: 'Rich Schema Test',
	type: 'object',
	additionalProperties: false,
	$defs: {
		Money: {
			type: 'object',
			properties: { amount: { type: 'number' }, currency: { type: 'string' } },
			required: ['amount', 'currency'],
		},
	},
	oneOf: [{ required: ['employee_id'] }, { required: ['identifier'] }],
	properties: {
		employee_id: { type: 'string', description: 'Employee id', pattern: '^emp_' },
		start_date: { type: 'string', format: 'date-time', description: 'Start date' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
		status: { type: 'string', enum: ['active', 'terminated'] },
		address: {
			type: 'object',
			properties: {
				line1: { type: 'string' },
				postcode: { type: 'string', pattern: '[A-Z]{2}[0-9]' },
			},
			required: ['line1'],
		},
		identifier: {
			description: 'Either an id or an email',
			oneOf: [{ type: 'string' }, { type: 'integer' }],
		},
		salary: { $ref: '#/$defs/Money' },
		nullable: { type: 'object', properties: { name: { type: 'string' } }, nullable: false },
	},
	required: ['start_date'],
} as const;

const localTool = (name: string, schema: unknown, description = 'Test tool') =>
	new BaseTool(name, description, toolParametersFromInputSchema(schema), { kind: 'local' });

const simpleTool = () =>
	localTool('test_tool', {
		type: 'object',
		properties: { id: { type: 'string', description: 'ID' } },
	});

describe('BaseTool', () => {
	it('cannot execute on its own', async () => {
		await expect(simpleTool().execute({ id: '1' })).rejects.toThrow(
			new StackOneError(
				'Tool "test_tool" has no executor. Override execute() to run a hand-built tool.',
			),
		);
	});

	describe('toJsonSchema', () => {
		it('is the served schema, verbatim', () => {
			expect(localTool('rich', richSchema).toJsonSchema()).toEqual(richSchema);
		});

		it('returns a copy a caller cannot mutate back into the tool', () => {
			const tool = localTool('rich', richSchema);
			const schema = tool.toJsonSchema();
			const address = schema.properties?.address?.properties;
			assert(address);
			(address as Record<string, unknown>).injected = {};
			(schema.$defs as Record<string, unknown>).Evil = {};

			expect(tool.toJsonSchema()).toEqual(richSchema);
		});

		it('omits an empty required list', () => {
			expect(
				localTool('t', { type: 'object', properties: {}, required: [] }).toJsonSchema(),
			).toEqual({
				type: 'object',
				properties: {},
			});
		});
	});

	/**
	 * Every adapter must hand the model what the server served. The one exception is a top-level
	 * `oneOf`/`anyOf`/`allOf`, which the OpenAI and Anthropic tool APIs reject outright, so every
	 * provider-bound adapter folds it into the root.
	 */
	describe('root schema pass-through across every adapter', () => {
		const tool = localTool('hris_rich_probe', richSchema, 'Rich probe');
		const { oneOf: _rejected, ...providerRoot } = richSchema;

		const adapters: Array<[string, () => Promise<Record<string, unknown>>]> = [
			['toOpenAI', async () => tool.toOpenAI().function.parameters as Record<string, unknown>],
			['toAnthropic', async () => tool.toAnthropic().input_schema as Record<string, unknown>],
			[
				'toOpenAIResponses (strict)',
				async () => tool.toOpenAIResponses().parameters as Record<string, unknown>,
			],
			[
				'toOpenAIResponses (non-strict)',
				async () => tool.toOpenAIResponses({ strict: false }).parameters as Record<string, unknown>,
			],
			[
				'toAISDK',
				async () => {
					const aiTools = await tool.toAISDK({ executable: false });
					const aiTool = aiTools.hris_rich_probe;
					assert(aiTool);
					return (aiTool.inputSchema as { jsonSchema: Record<string, unknown> }).jsonSchema;
				},
			],
			[
				'toClaudeAgentSdkTool',
				async () =>
					(
						(await tool.toClaudeAgentSdkTool()).inputSchema as {
							jsonSchema: Record<string, unknown>;
						}
					).jsonSchema,
			],
		];

		it.each(adapters)(
			'%s keeps $schema, $defs, $ref, title and every property',
			async (_name, adapt) => {
				const schema = await adapt();

				expect(schema.$schema).toBe(richSchema.$schema);
				expect(schema.title).toBe(richSchema.title);
				expect(schema.$defs).toEqual(richSchema.$defs);
				expect(schema.properties).toEqual(richSchema.properties);
				expect(schema.required).toEqual(['start_date']);
				expect(schema.type).toBe('object');
			},
		);

		it.each(adapters)('%s drops the root oneOf the provider would reject', async (_name, adapt) => {
			const schema = await adapt();

			for (const keyword of ['oneOf', 'anyOf', 'allOf']) {
				expect(schema).not.toHaveProperty(keyword);
			}
			// The nested union is untouched: only the root is a problem for the provider.
			expect((schema.properties as Record<string, JSONSchema>).identifier?.oneOf).toEqual([
				{ type: 'string' },
				{ type: 'integer' },
			]);
		});

		it.each(adapters)('%s is otherwise exactly the served root', async (_name, adapt) => {
			expect(await adapt()).toEqual(providerRoot);
		});

		it('preserves a served additionalProperties: true except where the adapter closes the root', async () => {
			const open = localTool('open', { ...richSchema, additionalProperties: true });

			expect(open.toJsonSchema().additionalProperties).toBe(true);
			expect(open.toOpenAI().function.parameters?.additionalProperties).toBe(true);
			expect(open.toAnthropic().input_schema.additionalProperties).toBe(true);
			expect(open.toOpenAIResponses({ strict: false }).parameters?.additionalProperties).toBe(true);
			// Strict Responses and the AI SDK close the root: documented, and pinned here.
			expect(open.toOpenAIResponses().parameters?.additionalProperties).toBe(false);
			const aiTools = await open.toAISDK({ executable: false });
			const aiTool = aiTools.open;
			assert(aiTool);
			expect(
				(aiTool.inputSchema as { jsonSchema: JSONSchema }).jsonSchema.additionalProperties,
			).toBe(false);
		});

		it('closes the root in strict mode without rewriting anything nested', () => {
			const parameters = tool.toOpenAIResponses().parameters as JSONSchema;
			expect(parameters.additionalProperties).toBe(false);
			expect(parameters.properties?.address).toEqual(richSchema.properties.address);
		});
	});

	it('converts to the OpenAI Chat Completions shape', () => {
		expect(simpleTool().toOpenAI()).toEqual({
			type: 'function',
			function: {
				name: 'test_tool',
				description: 'Test tool',
				parameters: { type: 'object', properties: { id: { type: 'string', description: 'ID' } } },
			},
		});
	});

	it('converts to the Anthropic shape', () => {
		expect(simpleTool().toAnthropic()).toEqual({
			name: 'test_tool',
			description: 'Test tool',
			input_schema: { type: 'object', properties: { id: { type: 'string', description: 'ID' } } },
		});
	});

	it('converts to the OpenAI Responses shape, strict by default', () => {
		const strict = simpleTool().toOpenAIResponses();
		expect(strict).toMatchObject({ type: 'function', name: 'test_tool', strict: true });

		const lax = simpleTool().toOpenAIResponses({ strict: false });
		expect(lax.strict).toBe(false);
		expect(lax.parameters).not.toHaveProperty('additionalProperties');
	});

	it('builds an AI SDK tool whose schema the ai package accepts', async () => {
		const aiTools = await simpleTool().toAISDK();
		expect(typeof aiTools.test_tool?.execute).toBe('function');
		expect(jsonSchema(simpleTool().toOpenAI().function.parameters as JSONSchema)).toBeDefined();
	});

	it('returns an AI SDK execution error as a string rather than throwing', async () => {
		const aiTools = await simpleTool().toAISDK();
		expect(await executeAISDKTool(aiTools, 'test_tool', { id: '1' })).toMatch(
			/^Error executing tool: Tool "test_tool" has no executor/,
		);
	});

	it('exposes execution metadata only when asked', async () => {
		const tool = simpleTool();
		expect((await tool.toAISDK()).test_tool?.execution).toEqual({ config: { kind: 'local' } });
		expect((await tool.toAISDK({ execution: false })).test_tool?.execution).toBeUndefined();
		tool.setExposeExecutionMetadata(false);
		expect((await tool.toAISDK()).test_tool?.execution).toBeUndefined();
		expect((await tool.toAISDK({ executable: false })).test_tool?.execute).toBeUndefined();
	});

	it('serialises a Claude Agent SDK result for the model, bytes as base64', async () => {
		const tool = simpleTool();
		tool.execute = async () => ({ content: Buffer.from('%PDF') as never, ok: true });
		const definition = await tool.toClaudeAgentSdkTool();

		const result = await definition.handler({});

		expect(JSON.parse(result.content[0]?.text ?? '')).toEqual({
			content: Buffer.from('%PDF').toString('base64'),
			ok: true,
		});
	});
});

describe('StackOneMcpTool as an action tool', () => {
	const calls: RecordedToolCall[] = [];
	const nestedProperties = {
		path: { type: 'object', properties: { id: { type: 'string' } } },
		query: { type: 'object', properties: { expand: { type: 'string' } } },
		body: { type: 'object', properties: { name: { type: 'string' } } },
		headers: { type: 'object', properties: { 'x-trace': { type: 'string' } } },
	} satisfies Record<string, JSONSchema>;
	const listed = {
		name: 'crm_update_contact',
		description: 'Update a contact',
		inputSchema: { type: 'object' as const, properties: nestedProperties },
	};
	const serve = (toolResults: Record<string, CallToolResult> = {}) => {
		const app = createMcpApp({
			accountTools: { acc1: [listed], acc2: [listed] },
			onToolCall: (call) => calls.push(call),
			toolResults,
		});
		server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));
	};
	beforeEach(() => {
		calls.length = 0;
		serve();
	});

	const actionTool = (properties: Record<string, JSONSchema> = nestedProperties) =>
		new StackOneMcpTool({
			name: 'crm_update_contact',
			description: 'Update a contact',
			parameters: toolParametersFromInputSchema({ type: 'object', properties }),
			endpoint: `${TEST_BASE_URL}/mcp`,
			apiKey: 'test-key',
			accountId: 'acc1',
			timeout: 5_000,
		});

	it('sends the arguments verbatim over tools/call, scoped to its account', async () => {
		const args = {
			path: { id: '7' },
			query: { expand: 'owner' },
			body: { name: 'Ada' },
			headers: { 'x-trace': 't-1' },
		};

		const result = await actionTool().execute(args);

		expect(calls).toEqual([
			{ accountId: 'acc1', toolMode: undefined, name: 'crm_update_contact', arguments: args },
		]);
		// As the server wrote it: UCA's { isError: false, result } wrapper included.
		expect(result).toEqual({
			isError: false,
			result: { data: { action: 'crm_update_contact', account_id: 'acc1', arguments: args } },
		});
	});

	// `clean[key] = value` with the key `__proto__` sets the prototype, so the argument vanished
	// from the request. Python sends it.
	it('sends an argument named __proto__ like any other', async () => {
		await actionTool().execute('{"__proto__":"p","constructor":"c","q":1}');

		expect(Object.entries(calls[0]?.arguments ?? {})).toEqual([
			['__proto__', 'p'],
			['constructor', 'c'],
			['q', 1],
		]);
	});

	it('sends flat_prefixed arguments verbatim too', async () => {
		const args = { path_id: '7', 'headers_x-trace': 't-1' };
		await actionTool({
			path_id: { type: 'string' },
			'headers_x-trace': { type: 'string' },
		}).execute(args);
		expect(calls[0]?.arguments).toEqual(args);
	});

	it('accepts arguments as a JSON string', async () => {
		await actionTool().execute('{"path":{"id":"7"}}');
		expect(calls[0]?.arguments).toEqual({ path: { id: '7' } });
	});

	it.each([
		['Authorization', 'Bearer stolen'],
		['authorization', 'Bearer stolen'],
		['X-Account-Id', 'victim'],
		[' x-account-id ', 'victim'],
		['Proxy-Authorization', 'Basic stolen'],
		['x-stackone-account-id', 'victim'],
		['Cookie', 'session=x'],
	])('drops a model-supplied %j header', async (name, value) => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		await actionTool().execute({ headers: { [name]: value } });

		expect(calls[0]?.arguments.headers).toEqual({});
		expect(calls[0]?.accountId).toBe('acc1');
		vi.restoreAllMocks();
	});

	it('keeps a header a nested schema declares, and drops one carrying CR/LF', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		await actionTool().execute({ headers: { 'X-Trace': 'abc', 'X-Other': 'no' } });
		await actionTool().execute({ headers: { 'x-trace': 'a\r\nInjected: 1' } });
		expect(calls[0]?.arguments.headers).toEqual({ 'X-Trace': 'abc' });
		expect(calls[1]?.arguments.headers).toEqual({});
		vi.restoreAllMocks();
	});

	it.each([
		['not valid json', /Invalid JSON in arguments/],
		['[1, 2, 3]', /must be a JSON object/],
		['null', /must be a JSON object/],
	])('rejects arguments %j', async (input, message) => {
		await expect(actionTool().execute(input)).rejects.toThrow(message);
	});

	// JSON.stringify, and so the MCP client, would send each of these as null.
	it.each([
		['NaN at the top level', { amount: Number.NaN }, 'NaN'],
		[
			'Infinity nested in an object',
			{ body: { name: 'Ada', score: Number.POSITIVE_INFINITY } },
			'Infinity',
		],
		[
			'-Infinity nested in an array',
			{ query: { ids: [1, Number.NEGATIVE_INFINITY] } },
			'-Infinity',
		],
	])('rejects %s without calling the server', async (_name, args, value) => {
		const error = await actionTool()
			.execute(args as JsonObject)
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(StackOneError);
		expect((error as Error).message).toBe(
			`Arguments for "crm_update_contact" could not be encoded as JSON: ${value} is not a JSON number`,
		);
		expect(calls).toEqual([]);
	});

	it('rejects a non-object, non-string argument', async () => {
		// @ts-expect-error - intentionally passing an invalid type
		await expect(actionTool().execute(12345)).rejects.toThrow(
			new ToolArgumentsError('Tool arguments for "crm_update_contact" must be a JSON object'),
		);
	});

	it.each([
		['a Date', new Date()],
		['a Map', new Map()],
		['a Set', new Set()],
	])('rejects %s as the whole arguments object', async (_name, value) => {
		const error = await actionTool()
			// @ts-expect-error - intentionally passing a non-plain object
			.execute(value)
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolArgumentsError);
		expect((error as Error).message).toMatch(/must be a JSON object/);
		expect(calls).toEqual([]);
	});

	// JSON.stringify would silently convert each of these (a Date to a string, a Map or Set to
	// `{}`) rather than refuse it, which would send the model a value it never supplied.
	it.each([
		['a Date', { when: new Date() }, 'a Date'],
		['a Map', { body: { cache: new Map() } }, 'a Map'],
		['a Set', { query: { ids: new Set([1, 2]) } }, 'a Set'],
		['a RegExp', { pattern: /x/ }, 'a RegExp'],
		['a function', { cb: () => {} }, 'a function'],
		['a symbol', { tag: Symbol('x') }, 'a symbol'],
		['a bigint', { amount: 10n }, 'a bigint'],
		['a Uint8Array', { bytes: new Uint8Array([1]) }, 'binary data'],
		['a class instance', { contact: new StackOneError('x') }, 'an instance of'],
	])(
		'rejects %s nested in the arguments, without calling the server',
		async (_name, args, hint) => {
			const error = await actionTool()
				.execute(args as unknown as JsonObject)
				.catch((caught: unknown) => caught);

			expect(error).toBeInstanceOf(ToolArgumentsError);
			expect((error as Error).message).toContain(
				`Arguments for "crm_update_contact" could not be encoded as JSON: ${hint}`,
			);
			expect(calls).toEqual([]);
		},
	);

	// What a model emits when a token boundary splits an emoji: not Unicode text, so not UTF-8.
	it.each([
		['a lone high surrogate in a value', { name: 'Ada\uD83D' }],
		['a lone low surrogate nested in an array', { query: { ids: ['\uDE00x'] } }],
		['a lone surrogate in a key', { body: { '\uD800': 'x' } }],
		['a lone surrogate in a top-level key', { '\uDFFF': 'x' }],
	])('rejects %s without calling the server', async (_name, args) => {
		const error = await actionTool()
			.execute(args as JsonObject)
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolArgumentsError);
		expect((error as Error).message).toMatch(
			/^Arguments for "crm_update_contact" could not be encoded as JSON: a (string|key) holding a lone surrogate is not Unicode text/,
		);
		expect(calls).toEqual([]);
	});

	it('accepts a surrogate pair', async () => {
		await actionTool().execute({ name: 'Ada \uD83D\uDE00' });
		expect(calls).toHaveLength(1);
	});

	it.each([['{"a": NaN}'], ['NaN'], ['{"a": Infinity}']])(
		'rejects the JSON text %s as invalid JSON',
		async (text) => {
			const error = await actionTool()
				.execute(text)
				.catch((caught: unknown) => caught);

			expect(error).toBeInstanceOf(ToolArgumentsError);
			expect((error as Error).message).toMatch(
				/^Invalid JSON in arguments for "crm_update_contact": /,
			);
			expect(calls).toEqual([]);
		},
	);

	it('rejects undefined inside an array', async () => {
		const error = await actionTool()
			.execute({ query: { ids: [1, undefined, 3] } } as unknown as JsonObject)
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolArgumentsError);
		expect((error as Error).message).toMatch(/undefined is not a JSON value/);
		expect(calls).toEqual([]);
	});

	it('rejects a circular reference', async () => {
		const body: JsonObject = { name: 'Ada' };
		body.self = body;

		const error = await actionTool()
			.execute({ body })
			.catch((caught: unknown) => caught);

		expect(error).toBeInstanceOf(ToolArgumentsError);
		expect((error as Error).message).toMatch(/circular reference/);
		expect(calls).toEqual([]);
	});

	it('drops an object property set to undefined, rather than rejecting it', async () => {
		await actionTool().execute({ path: { id: '1' }, extra: undefined } as unknown as JsonObject);
		expect(calls[0]?.arguments).toEqual({ path: { id: '1' } });
	});

	it('is refused by the server when it has no account', async () => {
		const error = (await actionTool()
			.setAccountId(undefined)
			.execute({})
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(400);
	});

	it('returns a file action’s download link as the server sent it', async () => {
		const link = {
			download_url: `${TEST_BASE_URL}/actions/download/v1.eu.token`,
			expires_at: '2026-09-29T12:05:00.000Z',
			file: { name: 'report.pdf', content_type: 'application/pdf', content_length: 3 },
		};
		const structuredContent = { isError: false, result: link };
		serve({
			crm_update_contact: {
				content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
				structuredContent,
			},
		});

		expect(await actionTool().execute({})).toEqual({ isError: false, result: link });
	});

	it('raises with status 501 when the server can issue no download link', async () => {
		const structuredContent = {
			isError: true,
			result: {
				error: 'This action returned a file, which cannot be delivered in a tool result',
				status_code: 501,
			},
		};
		serve({
			crm_update_contact: {
				isError: true,
				content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
				structuredContent,
			},
		});

		const error = (await actionTool()
			.execute({})
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(501);
	});

	it('can be rebound to another account', async () => {
		const tool = actionTool();

		tool.setAccountId('acc2');
		await tool.execute({});

		expect(tool.getAccountId()).toBe('acc2');
		expect(calls[0]?.accountId).toBe('acc2');
	});
});

describe('StackOneMcpTool', () => {
	const calls: RecordedToolCall[] = [];
	beforeEach(() => {
		calls.length = 0;
		const app = createMcpApp({
			accountTools: { acc1: [] },
			onToolCall: (call) => calls.push(call),
		});
		server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));
	});

	const mcpTool = (properties: Record<string, JSONSchema> = {}) =>
		new StackOneMcpTool({
			name: 'mock_acc1_execute_action',
			description: 'Execute',
			parameters: toolParametersFromInputSchema({ type: 'object', properties }),
			endpoint: `${TEST_BASE_URL}/mcp?tool-mode=search_execute`,
			apiKey: 'test-key',
			accountId: 'acc1',
			timeout: 5_000,
		});

	it('calls the tool over tools/call and returns the parsed result', async () => {
		const result = await mcpTool().execute({
			action_id: 'mock_list_items',
			query: { page_size: 2 },
		});

		expect(result).toMatchObject({
			isError: false,
			result: { data: { nodes: [] }, echoed_query: { page_size: 2 } },
		});
		expect(calls).toEqual([
			{
				accountId: 'acc1',
				toolMode: 'search_execute',
				name: 'mock_acc1_execute_action',
				arguments: { action_id: 'mock_list_items', query: { page_size: 2 } },
			},
		]);
	});

	// The meta tools take a `headers` object the server unpacks, and these arguments are
	// model-controlled. This schema declares no headers at all, so nothing survives.
	it('drops every model-supplied header', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		await mcpTool().execute({
			action_id: 'mock_list_items',
			headers: {
				Authorization: 'Bearer stolen',
				'Proxy-Authorization': 'Basic stolen',
				'x-account-id': 'victim-account',
				'x-stackone-account-id': 'victim-account',
				Cookie: 'session=x',
				'X-Api-Key': 'stolen',
			},
		});

		expect(calls[0]?.arguments.headers).toEqual({});
		vi.restoreAllMocks();
	});

	it('keeps a header its own schema declares', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		await mcpTool({
			headers: { type: 'object', properties: { 'x-trace': { type: 'string' } } },
		}).execute({
			action_id: 'mock_list_items',
			headers: { 'X-Trace': 'abc', 'X-Other': 'no' },
		});
		expect(calls[0]?.arguments.headers).toEqual({ 'X-Trace': 'abc' });
		vi.restoreAllMocks();
	});

	it('raises when the result carries isError', async () => {
		const error = (await mcpTool()
			.execute({ action_id: 'mock_not_a_real_action' })
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.message).toContain('Unknown action mock_not_a_real_action');
		expect(error.statusCode).toBe(404);
	});

	it('describes the call without sending it on dryRun', async () => {
		const result = await mcpTool().execute({ action_id: 'a' }, { dryRun: true });
		expect(calls).toHaveLength(0);
		expect(result).toMatchObject({ method: 'tools/call', arguments: { action_id: 'a' } });
	});
});

describe('Tools', () => {
	const named = (name: string) => localTool(name, { type: 'object', properties: {} });

	it('looks tools up by name, first match wins', () => {
		const first = named('dup');
		const tools = new Tools([first, named('dup'), named('other')]);

		expect(tools.getTool('dup')).toBe(first);
		expect(tools.getTool('missing')).toBeUndefined();
		expect(tools.length).toBe(3);
	});

	it('does not alias the array it was built from', () => {
		const list = [named('a')];
		const tools = new Tools(list);
		list.push(named('b'));
		expect(tools.length).toBe(1);
	});

	it('filters, maps, iterates and copies', () => {
		const tools = new Tools([named('a_x'), named('b_x')]);

		expect(tools.filter((tool) => tool.name.startsWith('a')).map((tool) => tool.name)).toEqual([
			'a_x',
		]);
		expect([...tools].map((tool) => tool.name)).toEqual(['a_x', 'b_x']);
		const seen: string[] = [];
		tools.forEach((tool) => seen.push(tool.name));
		expect(seen).toEqual(['a_x', 'b_x']);
		expect(tools.toArray()).not.toBe(tools.toArray());
	});

	it('tells StackOne tools apart', () => {
		const stackOneTool = new StackOneTool(
			's',
			'',
			{ type: 'object', properties: {} },
			{ kind: 'local' },
			'acc',
		);
		const tools = new Tools([named('plain'), stackOneTool]);

		expect(tools.getStackOneTools()).toEqual([stackOneTool]);
		expect(tools.getStackOneTool('s').getAccountId()).toBe('acc');
		expect(() => tools.getStackOneTool('plain')).toThrow(StackOneError);
		expect(tools.isStackOneTool(stackOneTool)).toBe(true);
	});

	it('converts every tool with every adapter', async () => {
		const tools = new Tools([named('a'), localTool('b', richSchema)]);

		expect(tools.toJsonSchema().map((entry) => entry.parameters)).toEqual([
			{ type: 'object', properties: {} },
			richSchema,
		]);
		expect(tools.toOpenAI().map((tool) => tool.function.name)).toEqual(['a', 'b']);
		expect(tools.toAnthropic().map((tool) => tool.name)).toEqual(['a', 'b']);
		expect(tools.toOpenAIResponses({ strict: false }).map((tool) => tool.strict)).toEqual([
			false,
			false,
		]);
		expect(Object.keys(await tools.toAISDK())).toEqual(['a', 'b']);
	});

	it('builds a Claude Agent SDK MCP server', async () => {
		const mcpServer = await new Tools([named('a')]).toClaudeAgentSdk({
			serverName: 'custom',
			serverVersion: '2.0.0',
		});

		expect(mcpServer.type).toBe('sdk');
		expect(mcpServer.name).toBe('custom');
		expect(mcpServer.instance).toBeDefined();
	});
});

describe('ToolParameters typing', () => {
	it('accepts a served schema as parameters', () => {
		const parameters: ToolParameters = toolParametersFromInputSchema(richSchema);
		expect(parameters.type).toBe('object');
	});
});

describe('Tools.executeOpenAIToolCalls', () => {
	const toolsWith = (behaviour: (args: unknown) => Promise<JsonObject>) => {
		const tool = localTool('linear_list_issues', {
			type: 'object',
			properties: { body_variables: { type: 'object' } },
		});
		const seen: unknown[] = [];
		tool.execute = async (args) => {
			seen.push(args);
			return behaviour(args);
		};
		return { tools: new Tools([tool]), seen };
	};
	const call = (name: string, args = '{}', id = 'call_1') => ({
		id,
		type: 'function' as const,
		function: { name, arguments: args },
	});

	it('runs each call and pairs its result with the call id', async () => {
		const { tools, seen } = toolsWith(async () => ({ data: { n: 1 } }));

		const messages = await tools.executeOpenAIToolCalls([
			call('linear_list_issues', '{"body_variables": {}}'),
		]);

		expect(messages).toEqual([
			{ role: 'tool', tool_call_id: 'call_1', content: '{"data":{"n":1}}' },
		]);
		expect(seen).toEqual(['{"body_variables": {}}']);
	});

	it('keeps the order of several calls', async () => {
		const { tools } = toolsWith(async (args) => ({ echoed: args as string }));

		const messages = await tools.executeOpenAIToolCalls([
			call('linear_list_issues', '{"a":1}', 'c1'),
			call('linear_list_issues', '{"a":2}', 'c2'),
		]);

		expect(messages.map((message) => message.tool_call_id)).toEqual(['c1', 'c2']);
	});

	it('accepts plain objects without a type and with object arguments', async () => {
		const { tools, seen } = toolsWith(async () => ({ ok: true }));
		await tools.executeOpenAIToolCalls([
			{ id: 'c', function: { name: 'linear_list_issues', arguments: { a: 1 } } },
		]);
		expect(seen).toEqual([{ a: 1 }]);
	});

	it('reports a failed call to the model instead of throwing, with the response body', async () => {
		const { tools } = toolsWith(async () => {
			throw new StackOneAPIError('400 Bad Request: path.id is missing', 400, {
				message: 'path.id is missing',
			});
		});

		const [message] = await tools.executeOpenAIToolCalls([call('linear_list_issues')]);

		expect(JSON.parse(message?.content as string)).toEqual({
			error: '400 Bad Request: path.id is missing',
			response_body: { message: 'path.id is missing' },
		});
	});

	it('reports malformed arguments the same way', async () => {
		const tool = new StackOneMcpTool({
			name: 'linear_list_issues',
			description: '',
			parameters: { type: 'object', properties: {} },
			endpoint: `${TEST_BASE_URL}/mcp`,
			apiKey: 'k',
			accountId: 'acc1',
			timeout: 1_000,
		});
		const [message] = await new Tools([tool]).executeOpenAIToolCalls([
			call('linear_list_issues', '{not json'),
		]);
		expect(JSON.parse(message?.content as string).error).toMatch(/Invalid JSON in arguments/);
	});

	it('reports an unknown tool rather than throwing', async () => {
		const { tools } = toolsWith(async () => ({}));
		const [message] = await tools.executeOpenAIToolCalls([call('invented_tool')]);
		expect(JSON.parse(message?.content as string)).toEqual({
			error: 'Unknown tool "invented_tool"',
		});
	});

	it('reports a non-function tool call rather than throwing', async () => {
		const { tools } = toolsWith(async () => ({}));
		const [message] = await tools.executeOpenAIToolCalls([
			{ id: 'c', type: 'custom', custom: { name: 'linear_list_issues', input: '' } },
		]);
		expect(JSON.parse(message?.content as string)).toEqual({
			error: 'Unsupported tool call type "custom"',
		});
	});

	it('serialises file bytes as base64 instead of a byte array', async () => {
		const { tools } = toolsWith(async () => ({ content: Buffer.from('%PDF-1.4') as never }));
		const [message] = await tools.executeOpenAIToolCalls([call('linear_list_issues')]);
		expect(JSON.parse(message?.content as string)).toEqual({
			content: Buffer.from('%PDF-1.4').toString('base64'),
		});
	});

	it('sends "null" for a tool that returns nothing, as the Python SDK does', async () => {
		const { tools } = toolsWith(async () => undefined as never);
		const [message] = await tools.executeOpenAIToolCalls([call('linear_list_issues')]);
		expect(message?.content).toBe('null');
	});

	it('rethrows an error that is not the SDK’s', async () => {
		const { tools } = toolsWith(async () => {
			throw new TypeError('programming error');
		});
		await expect(tools.executeOpenAIToolCalls([call('linear_list_issues')])).rejects.toThrow(
			TypeError,
		);
	});

	it('returns no messages for no tool calls', async () => {
		const { tools } = toolsWith(async () => ({}));
		expect(await tools.executeOpenAIToolCalls(undefined)).toEqual([]);
		expect(await tools.executeOpenAIToolCalls(null)).toEqual([]);
	});
});
