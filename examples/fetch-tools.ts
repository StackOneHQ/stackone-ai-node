/**
 * Example: fetch the latest StackOne tool catalog and execute a tool.
 *
 * Set `STACKONE_API_KEY` (and optionally `STACKONE_BASE_URL`) before running.
 * By default the script exits early in test environments where a real key is
 * not available.
 */

import process from 'node:process';
import { StackOneToolSet } from '../src';

const apiKey = process.env.STACKONE_API_KEY;
const isPlaceholderKey = !apiKey || apiKey === 'test-stackone-key';
const shouldSkip = process.env.SKIP_FETCH_TOOLS_EXAMPLE !== '0' && isPlaceholderKey;

if (shouldSkip) {
  console.log(
    'Skipping fetch-tools example. Provide STACKONE_API_KEY and set SKIP_FETCH_TOOLS_EXAMPLE=0 to run.'
  );
  process.exit(0);
}

const toolset = new StackOneToolSet({
  baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
});

const tools = await toolset.fetchTools();
console.log(`Loaded ${tools.length} tools`);

const tool = tools.getTool('hris_list_employees');
if (!tool) {
  throw new Error('Tool hris_list_employees not found in the catalog');
}

const result = await tool.execute({
  query: { limit: 5 },
});
console.log('Sample execution result:', JSON.stringify(result, null, 2));
