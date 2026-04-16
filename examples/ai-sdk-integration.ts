/**
 * This example shows how to use StackOne tools with the AI SDK.
 *
 * The AI SDK provides an agent-like pattern through the `stopWhen` parameter
 * with `stepCountIs()`. This creates a multi-step tool loop where the model
 * can autonomously call tools and reason over results until the stop condition
 * is met.
 *
 * In AI SDK v6+, you can use the `ToolLoopAgent` class for more explicit
 * agent functionality.
 */

import process from 'node:process';
import { openai } from '@ai-sdk/openai';
import { StackOneToolSet } from '@stackone/ai';
import { generateText, stepCountIs } from 'ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
	console.log('Skipping: OPENAI_API_KEY is not set');
	process.exit(0);
}

const aiSdkIntegration = async (): Promise<void> => {
	// Initialize StackOne — reads STACKONE_API_KEY and STACKONE_ACCOUNT_ID from env
	const toolset = new StackOneToolSet();

	// Filter to specific tools to keep token usage manageable
	const tools = await toolset.fetchTools({
		actions: ['workday_list_workers', 'workday_get_worker', 'workday_get_current_user'],
	});

	// Convert to AI SDK tools
	const aiSdkTools = await tools.toAISDK();
	console.log(`Loaded ${Object.keys(aiSdkTools).length} tools for AI SDK`);

	// The AI SDK will automatically call the tool if needed
	const { text, steps } = await generateText({
		model: openai('gpt-5.1'),
		tools: aiSdkTools,
		prompt: 'List the first 5 employees',
		stopWhen: stepCountIs(3),
	});

	console.log(`AI response: ${text}`);
	console.log(`Steps taken: ${steps.length}`);

	for (const step of steps) {
		if (step.toolCalls && step.toolCalls.length > 0) {
			for (const toolCall of step.toolCalls) {
				console.log(`  Tool call: ${toolCall.toolName}`);
				console.log(`  Arguments: ${JSON.stringify(toolCall.args)}`);
			}
		}
	}
};

await aiSdkIntegration();
