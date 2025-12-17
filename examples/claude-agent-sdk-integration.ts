/**
 * This example shows how to use StackOne tools with Claude Agent SDK.
 *
 * Claude Agent SDK allows you to create autonomous agents with custom tools
 * via MCP (Model Context Protocol) servers.
 */

import assert from 'node:assert';
import process from 'node:process';
import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

// Replace with your actual account ID from StackOne dashboard
const accountId = 'your-bamboohr-account-id';

const claudeAgentSdkIntegration = async (): Promise<void> => {
	// Initialize StackOne
	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch tools from StackOne
	const tools = await toolset.fetchTools();

	// Get a specific tool
	const employeeTool = tools.getTool('bamboohr_get_employee');
	assert(employeeTool !== undefined, 'Expected to find bamboohr_get_employee tool');

	// Create a Claude Agent SDK tool from the StackOne tool
	const getEmployeeTool = tool(
		employeeTool.name,
		employeeTool.description,
		{
			id: z.string().describe('The employee ID'),
		},
		async (args) => {
			const result = await employeeTool.execute(args);
			return {
				content: [{ type: 'text', text: JSON.stringify(result) }],
			};
		},
	);

	// Create an MCP server with the StackOne tool
	const mcpServer = createSdkMcpServer({
		name: 'stackone-tools',
		version: '1.0.0',
		tools: [getEmployeeTool],
	});

	// Use the Claude Agent SDK query with the custom MCP server
	const result = query({
		prompt: 'Get the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
		options: {
			model: 'claude-sonnet-4-5-20250929',
			mcpServers: {
				'stackone-tools': mcpServer,
			},
			// Disable built-in tools, only use our custom tools
			tools: [],
			maxTurns: 3,
		},
	});

	// Process the stream and collect results
	let hasToolCall = false;
	for await (const message of result) {
		if (message.type === 'assistant') {
			for (const block of message.message.content) {
				if (block.type === 'tool_use' && block.name === 'bamboohr_get_employee') {
					hasToolCall = true;
				}
			}
		}
	}

	assert(hasToolCall, 'Expected at least one tool call to bamboohr_get_employee');
};

await claudeAgentSdkIntegration();
