import { jsonSchema } from 'ai';
import { http, HttpResponse } from 'msw';
import { TEST_BASE_URL } from '../mocks/constants';
import { type RecordedToolCall, createMcpApp } from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { RpcClient } from './rpc-client';
import { toolParametersFromInputSchema } from './schema';
import { BaseTool, StackOneMcpTool, StackOneRpcTool, StackOneTool, Tools } from './tool';
import type { AISDKToolResult, JSONSchema, ToolParameters } from './types';
import { isBinaryDownloadResult } from './utils/binary-response';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';

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
			'Tool "test_tool" has no executor',
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

describe('StackOneRpcTool', () => {
	const client = new RpcClient({ baseUrl: TEST_BASE_URL, apiKey: 'test-key', timeout: 5_000 });
	const rpcTool = (properties: Record<string, JSONSchema>) =>
		new StackOneRpcTool({
			name: 'crm_update_contact',
			description: 'Update a contact',
			parameters: toolParametersFromInputSchema({ type: 'object', properties }),
			client,
			accountId: 'acc1',
		});
	const flatProperties = {
		path_id: { type: 'string' },
		query_expand: { type: 'string' },
		body_name: { type: 'string' },
		'headers_x-trace': { type: 'string' },
	} satisfies Record<string, JSONSchema>;

	const captureRpc = (
		response: () => Response = () => HttpResponse.json({ data: { ok: true } }),
	) => {
		const seen: Array<{ headers: Headers; body: Record<string, unknown> }> = [];
		server.use(
			http.post(`${TEST_BASE_URL}/actions/rpc`, async ({ request }) => {
				seen.push({
					headers: request.headers,
					body: (await request.json()) as Record<string, unknown>,
				});
				return response();
			}),
		);
		return seen;
	};

	it('sends the flat_prefixed arguments as the RPC envelope, scoped to its account', async () => {
		const seen = captureRpc();

		const result = await rpcTool(flatProperties).execute({
			path_id: '7',
			query_expand: 'owner',
			body_name: 'Ada',
			'headers_x-trace': 't-1',
		});

		expect(result).toEqual({ data: { ok: true } });
		expect(seen[0]?.headers.get('x-account-id')).toBe('acc1');
		expect(seen[0]?.body).toEqual({
			action: 'crm_update_contact',
			body: { name: 'Ada' },
			headers: { 'x-trace': 't-1', 'x-account-id': 'acc1' },
			path: { id: '7' },
			query: { expand: 'owner' },
		});
	});

	it('accepts arguments as a JSON string', async () => {
		const seen = captureRpc();
		await rpcTool(flatProperties).execute('{"path_id":"7"}');
		expect(seen[0]?.body.path).toEqual({ id: '7' });
	});

	it('omits empty path and query, but always sends body and headers', async () => {
		const seen = captureRpc();
		await rpcTool(flatProperties).execute();
		expect(seen[0]?.body).toEqual({
			action: 'crm_update_contact',
			body: {},
			headers: { 'x-account-id': 'acc1' },
		});
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
		const seen = captureRpc();

		await rpcTool(flatProperties).execute({ headers: { [name]: value } });

		expect(seen[0]?.body.headers).toEqual({ 'x-account-id': 'acc1' });
		expect(seen[0]?.headers.get('x-account-id')).toBe('acc1');
		expect(seen[0]?.headers.get('authorization')).toMatch(/^Basic /);
		vi.restoreAllMocks();
	});

	it('drops a declared header carrying CR/LF', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const seen = captureRpc();
		await rpcTool(flatProperties).execute({ 'headers_x-trace': 'a\r\nInjected: 1' });
		expect(seen[0]?.body.headers).toEqual({ 'x-account-id': 'acc1' });
		vi.restoreAllMocks();
	});

	it('routes a bare schema field that merely starts with path_ to the body, warning once', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const seen = captureRpc();
		const tool = rpcTool({ path_to_file: { type: 'string' }, name: { type: 'string' } });

		await tool.execute({ path_to_file: '/tmp/x' });
		await tool.execute({ path_to_file: '/tmp/y' });

		expect(seen[0]?.body.body).toEqual({ path_to_file: '/tmp/x' });
		expect(seen[0]?.body).not.toHaveProperty('path');
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain('flat-prefix detection is disabled');
		vi.restoreAllMocks();
	});

	it('rejects a reserved container given a scalar', async () => {
		await expect(rpcTool(flatProperties).execute({ query: 'sales' })).rejects.toThrow(
			/"query" is an envelope container/,
		);
	});

	it('describes the request without sending it on dryRun', async () => {
		const seen = captureRpc();
		const result = await rpcTool(flatProperties).execute({ path_id: '7' }, { dryRun: true });

		expect(seen).toHaveLength(0);
		expect(result.url).toBe(`${TEST_BASE_URL}/actions/rpc`);
		expect(result.method).toBe('POST');
		expect(result.headers).toMatchObject({ 'x-account-id': 'acc1' });
		expect(result.headers).not.toHaveProperty('Authorization');
		expect(JSON.parse(result.body as string)).toEqual({
			action: 'crm_update_contact',
			body: {},
			headers: { 'x-account-id': 'acc1' },
			path: { id: '7' },
		});
		expect(result.mappedParams).toEqual({ path_id: '7' });
	});

	it.each([
		['not valid json', /Invalid JSON in arguments/],
		['[1, 2, 3]', /must be a JSON object/],
		['null', /must be a JSON object/],
	])('rejects arguments %j', async (input, message) => {
		await expect(rpcTool(flatProperties).execute(input)).rejects.toThrow(message);
	});

	it('rejects a non-object, non-string argument', async () => {
		// @ts-expect-error - intentionally passing an invalid type
		await expect(rpcTool(flatProperties).execute(12345)).rejects.toThrow(StackOneError);
	});

	it('reports arguments JSON cannot encode as an argument error', async () => {
		await expect(rpcTool(flatProperties).execute({ body_name: 1n as never })).rejects.toThrow(
			/could not be encoded as JSON/,
		);
	});

	it('surfaces an API rejection with its status, body and the server message', async () => {
		captureRpc(() =>
			HttpResponse.json(
				{ message: 'path.id is missing' },
				{ status: 400, statusText: 'Bad Request' },
			),
		);

		const error = (await rpcTool(flatProperties)
			.execute({})
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error).toBeInstanceOf(StackOneAPIError);
		expect(error.statusCode).toBe(400);
		expect(error.message).toBe('400 Bad Request: path.id is missing');
	});

	it('is refused by the server when it has no account', async () => {
		const tool = rpcTool({ foo: { type: 'string' } }).setAccountId(undefined);
		const error = (await tool
			.execute({ foo: 'bar' })
			.catch((caught: unknown) => caught)) as StackOneAPIError;

		expect(error.statusCode).toBe(400);
	});

	it('returns a download with a safe file name', async () => {
		captureRpc(
			() =>
				new HttpResponse(new Uint8Array([1, 2, 3]), {
					headers: {
						'content-type': 'application/pdf',
						'content-disposition': "attachment; filename*=UTF-8''%2e%2e%2fsecret.pdf",
					},
				}),
		);

		const result = await rpcTool(flatProperties).execute({ path_id: 'f' });

		assert(isBinaryDownloadResult(result));
		expect(result.fileName).toBe('secret.pdf');
	});

	it('can be rebound to another account', async () => {
		const seen = captureRpc();
		const tool = rpcTool(flatProperties);

		tool.setAccountId('acc2');
		await tool.execute({});

		expect(tool.getAccountId()).toBe('acc2');
		expect(seen[0]?.headers.get('x-account-id')).toBe('acc2');
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
			endpoint: `${TEST_BASE_URL}/mcp?param-style=flat_prefixed&tool-mode=search_execute`,
			apiKey: 'test-key',
			accountId: 'acc1',
			timeout: 5_000,
		});

	it('calls the tool over tools/call and returns the parsed result', async () => {
		const result = await mcpTool().execute({
			action_id: 'mock_list_items',
			query: { page_size: 2 },
		});

		expect(result).toMatchObject({ data: { nodes: [] }, echoed_query: { page_size: 2 } });
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
	// model-controlled. The meta tool's own schema declares no headers_*, so nothing survives.
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
		await mcpTool({ 'headers_x-trace': { type: 'string' } }).execute({
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
