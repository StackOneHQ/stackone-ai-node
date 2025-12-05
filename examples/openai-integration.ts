/**
 * This example shows how to use StackOne tools with OpenAI.
 */

import assert from 'node:assert';
import process from 'node:process';
import OpenAI from 'openai';
import { StackOneToolSet } from '../src';
import { ACCOUNT_IDS } from './constants';

const apiKey = process.env.STACKONE_API_KEY;
const isPlaceholderKey = !apiKey || apiKey === 'test-stackone-key';
const shouldSkip = process.env.SKIP_FETCH_TOOLS_EXAMPLE !== '0' && isPlaceholderKey;

if (shouldSkip) {
  console.log(
    'Skipping openai-integration example. Provide STACKONE_API_KEY and set SKIP_FETCH_TOOLS_EXAMPLE=0 to run.'
  );
  process.exit(0);
}

const openaiIntegration = async (): Promise<void> => {
  // Initialise StackOne
  const toolset = new StackOneToolSet({
    accountId: ACCOUNT_IDS.HRIS,
    baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
  });

  // Fetch HRIS tools via MCP
  const tools = await toolset.fetchTools({
    actions: ['hris_get_*'],
  });
  const openAITools = tools.toOpenAI();

  // Initialise OpenAI client
  const openai = new OpenAI();

  // Create a chat completion with tool calls
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that can access HRIS information.',
      },
      {
        role: 'user',
        content: 'What is the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA phone number?',
      },
    ],
    tools: openAITools,
  });

  // Verify the response contains tool calls
  assert(response.choices.length > 0, 'Expected at least one choice in the response');

  const choice = response.choices[0];
  assert(choice.message.tool_calls !== undefined, 'Expected tool_calls to be defined');
  assert(choice.message.tool_calls.length > 0, 'Expected at least one tool call');

  const toolCall = choice.message.tool_calls[0];
  assert(
    toolCall.function.name === 'hris_get_employee',
    'Expected tool call to be hris_get_employee'
  );

  // Parse the arguments to verify they contain the expected fields
  const args = JSON.parse(toolCall.function.arguments);
  assert(args.id === 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA', 'Expected id to match the query');
};

// Run the example
openaiIntegration();
