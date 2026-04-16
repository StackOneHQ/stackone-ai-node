/**
 * Tool discovery with the StackOne AI SDK.
 *
 * Covers: direct fetch, semantic search, local search, auto search,
 * and the search-and-execute pattern.
 *
 * Run with:
 *   STACKONE_API_KEY=xxx STACKONE_ACCOUNT_ID=xxx npx tsx examples/search-tools.ts
 */

import process from 'node:process';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
const accountId = process.env.STACKONE_ACCOUNT_ID;

if (!apiKey) {
	console.error('Set STACKONE_API_KEY to run this example.');
	process.exit(1);
}
if (!accountId) {
	console.error('Set STACKONE_ACCOUNT_ID to run this example.');
	process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Direct fetch — no search, just action-pattern filtering
// ---------------------------------------------------------------------------
async function directFetch(): Promise<void> {
	console.log('\n=== 1. Direct Fetch (action filters) ===\n');

	const toolset = new StackOneToolSet({ apiKey, accountId });

	// Glob pattern: fetch only Workday tools
	const tools = await toolset.fetchTools({ actions: ['workday_*'] });
	const names = tools.toArray().map((t) => t.name);
	console.log(`  Fetched ${names.length} tools matching "workday_*"`);
	console.log(`  First 5: ${names.slice(0, 5).join(', ')}`);
}

// ---------------------------------------------------------------------------
// 2. Semantic search — remote embedding-based similarity
// ---------------------------------------------------------------------------
async function semanticSearch(): Promise<void> {
	console.log('\n=== 2. Semantic Search ===\n');

	const toolset = new StackOneToolSet({
		apiKey,
		accountId,
		search: { method: 'semantic', topK: 5 },
	});

	const tools = await toolset.searchTools('manage employees');
	const names = tools.toArray().map((t) => t.name);
	console.log(`  Query: "manage employees" -> ${names.length} results`);
	for (const name of names) {
		console.log(`    - ${name}`);
	}
}

// ---------------------------------------------------------------------------
// 3. Local search — BM25 + TF-IDF, no API call to semantic endpoint
// ---------------------------------------------------------------------------
async function localSearch(): Promise<void> {
	console.log('\n=== 3. Local Search (BM25 + TF-IDF) ===\n');

	const toolset = new StackOneToolSet({
		apiKey,
		accountId,
		search: { method: 'local', topK: 5 },
	});

	const tools = await toolset.searchTools('time off requests', { search: 'local' });
	const names = tools.toArray().map((t) => t.name);
	console.log(`  Query: "time off requests" -> ${names.length} results`);
	for (const name of names) {
		console.log(`    - ${name}`);
	}
}

// ---------------------------------------------------------------------------
// 4. Auto search + getSearchTool() callable
//    Tries semantic first, falls back to local if the API is unavailable.
// ---------------------------------------------------------------------------
async function autoSearchWithCallable(): Promise<void> {
	console.log('\n=== 4. Auto Search + getSearchTool() Callable ===\n');

	const toolset = new StackOneToolSet({
		apiKey,
		accountId,
		search: { method: 'auto', topK: 5 },
	});

	// 4a. Direct searchTools() with auto mode
	const tools = await toolset.searchTools('send a message', { search: 'auto' });
	console.log(`  searchTools("send a message") -> ${tools.length} results`);

	// 4b. getSearchTool() — a callable wrapper for agent loops
	const searchTool = toolset.getSearchTool();

	const queries = ['cancel an event', 'list employees', 'create a job posting'];
	for (const query of queries) {
		const results = await searchTool.search(query, { topK: 3 });
		const names = results.toArray().map((t) => t.name);
		console.log(`  searchTool.search("${query}") -> ${names.join(', ') || '(none)'}`);
	}

	// 4c. Constructor topK vs per-call override
	console.log('\n  -- topK override --');
	const defaultResults = await toolset.searchTools('manage employee records');
	console.log(`  Constructor topK=5: got ${defaultResults.length} tools`);

	const overrideResults = await toolset.searchTools('manage employee records', { topK: 10 });
	console.log(`  Per-call topK=10:   got ${overrideResults.length} tools`);
}

// ---------------------------------------------------------------------------
// 5. Search & execute mode — getTools() with Vercel AI SDK
//    The LLM receives tool_search + tool_execute and discovers tools on demand.
// ---------------------------------------------------------------------------
async function searchAndExecute(): Promise<void> {
	console.log('\n=== 5. Search & Execute (Vercel AI SDK) ===\n');

	// Dynamic imports — these are optional peer dependencies
	const [{ openai }, { generateText, stepCountIs }] = await Promise.all([
		import('@ai-sdk/openai'),
		import('ai'),
	]);

	const toolset = new StackOneToolSet({
		apiKey,
		accountId,
		search: { method: 'semantic', topK: 3 },
		timeout: 120_000, // increase for slow providers (default: 60s)
	});

	// getTools() returns tool_search + tool_execute as a Tools collection
	const tools = toolset.getTools({ accountIds: [accountId as string] });
	console.log('  Tools provided to model: tool_search, tool_execute');

	const { text, steps } = await generateText({
		model: openai('gpt-5.1'),
		tools: await tools.toAISDK(),
		prompt: 'List employees and return a short summary.',
		stopWhen: stepCountIs(5),
	});

	console.log(`  Model completed in ${steps.length} step(s)`);
	console.log(`  Response: ${text.slice(0, 200)}${text.length > 200 ? '...' : ''}`);
}

// ---------------------------------------------------------------------------
// Main — run each section in order
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
	await directFetch();
	await semanticSearch();
	await localSearch();
	await autoSearchWithCallable();

	// Section 5 requires @ai-sdk/openai and ai packages + an OPENAI_API_KEY.
	// Skip gracefully if not available.
	try {
		await searchAndExecute();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (message.includes('Cannot find module') || message.includes('Cannot find package')) {
			console.log('\n=== 5. Search & Execute (Vercel AI SDK) ===\n');
			console.log('  Skipped: install @ai-sdk/openai and ai to run this section.');
		} else {
			throw error;
		}
	}
}

await main();
