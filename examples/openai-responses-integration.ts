/**
 * This example shows how to use StackOne tools with OpenAI's Responses API.
 */

import process from 'node:process';
import { StackOneToolSet } from '@stackone/ai';
import OpenAI from 'openai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
	console.log('Skipping: OPENAI_API_KEY is not set');
	process.exit(0);
}

const openaiResponsesIntegration = async (): Promise<void> => {
	// Initialize StackOne — reads STACKONE_API_KEY and STACKONE_ACCOUNT_ID from env
	const toolset = new StackOneToolSet();

	// Fetch tools via MCP
	const tools = await toolset.fetchTools({
		actions: ['*_list_*'],
	});
	const openAIResponsesTools = tools.toOpenAIResponses();
	console.log(`Loaded ${openAIResponsesTools.length} tools for OpenAI Responses API`);

	// Initialize OpenAI client
	const openai = new OpenAI();

	// Create a response with tool calls using the Responses API
	const response = await openai.responses.create({
		model: 'gpt-5.1',
		instructions: 'You are a helpful assistant that can access various tools.',
		input: 'List the first 5 employees',
		tools: openAIResponsesTools,
	});

	console.log(`Response ID: ${response.id}`);
	console.log(`Model: ${response.model}`);

	// Check if the model made any tool calls
	const toolCalls = response.output.filter(
		(item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === 'function_call',
	);

	console.log(`Tool calls found: ${toolCalls.length}`);

	for (const toolCall of toolCalls) {
		console.log(`  Tool: ${toolCall.name}`);
		console.log(`  Arguments: ${toolCall.arguments}`);
	}
};

// Run the example
await openaiResponsesIntegration();
