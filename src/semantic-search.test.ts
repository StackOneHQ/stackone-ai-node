/**
 * Tests for semantic search client and integration.
 * Covers: SemanticSearchClient, normalizeActionName, StackOneToolSet integration,
 * utility tools with semantic search, connector helpers, and deduplication.
 */

import { http, HttpResponse } from 'msw';
import { type McpToolDefinition, createMcpApp } from '../mocks/mcp-server';
import { server } from '../mocks/node';
import { normalizeActionName, SemanticSearchClient, SemanticSearchError } from './semantic-search';
import { StackOneToolSet } from './toolsets';
import { BaseTool, Tools } from './tool';

// ─── Helpers ──────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.stackone.com';

function semanticResult(overrides: {
	action_name: string;
	connector_key: string;
	similarity_score: number;
	label?: string;
	description?: string;
}): Record<string, unknown> {
	return {
		action_name: overrides.action_name,
		connector_key: overrides.connector_key,
		similarity_score: overrides.similarity_score,
		label: overrides.label ?? 'Label',
		description: overrides.description ?? 'Description',
	};
}

function mockSemanticSearch(
	results: Record<string, unknown>[],
	options?: { query?: string; status?: number },
): void {
	server.use(
		http.post(`${BASE_URL}/actions/search`, async ({ request }) => {
			if (options?.status && options.status !== 200) {
				return HttpResponse.json({ error: 'Error' }, { status: options.status });
			}
			const body = (await request.json()) as Record<string, unknown>;
			return HttpResponse.json({
				results,
				total_count: results.length,
				query: body.query ?? options?.query ?? '',
			});
		}),
	);
}

function setupMcpTools(tools: McpToolDefinition[]): void {
	const app = createMcpApp({
		accountTools: { default: tools, 'acc-123': tools },
	});

	server.use(
		http.all(`${BASE_URL}/mcp`, async ({ request }) => {
			const res = await app.request(new Request(request.url, request), undefined, {});
			return new HttpResponse(res.body, {
				status: res.status,
				headers: Object.fromEntries(res.headers.entries()),
			});
		}),
	);
}

const bamboohrTool: McpToolDefinition = {
	name: 'bamboohr_create_employee',
	description: 'Creates a new employee in BambooHR',
	inputSchema: { type: 'object', properties: {} },
};

const hibobTool: McpToolDefinition = {
	name: 'hibob_create_employee',
	description: 'Creates a new employee in HiBob',
	inputSchema: { type: 'object', properties: {} },
};

const bamboohrListTool: McpToolDefinition = {
	name: 'bamboohr_list_employees',
	description: 'Lists all employees in BambooHR',
	inputSchema: { type: 'object', properties: {} },
};

const workdayTool: McpToolDefinition = {
	name: 'workday_create_worker',
	description: 'Creates a new worker in Workday',
	inputSchema: { type: 'object', properties: {} },
};

// ─── SemanticSearchClient ──────────────────────────────────────────────────

