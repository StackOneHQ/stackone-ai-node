/**
 * StackOneToolSet tests - comprehensive test suite covering:
 * - Initialization and configuration
 * - Authentication (basic, bearer)
 * - Glob and filter matching
 * - MCP fetch integration
 * - Account filtering
 * - Provider and action filtering
 */
import { http, HttpResponse } from 'msw';
import { type McpToolDefinition, createMcpApp, defaultMcpTools } from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { TEST_BASE_URL } from '../mocks/constants';
import { StackOneToolSet, ToolSetConfigError } from './toolsets';

describe('StackOneToolSet', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test_key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe('initialization', () => {
		it('should initialize with API key from constructor', () => {
			const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

			expect(toolset).toBeDefined();
			// @ts-expect-error - Accessing private property for testing
			expect(toolset.authentication?.credentials?.username).toBe('custom_key');
		});

		it('should initialize with API key from environment', () => {
			const toolset = new StackOneToolSet();

			expect(toolset).toBeDefined();
			// @ts-expect-error - Accessing private property for testing
			expect(toolset.authentication?.credentials?.username).toBe('test_key');
		});

		it('should initialize with custom values', () => {
			const baseUrl = 'https://api.example.com';
			const headers = { 'X-Custom-Header': 'test' };

			const toolset = new StackOneToolSet({
				apiKey: 'custom_key',
				baseUrl,
				headers,
			});

			// @ts-expect-error - Accessing private properties for testing
			expect(toolset.baseUrl).toBe(baseUrl);
			// @ts-expect-error - Accessing private properties for testing
			expect(toolset.headers['X-Custom-Header']).toBe('test');
		});

		it('should set API key in headers', () => {
			const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

			// @ts-expect-error - Accessing private property for testing
			expect(toolset.headers.Authorization).toBe('Basic Y3VzdG9tX2tleTo=');
		});

		it('should set account ID in headers if provided', () => {
			const toolset = new StackOneToolSet({
				apiKey: 'custom_key',
				accountId: 'test_account',
			});

			// Verify account ID is stored in the headers
			// @ts-expect-error - Accessing private property for testing
			expect(toolset.headers['x-account-id']).toBe('test_account');
		});

		it('should allow setting account IDs via setAccounts', () => {
			const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

			const result = toolset.setAccounts(['account-1', 'account-2']);

			// Should return this for chaining
			expect(result).toBe(toolset);
			// @ts-expect-error - Accessing private property for testing
			expect(toolset.accountIds).toEqual(['account-1', 'account-2']);
		});

		it('should initialize with multiple account IDs from constructor', () => {
			const toolset = new StackOneToolSet({
				apiKey: 'custom_key',
				accountIds: ['account-1', 'account-2', 'account-3'],
			});

			// @ts-expect-error - Accessing private property for testing
			expect(toolset.accountIds).toEqual(['account-1', 'account-2', 'account-3']);
		});

		it('should initialize with empty accountIds array when not provided', () => {
			const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

			// @ts-expect-error - Accessing private property for testing
			expect(toolset.accountIds).toEqual([]);
		});

		it('should not allow both accountId and accountIds in constructor (type check)', () => {
			// This test verifies the type system prevents using both accountId and accountIds
			// The following would be a type error:
			// new StackOneToolSet({
			//   apiKey: 'custom_key',
			//   accountId: 'primary-account',
			//   accountIds: ['account-1', 'account-2'],
			// });

			// Valid: only accountId
			const toolsetSingle = new StackOneToolSet({
				apiKey: 'custom_key',
				accountId: 'primary-account',
			});
			// @ts-expect-error - Accessing private property for testing
			expect(toolsetSingle.headers['x-account-id']).toBe('primary-account');
			// @ts-expect-error - Accessing private property for testing
			expect(toolsetSingle.accountIds).toEqual([]);

			// Valid: only accountIds
			const toolsetMultiple = new StackOneToolSet({
				apiKey: 'custom_key',
				accountIds: ['account-1', 'account-2'],
			});
			// @ts-expect-error - Accessing private property for testing
			expect(toolsetMultiple.headers['x-account-id']).toBeUndefined();
			// @ts-expect-error - Accessing private property for testing
			expect(toolsetMultiple.accountIds).toEqual(['account-1', 'account-2']);
		});

		it('should throw error when both accountId and accountIds are provided at runtime', () => {
			// Runtime validation for JavaScript users or when TypeScript is bypassed
			expect(() => {
				new StackOneToolSet({
					apiKey: 'custom_key',
					accountId: 'primary-account',
					accountIds: ['account-1', 'account-2'],
				} as never); // Use 'as never' to bypass TypeScript for runtime test
			}).toThrow(ToolSetConfigError);
			expect(() => {
				new StackOneToolSet({
					apiKey: 'custom_key',
					accountId: 'primary-account',
					accountIds: ['account-1', 'account-2'],
				} as never);
			}).toThrow(/Cannot provide both accountId and accountIds/);
		});

		it('should set baseUrl from config', () => {
			const toolset = new StackOneToolSet({
				apiKey: 'custom_key',
				baseUrl: 'https://api.example.com',
			});

			// @ts-expect-error - Accessing private property for testing
			expect(toolset.baseUrl).toBe('https://api.example.com');
		});
	});

	describe('authentication', () => {
		it('should configure basic auth with API key from constructor', () => {
			const toolset = new StackOneToolSet({ apiKey: 'custom_key' });

			// @ts-expect-error - Accessing private property for testing
			expect(toolset.authentication).toEqual({
				type: 'basic',
				credentials: {
					username: 'custom_key',
					password: '',
				},
			});
		});

		it('should configure basic auth with API key from environment', () => {
			const toolset = new StackOneToolSet();

			// @ts-expect-error - Accessing private property for testing
			expect(toolset.authentication).toEqual({
				type: 'basic',
				credentials: {
					username: 'test_key',
					password: '',
				},
			});
		});

		it('should throw ToolSetConfigError if no API key is provided and strict mode is enabled', () => {
			vi.stubEnv('STACKONE_API_KEY', undefined);

			expect(() => {
				new StackOneToolSet({ strict: true });
			}).toThrow(ToolSetConfigError);
		});

		it('should not override custom headers with authentication', () => {
			const customHeaders = {
				'Custom-Header': 'test-value',
				Authorization: 'Bearer custom-token',
			};

			const toolset = new StackOneToolSet({
				apiKey: 'custom_key',
				headers: customHeaders,
			});

			// @ts-expect-error - Accessing private property for testing
			expect(toolset.headers).toEqual(customHeaders);
		});

		it('should combine authentication and account ID headers', () => {
			const toolset = new StackOneToolSet({
				apiKey: 'custom_key',
				accountId: 'test_account',
			});

			const expectedAuthValue = `Basic ${Buffer.from('custom_key:').toString('base64')}`;
			// @ts-expect-error - Accessing private property for testing
			expect(toolset.headers.Authorization).toBe(expectedAuthValue);
			// @ts-expect-error - Accessing private property for testing
			expect(toolset.headers['x-account-id']).toBe('test_account');
		});
	});

	describe('fetchTools (MCP integration)', () => {
		it('creates tools from MCP catalog and wires RPC execution', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			// 1 dummy_action tool
			expect(tools.length).toBe(1);

			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			expect(tool).toBeDefined();
			expect(tool?.name).toBe('dummy_action');

			const aiTools = await tool?.toAISDK({ executable: false });
			const aiToolDefinition = aiTools?.dummy_action;
			expect(aiToolDefinition).toBeDefined();
			expect(aiToolDefinition?.description).toBe('Dummy tool');
			// @ts-expect-error - jsonSchema is available on Schema wrapper from ai sdk
			expect(aiToolDefinition?.inputSchema.jsonSchema.properties).toBeDefined();
			expect(aiToolDefinition?.execution).toBeUndefined();

			const executableTool = (await tool?.toAISDK())?.dummy_action;
			expect(executableTool?.execute).toBeDefined();
		});

		it('pins param-style=flat_prefixed on the MCP listing URL', async () => {
			let requestedUrl = '';
			const mcpApp = createMcpApp({ accountTools: { default: defaultMcpTools } });
			server.use(
				http.all(`${TEST_BASE_URL}/mcp`, async ({ request }) => {
					if (!requestedUrl) {
						requestedUrl = request.url;
					}
					return mcpApp.fetch(request);
				}),
			);

			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});
			await toolset.fetchTools();

			expect(requestedUrl).toBe(`${TEST_BASE_URL}/mcp?param-style=flat_prefixed`);
		});
	});

	describe('account filtering', () => {
		it('supports setAccounts() for chaining', () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			// Test chaining
			const result = toolset.setAccounts(['acc1', 'acc2']);
			expect(result).toBe(toolset);
		});

		it('fetches tools without account filtering when no accountIds provided', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			const tools = await toolset.fetchTools();
			// 2 default tools
			expect(tools.length).toBe(2);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('default_tool_1');
			expect(toolNames).toContain('default_tool_2');
		});

		it('uses x-account-id header when fetching tools with accountIds', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			// Fetch tools for acc1
			const tools = await toolset.fetchTools({ accountIds: ['acc1'] });
			// 2 acc1 tools
			expect(tools.length).toBe(2);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('acc1_tool_1');
			expect(toolNames).toContain('acc1_tool_2');
		});

		it('uses setAccounts when no accountIds provided in fetchTools', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			// Set accounts using setAccounts
			toolset.setAccounts(['acc1', 'acc2']);

			// Fetch without accountIds - should use setAccounts
			const tools = await toolset.fetchTools();

			// Should fetch tools for 2 accounts from setAccounts
			// acc1 has 2 tools, acc2 has 2 tools
			expect(tools.length).toBe(4);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('acc1_tool_1');
			expect(toolNames).toContain('acc1_tool_2');
			expect(toolNames).toContain('acc2_tool_1');
			expect(toolNames).toContain('acc2_tool_2');
		});

		it('uses accountIds from constructor when no accountIds provided in fetchTools', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountIds: ['acc1', 'acc2'],
			});

			// Fetch without accountIds - should use constructor accountIds
			const tools = await toolset.fetchTools();

			// Should fetch tools for 2 accounts from constructor
			// acc1 has 2 tools, acc2 has 2 tools
			expect(tools.length).toBe(4);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('acc1_tool_1');
			expect(toolNames).toContain('acc1_tool_2');
			expect(toolNames).toContain('acc2_tool_1');
			expect(toolNames).toContain('acc2_tool_2');
		});

		it('setAccounts overrides constructor accountIds', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountIds: ['acc1'],
			});

			// Override with setAccounts
			toolset.setAccounts(['acc2', 'acc3']);

			// Fetch without accountIds - should use setAccounts, not constructor
			const tools = await toolset.fetchTools();

			// Should fetch tools for acc2 and acc3 (not acc1)
			// acc2 has 2 tools, acc3 has 1 tool
			expect(tools.length).toBe(3);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).not.toContain('acc1_tool_1');
			expect(toolNames).toContain('acc2_tool_1');
			expect(toolNames).toContain('acc2_tool_2');
			expect(toolNames).toContain('acc3_tool_1');
		});

		it('overrides setAccounts when accountIds provided in fetchTools', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			// Set accounts using setAccounts
			toolset.setAccounts(['acc1', 'acc2']);

			// Fetch with accountIds - should override setAccounts
			const tools = await toolset.fetchTools({ accountIds: ['acc3'] });

			// Should fetch tools only for acc3 (ignoring acc1, acc2)
			expect(tools.length).toBe(1);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('acc3_tool_1');
		});

		// Regression for issue #365: tools must carry the x-account-id of the
		// account they were fetched for, even when accounts are fetched
		// concurrently. The prior implementation mutated this.headers around
		// async boundaries, so concurrent fetches clobbered each other and
		// tools were stamped with the wrong account.
		it('stamps each tool with the x-account-id of its own account under intra-call concurrency', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			const tools = await toolset.fetchTools({ accountIds: ['acc1', 'acc2', 'acc3'] });

			for (const tool of tools.toArray()) {
				if (tool.name.startsWith('acc1_')) {
					expect(tool.getHeaders()['x-account-id']).toBe('acc1');
				} else if (tool.name.startsWith('acc2_')) {
					expect(tool.getHeaders()['x-account-id']).toBe('acc2');
				} else if (tool.name.startsWith('acc3_')) {
					expect(tool.getHeaders()['x-account-id']).toBe('acc3');
				}
			}
		});

		it('stamps tools correctly when two fetchTools calls run concurrently on the same instance', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			const [acc1Tools, acc2Tools] = await Promise.all([
				toolset.fetchTools({ accountIds: ['acc1'] }),
				toolset.fetchTools({ accountIds: ['acc2'] }),
			]);

			for (const tool of acc1Tools.toArray()) {
				if (tool.name.startsWith('acc')) {
					expect(tool.getHeaders()['x-account-id']).toBe('acc1');
				}
			}
			for (const tool of acc2Tools.toArray()) {
				if (tool.name.startsWith('acc')) {
					expect(tool.getHeaders()['x-account-id']).toBe('acc2');
				}
			}
		});
	});

	describe('tool execution', () => {
		it('should execute tool with dryRun option', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			const result = await tool.execute({ body: { name: 'test' } }, { dryRun: true });

			expect(result.url).toBe(`${TEST_BASE_URL}/actions/rpc`);
			expect(result.method).toBe('POST');
			expect(result.headers).toBeDefined();
			expect(result.body).toBeDefined();
			expect(result.mappedParams).toEqual({ body: { name: 'test' } });
		});

		it('should execute tool with path, query, and headers params', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			const result = await tool.execute(
				{
					body: { name: 'test' },
					path: { id: '123' },
					query: { limit: 10 },
					headers: { 'x-custom': 'value' },
				},
				{ dryRun: true },
			);

			expect(result.mappedParams).toEqual({
				body: { name: 'test' },
				path: { id: '123' },
				query: { limit: 10 },
				headers: { 'x-custom': 'value' },
			});
		});

		it('should execute tool with string parameters', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			const result = await tool.execute(JSON.stringify({ body: { name: 'test' } }), {
				dryRun: true,
			});

			expect(result.mappedParams).toEqual({ body: { name: 'test' } });
		});

		it('should throw StackOneError for invalid parameter type', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			// @ts-expect-error - intentionally passing invalid type
			await expect(tool.execute(12345)).rejects.toThrow('Invalid parameters type');
		});

		it('should wrap non-StackOneError in execute', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			// Pass invalid JSON string to trigger JSON.parse error
			await expect(tool.execute('not valid json')).rejects.toThrow('Error executing RPC action');
		});

		it('should include extra params in rpcBody', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			const result = await tool.execute(
				{
					body: { nested: 'value' },
					extraParam: 'extra-value',
					anotherParam: 123,
				},
				{ dryRun: true },
			);

			// The body should include both the nested body and extra params
			const parsedBody = JSON.parse(result.body as string);
			expect(parsedBody.body).toEqual({
				nested: 'value',
				extraParam: 'extra-value',
				anotherParam: 123,
			});
		});

		it('routes flat_prefixed params into the RPC envelope', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			const result = await tool.execute(
				{
					path_id: '123',
					query_limit: 10,
					'headers_x-custom': 'value',
					body_name: 'test',
				},
				{ dryRun: true },
			);

			const payload = JSON.parse(result.body as string);
			expect(payload.path).toEqual({ id: '123' });
			expect(payload.query).toEqual({ limit: 10 });
			expect(payload.body).toEqual({ name: 'test' });
			// dummy_action declares no `headers_*` property, so the header is dropped.
			expect(result.headers as Record<string, string>).not.toHaveProperty('x-custom');
		});

		it('preserves fields named after Object.prototype members', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			const result = await tool.execute(
				{ body_constructor: 'x', path_toString: 'y', query_valueOf: 'z' },
				{ dryRun: true },
			);

			const payload = JSON.parse(result.body as string);
			expect(payload.body).toEqual({ constructor: 'x' });
			expect(payload.path).toEqual({ toString: 'y' });
			expect(payload.query).toEqual({ valueOf: 'z' });
		});

		it('prefers an explicit flat key over a nested duplicate whatever the key order', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			const nestedFirst = await tool.execute(
				{ path: { id: 'nested' }, path_id: 'flat' },
				{ dryRun: true },
			);
			const flatFirst = await tool.execute(
				{ path_id: 'flat', path: { id: 'nested' } },
				{ dryRun: true },
			);

			expect(JSON.parse(nestedFirst.body as string).path).toEqual({ id: 'flat' });
			expect(JSON.parse(flatFirst.body as string).path).toEqual({ id: 'flat' });
		});

		it('drops reserved envelope keys that do not carry an object', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			const tool = tools.toArray().find((t) => t.name === 'dummy_action');
			assert(tool, 'tool should be defined');

			const result = await tool.execute(
				{ body: 'oops', path: 5, real_field: 'kept' },
				{ dryRun: true },
			);

			// `body`/`path` name an envelope, so a non-object value is dropped rather than
			// leaked into the body payload under its reserved name.
			const payload = JSON.parse(result.body as string);
			expect(payload.body).toEqual({ real_field: 'kept' });
			expect(payload.path).toBeUndefined();
		});
	});

	describe('model-supplied headers', () => {
		const serveTool = (inputSchema: McpToolDefinition['inputSchema']) => {
			const app = createMcpApp({
				accountTools: {
					'tenant-a': [{ name: 'crm_list_contacts', description: 'List contacts', inputSchema }],
				},
			});
			server.use(http.all(`${TEST_BASE_URL}/mcp`, ({ request }) => app.fetch(request)));
		};
		const captureRpc = () => {
			const seen: { accountHeader: string | null; body: Record<string, unknown> }[] = [];
			server.use(
				http.post(`${TEST_BASE_URL}/actions/rpc`, async ({ request }) => {
					seen.push({
						accountHeader: request.headers.get('x-account-id'),
						body: (await request.json()) as Record<string, unknown>,
					});
					return HttpResponse.json({ data: {} });
				}),
			);
			return seen;
		};
		const fetchTool = async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'tenant-a',
			});
			const tool = (await toolset.fetchTools()).getTool('crm_list_contacts');
			assert(tool, 'tool should be listed');
			return tool;
		};

		// Regression: the envelope headers were merged OVER the tool's own headers, so a
		// model-supplied x-account-id replaced the account the tool was fetched for — on the
		// envelope and on the HTTP header the API actually reads.
		it('cannot switch tenant with headers_x-account-id, even when the schema declares it', async () => {
			serveTool({
				type: 'object',
				properties: { 'headers_x-account-id': { type: 'string' }, query_limit: { type: 'number' } },
			});
			const seen = captureRpc();
			const tool = await fetchTool();

			await tool.execute({ 'headers_x-account-id': 'tenant-b', query_limit: 1 });

			expect(seen[0]?.accountHeader).toBe('tenant-a');
			expect((seen[0]?.body.headers as Record<string, string>)['x-account-id']).toBe('tenant-a');
		});

		it('cannot switch tenant with a nested headers object', async () => {
			serveTool({ type: 'object', properties: { query_limit: { type: 'number' } } });
			const seen = captureRpc();
			const tool = await fetchTool();

			await tool.execute({ headers: { 'X-Account-Id': 'tenant-b', Authorization: 'Bearer stolen' } });

			expect(seen[0]?.accountHeader).toBe('tenant-a');
			expect(seen[0]?.body.headers).toEqual({ 'x-account-id': 'tenant-a' });
		});

		it('forwards a header the served schema declares', async () => {
			serveTool({ type: 'object', properties: { 'headers_x-trace': { type: 'string' } } });
			const seen = captureRpc();
			const tool = await fetchTool();

			await tool.execute({ 'headers_x-trace': 'abc', 'headers_x-other': 'dropped' });

			expect(seen[0]?.body.headers).toEqual({ 'x-trace': 'abc', 'x-account-id': 'tenant-a' });
		});
	});

	describe('provider and action filtering', () => {
		it('filters tools by providers', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'mixed',
			});

			// Filter by providers
			const tools = await toolset.fetchTools({ providers: ['hibob', 'bamboohr'] });

			// 4 filtered tools
			expect(tools.length).toBe(4);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('hibob_create_employees');
			expect(toolNames).toContain('bamboohr_list_employees');
			expect(toolNames).toContain('bamboohr_get_employee');
			expect(toolNames).not.toContain('workday_list_employees');
		});

		it('filters tools by actions with exact match', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'mixed',
			});

			// Filter by exact action names
			const tools = await toolset.fetchTools({
				actions: ['hibob_list_employees', 'hibob_create_employees'],
			});

			// 2 filtered tools
			expect(tools.length).toBe(2);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('hibob_create_employees');
		});

		it('filters tools by actions with glob pattern', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountId: 'mixed',
			});

			// Filter by glob pattern
			const tools = await toolset.fetchTools({ actions: ['*_list_employees'] });

			// 3 filtered tools
			expect(tools.length).toBe(3);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('bamboohr_list_employees');
			expect(toolNames).toContain('workday_list_employees');
			expect(toolNames).not.toContain('hibob_create_employees');
			expect(toolNames).not.toContain('bamboohr_get_employee');
		});

		it('combines accountIds and actions filters', async () => {
			const acc1Tools: McpToolDefinition[] = [
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
			];

			const acc2Tools: McpToolDefinition[] = [
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
			];

			// Override the handler for this specific test
			const testMcpApp = createMcpApp({
				accountTools: {
					acc1: acc1Tools,
					acc2: acc2Tools,
				},
			});
			server.use(
				http.all(`${TEST_BASE_URL}/mcp`, async ({ request }) => {
					return testMcpApp.fetch(request);
				}),
			);

			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			// Combine account and action filters
			const tools = await toolset.fetchTools({
				accountIds: ['acc1', 'acc2'],
				actions: ['*_list_employees'],
			});

			// 2 filtered tools
			expect(tools.length).toBe(2);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('bamboohr_list_employees');
			expect(toolNames).not.toContain('hibob_create_employees');
			expect(toolNames).not.toContain('bamboohr_get_employee');
		});

		it('combines all filters: accountIds, providers, and actions', async () => {
			const acc1Tools: McpToolDefinition[] = [
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
					name: 'workday_list_employees',
					description: 'Workday List Employees',
					inputSchema: {
						type: 'object',
						properties: { fields: { type: 'string' } },
					},
				},
			];

			// Override the handler for this specific test
			const testMcpApp = createMcpApp({
				accountTools: {
					acc1: acc1Tools,
				},
			});
			server.use(
				http.all(`${TEST_BASE_URL}/mcp`, async ({ request }) => {
					return testMcpApp.fetch(request);
				}),
			);

			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			// Combine all filters
			const tools = await toolset.fetchTools({
				accountIds: ['acc1'],
				providers: ['hibob'],
				actions: ['*_list_*'],
			});

			// Should only return hibob_list_employees (matches all filters)
			expect(tools.length).toBe(1);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
		});
	});

	describe('catalog cache', () => {
		const installMcpSpy = (
			accountTools: Record<string, McpToolDefinition[]> = {
				acc1: [
					{
						name: 'acc1_tool_1',
						description: 'acc1 tool 1',
						inputSchema: { type: 'object', properties: {} },
					},
				],
				acc2: [
					{
						name: 'acc2_tool_1',
						description: 'acc2 tool 1',
						inputSchema: { type: 'object', properties: {} },
					},
				],
			},
		) => {
			const testMcpApp = createMcpApp({ accountTools });
			const counter = { count: 0 };
			server.use(
				http.all(`${TEST_BASE_URL}/mcp`, async ({ request }) => {
					counter.count += 1;
					return testMcpApp.fetch(request);
				}),
			);
			return counter;
		};

		it('memoizes fetchTools results across repeat calls', async () => {
			const counter = installMcpSpy();
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			await toolset.fetchTools({ accountIds: ['acc1'] });
			const afterFirst = counter.count;
			expect(afterFirst).toBeGreaterThan(0);

			await toolset.fetchTools({ accountIds: ['acc1'] });
			await toolset.fetchTools({ accountIds: ['acc1'] });
			expect(counter.count).toBe(afterFirst);
		});

		it('uses separate cache entries for different account sets', async () => {
			const counter = installMcpSpy();
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			await toolset.fetchTools({ accountIds: ['acc1'] });
			const afterAcc1 = counter.count;

			await toolset.fetchTools({ accountIds: ['acc1'] });
			expect(counter.count).toBe(afterAcc1);

			await toolset.fetchTools({ accountIds: ['acc2'] });
			expect(counter.count).toBeGreaterThan(afterAcc1);
			const afterAcc2 = counter.count;

			await toolset.fetchTools({ accountIds: ['acc1'] });
			expect(counter.count).toBe(afterAcc2);
		});

		it('account-id ordering does not affect cache hits', async () => {
			const counter = installMcpSpy();
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			await toolset.fetchTools({ accountIds: ['acc1', 'acc2'] });
			const afterFirst = counter.count;
			expect(afterFirst).toBeGreaterThan(0);

			// Reordered list should hit the cache — no new MCP traffic.
			await toolset.fetchTools({ accountIds: ['acc2', 'acc1'] });
			expect(counter.count).toBe(afterFirst);
		});

		it('clearCatalogCache forces a refetch', async () => {
			const counter = installMcpSpy();
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			await toolset.fetchTools({ accountIds: ['acc1'] });
			const afterFirst = counter.count;

			toolset.clearCatalogCache();
			await toolset.fetchTools({ accountIds: ['acc1'] });
			expect(counter.count).toBeGreaterThan(afterFirst);
		});

		it('setAccounts invalidates the cache', async () => {
			const counter = installMcpSpy();
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
				accountIds: ['acc1'],
			});

			await toolset.fetchTools();
			await toolset.fetchTools();
			const afterAcc1 = counter.count;

			toolset.setAccounts(['acc2']);
			await toolset.fetchTools();
			expect(counter.count).toBeGreaterThan(afterAcc1);
		});

		it('reuses the same Tools instance on cache hit (identity)', async () => {
			installMcpSpy();
			const toolset = new StackOneToolSet({
				baseUrl: TEST_BASE_URL,
				apiKey: 'test-key',
			});

			const first = await toolset.fetchTools({ accountIds: ['acc1'] });
			const second = await toolset.fetchTools({ accountIds: ['acc1'] });

			// Identity reuse means the toolIndex cache's reference-equality check
			// in localSearch can hit across search calls.
			expect(second).toBe(first);
		});
	});
});
