/**
 * This example shows how to use StackOne tools with TanStack AI.
 *
 * TanStack AI requires Zod schemas for tool input validation.
 * This example demonstrates how to wrap StackOne tools for use with TanStack AI
 * by creating Zod schemas that match the tool's JSON Schema.
 */

import assert from 'node:assert';
import process from 'node:process';
import { chat } from '@tanstack/ai';
import { openaiText } from '@tanstack/ai-openai';
import { z } from 'zod';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

// Replace with your actual account ID from StackOne dashboard
const accountId = 'your-bamboohr-account-id';

const tanstackAiIntegration = async (): Promise<void> => {
	// Initialize StackOne
	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch tools from StackOne
	const tools = await toolset.fetchTools();

	// Get a specific tool and create a TanStack AI compatible tool
	const employeeTool = tools.getTool('bamboohr_get_employee');
	assert(employeeTool !== undefined, 'Expected to find bamboohr_get_employee tool');

	// Create a TanStack AI server tool from the StackOne tool
	// TanStack AI requires Zod schemas, so we create one that matches the tool's parameters
	const getEmployeeTool = {
		name: employeeTool.name,
		description: employeeTool.description,
		// TanStack AI requires Zod schema for input validation
		inputSchema: z.object({
			id: z.string().describe('The employee ID'),
		}),
		execute: async (args: { id: string }) => {
			return employeeTool.execute(args);
		},
	};

	// Use TanStack AI chat with the tool
	// The adapter reads OPENAI_API_KEY from the environment automatically
	const adapter = openaiText('gpt-5');
	const stream = chat({
		adapter,
		messages: [
			{
				role: 'user',
				content: 'Get the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
			},
		],
		tools: [getEmployeeTool],
	});

	// Process the stream
	let hasToolCall = false;
	for await (const chunk of stream) {
		if (chunk.type === 'tool_call') {
			hasToolCall = true;
			assert(
				chunk.toolCall.function.name === 'bamboohr_get_employee',
				'Expected tool call to be bamboohr_get_employee',
			);
		}
	}

	assert(hasToolCall, 'Expected at least one tool call');
};

await tanstackAiIntegration();
