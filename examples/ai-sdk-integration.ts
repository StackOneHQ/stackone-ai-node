/**
 * This example shows how to use StackOne tools with the AI SDK.
 */

import assert from 'node:assert';
import process from 'node:process';
import { openai } from '@ai-sdk/openai';
import { StackOneToolSet } from '@stackone/ai';
import { generateText, stepCountIs } from 'ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

// Replace with your actual account ID from StackOne dashboard
const accountId = 'your-bamboohr-account-id';

const aiSdkIntegration = async (): Promise<void> => {
	// Initialise StackOne
	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch all tools for this account via MCP
	const tools = await toolset.fetchTools();

	// Convert to AI SDK tools
	const aiSdkTools = await tools.toAISDK();

	// The AI SDK will automatically call the tool if needed
	const { text } = await generateText({
		model: openai('gpt-5.1'),
		tools: aiSdkTools,
		prompt: 'Get all details about employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
		stopWhen: stepCountIs(3),
	});

	assert(text.includes('Michael'), 'Expected employee name to be included in the response');
};

await aiSdkIntegration();
