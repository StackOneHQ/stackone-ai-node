/**
 * Example: fetch the latest StackOne tool catalog with filtering options.
 *
 * Set `STACKONE_API_KEY` (and optionally `STACKONE_BASE_URL`) before running.
 * By default the script exits early in test environments where a real key is
 * not available.
 */

import process from 'node:process';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

const toolset = new StackOneToolSet({
	baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
});

// Example 1: Fetch all tools
console.log('\n=== Example 1: Fetch all tools ===');
const allTools = await toolset.fetchTools();
console.log(`Loaded ${allTools.length} tools`);

// Example 2: Filter by account IDs using setAccounts()
console.log('\n=== Example 2: Filter by account IDs (using setAccounts) ===');
toolset.setAccounts(['account-123', 'account-456']);
const toolsByAccounts = await toolset.fetchTools();
console.log(`Loaded ${toolsByAccounts.length} tools for specified accounts`);

// Example 3: Filter by account IDs using options
console.log('\n=== Example 3: Filter by account IDs (using options) ===');
const toolsByAccountsOption = await toolset.fetchTools({
	accountIds: ['account-789'],
});
console.log(`Loaded ${toolsByAccountsOption.length} tools for account-789`);

// Example 4: Filter by providers
console.log('\n=== Example 4: Filter by providers ===');
const toolsByProviders = await toolset.fetchTools({
	providers: ['hibob', 'bamboohr'],
});
console.log(`Loaded ${toolsByProviders.length} tools for HiBob and BambooHR`);

// Example 5: Filter by actions with exact match
console.log('\n=== Example 5: Filter by actions (exact match) ===');
const toolsByActions = await toolset.fetchTools({
	actions: ['hris_list_employees', 'hris_create_employee'],
});
console.log(`Loaded ${toolsByActions.length} tools matching exact action names`);

// Example 6: Filter by actions with glob pattern
console.log('\n=== Example 6: Filter by actions (glob pattern) ===');
const toolsByGlobPattern = await toolset.fetchTools({
	actions: ['*_list_employees'],
});
console.log(`Loaded ${toolsByGlobPattern.length} tools matching *_list_employees pattern`);

// Example 7: Combine multiple filters
console.log('\n=== Example 7: Combine multiple filters ===');
const toolsCombined = await toolset.fetchTools({
	accountIds: ['account-123'],
	providers: ['hibob'],
	actions: ['*_list_*'],
});
console.log(
	`Loaded ${toolsCombined.length} tools for account-123, provider hibob, matching *_list_* pattern`,
);

// Execute a tool
console.log('\n=== Executing a tool ===');
const tool = allTools.getTool('hris_list_employees');
if (!tool) {
	throw new Error('Tool hris_list_employees not found in the catalog');
}

const result = await tool.execute({
	query: { limit: 5 },
});
console.log('Sample execution result:', JSON.stringify(result, null, 2));
