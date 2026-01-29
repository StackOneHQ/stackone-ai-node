/**
 * E2E test for fetch-tools.ts example
 *
 * Tests the complete flow of fetching and filtering tools via MCP.
 */

import { http, HttpResponse } from 'msw';
import { server } from '../mocks/node';
import { StackOneToolSet } from '../src';

describe('fetch-tools example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should fetch tools, filter by various criteria, and execute a tool', async () => {
		// Setup RPC handler for tool execution
		server.use(
			http.post('https://api.stackone.com/actions/rpc', async ({ request }) => {
				const body: unknown = await request.json();
				assert(typeof body === 'object' && body !== null);
				const { action } = body as Record<string, unknown>;
				if (action === 'bamboohr_list_employees') {
					return HttpResponse.json({
						data: [
							{ id: '1', name: 'Employee 1' },
							{ id: '2', name: 'Employee 2' },
							{ id: '3', name: 'Employee 3' },
							{ id: '4', name: 'Employee 4' },
							{ id: '5', name: 'Employee 5' },
						],
					});
				}
				return HttpResponse.json({ data: {} });
			}),
		);

		const toolset = new StackOneToolSet({
			baseUrl: 'https://api.stackone.com',
		});

		// Example 1: Fetch all tools (without account filter)
		const allTools = await toolset.fetchTools();
		expect(allTools.length).toBeGreaterThan(0);

		// Example 2: Filter by account IDs using setAccounts()
		toolset.setAccounts(['your-bamboohr-account-id']);
		const toolsByAccounts = await toolset.fetchTools();
		expect(toolsByAccounts.length).toBeGreaterThan(0);

		// Example 3: Filter by account IDs using options
		const toolsByAccountsOption = await toolset.fetchTools({
			accountIds: ['your-bamboohr-account-id'],
		});
		expect(toolsByAccountsOption.length).toBeGreaterThan(0);

		// Example 4: Filter by providers
		const toolsByProviders = await toolset.fetchTools({
			accountIds: ['your-bamboohr-account-id'],
			providers: ['bamboohr'],
		});
		expect(toolsByProviders.length).toBeGreaterThan(0);
		const providerToolNames = toolsByProviders.toArray().map((t) => t.name);
		expect(
			providerToolNames.every((name) => name.startsWith('bamboohr_') || name.startsWith('tool_')),
		).toBe(true);

		// Example 5: Filter by actions with exact match
		const toolsByActions = await toolset.fetchTools({
			accountIds: ['your-bamboohr-account-id'],
			actions: ['bamboohr_list_employees', 'bamboohr_create_employee'],
		});
		const actionToolNames = toolsByActions.toArray().map((t) => t.name);
		expect(actionToolNames).toContain('bamboohr_list_employees');
		expect(actionToolNames).toContain('bamboohr_create_employee');

		// Example 6: Filter by actions with glob pattern
		const toolsByGlobPattern = await toolset.fetchTools({
			accountIds: ['your-bamboohr-account-id'],
			actions: ['*_list_employees'],
		});
		const globToolNames = toolsByGlobPattern
			.toArray()
			.filter((t) => !t.name.startsWith('tool_'))
			.map((t) => t.name);
		expect(globToolNames).toContain('bamboohr_list_employees');

		// Execute a tool
		const tool = toolsByAccounts.getTool('bamboohr_list_employees');
		expect(tool).toBeDefined();

		const result = await tool!.execute({
			query: { limit: 5 },
		});
		expect(result.data).toBeDefined();
		expect(Array.isArray(result.data)).toBe(true);
	});
});
