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
 * # Using bun
 * bun add @stackone/ai
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

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config();

/**
 * # Account IDs
 *
 * StackOne uses account IDs to identify different integrations.
 * See the example in the README for more details.
 *
 * This example will hardcode the account ID:
 */

const accountId = '45072196112816593343';

/**
 * # Quickstart
 */

import assert from 'node:assert';
import { StackOneToolSet } from '../src';

const quickstart = async (): Promise<void> => {
  const toolset = new StackOneToolSet();

  // Get all HRIS-related tools
  const tools = toolset.getTools('hris_*', accountId);

  // Verify we have tools
  assert(tools.length > 0, 'Expected to find HRIS tools');

  // Use a specific tool
  const employeeTool = tools.getTool('hris_list_employees');
  assert(employeeTool !== undefined, 'Expected to find hris_list_employees tool');

  // Execute the tool and verify the response
  const employees = await employeeTool.execute();
  assert(Array.isArray(employees), 'Expected employees to be an array');
  assert(employees.length > 0, 'Expected to find at least one employee');
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
 * - [Error Handling](error-handling.md)
 * - [File Uploads](file-uploads.md)
 * - [Custom Base URL](custom-base-url.md)
 * - [Account ID Usage](account-id-usage.md)
 */
