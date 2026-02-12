/**
 * E2E test for semantic-search.ts example
 *
 * Tests the complete flow of semantic search using Calendly-themed tools:
 * searchActionNames, searchTools, searchTools with connector, and utility
 * tools with semantic search.
 */

import { http, HttpResponse } from 'msw';
import { server } from '../mocks/node';
import { type SemanticSearchResult, StackOneToolSet } from '../src';

/** Helper to create a semantic search result */
function semanticResult(
	actionName: string,
	connectorKey: string,
	similarityScore: number,
	description = `${actionName} description`,
): Record<string, unknown> {
	return {
		action_name: actionName,
		connector_key: connectorKey,
		similarity_score: similarityScore,
		label: actionName.replace(/_/g, ' '),
		description,
	};
}

/** Set up a mock handler for the semantic search API */
function mockSemanticSearch(results: Record<string, unknown>[]): void {
	server.use(
		http.post('https://api.stackone.com/actions/search', async ({ request }) => {
			const body = (await request.json()) as { query: string; connector?: string };
			const filtered = body.connector
				? results.filter((r) => r.connector_key === body.connector)
				: results;
			return HttpResponse.json({
				results: filtered,
				total_count: filtered.length,
				query: body.query,
			});
		}),
	);
}

describe('semantic-search example e2e', () => {
	const semanticResults = [
		semanticResult(
			'calendly_1.0.0_calendly_list_events_global',
			'calendly',
			0.95,
			'List scheduled events from Calendly',
		),
		semanticResult(
			'calendly_1.0.0_calendly_cancel_event_global',
			'calendly',
			0.88,
			'Cancel a scheduled event in Calendly',
		),
		semanticResult(
			'calendly_1.0.0_calendly_create_scheduling_link_global',
			'calendly',
			0.82,
			'Create a new scheduling link in Calendly',
		),
		semanticResult(
			'calendly_1.0.0_calendly_get_event_global',
			'calendly',
			0.75,
			'Get details of a specific event from Calendly',
		),
	];

	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('searchActionNames returns action names and scores without fetching tools', async () => {
		mockSemanticSearch(semanticResults);

		const toolset = new StackOneToolSet({
			baseUrl: 'https://api.stackone.com',
		});

		const results = await toolset.searchActionNames('get user schedule', { topK: 5 });

		expect(results.length).toBeGreaterThan(0);
		for (const r of results) {
			expect(r.actionName).toBeDefined();
			expect(r.connectorKey).toBeDefined();
			expect(r.similarityScore).toBeGreaterThan(0);
		}
	});

	it('searchActionNames filters to connectors available in linked accounts', async () => {
		mockSemanticSearch(semanticResults);

		const toolset = new StackOneToolSet({
			baseUrl: 'https://api.stackone.com',
		});

		// With accountIds, results are filtered to connectors in those accounts
		const results = await toolset.searchActionNames('cancel an event', {
			accountIds: ['your-calendly-account-id'],
			topK: 5,
		});

		expect(results.length).toBeGreaterThan(0);
		// All results should be for calendly since that's the only connector in the account
		for (const r of results) {
			expect(r.connectorKey).toBe('calendly');
		}
	});

	it('searchTools returns a Tools collection with matched tools', async () => {
		mockSemanticSearch(semanticResults);

		const toolset = new StackOneToolSet({
			baseUrl: 'https://api.stackone.com',
		});

		const tools = await toolset.searchTools('cancel an event', {
			accountIds: ['your-calendly-account-id'],
			topK: 5,
		});

		expect(tools.length).toBeGreaterThan(0);

		// Tools should be convertible to OpenAI format
		const openaiTools = tools.toOpenAI();
		expect(openaiTools.length).toBeGreaterThan(0);
		expect(openaiTools[0]).toHaveProperty('type', 'function');

		// All matched tools should be calendly tools
		for (const tool of tools.toArray()) {
			expect(tool.name).toMatch(/^calendly_/);
		}
	});

	it('searchTools with connector filter scopes to a specific provider', async () => {
		mockSemanticSearch(semanticResults);

		const toolset = new StackOneToolSet({
			baseUrl: 'https://api.stackone.com',
		});

		const tools = await toolset.searchTools('book a meeting', {
			connector: 'calendly',
			accountIds: ['your-calendly-account-id'],
			topK: 3,
		});

		expect(tools.length).toBeGreaterThan(0);
		for (const tool of tools.toArray()) {
			expect(tool.name.startsWith('calendly_')).toBe(true);
		}
	});

	it('utility tools with semantic search creates semantic tool_search', async () => {
		mockSemanticSearch(semanticResults);

		const toolset = new StackOneToolSet({
			baseUrl: 'https://api.stackone.com',
		});

		const allTools = await toolset.fetchTools({
			accountIds: ['your-calendly-account-id'],
		});

		const utility = await allTools.utilityTools({
			semanticClient: toolset.semanticClient,
		});

		// Should have tool_search and tool_execute
		const searchTool = utility.getTool('tool_search');
		const executeTool = utility.getTool('tool_execute');
		expect(searchTool).toBeDefined();
		expect(executeTool).toBeDefined();

		// tool_search with semantic should have a connector parameter
		const schema = searchTool!.parameters;
		expect(schema.properties).toHaveProperty('connector');

		// Execute semantic tool_search
		const result = await searchTool!.execute({ query: 'cancel an event or meeting', limit: 5 });
		const tools = (result as { tools?: Array<{ name: string; score: number }> }).tools;
		expect(tools).toBeDefined();
		expect(tools!.length).toBeGreaterThan(0);
	});

	it('searchActionNames normalizes and deduplicates action names', async () => {
		// Provide multiple API versions of the same action
		const dupeResults = [
			semanticResult('calendly_1.0.0_calendly_list_events_global', 'calendly', 0.95),
			semanticResult('calendly_2.0.0_calendly_list_events_global', 'calendly', 0.9),
			semanticResult('calendly_1.0.0_calendly_cancel_event_global', 'calendly', 0.85),
		];
		mockSemanticSearch(dupeResults);

		const toolset = new StackOneToolSet({
			baseUrl: 'https://api.stackone.com',
		});

		const results = await toolset.searchActionNames('events', { topK: 10 });

		// Should be deduplicated — only one "calendly_list_events" and one "calendly_cancel_event"
		const actionNames = results.map((r: SemanticSearchResult) => r.actionName);
		const uniqueNames = new Set(actionNames);
		expect(uniqueNames.size).toBe(actionNames.length);
		expect(actionNames).toContain('calendly_list_events');
		expect(actionNames).toContain('calendly_cancel_event');
	});
});
