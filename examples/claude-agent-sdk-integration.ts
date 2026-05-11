/**
 * This example shows how to use StackOne tools with Claude Agent SDK.
 *
 * Claude Agent SDK allows you to create autonomous agents with custom tools
 * via MCP (Model Context Protocol) servers.
 *
 * The `toClaudeAgentSdk()` method automatically converts StackOne tools
 * to Claude Agent SDK format, handling the MCP server creation internally.
 */

import process from 'node:process';
import { query } from '@anthropic-ai/claude-agent-sdk';
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

const claudeAgentSdkIntegration = async (): Promise<void> => {
	// Initialize StackOne — reads STACKONE_API_KEY and STACKONE_ACCOUNT_ID from env
	const toolset = new StackOneToolSet();

	// Fetch tools from StackOne and convert to Claude Agent SDK format
	const tools = await toolset.fetchTools();
	const mcpServer = await tools.toClaudeAgentSdk();
	console.log('Claude Agent SDK MCP server created');

	// Use the Claude Agent SDK query with the StackOne MCP server
	// Type assertion is needed because our interface is compatible but not identical
	const result = query({
		prompt: 'List the first 5 employees',
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
	console.log('Processing agent stream...');
	for await (const message of result) {
		if (message.type === 'assistant') {
			for (const block of message.message.content) {
				if (block.type === 'tool_use') {
					console.log(`  Tool use: ${block.name}`);
					console.log(`  Input: ${JSON.stringify(block.input)}`);
				} else if (block.type === 'text') {
					console.log(`  Assistant: ${block.text}`);
				}
			}
		}
	}

	console.log('Agent stream completed');
};

await claudeAgentSdkIntegration();