describe('SemanticSearchClient', () => {
	describe('initialization', () => {
		it('should initialize with defaults', () => {
			const client = new SemanticSearchClient({ apiKey: 'test-key' });

			expect(client.apiKey).toBe('test-key');
			expect(client.baseUrl).toBe('https://api.stackone.com');
			expect(client.timeout).toBe(30_000);
		});

		it('should initialize with custom base URL', () => {
			const client = new SemanticSearchClient({
				apiKey: 'test-key',
				baseUrl: 'https://custom.api.com/',
			});

			expect(client.baseUrl).toBe('https://custom.api.com');
		});

		it('should initialize with custom timeout', () => {
			const client = new SemanticSearchClient({
				apiKey: 'test-key',
				timeout: 5_000,
			});

			expect(client.timeout).toBe(5_000);
		});
	});

	describe('_buildAuthHeader', () => {
		it('should build correct Basic auth header', () => {
			const client = new SemanticSearchClient({ apiKey: 'test-key' });
			const header = client._buildAuthHeader();

			// "test-key:" encoded in base64 = dGVzdC1rZXk6
			expect(header).toBe('Basic dGVzdC1rZXk6');
		});
	});

	describe('search', () => {
		it('should return parsed results on success', async () => {
			mockSemanticSearch([
				semanticResult({
					action_name: 'bamboohr_create_employee',
					connector_key: 'bamboohr',
					similarity_score: 0.92,
					label: 'Create Employee',
					description: 'Creates a new employee',
				}),
			]);

			const client = new SemanticSearchClient({ apiKey: 'test-key' });
			const response = await client.search('create employee', { topK: 5 });

			expect(response.results).toHaveLength(1);
			expect(response.results[0].actionName).toBe('bamboohr_create_employee');
			expect(response.results[0].connectorKey).toBe('bamboohr');
			expect(response.results[0].similarityScore).toBe(0.92);
			expect(response.totalCount).toBe(1);
		});

		it('should send connector filter in payload', async () => {
			const recordedRequests: Request[] = [];
			server.use(
				http.post(`${BASE_URL}/actions/search`, async ({ request }) => {
					recordedRequests.push(request.clone());
					const body = (await request.json()) as Record<string, unknown>;
					return HttpResponse.json({
						results: [],
						total_count: 0,
						query: body.query,
					});
				}),
			);

			const client = new SemanticSearchClient({ apiKey: 'test-key' });
			await client.search('create employee', { connector: 'bamboohr', topK: 10 });

			expect(recordedRequests).toHaveLength(1);
			const body = (await recordedRequests[0].json()) as Record<string, unknown>;
			expect(body).toEqual({
				query: 'create employee',
				connector: 'bamboohr',
				top_k: 10,
			});
		});

		it('should throw SemanticSearchError on HTTP error', async () => {
			mockSemanticSearch([], { status: 401 });

			const client = new SemanticSearchClient({ apiKey: 'invalid-key' });
			await expect(client.search('create employee')).rejects.toThrow(SemanticSearchError);
			await expect(client.search('create employee')).rejects.toThrow(/API error: 401/);
		});

		it('should throw SemanticSearchError on network error', async () => {
			server.use(
				http.post(`${BASE_URL}/actions/search`, () => {
					return HttpResponse.error();
				}),
			);

			const client = new SemanticSearchClient({ apiKey: 'test-key' });
			await expect(client.search('create employee')).rejects.toThrow(SemanticSearchError);
		});
	});

	describe('searchActionNames', () => {
		it('should return action names filtered by min score', async () => {
			mockSemanticSearch([
				semanticResult({
					action_name: 'bamboohr_create_employee',
					connector_key: 'bamboohr',
					similarity_score: 0.92,
				}),
				semanticResult({
					action_name: 'hibob_create_employee',
					connector_key: 'hibob',
					similarity_score: 0.45,
				}),
			]);

			const client = new SemanticSearchClient({ apiKey: 'test-key' });

			// Without min_score filter
			const allNames = await client.searchActionNames('create employee');
			expect(allNames).toHaveLength(2);
			expect(allNames).toContain('bamboohr_create_employee');
			expect(allNames).toContain('hibob_create_employee');

			// With min_score filter
			const filteredNames = await client.searchActionNames('create employee', {
				minScore: 0.5,
			});
			expect(filteredNames).toHaveLength(1);
			expect(filteredNames).toContain('bamboohr_create_employee');
		});
	});
});

// ─── normalizeActionName ───────────────────────────────────────────────────

describe('normalizeActionName', () => {
	it('should normalize versioned API names to MCP format', () => {
		expect(normalizeActionName('calendly_1.0.0_calendly_create_scheduling_link_global')).toBe(
			'calendly_create_scheduling_link',
		);
	});

	it('should handle multi-segment semver', () => {
		expect(normalizeActionName('breathehr_1.0.1_breathehr_list_employees_global')).toBe(
			'breathehr_list_employees',
		);
	});

	it('should pass through already-normalized names', () => {
		expect(normalizeActionName('bamboohr_create_employee')).toBe('bamboohr_create_employee');
	});

	it('should pass through non-matching names', () => {
		expect(normalizeActionName('some_random_tool')).toBe('some_random_tool');
	});

	it('should handle empty string', () => {
		expect(normalizeActionName('')).toBe('');
	});

	it('should normalize different versions to the same name', () => {
		const v1 = normalizeActionName('breathehr_1.0.0_breathehr_list_employees_global');
		const v2 = normalizeActionName('breathehr_1.0.1_breathehr_list_employees_global');
		expect(v1).toBe(v2);
		expect(v1).toBe('breathehr_list_employees');
	});
});

