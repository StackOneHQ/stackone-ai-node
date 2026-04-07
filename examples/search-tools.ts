/**
 * Search tool patterns: callable wrapper and config overrides.
 *
 * For full agent execution, see agent-tool-search.ts.
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

// --- Example 1: getSearchTool() callable ---
console.log('=== getSearchTool() callable ===\n');

const toolset = new StackOneToolSet({ apiKey, accountId, search: {} });
const searchTool = toolset.getSearchTool();

const queries = ['cancel an event', 'list employees', 'send a message'];
for (const query of queries) {
	const tools = await searchTool.search(query, { topK: 3 });
	const names = tools.toArray().map((t) => t.name);
	console.log(`  "${query}" -> ${names.join(', ') || '(none)'}`);
}

// --- Example 2: Constructor topK vs per-call override ---
console.log('\n=== Constructor topK vs per-call override ===\n');

const toolset3 = new StackOneToolSet({ apiKey, accountId, search: { topK: 3 } });

const query = 'manage employee records';

const tools3 = await toolset3.searchTools(query);
console.log(`Constructor topK=3: got ${tools3.length} tools`);

const toolsOverride = await toolset3.searchTools(query, { topK: 10 });
console.log(`Per-call topK=10 (overrides constructor 3): got ${toolsOverride.length} tools`);
