/**
 * This example shows how to use StackOne tools with OpenAI's Responses API.
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
const accountId = 'your-stackone-account-id';

const openaiResponsesIntegration = async (): Promise<void> => {
	// Initialise StackOne
	const toolset = new StackOneToolSet({ accountId });

	// Fetch tools via MCP
	const tools = await toolset.fetchTools({
		actions: ['*_list_*'],
	});
	const openAIResponsesTools = tools.toOpenAIResponses();

	// Initialise OpenAI client
	const openai = new OpenAI();

	// Create a response with tool calls using the Responses API
	const response = await openai.responses.create({
		model: 'gpt-5.1',
		instructions: 'You are a helpful assistant that can access various tools.',
		input: 'What is the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA phone number?',
		tools: openAIResponsesTools,
	});

	// Verify the response contains expected data
	assert(response.id, 'Expected response to have an ID');
	assert(response.model, 'Expected response to have a model');

	// Check if the model made any tool calls
	const toolCalls = response.output.filter(
		(item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === 'function_call',
	);

	assert(toolCalls.length > 0, 'Expected at least one tool call');

	const toolCall = toolCalls[0];
	assert(
		toolCall.name === 'bamboohr_get_employee',
		'Expected tool call to be bamboohr_get_employee',
	);

	// Parse the arguments to verify they contain the expected fields
	const args = JSON.parse(toolCall.arguments);
	assert(args.id === 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA', 'Expected id to match the query');
};

// Run the example
await openaiResponsesIntegration();
