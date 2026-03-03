/**
 * This example demonstrates how to use semantic search for dynamic tool discovery.
 * Semantic search allows AI agents to find relevant tools based on natural language queries
 * using StackOne's search API with local BM25+TF-IDF fallback.
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

	// Initialize StackOne — reads STACKONE_API_KEY and STACKONE_ACCOUNT_ID from env
	const toolset = new StackOneToolSet();

	// Search for relevant tools using semantic search
	const tools = await toolset.searchTools('manage employee records and time off', {
		topK: 5,
		search: 'auto', // tries semantic API first, falls back to local search
	});

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

	const toolset = new StackOneToolSet();

	// Get a reusable search tool
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

	const toolset = new StackOneToolSet();

	// Use local search mode (BM25 + TF-IDF, no API call to semantic search endpoint)
	const tools = await toolset.searchTools('create time off request', {
		search: 'local',
		topK: 3,
	});

	console.log(`Found ${tools.length} tools using local search:`);
	for (const tool of tools) {
		console.log(`  - ${tool.name}: ${tool.description}`);
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
	} catch (error) {
		console.error('Error running examples:', error);
	}
};

await main();
