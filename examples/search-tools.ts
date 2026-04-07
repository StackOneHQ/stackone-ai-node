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

const accountId = process.env.STACKONE_ACCOUNT_ID;

// --- Example 1: getSearchTool() callable ---
console.log('=== getSearchTool() callable ===\n');

const toolset = new StackOneToolSet({ search: {} });
const searchTool = toolset.getSearchTool();

const queries = ['cancel an event', 'list employees', 'send a message'];
for (const query of queries) {
	const tools = await searchTool.search(query, {
		topK: 3,
		accountIds: accountId ? [accountId] : undefined,
	});
	const names = tools.toArray().map((t) => t.name);
	console.log(`  "${query}" -> ${names.join(', ') || '(none)'}`);
}

// --- Example 2: Constructor topK vs per-call override ---
console.log('\n=== Constructor topK vs per-call override ===\n');

const toolset3 = new StackOneToolSet({ search: { topK: 3 } });
const toolset10 = new StackOneToolSet({ search: { topK: 10 } });

const query = 'manage employee records';
const opts = accountId ? { accountIds: [accountId] } : {};

const tools3 = await toolset3.searchTools(query, opts);
console.log(`Constructor topK=3: got ${tools3.length} tools`);

const tools10 = await toolset10.searchTools(query, opts);
console.log(`Constructor topK=10: got ${tools10.length} tools`);

// Per-call override: constructor says 3 but this call says 10
const toolsOverride = await toolset3.searchTools(query, { ...opts, topK: 10 });
console.log(`Per-call topK=10 (overrides constructor 3): got ${toolsOverride.length} tools`);
