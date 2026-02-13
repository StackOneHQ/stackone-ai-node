/**
 * Example demonstrating semantic search for AI-powered tool discovery.
 *
 * Semantic search understands natural language intent and synonyms, so queries like
 * "book a meeting" or "cancel an event" resolve to the right StackOne actions —
 * unlike keyword matching which requires exact tool names.
 *
 * This example uses a Calendly-linked account to demonstrate how semantic search
 * discovers scheduling, event, and organization management tools from natural
 * language queries.
 *
 * How Semantic Search Works (Overview)
 * =====================================
 *
 * The SDK provides three paths for semantic tool discovery, each with a different
 * trade-off between speed, filtering, and completeness:
 *
 * 1. searchTools(query)  — Full discovery (recommended for agent frameworks)
 *
 *    This is the method you should use when integrating with OpenAI, AI SDK,
 *    or any other agent framework. It works in these steps:
 *
 *    a) Fetch ALL tools from the user's linked accounts via MCP
 *    b) Extract the set of available connectors (e.g. {bamboohr, calendly})
 *    c) Query the semantic search API with the natural language query
 *    d) Filter results to only connectors the user has access to
 *    e) Deduplicate across API versions (keep highest score per action)
 *    f) Match results back to the fetched tool definitions
 *    g) Return a Tools collection sorted by relevance score
 *
 *    Key point: tools are fetched first, semantic search runs second, and only
 *    the intersection (tools the user has AND that match the query) is returned.
 *    If the semantic API is unavailable, the SDK falls back to local BM25+TF-IDF
 *    search automatically.
 *
 * 2. searchActionNames(query)  — Lightweight preview
 *
 *    Queries the semantic API directly and returns metadata (name, connector,
 *    score, description) without fetching full tool definitions. Useful for
 *    inspecting results before committing to a full fetch. When accountIds are
 *    provided, results are filtered to the user's available connectors.
 *
 * 3. utilityTools({ semanticClient })  — Agent-loop pattern
 *
 *    Creates tool_search and tool_execute utility tools that agents can call
 *    inside an agentic loop. The agent searches, inspects, and executes tools
 *    dynamically. Note: utility tool search queries the full backend catalog
 *    (all connectors), not just the user's linked accounts.
 *
 * This example is runnable with the following command:
 * ```bash
 * pnpm tsx examples/semantic-search.ts
 * ```
 *
 * Prerequisites:
 * - STACKONE_API_KEY environment variable set
 * - STACKONE_ACCOUNT_ID environment variable set (required for examples that fetch tools)
 * - At least one linked account in StackOne (this example uses Calendly)
 *
 * Note: searchActionNames() works with just STACKONE_API_KEY — no account ID needed.
 */

import process from 'node:process';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

// Read account IDs from environment — supports comma-separated values
const accountIds = (process.env.STACKONE_ACCOUNT_ID ?? '')
	.split(',')
	.map((id) => id.trim())
	.filter(Boolean);

/**
 * Example 1: Lightweight search returning action names and scores without fetching tools.
 *
 * searchActionNames() queries the semantic search API directly — it does NOT
 * need account IDs or MCP. When called without accountIds, results come from the
 * full StackOne catalog. When called with accountIds, results are filtered to
 * only connectors available in your linked accounts.
 */
