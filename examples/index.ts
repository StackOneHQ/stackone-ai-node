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
 * See the example in the README for more details.
 *
 * This example will use the centralised account ID:
 */

import process from 'node:process';
import { ACCOUNT_IDS } from './constants';

const accountId = ACCOUNT_IDS.HRIS;

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

  // Fetch HRIS-related tools via MCP
  const tools = await toolset.fetchTools({
    actions: ['hris_*'],
  });

  // Verify we have tools
  assert(tools.length > 0, 'Expected to find HRIS tools');

  // Use a specific tool
  const employeeTool = tools.getTool('hris_list_employees');
  assert(employeeTool !== undefined, 'Expected to find hris_list_employees tool');

  // Execute the tool and verify the response
  const result = await employeeTool.execute();
  assert(Array.isArray(result.data), 'Expected employees to be an array');
  assert(result.data.length > 0, 'Expected to find at least one employee');
};

// Run the example
quickstart();

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
