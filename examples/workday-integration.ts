/**
 * Workday integration: timeout and account scoping for slow providers.
 *
 * Workday can take 10-15s to respond. This example shows how to configure
 * timeout and accountIds through the execute config.
 *
 * Run with:
 *   STACKONE_API_KEY=xxx OPENAI_API_KEY=xxx STACKONE_ACCOUNT_ID=xxx npx tsx examples/workday-integration.ts
 */

import process from 'node:process';
import { StackOneToolSet } from '@stackone/ai';
import OpenAI from 'openai';

const accountId = process.env.STACKONE_ACCOUNT_ID ?? '';

// Timeout and accountIds both live in the execute config
const toolset = new StackOneToolSet({
	search: { method: 'semantic', topK: 5 },
	accountId,
	execute: { timeout: 120_000 },
});

const client = new OpenAI();

async function runAgent(
	messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
	tools: OpenAI.Chat.Completions.ChatCompletionTool[],
	maxSteps = 10,
): Promise<void> {
	for (let i = 0; i < maxSteps; i++) {
		const response = await client.chat.completions.create({ model: 'gpt-5.4', messages, tools });
		const choice = response.choices[0];

		if (!choice.message.tool_calls?.length) {
			console.log(`Answer: ${choice.message.content}`);
			return;
		}

		messages.push(choice.message);
		for (const tc of choice.message.tool_calls) {
			if (tc.type !== 'function') continue;
			console.log(`  -> ${tc.function.name}(${tc.function.arguments.slice(0, 80)})`);
			const tool = toolset.getTools({ accountIds: [accountId] }).getTool(tc.function.name);
			const result = tool ? await tool.execute(tc.function.arguments) : { error: 'Unknown tool' };
			messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
		}
	}
}

// --- Example 1: Search and execute mode ---
console.log('=== Search and execute mode ===\n');
const searchTools = toolset.getTools({ accountIds: [accountId] }).toOpenAI();
await runAgent(
	[
		{ role: 'system', content: 'Use tool_search to find tools, then tool_execute to run them.' },
		{ role: 'user', content: 'List the first 5 employees.' },
	],
	searchTools,
);

// --- Example 2: Normal mode ---
console.log('\n=== Normal mode ===\n');
const tools = await toolset.fetchTools({ actions: ['workday_*_employee*'] });
if (tools.length === 0) {
	console.log('No Workday tools found for this account.');
} else {
	await runAgent([{ role: 'user', content: 'List the first 5 employees.' }], tools.toOpenAI());
}
