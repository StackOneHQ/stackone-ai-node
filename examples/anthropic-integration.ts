/**
 * This example shows how to use StackOne tools with Anthropic Claude.
 */

import process from 'node:process';
import Anthropic from '@anthropic-ai/sdk';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
	console.log('Skipping: ANTHROPIC_API_KEY is not set');
	process.exit(0);
}

const anthropicIntegration = async (): Promise<void> => {
	// Initialize StackOne — reads STACKONE_API_KEY and STACKONE_ACCOUNT_ID from env
	const toolset = new StackOneToolSet();

	// Filter for any relevant tools
	const tools = await toolset.fetchTools({
		actions: ['*_list_*', '*_search_*'],
	});
	const anthropicTools = tools.toAnthropic();
	console.log(`Loaded ${anthropicTools.length} tools for Anthropic`);

	// Initialize Anthropic client
	const anthropic = new Anthropic();

	// Create a message with tool calls
	const response = await anthropic.messages.create({
		model: 'claude-haiku-4-5-20241022',
		max_tokens: 1024,
		system: 'You are a helpful assistant that can access tools.',
		messages: [
			{
				role: 'user',
				content: 'List the first 5 employees',
			},
		],
		tools: anthropicTools,
	});

	console.log(`Response content blocks: ${response.content.length}`);

	for (const block of response.content) {
		if (block.type === 'tool_use') {
			console.log(`  Tool use: ${block.name}`);
			console.log(`  Input: ${JSON.stringify(block.input)}`);
		} else if (block.type === 'text') {
			console.log(`  Text: ${block.text}`);
		}
	}
};

// Run the example
await anthropicIntegration();
