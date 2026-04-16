/**
 * Authentication and account management patterns.
 *
 * Shows every way to configure API keys and account IDs with the Node SDK.
 *
 * Run with:
 *   STACKONE_API_KEY=xxx STACKONE_ACCOUNT_ID=xxx npx tsx examples/auth-management.ts
 */

import process from 'node:process';
import { StackOneToolSet } from '@stackone/ai';

if (!process.env.STACKONE_API_KEY) {
	console.error('Set STACKONE_API_KEY to run this example.');
	process.exit(1);
}

// --- 1. API Key setup ---
const apiKeyFromEnv = async (): Promise<void> => {
	console.log('=== 1a. API Key from environment ===\n');

	// Reads STACKONE_API_KEY and STACKONE_ACCOUNT_ID from env automatically
	const toolset = new StackOneToolSet();
	const tools = await toolset.fetchTools();
	console.log(`  Loaded ${tools.toOpenAI().length} tools using env API key\n`);
};

const apiKeyExplicit = async (): Promise<void> => {
	console.log('=== 1b. Explicit API key ===\n');

	const toolset = new StackOneToolSet({ apiKey: process.env.STACKONE_API_KEY });
	const tools = await toolset.fetchTools();
	console.log(`  Loaded ${tools.toOpenAI().length} tools using explicit API key\n`);
};

// --- 2. Account ID from environment ---
const accountIdFromEnv = async (): Promise<void> => {
	console.log('=== 2. Account ID from environment ===\n');

	// The Node SDK reads STACKONE_ACCOUNT_ID from env automatically
	const accountId = process.env.STACKONE_ACCOUNT_ID;
	console.log(`  STACKONE_ACCOUNT_ID is ${accountId ? 'set' : 'not set'}`);

	const toolset = new StackOneToolSet();
	const tools = await toolset.fetchTools();
	console.log(`  Loaded ${tools.toOpenAI().length} tools for account from env\n`);
};

// --- 3. Account ID in constructor ---
const accountIdInConstructor = async (): Promise<void> => {
	console.log('=== 3. Account ID in constructor ===\n');

	const accountId = process.env.STACKONE_ACCOUNT_ID ?? 'my-account';
	const toolset = new StackOneToolSet({ accountId });
	const tools = await toolset.fetchTools();
	console.log(`  Loaded ${tools.toOpenAI().length} tools for configured account\n`);
};

// --- 4. setAccounts() — set accounts globally ---
const setAccountsGlobally = async (): Promise<void> => {
	console.log('=== 4. setAccounts() — global account list ===\n');

	const accountId = process.env.STACKONE_ACCOUNT_ID ?? 'my-account';
	const toolset = new StackOneToolSet();
	toolset.setAccounts([accountId]);
	console.log('  Called setAccounts() with configured account');

	// Subsequent fetchTools uses the globally set accounts
	const tools = await toolset.fetchTools();
	console.log(`  Loaded ${tools.toOpenAI().length} tools after setAccounts()\n`);
};

// --- 5. Per-tool account override ---
const perToolOverride = async (): Promise<void> => {
	console.log('=== 5. Per-tool account override ===\n');

	const toolset = new StackOneToolSet();
	const tools = await toolset.fetchTools();

	// Override account on a single tool (use getStackOneTool for account methods)
	try {
		const tool = tools.getStackOneTool('workday_list_workers');
		tool.setAccountId('per-tool-account');
		const current = tool.getAccountId();
		console.log(`  Single tool account: "${current}"\n`);
	} catch {
		console.log('  (workday_list_workers not available — skipping single-tool demo)\n');
	}
};

// --- Run all sections ---
await apiKeyFromEnv();
await apiKeyExplicit();
await accountIdFromEnv();
await accountIdInConstructor();
await setAccountsGlobally();
await perToolOverride();

console.log('Done — all auth patterns demonstrated.');