// ─── Tools.getConnectors ───────────────────────────────────────────────────

describe('Tools.getConnectors', () => {
	it('should return unique connector names', () => {
		const tools = new Tools([
			new BaseTool(
				'bamboohr_create_employee',
				'desc',
				{ type: 'object', properties: {} },
				{ kind: 'local' },
			),
			new BaseTool(
				'bamboohr_list_employees',
				'desc',
				{ type: 'object', properties: {} },
				{ kind: 'local' },
			),
			new BaseTool(
				'hibob_create_employee',
				'desc',
				{ type: 'object', properties: {} },
				{ kind: 'local' },
			),
			new BaseTool(
				'slack_send_message',
				'desc',
				{ type: 'object', properties: {} },
				{ kind: 'local' },
			),
		]);

		const connectors = tools.getConnectors();
		expect(connectors).toEqual(new Set(['bamboohr', 'hibob', 'slack']));
	});

	it('should return empty set for empty tools', () => {
		const tools = new Tools([]);
		expect(tools.getConnectors()).toEqual(new Set());
	});
});

// ─── StackOneToolSet semantic search integration ───────────────────────────

describe('StackOneToolSet semantic search', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe('semanticClient', () => {
		it('should lazily initialize semantic client', () => {
			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const client = toolset.semanticClient;

			expect(client).toBeInstanceOf(SemanticSearchClient);
			expect(client.apiKey).toBe('test-key');

			// Same instance on second access
			expect(toolset.semanticClient).toBe(client);
		});
	});

	describe('searchTools', () => {
		it('should return tools filtered by available connectors', async () => {
			// Set up MCP to return bamboohr and hibob tools
			setupMcpTools([bamboohrTool, hibobTool, bamboohrListTool]);

			// Semantic search returns results including workday (user doesn't have)
			mockSemanticSearch([
				semanticResult({
					action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
					connector_key: 'bamboohr',
					similarity_score: 0.95,
				}),
				semanticResult({
					action_name: 'workday_1.0.0_workday_create_worker_global',
					connector_key: 'workday',
					similarity_score: 0.9,
				}),
				semanticResult({
					action_name: 'hibob_1.0.0_hibob_create_employee_global',
					connector_key: 'hibob',
					similarity_score: 0.85,
				}),
			]);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const tools = await toolset.searchTools('create employee', { topK: 5 });

			// Should only return tools for available connectors
			const toolNames = tools.map((t) => t.name);
			expect(toolNames).toContain('bamboohr_create_employee');
			expect(toolNames).toContain('hibob_create_employee');
			expect(toolNames).not.toContain('workday_create_worker');

			// Should be sorted by semantic score
			expect(tools.toArray()[0].name).toBe('bamboohr_create_employee');
			expect(tools.toArray()[1].name).toBe('hibob_create_employee');
		});

		it('should fallback to local search when semantic API fails', async () => {
			setupMcpTools([bamboohrTool, bamboohrListTool, workdayTool]);

			// Semantic search fails
			server.use(
				http.post(`${BASE_URL}/actions/search`, () => {
					return HttpResponse.json({ error: 'Unavailable' }, { status: 503 });
				}),
			);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const tools = await toolset.searchTools('create employee', {
				topK: 5,
				fallbackToLocal: true,
			});

			// Should return results from local BM25+TF-IDF fallback
			expect(tools.length).toBeGreaterThan(0);
			const toolNames = tools.map((t) => t.name);
			// Should only include tools for available connectors
			for (const name of toolNames) {
				const connector = name.split('_')[0];
				expect(['bamboohr', 'workday']).toContain(connector);
			}
		});

		it('should respect fallback_to_local=false', async () => {
			setupMcpTools([bamboohrTool]);

			server.use(
				http.post(`${BASE_URL}/actions/search`, () => {
					return HttpResponse.json({ error: 'Unavailable' }, { status: 503 });
				}),
			);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			await expect(
				toolset.searchTools('create employee', { fallbackToLocal: false }),
			).rejects.toThrow(SemanticSearchError);
		});

		it('should fallback with connector filter', async () => {
			setupMcpTools([bamboohrTool, bamboohrListTool, workdayTool]);

			server.use(
				http.post(`${BASE_URL}/actions/search`, () => {
					return HttpResponse.json({ error: 'Unavailable' }, { status: 503 });
				}),
			);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const tools = await toolset.searchTools('create employee', {
				connector: 'bamboohr',
				fallbackToLocal: true,
			});

			expect(tools.length).toBeGreaterThan(0);
			for (const tool of tools) {
				expect(tool.name.split('_')[0]).toBe('bamboohr');
			}
		});

		it('should deduplicate versioned action names', async () => {
			setupMcpTools([
				{
					name: 'breathehr_list_employees',
					description: 'Lists employees',
					inputSchema: { type: 'object', properties: {} },
				},
				bamboohrTool,
			]);

			mockSemanticSearch([
				semanticResult({
					action_name: 'breathehr_1.0.0_breathehr_list_employees_global',
					connector_key: 'breathehr',
					similarity_score: 0.95,
				}),
				semanticResult({
					action_name: 'breathehr_1.0.1_breathehr_list_employees_global',
					connector_key: 'breathehr',
					similarity_score: 0.9,
				}),
				semanticResult({
					action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
					connector_key: 'bamboohr',
					similarity_score: 0.85,
				}),
			]);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const tools = await toolset.searchTools('list employees', { topK: 5 });

			const toolNames = tools.map((t) => t.name);
			// Should deduplicate: both breathehr versions -> breathehr_list_employees
			expect(toolNames.filter((n) => n === 'breathehr_list_employees')).toHaveLength(1);
			expect(toolNames).toContain('bamboohr_create_employee');
			expect(tools.length).toBe(2);
		});
	});

	describe('searchActionNames', () => {
		it('should return normalized action names', async () => {
			mockSemanticSearch([
				semanticResult({
					action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
					connector_key: 'bamboohr',
					similarity_score: 0.92,
				}),
				semanticResult({
					action_name: 'hibob_1.0.0_hibob_create_employee_global',
					connector_key: 'hibob',
					similarity_score: 0.45,
				}),
			]);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const results = await toolset.searchActionNames('create employee', {
				minScore: 0.5,
			});

			expect(results).toHaveLength(1);
			expect(results[0].actionName).toBe('bamboohr_create_employee');
		});

		it('should filter by available connectors when accountIds provided', async () => {
			// Set up MCP to return only bamboohr and hibob tools
			setupMcpTools([bamboohrTool, hibobTool]);

			// Use a smarter mock that respects the connector parameter
			server.use(
				http.post(`${BASE_URL}/actions/search`, async ({ request }) => {
					const body = (await request.json()) as Record<string, unknown>;
					const connector = body.connector as string | undefined;

					const allResults = [
						semanticResult({
							action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
							connector_key: 'bamboohr',
							similarity_score: 0.95,
						}),
						semanticResult({
							action_name: 'workday_1.0.0_workday_create_worker_global',
							connector_key: 'workday',
							similarity_score: 0.9,
						}),
						semanticResult({
							action_name: 'hibob_1.0.0_hibob_create_employee_global',
							connector_key: 'hibob',
							similarity_score: 0.85,
						}),
					];

					// Filter by connector if provided (mimics real API behavior)
					const results = connector
						? allResults.filter((r) => (r as Record<string, unknown>).connector_key === connector)
						: allResults;

					return HttpResponse.json({
						results,
						total_count: results.length,
						query: body.query,
					});
				}),
			);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const results = await toolset.searchActionNames('create employee', {
				accountIds: ['acc-123'],
				topK: 10,
			});

			// workday should be filtered out (not in linked accounts)
			const actionNames = results.map((r) => r.actionName);
			expect(actionNames).toContain('bamboohr_create_employee');
			expect(actionNames).toContain('hibob_create_employee');
			expect(actionNames).not.toContain('workday_create_worker');
		});

		it('should return empty array when semantic search fails', async () => {
			server.use(
				http.post(`${BASE_URL}/actions/search`, () => {
					return HttpResponse.json({ error: 'Unavailable' }, { status: 503 });
				}),
			);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const results = await toolset.searchActionNames('create employee');

			expect(results).toEqual([]);
		});

		it('should deduplicate versioned action names', async () => {
			mockSemanticSearch([
				semanticResult({
					action_name: 'breathehr_1.0.0_breathehr_list_employees_global',
					connector_key: 'breathehr',
					similarity_score: 0.95,
				}),
				semanticResult({
					action_name: 'breathehr_1.0.1_breathehr_list_employees_global',
					connector_key: 'breathehr',
					similarity_score: 0.9,
				}),
			]);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const results = await toolset.searchActionNames('list employees', { topK: 5 });

			// Should deduplicate: only one result for breathehr_list_employees
			expect(results).toHaveLength(1);
			expect(results[0].actionName).toBe('breathehr_list_employees');
			expect(results[0].similarityScore).toBe(0.95);
		});

		it('should respect topK after filtering', async () => {
			mockSemanticSearch(
				Array.from({ length: 10 }, (_, i) =>
					semanticResult({
						action_name: `bamboohr_1.0.0_bamboohr_action_${i}_global`,
						connector_key: 'bamboohr',
						similarity_score: 0.9 - i * 0.05,
					}),
				),
			);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const results = await toolset.searchActionNames('test', { topK: 3 });

			expect(results).toHaveLength(3);
			expect(results[0].actionName).toBe('bamboohr_action_0');
		});
	});
});

