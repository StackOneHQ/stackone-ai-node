/**
 * This example demonstrates how to use semantic search for dynamic tool discovery.
 * Semantic search allows AI agents to find relevant tools based on natural language queries
 * using StackOne's search API with local BM25+TF-IDF fallback.
 *
 * Search config can be set at the constructor level via `{ search: SearchConfig }` and
 * overridden per-call on `searchTools()`. Pass `{ search: null }` to disable search.
 * SearchConfig: { method?: 'auto' | 'semantic' | 'local', topK?: number, minSimilarity?: number }
 *
 * @example
 * ```bash
 * # Run with required environment variables:
 * STACKONE_API_KEY=your-key OPENAI_API_KEY=your-key npx tsx examples/search-tools.ts
 * ```
 */

import process from 'node:process';
import { openai } from '@ai-sdk/openai';
import { StackOneToolSet } from '@stackone/ai';
import { generateText, stepCountIs } from 'ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

/**
 * Example 1: Search for tools with semantic search and use with AI SDK
 */
const searchToolsWithAISDK = async (): Promise<void> => {
	console.log('Example 1: Semantic tool search with AI SDK\n');

	// Configure search at the constructor level — applies to all searchTools() calls
	const toolset = new StackOneToolSet({ search: { method: 'semantic', topK: 5 } });

	// searchTools() inherits the constructor's search config
	const tools = await toolset.searchTools('manage employee records and time off');

	console.log(`Found ${tools.length} relevant tools`);

	// Convert to AI SDK format and use with generateText
	const aiSdkTools = await tools.toAISDK();

	const { text, toolCalls } = await generateText({
		model: openai('gpt-5.1'),
		tools: aiSdkTools,
		prompt: `List the first 5 employees from the HR system.`,
		stopWhen: stepCountIs(3),
	});

	console.log('AI Response:', text);
	console.log('\nTool calls made:', toolCalls?.map((call) => call.toolName).join(', '));
};

/**
 * Example 2: Using SearchTool for agent loops
 */
const searchToolWithAgentLoop = async (): Promise<void> => {
	console.log('\nExample 2: SearchTool for agent loops\n');

	// Default constructor — search enabled with method: 'auto'
	const toolset = new StackOneToolSet();

	// Per-call options override constructor defaults when needed
	const searchTool = toolset.getSearchTool({ search: 'auto' });

	// In an agent loop, search for tools as needed
	const queries = ['create a new employee', 'list job candidates', 'send a message to a channel'];

	for (const query of queries) {
		const tools = await searchTool.search(query, { topK: 3 });
		const toolNames = tools.toArray().map((t) => t.name);
		console.log(`Query: "${query}" -> Found: ${toolNames.join(', ') || '(none)'}`);
	}
};

/**
 * Example 3: Lightweight action name search
 */
const searchActionNames = async (): Promise<void> => {
	console.log('\nExample 3: Lightweight action name search\n');

	const toolset = new StackOneToolSet();

	// Search for action names without fetching full tool definitions
	const results = await toolset.searchActionNames('manage employees', {
		topK: 5,
	});

	console.log('Search results:');
	for (const result of results) {
		console.log(
			`  - ${result.actionName} (${result.connectorKey}): score=${result.similarityScore.toFixed(2)}`,
		);
	}

	// Then fetch specific tools based on the results
	if (results.length > 0) {
		const topActions = results.filter((r) => r.similarityScore > 0.7).map((r) => r.actionName);
		console.log(`\nFetching tools for top actions: ${topActions.join(', ')}`);

		const tools = await toolset.fetchTools({ actions: topActions });
		console.log(`Fetched ${tools.length} tools`);
	}
};

/**
 * Example 4: Local-only search (no API call)
 */
const localSearchOnly = async (): Promise<void> => {
	console.log('\nExample 4: Local-only BM25+TF-IDF search\n');

	// Set search method at constructor level — all searchTools() calls use local search
	const toolset = new StackOneToolSet({ search: { method: 'local', topK: 3 } });

	// searchTools() inherits local search config from the constructor
	const tools = await toolset.searchTools('create time off request');

	console.log(`Found ${tools.length} tools using local search:`);
	for (const tool of tools) {
		console.log(`  - ${tool.name}: ${tool.description}`);
	}
};

/**
 * Example 5: Constructor-level topK vs per-call override
 */
const topKConfig = async (): Promise<void> => {
	console.log('\nExample 5: topK at constructor vs per-call\n');

	// Constructor-level topK — all calls default to returning 3 results
	const toolset = new StackOneToolSet({ search: { topK: 3 } });

	const query = 'manage employee records';
	console.log(`Constructor topK=3: searching for "${query}"`);
	const toolsDefault = await toolset.searchTools(query);
	console.log(`  Got ${toolsDefault.length} tools (constructor default)`);
	for (const tool of toolsDefault) {
		console.log(`    - ${tool.name}`);
	}

	// Per-call override — this single call returns up to 10 results
	console.log('\nPer-call topK=10: overriding constructor default');
	const toolsOverride = await toolset.searchTools(query, { topK: 10 });
	console.log(`  Got ${toolsOverride.length} tools (per-call override)`);
	for (const tool of toolsOverride) {
		console.log(`    - ${tool.name}`);
	}
};

// Main execution
const main = async (): Promise<void> => {
	try {
		if (process.env.OPENAI_API_KEY) {
			await searchToolsWithAISDK();
		} else {
			console.log('OPENAI_API_KEY not found, skipping AI SDK example\n');
		}

		await searchToolWithAgentLoop();
		await searchActionNames();
		await localSearchOnly();
		await topKConfig();
	} catch (error) {
		console.error('Error running examples:', error);
	}
};

await main();
