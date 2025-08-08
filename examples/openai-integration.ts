/**
 * This example shows how to use StackOne tools with OpenAI.
 */

import assert from 'node:assert';
import OpenAI from 'openai';
import { StackOneToolSet } from '../src';
import { ACCOUNT_IDS } from './constants';

const openaiIntegration = async (): Promise<void> => {
  // Initialize StackOne
  const toolset = new StackOneToolSet();
  const accountId = ACCOUNT_IDS.HRIS;

  // Get the correct tool
  const tools = toolset.getStackOneTools('hris_get_*', accountId);
  const openAITools = tools.toOpenAI();

  // Initialize OpenAI client
  const openai = new OpenAI();

  // Create a chat completion with tool calls
  const response = await openai.chat.completions.create({
    model: 'gpt-5',
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
  assert(args.fields !== undefined, 'Expected fields to be defined');
};

// Run the example
openaiIntegration();