// ─── Semantic utility tool search ──────────────────────────────────────────

describe('utilityTools with semanticClient', () => {
	it('should create semantic tool_search when semanticClient provided', async () => {
		const tools = new Tools([
			new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
		]);

		const client = new SemanticSearchClient({ apiKey: 'test-key' });
		const utility = await tools.utilityTools({ semanticClient: client });

		expect(utility.length).toBe(2);
		const searchTool = utility.getTool('tool_search');
		expect(searchTool).toBeDefined();
		expect(searchTool!.description).toContain('semantic');
	});

	it('should use local search when no semanticClient', async () => {
		const tools = new Tools([
			new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
		]);

		const utility = await tools.utilityTools();

		expect(utility.length).toBe(2);
		const searchTool = utility.getTool('tool_search');
		expect(searchTool).toBeDefined();
		expect(searchTool!.description).toContain('BM25');
	});

	it('should preserve backward compatibility with number arg', async () => {
		const tools = new Tools([
			new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
		]);

		// Legacy number argument should still work
		const utility = await tools.utilityTools(0.5);

		expect(utility.length).toBe(2);
		const searchTool = utility.getTool('tool_search');
		expect(searchTool).toBeDefined();
		expect(searchTool!.description).toContain('alpha=0.5');
	});

	it('should execute semantic tool_search and return results', async () => {
		mockSemanticSearch([
			semanticResult({
				action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
				connector_key: 'bamboohr',
				similarity_score: 0.92,
				label: 'Create Employee',
				description: 'Creates a new employee',
			}),
		]);

		const tools = new Tools([
			new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
		]);

		const client = new SemanticSearchClient({ apiKey: 'test-key' });
		const utility = await tools.utilityTools({ semanticClient: client });
		const searchTool = utility.getTool('tool_search');

		const result = (await searchTool!.execute({ query: 'create employee', limit: 5 })) as {
			tools: Array<{ name: string; score: number; connector: string }>;
		};

		expect(result.tools).toHaveLength(1);
		expect(result.tools[0].name).toBe('bamboohr_create_employee');
		expect(result.tools[0].score).toBe(0.92);
		expect(result.tools[0].connector).toBe('bamboohr');
	});

	it('should filter by minScore', async () => {
		mockSemanticSearch([
			semanticResult({
				action_name: 'high_score_action',
				connector_key: 'test',
				similarity_score: 0.9,
			}),
			semanticResult({
				action_name: 'low_score_action',
				connector_key: 'test',
				similarity_score: 0.3,
			}),
		]);

		const tools = new Tools([
			new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
		]);

		const client = new SemanticSearchClient({ apiKey: 'test-key' });
		const utility = await tools.utilityTools({ semanticClient: client });
		const searchTool = utility.getTool('tool_search');

		const result = (await searchTool!.execute({
			query: 'test',
			limit: 10,
			minScore: 0.5,
		})) as { tools: Array<{ name: string }> };

		expect(result.tools).toHaveLength(1);
		expect(result.tools[0].name).toBe('high_score_action');
	});

	it('should pass connector filter to semantic API', async () => {
		const recordedRequests: Request[] = [];
		server.use(
			http.post(`${BASE_URL}/actions/search`, async ({ request }) => {
				recordedRequests.push(request.clone());
				return HttpResponse.json({
					results: [],
					total_count: 0,
					query: 'create employee',
				});
			}),
		);

		const tools = new Tools([
			new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
		]);

		const client = new SemanticSearchClient({ apiKey: 'test-key' });
		const utility = await tools.utilityTools({ semanticClient: client });
		const searchTool = utility.getTool('tool_search');

		await searchTool!.execute({ query: 'create employee', connector: 'bamboohr' });

		expect(recordedRequests).toHaveLength(1);
		const body = (await recordedRequests[0].json()) as Record<string, unknown>;
		expect(body.connector).toBe('bamboohr');
	});

	it('should have connector parameter in schema', async () => {
		const tools = new Tools([
			new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
		]);

		const client = new SemanticSearchClient({ apiKey: 'test-key' });
		const utility = await tools.utilityTools({ semanticClient: client });
		const searchTool = utility.getTool('tool_search');

		expect(searchTool!.parameters.properties).toHaveProperty('query');
		expect(searchTool!.parameters.properties).toHaveProperty('limit');
		expect(searchTool!.parameters.properties).toHaveProperty('minScore');
		expect(searchTool!.parameters.properties).toHaveProperty('connector');
	});

	it('should deduplicate versioned action names in utility tool', async () => {
		mockSemanticSearch([
			semanticResult({
				action_name: 'breathehr_1.0.0_breathehr_list_employees_global',
				connector_key: 'breathehr',
				similarity_score: 0.95,
			}),
			semanticResult({
				action_name: 'breathehr_1.0.1_breathehr_list_employees_global',
				connector_key: 'breathehr',
				similarity_score: 0.9,
			}),
		]);

		const tools = new Tools([
			new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
		]);

		const client = new SemanticSearchClient({ apiKey: 'test-key' });
		const utility = await tools.utilityTools({ semanticClient: client });
		const searchTool = utility.getTool('tool_search');

		const result = (await searchTool!.execute({
			query: 'list employees',
			limit: 10,
		})) as { tools: Array<{ name: string; score: number }> };

		expect(result.tools).toHaveLength(1);
		expect(result.tools[0].name).toBe('breathehr_list_employees');
		expect(result.tools[0].score).toBe(0.95);
	});
});

