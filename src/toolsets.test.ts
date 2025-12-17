/**
 * StackOneToolSet tests - comprehensive test suite covering:
 * - Initialization and configuration
 * - Authentication (basic, bearer)
 * - Glob and filter matching
 * - MCP fetch integration
 * - Account filtering
 * - Provider and action filtering
 */
import { http } from 'msw';
import { type McpToolDefinition, createMcpApp } from '../mocks/mcp-server';
import { server } from '../mocks/node';
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
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
				accountId: 'test-account',
			});

			const tools = await toolset.fetchTools();
			// 1 dummy_action tool + 1 feedback tool
			expect(tools.length).toBe(2);

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

		it('throws error when receiving unified API tools', async () => {
			const unifiedToolMcpApp = createMcpApp({
				accountTools: {
					'unified-test-account': [
						{
							name: 'unified_hris_list_employees',
							description: 'Unified HRIS tool',
							inputSchema: { type: 'object', properties: {} },
						},
					],
				},
			});

			server.use(
				http.all('https://api.stackone-dev.com/mcp', async ({ request }) => {
					return unifiedToolMcpApp.fetch(request);
				}),
			);

			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
				accountId: 'unified-test-account',
			});

			await expect(toolset.fetchTools()).rejects.toThrow(ToolSetConfigError);
			await expect(toolset.fetchTools()).rejects.toThrow(/unified API tool/);
			await expect(toolset.fetchTools()).rejects.toThrow(/unified_hris_list_employees/);
		});
	});

	describe('account filtering', () => {
		it('supports setAccounts() for chaining', () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
			});

			// Test chaining
			const result = toolset.setAccounts(['acc1', 'acc2']);
			expect(result).toBe(toolset);
		});

		it('fetches tools without account filtering when no accountIds provided', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
			});

			const tools = await toolset.fetchTools();
			// 2 default tools + 1 feedback tool
			expect(tools.length).toBe(3);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('default_tool_1');
			expect(toolNames).toContain('default_tool_2');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});

		it('uses x-account-id header when fetching tools with accountIds', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
			});

			// Fetch tools for acc1
			const tools = await toolset.fetchTools({ accountIds: ['acc1'] });
			// 2 acc1 tools + 1 feedback tool
			expect(tools.length).toBe(3);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('acc1_tool_1');
			expect(toolNames).toContain('acc1_tool_2');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});

		it('uses setAccounts when no accountIds provided in fetchTools', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
			});

			// Set accounts using setAccounts
			toolset.setAccounts(['acc1', 'acc2']);

			// Fetch without accountIds - should use setAccounts
			const tools = await toolset.fetchTools();

			// Should fetch tools for 2 accounts from setAccounts
			// acc1 has 2 tools, acc2 has 2 tools, + 1 feedback tool = 5
			expect(tools.length).toBe(5);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('acc1_tool_1');
			expect(toolNames).toContain('acc1_tool_2');
			expect(toolNames).toContain('acc2_tool_1');
			expect(toolNames).toContain('acc2_tool_2');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});

		it('uses accountIds from constructor when no accountIds provided in fetchTools', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
				accountIds: ['acc1', 'acc2'],
			});

			// Fetch without accountIds - should use constructor accountIds
			const tools = await toolset.fetchTools();

			// Should fetch tools for 2 accounts from constructor
			// acc1 has 2 tools, acc2 has 2 tools, + 1 feedback tool = 5
			expect(tools.length).toBe(5);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('acc1_tool_1');
			expect(toolNames).toContain('acc1_tool_2');
			expect(toolNames).toContain('acc2_tool_1');
			expect(toolNames).toContain('acc2_tool_2');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});

		it('setAccounts overrides constructor accountIds', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
				accountIds: ['acc1'],
			});

			// Override with setAccounts
			toolset.setAccounts(['acc2', 'acc3']);

			// Fetch without accountIds - should use setAccounts, not constructor
			const tools = await toolset.fetchTools();

			// Should fetch tools for acc2 and acc3 (not acc1)
			// acc2 has 2 tools, acc3 has 1 tool, + 1 feedback tool = 4
			expect(tools.length).toBe(4);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).not.toContain('acc1_tool_1');
			expect(toolNames).toContain('acc2_tool_1');
			expect(toolNames).toContain('acc2_tool_2');
			expect(toolNames).toContain('acc3_tool_1');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});

		it('overrides setAccounts when accountIds provided in fetchTools', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
			});

			// Set accounts using setAccounts
			toolset.setAccounts(['acc1', 'acc2']);

			// Fetch with accountIds - should override setAccounts
			const tools = await toolset.fetchTools({ accountIds: ['acc3'] });

			// Should fetch tools only for acc3 (ignoring acc1, acc2) + 1 feedback tool
			expect(tools.length).toBe(2);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('acc3_tool_1');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});
	});

	describe('provider and action filtering', () => {
		it('filters tools by providers', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
				accountId: 'mixed',
			});

			// Filter by providers
			const tools = await toolset.fetchTools({ providers: ['hibob', 'bamboohr'] });

			// 4 filtered tools + 1 feedback tool
			expect(tools.length).toBe(5);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('hibob_create_employees');
			expect(toolNames).toContain('bamboohr_list_employees');
			expect(toolNames).toContain('bamboohr_get_employee');
			expect(toolNames).not.toContain('workday_list_employees');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});

		it('filters tools by actions with exact match', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
				accountId: 'mixed',
			});

			// Filter by exact action names
			const tools = await toolset.fetchTools({
				actions: ['hibob_list_employees', 'hibob_create_employees'],
			});

			// 2 filtered tools + 1 feedback tool
			expect(tools.length).toBe(3);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('hibob_create_employees');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});

		it('filters tools by actions with glob pattern', async () => {
			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
				accountId: 'mixed',
			});

			// Filter by glob pattern
			const tools = await toolset.fetchTools({ actions: ['*_list_employees'] });

			// 3 filtered tools + 1 feedback tool
			expect(tools.length).toBe(4);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('bamboohr_list_employees');
			expect(toolNames).toContain('workday_list_employees');
			expect(toolNames).not.toContain('hibob_create_employees');
			expect(toolNames).not.toContain('bamboohr_get_employee');
			expect(toolNames).toContain('meta_collect_tool_feedback');
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
				http.all('https://api.stackone-dev.com/mcp', async ({ request }) => {
					return testMcpApp.fetch(request);
				}),
			);

			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
			});

			// Combine account and action filters
			const tools = await toolset.fetchTools({
				accountIds: ['acc1', 'acc2'],
				actions: ['*_list_employees'],
			});

			// 2 filtered tools + 1 feedback tool
			expect(tools.length).toBe(3);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('bamboohr_list_employees');
			expect(toolNames).not.toContain('hibob_create_employees');
			expect(toolNames).not.toContain('bamboohr_get_employee');
			expect(toolNames).toContain('meta_collect_tool_feedback');
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
				http.all('https://api.stackone-dev.com/mcp', async ({ request }) => {
					return testMcpApp.fetch(request);
				}),
			);

			const toolset = new StackOneToolSet({
				baseUrl: 'https://api.stackone-dev.com',
				apiKey: 'test-key',
			});

			// Combine all filters
			const tools = await toolset.fetchTools({
				accountIds: ['acc1'],
				providers: ['hibob'],
				actions: ['*_list_*'],
			});

			// Should only return hibob_list_employees (matches all filters) + 1 feedback tool
			expect(tools.length).toBe(2);
			const toolNames = tools.toArray().map((t) => t.name);
			expect(toolNames).toContain('hibob_list_employees');
			expect(toolNames).toContain('meta_collect_tool_feedback');
		});
	});
});
