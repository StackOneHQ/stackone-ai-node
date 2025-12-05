/**
 * This example shows how to use StackOne tools with the AI SDK.
 */

import assert from 'node:assert';
import process from 'node:process';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { StackOneToolSet } from '../src';
import { ACCOUNT_IDS } from './constants';

const apiKey = process.env.STACKONE_API_KEY;
const isPlaceholderKey = !apiKey || apiKey === 'test-stackone-key';
const shouldSkip = process.env.SKIP_FETCH_TOOLS_EXAMPLE !== '0' && isPlaceholderKey;

if (shouldSkip) {
  console.log(
    'Skipping ai-sdk-integration example. Provide STACKONE_API_KEY and set SKIP_FETCH_TOOLS_EXAMPLE=0 to run.'
  );
  process.exit(0);
}

const aiSdkIntegration = async (): Promise<void> => {
  // Initialise StackOne
  const toolset = new StackOneToolSet({
    accountId: ACCOUNT_IDS.HRIS,
    baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
  });

  // Fetch HRIS tools via MCP
  const tools = await toolset.fetchTools({
    actions: ['hris_get_*'],
  });

  // Convert to AI SDK tools
  const aiSdkTools = await tools.toAISDK();

  // Use max steps to automatically call the tool if it's needed
  const { text } = await generateText({
    model: openai('gpt-4o'),
    tools: aiSdkTools,
    prompt: 'Get all details about employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
    maxSteps: 3,
  });

  assert(text.includes('Michael'), 'Expected employee name to be included in the response');
};

aiSdkIntegration();