// ─── Semantic search → AI SDK integration ──────────────────────────────────

describe('Semantic search → AI SDK integration', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe('searchTools → toAISDK', () => {
		it('should convert semantic search results to AI SDK format', async () => {
			setupMcpTools([bamboohrTool, hibobTool, bamboohrListTool]);

			mockSemanticSearch([
				semanticResult({
					action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
					connector_key: 'bamboohr',
					similarity_score: 0.95,
					description: 'Creates a new employee in BambooHR',
				}),
				semanticResult({
					action_name: 'hibob_1.0.0_hibob_create_employee_global',
					connector_key: 'hibob',
					similarity_score: 0.85,
					description: 'Creates a new employee in HiBob',
				}),
			]);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const tools = await toolset.searchTools('create employee', { topK: 5 });

			const aiSdkTools = await tools.toAISDK();

			// Should contain matched tools
			expect(aiSdkTools).toHaveProperty('bamboohr_create_employee');
			expect(aiSdkTools).toHaveProperty('hibob_create_employee');

			// Each tool should have correct AI SDK structure
			const bamboohrAiTool = aiSdkTools.bamboohr_create_employee;
			expect(bamboohrAiTool.description).toBe('Creates a new employee in BambooHR');
			expect(bamboohrAiTool.inputSchema).toBeDefined();
			expect(typeof bamboohrAiTool.execute).toBe('function');

			const hibobAiTool = aiSdkTools.hibob_create_employee;
			expect(hibobAiTool.description).toBe('Creates a new employee in HiBob');
			expect(typeof hibobAiTool.execute).toBe('function');
		});

		it('should produce executable AI SDK tools from semantic search', async () => {
			setupMcpTools([bamboohrTool]);

			mockSemanticSearch([
				semanticResult({
					action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
					connector_key: 'bamboohr',
					similarity_score: 0.95,
				}),
			]);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const tools = await toolset.searchTools('create employee', { topK: 5 });

			const aiSdkTools = await tools.toAISDK();
			const tool = aiSdkTools.bamboohr_create_employee;
			expect(tool.execute).toBeDefined();

			// Execute through the AI SDK wrapper
			const result = await tool.execute?.(
				{ name: 'test' },
				{ toolCallId: 'test-call-id', messages: [] },
			);
			expect(result).toBeDefined();
		});

		it('should support non-executable mode from semantic search', async () => {
			setupMcpTools([bamboohrTool]);

			mockSemanticSearch([
				semanticResult({
					action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
					connector_key: 'bamboohr',
					similarity_score: 0.95,
				}),
			]);

			const toolset = new StackOneToolSet({ apiKey: 'test-key' });
			const tools = await toolset.searchTools('create employee');

			const aiSdkTools = await tools.toAISDK({ executable: false });

			expect(aiSdkTools.bamboohr_create_employee).toBeDefined();
			expect(aiSdkTools.bamboohr_create_employee.execute).toBeUndefined();
		});
	});

	describe('utilityTools with semanticClient → toAISDK', () => {
		it('should convert semantic utility tools to AI SDK format', async () => {
			const tools = new Tools([
				new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
			]);

			const client = new SemanticSearchClient({ apiKey: 'test-key' });
			const utility = await tools.utilityTools({ semanticClient: client });

			const aiSdkTools = await utility.toAISDK();

			expect(aiSdkTools).toHaveProperty('tool_search');
			expect(aiSdkTools).toHaveProperty('tool_execute');

			// tool_search should have execute function
			expect(typeof aiSdkTools.tool_search.execute).toBe('function');
			expect(aiSdkTools.tool_search.description).toContain('semantic');

			// tool_execute should have execute function
			expect(typeof aiSdkTools.tool_execute.execute).toBe('function');
		});

		it('should execute semantic tool_search through AI SDK wrapper', async () => {
			mockSemanticSearch([
				semanticResult({
					action_name: 'bamboohr_1.0.0_bamboohr_create_employee_global',
					connector_key: 'bamboohr',
					similarity_score: 0.92,
					label: 'Create Employee',
					description: 'Creates a new employee',
				}),
			]);

			const tools = new Tools([
				new BaseTool('test_tool', 'Test', { type: 'object', properties: {} }, { kind: 'local' }),
			]);

			const client = new SemanticSearchClient({ apiKey: 'test-key' });
			const utility = await tools.utilityTools({ semanticClient: client });

			const aiSdkTools = await utility.toAISDK();

			// Execute tool_search through AI SDK format
			const result = await aiSdkTools.tool_search.execute?.(
				{ query: 'create employee', limit: 5 },
				{ toolCallId: 'test-call', messages: [] },
			);

			expect(result).toBeDefined();
			const searchResult = result as { tools: Array<{ name: string; score: number }> };
			expect(searchResult.tools).toHaveLength(1);
			expect(searchResult.tools[0].name).toBe('bamboohr_create_employee');
			expect(searchResult.tools[0].score).toBe(0.92);
		});
	});
});
