/**
 * Benchmarks for ToolIndex (hybrid BM25 + TF-IDF search) - index construction
 * and search performance at various scales.
 */
import { bench, describe } from 'vitest';
import { ToolIndex } from './local-search';
import { BaseTool } from './tool';

function createMockTools(count: number): BaseTool[] {
	const verbs = ['create', 'update', 'delete', 'get', 'list', 'search'];
	const nouns = [
		'employee',
		'candidate',
		'contact',
		'document',
		'task',
		'event',
		'ticket',
		'account',
		'project',
		'invoice',
	];
	const integrations = [
		'bamboohr',
		'workday',
		'salesforce',
		'hubspot',
		'jira',
		'slack',
		'github',
		'zendesk',
		'greenhouse',
		'lever',
	];

	return Array.from({ length: count }, (_, i) => {
		const integration = integrations[i % integrations.length] ?? 'bamboohr';
		const verb = verbs[i % verbs.length] ?? 'create';
		const noun = nouns[Math.floor(i / verbs.length) % nouns.length] ?? 'employee';
		const name = `${integration}_${verb}_${noun}`;

		return new BaseTool(
			name,
			`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${noun} records in ${integration}`,
			{ type: 'object', properties: {} },
			{
				kind: 'http',
				method: verb === 'list' || verb === 'get' || verb === 'search' ? 'GET' : 'POST',
				url: `https://api.example.com/${noun}s`,
				bodyType: 'json',
				params: [],
			},
		);
	});
}

describe('ToolIndex - construction', () => {
	bench('construct and initialize index with 10 tools', async () => {
		const tools = createMockTools(10);
		const index = new ToolIndex(tools);
		// Await internal Orama promise to measure total initialization time
		// (synchronous TF-IDF build + async BM25 index construction)
		await index.search('', 1);
	});

	bench('construct and initialize index with 50 tools', async () => {
		const tools = createMockTools(50);
		const index = new ToolIndex(tools);
		await index.search('', 1);
	});

	bench('construct and initialize index with 200 tools', async () => {
		const tools = createMockTools(200);
		const index = new ToolIndex(tools);
		await index.search('', 1);
	});
});

describe('ToolIndex - search', () => {
	const smallIndex = new ToolIndex(createMockTools(10));
	const mediumIndex = new ToolIndex(createMockTools(50));
	const largeIndex = new ToolIndex(createMockTools(200));

	beforeAll(async () => {
		// Ensure all indexes are fully initialized before measuring search latency
		await Promise.all([
			smallIndex.search('', 1),
			mediumIndex.search('', 1),
			largeIndex.search('', 1),
		]);
	});

	bench('search in 10-tool index', async () => {
		await smallIndex.search('create employee', 5);
	});

	bench('search in 50-tool index', async () => {
		await mediumIndex.search('create employee', 5);
	});

	bench('search in 200-tool index', async () => {
		await largeIndex.search('create employee', 5);
	});
});
