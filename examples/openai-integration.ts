/**
 * This example shows how to use StackOne tools with OpenAI.
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

const openaiIntegration = async (): Promise<void> => {
	// Initialize StackOne — reads STACKONE_API_KEY and STACKONE_ACCOUNT_ID from env
	const toolset = new StackOneToolSet();

	// Filter to specific tools to stay within OpenAI's 128-tool limit
	const tools = await toolset.fetchTools({
		actions: ['workday_list_workers', 'workday_get_worker', 'workday_get_current_user'],
	});
	const openAITools = tools.toOpenAI();
	console.log(`Loaded ${openAITools.length} tools for OpenAI`);

	// Initialize OpenAI client
	const openai = new OpenAI();

	// Create a chat completion with tool calls
	const response = await openai.chat.completions.create({
		model: 'gpt-5.1',
		messages: [
			{
				role: 'system',
				content: 'You are a helpful assistant that can access HR information.',
			},
			{
				role: 'user',
				content: 'List the first 5 employees',
			},
		],
		tools: openAITools,
	});

	console.log(`Model returned ${response.choices.length} choice(s)`);

	const choice = response.choices[0];
	const toolCalls = choice.message.tool_calls ?? [];
	console.log(`Tool calls made: ${toolCalls.length}`);

	for (const toolCall of toolCalls) {
		if ('function' in toolCall) {
			console.log(`  Tool: ${toolCall.function.name}`);
			console.log(`  Arguments: ${toolCall.function.arguments}`);
		}
	}
};

// Run the example
await openaiIntegration();
