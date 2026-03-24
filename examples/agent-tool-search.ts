/**
 * This example demonstrates the search and execute tools pattern (tool_search + tool_execute)
 * for LLM-driven tool discovery and execution.
 *
 * Instead of loading all tools upfront, the LLM autonomously searches for
 * relevant tools and executes them — keeping token usage minimal.
 *
 * @example
 * ```bash
 * # Run with required environment variables:
 * STACKONE_API_KEY=your-key OPENAI_API_KEY=your-key STACKONE_ACCOUNT_ID=your-account npx tsx examples/agent-tool-search.ts
 * ```
 */

import process from 'node:process';
import { openai } from '@ai-sdk/openai';
import { StackOneToolSet } from '@stackone/ai';
import { generateText, stepCountIs } from 'ai';
import OpenAI from 'openai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
	console.error('OPENAI_API_KEY environment variable is required');
	process.exit(1);
}

const accountId = process.env.STACKONE_ACCOUNT_ID;

/**
 * Example 1: Search and execute with Vercel AI SDK
 *
 * The LLM receives only tool_search and tool_execute — two small tool definitions
 * regardless of how many tools exist. It searches for what it needs and executes.
 */
const toolsWithAISDK = async (): Promise<void> => {
	console.log('Example 1: Search and execute with Vercel AI SDK\n');

	const toolset = new StackOneToolSet({
		search: { method: 'semantic', topK: 3 },
		...(accountId ? { accountId } : {}),
	});

	// Get search and execute tools — returns a Tools collection with tool_search + tool_execute
	const accountIds = accountId ? [accountId] : [];
	const tools = toolset.getTools({ accountIds });

	console.log(
		`Search and execute: ${tools
			.toArray()
			.map((t) => t.name)
			.join(', ')}`,
	);
	console.log();

	// Pass to the LLM — it will search for calendly tools, then execute
	const { text, steps } = await generateText({
		model: openai('gpt-5.4'),
		tools: await tools.toAISDK(),
		prompt: 'List my upcoming Calendly events for the next week.',
		stopWhen: stepCountIs(10),
	});

	console.log('AI Response:', text);
	console.log('\nSteps taken:');
	for (const step of steps) {
		for (const call of step.toolCalls ?? []) {
			const args = (call as unknown as Record<string, unknown>).args;
			const argsStr = args ? JSON.stringify(args).slice(0, 100) : '{}';
			console.log(`  - ${call.toolName}(${argsStr})`);
		}
	}
};

/**
 * Example 2: Search and execute with OpenAI Chat Completions
 *
 * Same pattern, different framework. The search and execute tools convert to any format.
 */
const toolsWithOpenAI = async (): Promise<void> => {
	console.log('\nExample 2: Search and execute with OpenAI Chat Completions\n');

	const toolset = new StackOneToolSet({
		search: { method: 'semantic', topK: 3 },
		...(accountId ? { accountId } : {}),
	});

	const accountIds = accountId ? [accountId] : [];
	const tools = toolset.getTools({ accountIds });
	const openaiTools = tools.toOpenAI();

	const client = new OpenAI();
	const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
		{
			role: 'system',
			content:
				'You are a helpful scheduling assistant. Use tool_search to find relevant tools, then tool_execute to run them. Always read the parameter schemas from tool_search results carefully. If a tool needs a user URI, first search for and call a "get current user" tool to obtain it. If a tool execution fails, try different parameters or a different tool.',
		},
		{
			role: 'user',
			content: 'Check my upcoming Calendly events and list them.',
		},
	];

	// Agent loop — let the LLM drive search and execution
	const maxIterations = 10;
	for (let i = 0; i < maxIterations; i++) {
		const response = await client.chat.completions.create({
			model: 'gpt-5.4',
			messages,
			tools: openaiTools,
			tool_choice: 'auto',
		});

		const choice = response.choices[0];

		if (!choice.message.tool_calls?.length) {
			console.log('Final response:', choice.message.content);
			break;
		}

		// Add assistant message with tool calls
		messages.push(choice.message);

		// Execute each tool call
		for (const toolCall of choice.message.tool_calls) {
			if (toolCall.type !== 'function') {
				continue;
			}

			console.log(`LLM called: ${toolCall.function.name}(${toolCall.function.arguments})`);

			const tool = tools.getTool(toolCall.function.name);
			if (!tool) {
				messages.push({
					role: 'tool',
					tool_call_id: toolCall.id,
					content: JSON.stringify({ error: `Unknown tool: ${toolCall.function.name}` }),
				});
				continue;
			}

			const result = await tool.execute(toolCall.function.arguments);
			messages.push({
				role: 'tool',
				tool_call_id: toolCall.id,
				content: JSON.stringify(result),
			});
		}
	}
};

// Main execution
const main = async (): Promise<void> => {
	try {
		await toolsWithAISDK();
		await toolsWithOpenAI();
	} catch (error) {
		console.error('Error running examples:', error);
	}
};

await main();
