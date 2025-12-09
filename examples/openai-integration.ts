/**
 * This example shows how to use StackOne tools with OpenAI.
 */

import assert from 'node:assert';
import process from 'node:process';
import { StackOneToolSet } from '@stackone/ai';
import OpenAI from 'openai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
  console.error('STACKONE_API_KEY environment variable is required');
  process.exit(1);
}

// Replace with your actual account ID from StackOne dashboard
const accountId = 'your-hris-account-id';

const openaiIntegration = async (): Promise<void> => {
  // Initialise StackOne
  const toolset = new StackOneToolSet({
    accountId,
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
    model: 'gpt-5.1',
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
  assert(toolCall.type === 'function', 'Expected tool call to be a function');
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
