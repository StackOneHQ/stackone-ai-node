/**
 * # Installation
 *
 * ```bash
 * # Using npm
 * npm install @stackone/ai
 *
 * # Using yarn
 * yarn add @stackone/ai
 *
 * # Using pnpm
 * pnpm add @stackone/ai
 * ```
 *
 * # Authentication
 *
 * Set the `STACKONE_API_KEY` environment variable:
 *
 * ```bash
 * export STACKONE_API_KEY=<your-api-key>
 * ```
 *
 * or load from a .env file:
 */

/**
 * # Account IDs
 *
 * StackOne uses account IDs to identify different integrations.
 * Replace the placeholder below with your actual account ID from the StackOne dashboard.
 */

import process from 'node:process';

// Replace with your actual account ID from StackOne dashboard
const accountId = 'your-bamboohr-account-id';

/**
 * # Quickstart
 */

import assert from 'node:assert';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

const quickstart = async (): Promise<void> => {
	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch all tools for this account via MCP
	const tools = await toolset.fetchTools();

	// Verify we have tools
	assert(tools.length > 0, 'Expected to find tools');

	// Use a specific tool
	const employeeTool = tools.getTool('bamboohr_list_employees');
	assert(employeeTool !== undefined, 'Expected to find bamboohr_list_employees tool');

	// Execute the tool and verify the response
	const result = await employeeTool.execute();
	assert(Array.isArray(result.data), 'Expected employees to be an array');
	assert(result.data.length > 0, 'Expected to find at least one employee');
};

// Run the example
await quickstart();

/**
 * # Next Steps
 *
 * Check out some more examples:
 *
 * - [OpenAI Integration](openai-integration.md)
 * - [AI SDK Integration](ai-sdk-integration.md)
 * - [Fetch Tools](fetch-tools.md)
 * - [Meta Tools](meta-tools.md)
 */
