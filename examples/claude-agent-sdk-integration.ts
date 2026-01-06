/**
 * This example shows how to use StackOne tools with Claude Agent SDK.
 *
 * Claude Agent SDK allows you to create autonomous agents with custom tools
 * via MCP (Model Context Protocol) servers.
 *
 * The `toClaudeAgentSdk()` method automatically converts StackOne tools
 * to Claude Agent SDK format, handling the MCP server creation internally.
 */

import assert from 'node:assert';
import process from 'node:process';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { StackOneToolSet } from '@stackone/ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

// Replace with your actual account ID from StackOne dashboard
const accountId = 'your-hris-account-id';

const claudeAgentSdkIntegration = async (): Promise<void> => {
	// Initialize StackOne
	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch tools from StackOne and convert to Claude Agent SDK format
	const tools = await toolset.fetchTools();
	const mcpServer = await tools.toClaudeAgentSdk();

	// Use the Claude Agent SDK query with the StackOne MCP server
	// Type assertion is needed because our interface is compatible but not identical
	const result = query({
		prompt: 'Get the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
		options: {
			model: 'claude-sonnet-4-5-20250929',
			mcpServers: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Compatible MCP server type
				'stackone-tools': mcpServer as any,
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
				if (block.type === 'tool_use' && block.name === 'hris_get_employee') {
					hasToolCall = true;
				}
			}
		}
	}

	assert(hasToolCall, 'Expected at least one tool call to hris_get_employee');
};

await claudeAgentSdkIntegration();
