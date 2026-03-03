/**
 * This example shows how to use StackOne tools with Anthropic Claude.
 */

import assert from 'node:assert';
import process from 'node:process';
import Anthropic from '@anthropic-ai/sdk';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

const anthropicIntegration = async (): Promise<void> => {
	// Initialize StackOne — reads STACKONE_API_KEY and STACKONE_ACCOUNT_ID from env
	const toolset = new StackOneToolSet();

	// Filter for any relevant tools
	const tools = await toolset.fetchTools({
		actions: ['*_list_*', '*_search_*'],
	});
	const anthropicTools = tools.toAnthropic();

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
				content: 'What is the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA phone number?',
			},
		],
		tools: anthropicTools,
	});

	// Verify the response contains tool use
	assert(response.content.length > 0, 'Expected at least one content block in the response');

	const toolUseBlock = response.content.find((block) => block.type === 'tool_use');
	assert(toolUseBlock !== undefined, 'Expected a tool_use block in the response');
	assert(toolUseBlock.type === 'tool_use', 'Expected block to be tool_use type');
	assert(toolUseBlock.name === 'hris_get_employee', 'Expected tool call to be hris_get_employee');

	// Verify the input contains the expected fields
	const input = toolUseBlock.input as Record<string, unknown>;
	assert(input.id === 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA', 'Expected id to match the query');
};

// Run the example
await anthropicIntegration();
