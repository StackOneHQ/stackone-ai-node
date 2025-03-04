/**
 * # Installation
 *
 * ```bash
 * # Using npm
 * npm install stackone-ai-node
 *
 * # Using yarn
 * yarn add stackone-ai-node
 *
 * # Using bun
 * bun add stackone-ai-node
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

import { StackOneToolSet } from '../src';

const quickstart = async (): Promise<void> => {
  const toolset = new StackOneToolSet();

  // Get all HRIS-related tools
  const tools = toolset.getTools('hris_*', accountId);

  // Use a specific tool
  const employeeTool = tools.getTool('hris_list_employees');
  if (employeeTool) {
    try {
      const employees = await employeeTool.execute();
      console.log(employees);
    } catch (error) {
      console.error('Error executing tool:', error);
    }
  }
};

// Run the example
quickstart().catch(console.error);

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
 */