const exampleSearchActionNames = async (): Promise<void> => {
	console.log('='.repeat(60));
	console.log('Example 1: searchActionNames() — lightweight discovery');
	console.log('='.repeat(60));
	console.log();

	const toolset = new StackOneToolSet({
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	const query = 'get user schedule';
	console.log(`Searching for: "${query}"`);
	console.log();

	const results = await toolset.searchActionNames(query, { topK: 5 });

	console.log(`Top ${results.length} matches from the full catalog:`);
	for (const r of results) {
		console.log(`  [${r.similarityScore.toFixed(2)}] ${r.actionName} (${r.connectorKey})`);
		console.log(`         ${r.description}`);
	}
	console.log();

	// Show filtering effect when account_ids are available
	if (accountIds.length > 0) {
		console.log(`Now filtering to your linked accounts (${accountIds.join(', ')})...`);
		const filtered = await toolset.searchActionNames(query, { accountIds, topK: 5 });
		console.log(`Filtered to ${filtered.length} matches (only your connectors):`);
		for (const r of filtered) {
			console.log(`  [${r.similarityScore.toFixed(2)}] ${r.actionName} (${r.connectorKey})`);
		}
	} else {
		console.log('Tip: Set STACKONE_ACCOUNT_ID to see results filtered to your linked connectors.');
	}
	console.log();
};

/**
 * Example 2: Full tool discovery using semantic search.
 *
 * searchTools() is the recommended way to use semantic search. It:
 * 1. Queries the semantic search API with your natural language query
 * 2. Fetches tool definitions from your linked accounts via MCP
 * 3. Matches semantic results to available tools
 * 4. Returns a Tools collection ready for any framework (.toOpenAI(), .toAISDK(), etc.)
 */
const exampleSearchTools = async (): Promise<void> => {
	console.log('='.repeat(60));
	console.log('Example 2: searchTools() — full tool discovery');
	console.log('='.repeat(60));
	console.log();

	const toolset = new StackOneToolSet({
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	const query = 'cancel an event';
	console.log(`Step 1: Searching for "${query}" via semantic search...`);
	console.log();

	const tools = await toolset.searchTools(query, { accountIds, topK: 5 });

	const connectors = new Set(tools.toArray().map((t) => t.name.split('_')[0]));
	console.log(
		`Found ${tools.length} tools from your linked account(s) (${[...connectors].sort().join(', ')}):`,
	);
	for (const tool of tools.toArray()) {
		console.log(`  - ${tool.name}`);
		console.log(`    ${tool.description}`);
	}
	console.log();

	// Show OpenAI conversion
	console.log('Step 2a: Converting to OpenAI function-calling format...');
	const openaiTools = tools.toOpenAI();
	console.log(`Created ${openaiTools.length} OpenAI function definitions:`);
	for (const fn of openaiTools) {
		const func = fn.function;
		const paramNames = Object.keys(
			(func.parameters as Record<string, Record<string, unknown>>)?.properties ?? {},
		);
		console.log(
			`  - ${func.name}(${paramNames.slice(0, 3).join(', ')}${paramNames.length > 3 ? '...' : ''})`,
		);
	}
	console.log();

	// Show AI SDK conversion
	console.log('Step 2b: Converting to Vercel AI SDK format...');
	const aiSdkTools = await tools.toAISDK();
	const aiSdkToolNames = Object.keys(aiSdkTools);
	console.log(`Created ${aiSdkToolNames.length} AI SDK tool definitions:`);
	for (const name of aiSdkToolNames) {
		const tool = aiSdkTools[name];
		console.log(`  - ${name} (executable: ${typeof tool.execute === 'function'})`);
	}
	console.log();
};

/**
 * Example 3: Semantic search filtered by connector.
 *
 * Use the connector parameter to scope results to a specific provider,
 * for example when you know the user works with Calendly.
 */
const exampleSearchToolsWithConnector = async (): Promise<void> => {
	console.log('='.repeat(60));
	console.log('Example 3: searchTools() with connector filter');
	console.log('='.repeat(60));
	console.log();

	const toolset = new StackOneToolSet({
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	const query = 'book a meeting';
	const connector = 'calendly';
	console.log(`Searching for "${query}" filtered to connector="${connector}"...`);
	console.log();

	const tools = await toolset.searchTools(query, {
		connector,
		accountIds,
		topK: 3,
	});

	console.log(`Found ${tools.length} ${connector} tools:`);
	for (const tool of tools.toArray()) {
		console.log(`  - ${tool.name}`);
		console.log(`    ${tool.description}`);
	}
	console.log();
};

/**
 * Example 4: Using utility tools with semantic search for agent loops.
 *
 * When building agent loops (search -> select -> execute), pass
 * semanticClient to utilityTools() to upgrade tool_search from
 * local BM25+TF-IDF to cloud-based semantic search.
 *
 * Note: tool_search queries the full backend catalog (all connectors),
 * not just the ones in your linked accounts.
 */
const exampleUtilityToolsSemantic = async (): Promise<void> => {
	console.log('='.repeat(60));
	console.log('Example 4: Utility tools with semantic search');
	console.log('='.repeat(60));
	console.log();

	const toolset = new StackOneToolSet({
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	console.log('Step 1: Fetching tools from your linked accounts via MCP...');
	const tools = await toolset.fetchTools({ accountIds });
	console.log(`Loaded ${tools.length} tools.`);
	console.log();

	console.log('Step 2: Creating utility tools with semantic search enabled...');
	console.log('  Passing semanticClient upgrades tool_search from local keyword');
	console.log('  matching (BM25+TF-IDF) to cloud-based semantic vector search.');
	const utility = await tools.utilityTools({ semanticClient: toolset.semanticClient });

	const searchTool = utility.getTool('tool_search');
	if (searchTool) {
		const searchQuery = 'cancel an event or meeting';
		console.log();
		console.log(`Step 3: Calling tool_search with query="${searchQuery}"...`);
		console.log('  (This searches the full StackOne catalog, not just your linked tools)');
		console.log();
		const result = await searchTool.execute({ query: searchQuery, limit: 5 });
		const toolsData =
			(result as { tools?: Array<{ name: string; description: string; score: number }> }).tools ??
			[];
		console.log(`tool_search returned ${toolsData.length} results:`);
		for (const toolInfo of toolsData) {
			console.log(`  [${toolInfo.score.toFixed(2)}] ${toolInfo.name}`);
			console.log(`         ${toolInfo.description}`);
		}
	}
	console.log();
};

/**
 * Example 5: Complete agent loop using semantic search with OpenAI.
 *
 * Demonstrates the full pattern for building an AI agent that
 * discovers tools via semantic search and executes them via OpenAI.
 */
const exampleOpenAIAgentLoop = async (): Promise<void> => {
	console.log('='.repeat(60));
	console.log('Example 5: OpenAI agent loop with semantic search');
	console.log('='.repeat(60));
	console.log();

	let OpenAI: typeof import('openai').default;
	try {
		const mod = await import('openai');
		OpenAI = mod.default;
	} catch {
		console.log('Skipped: OpenAI library not installed. Install with: pnpm add openai');
		console.log();
		return;
	}

	if (!process.env.OPENAI_API_KEY) {
		console.log('Skipped: Set OPENAI_API_KEY to run this example.');
		console.log();
		return;
	}

	const client = new OpenAI();
	const toolset = new StackOneToolSet({
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	const query = 'list upcoming events';
	console.log(`Step 1: Discovering tools for "${query}" via semantic search...`);
	const tools = await toolset.searchTools(query, { accountIds, topK: 3 });
	console.log(`Found ${tools.length} tools:`);
	for (const tool of tools.toArray()) {
		console.log(`  - ${tool.name}`);
	}
	console.log();

	console.log('Step 2: Sending tools to OpenAI as function definitions...');
	const openaiTools = tools.toOpenAI();

	const response = await client.chat.completions.create({
		model: 'gpt-4o-mini',
		messages: [
			{ role: 'system', content: 'You are a helpful scheduling assistant.' },
			{ role: 'user', content: 'Can you show me my upcoming events?' },
		],
		tools: openaiTools,
		tool_choice: 'auto',
	});

	const message = response.choices[0]?.message;
	if (message?.tool_calls) {
		console.log('Step 3: OpenAI chose to call these tools:');
		for (const toolCall of message.tool_calls) {
			if (toolCall.type !== 'function') continue;
			console.log(`  - ${toolCall.function.name}(${toolCall.function.arguments})`);

			const tool = tools.getTool(toolCall.function.name);
			if (tool) {
				const result = await tool.execute(JSON.parse(toolCall.function.arguments));
				console.log(
					`    Response keys: ${typeof result === 'object' && result !== null ? Object.keys(result).join(', ') : typeof result}`,
				);
			}
		}
	} else {
		console.log(`OpenAI responded with text: ${message?.content}`);
	}
	console.log();
};

/**
 * Example 6: Using semantic search with the Vercel AI SDK.
 *
 * Demonstrates the full pattern: discover tools via semantic search,
 * convert them to AI SDK format, and pass them to generateText().
 */
const exampleSearchToolsAISDK = async (): Promise<void> => {
	console.log('='.repeat(60));
	console.log('Example 6: Semantic search with Vercel AI SDK');
	console.log('='.repeat(60));
	console.log();

	let generateText: typeof import('ai').generateText;
	let stepCountIs: typeof import('ai').stepCountIs;
	let openai: typeof import('@ai-sdk/openai').openai;
	try {
		const aiMod = await import('ai');
		generateText = aiMod.generateText;
		stepCountIs = aiMod.stepCountIs;
		const openaiMod = await import('@ai-sdk/openai');
		openai = openaiMod.openai;
	} catch {
		console.log('Skipped: ai and @ai-sdk/openai libraries not installed.');
		console.log('Install with: pnpm add ai @ai-sdk/openai');
		console.log();
		return;
	}

	if (!process.env.OPENAI_API_KEY) {
		console.log('Skipped: Set OPENAI_API_KEY to run this example.');
		console.log();
		return;
	}

	const toolset = new StackOneToolSet({
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	const query = 'list upcoming events';
	console.log(`Step 1: Discovering tools for "${query}" via semantic search...`);
	const tools = await toolset.searchTools(query, { accountIds, topK: 3 });
	console.log(`Found ${tools.length} tools:`);
	for (const tool of tools.toArray()) {
		console.log(`  - ${tool.name}`);
	}
	console.log();

	console.log('Step 2: Converting to AI SDK format...');
	const aiSdkTools = await tools.toAISDK();
	console.log(`Created ${Object.keys(aiSdkTools).length} AI SDK tool definitions`);
	console.log();

	console.log('Step 3: Running generateText() with AI SDK...');
	const { text } = await generateText({
		model: openai('gpt-4o-mini'),
		tools: aiSdkTools,
		prompt: 'Can you show me my upcoming events?',
		stopWhen: stepCountIs(3),
	});

	console.log(`AI response: ${text}`);
	console.log();
};

// Main execution
const main = async (): Promise<void> => {
	console.log();
	console.log('############################################################');
	console.log('#   StackOne AI SDK — Semantic Search Examples              #');
	console.log('############################################################');
	console.log();

	// --- Examples that work without account IDs ---
	await exampleSearchActionNames();

	// --- Examples that require account IDs (MCP needs x-account-id) ---
	if (accountIds.length === 0) {
		console.log('='.repeat(60));
		console.log('Remaining examples require STACKONE_ACCOUNT_ID');
		console.log('='.repeat(60));
		console.log();
		console.log('Set STACKONE_ACCOUNT_ID (comma-separated for multiple) to run');
		console.log('examples that fetch full tool definitions from your linked accounts:');
		console.log('  - searchTools() with natural language queries');
		console.log('  - searchTools() with connector filter');
		console.log('  - Utility tools with semantic search');
		console.log('  - OpenAI agent loop');
		return;
	}

	await exampleSearchTools();
	await exampleSearchToolsWithConnector();
	await exampleUtilityToolsSemantic();
	await exampleOpenAIAgentLoop();
	await exampleSearchToolsAISDK();

	console.log('############################################################');
	console.log('#   All examples completed!                                 #');
	console.log('############################################################');
};

// Run if this file is executed directly
if (import.meta.main) {
	await main();
}

export {
	exampleSearchActionNames,
	exampleSearchTools,
	exampleSearchToolsWithConnector,
	exampleUtilityToolsSemantic,
	exampleOpenAIAgentLoop,
	exampleSearchToolsAISDK,
};
