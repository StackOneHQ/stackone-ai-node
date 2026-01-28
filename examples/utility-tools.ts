/**
 * This example demonstrates how to use utility tools for dynamic tool discovery and execution.
 * Utility tools allow AI agents to search for relevant tools based on natural language queries
 * and execute them dynamically without hardcoding tool names.
 *
 * @beta Utility tools are in beta and may change in future versions
 */

import process from 'node:process';
import { openai } from '@ai-sdk/openai';
import { type JsonObject, StackOneToolSet, Tools } from '@stackone/ai';
import { generateText, stepCountIs } from 'ai';

const apiKey = process.env.STACKONE_API_KEY;
if (!apiKey) {
	console.error('STACKONE_API_KEY environment variable is required');
	process.exit(1);
}

// Replace with your actual account ID from StackOne dashboard
const accountId = 'your-bamboohr-account-id';

/**
 * Example 1: Using utility tools with AI SDK for dynamic tool discovery
 */
const utilityToolsWithAISDK = async (): Promise<void> => {
	console.log('🔍 Example 1: Dynamic tool discovery with AI SDK\n');

	// Initialize StackOne toolset
	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch all available tools via MCP
	const allTools = await toolset.fetchTools();

	// Get utility tools for dynamic discovery and execution
	const utilityTools = await allTools.utilityTools();
	const aiSdkUtilityTools = await utilityTools.toAISDK();

	// Use utility tools to dynamically find and execute relevant tools
	const { text, toolCalls } = await generateText({
		model: openai('gpt-5.1'),
		tools: aiSdkUtilityTools,
		prompt: `I need to create a time off request for an employee.
    First, find the right tool for this task, then use it to create a time off request
    for employee ID "emp_123" from January 15, 2024 to January 19, 2024.`,
		stopWhen: stepCountIs(3), // Allow multiple tool calls
	});

	console.log('AI Response:', text);
	console.log('\nTool calls made:', toolCalls?.map((call) => call.toolName).join(', '));
};

/**
 * Example 2: Using utility tools with OpenAI for HR assistant
 */
const utilityToolsWithOpenAI = async (): Promise<void> => {
	console.log('\n🤖 Example 2: HR Assistant with OpenAI\n');

	const { OpenAI } = await import('openai');
	const openaiClient = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});

	// Initialize StackOne toolset
	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch BambooHR tools via MCP
	const bamboohrTools = await toolset.fetchTools({
		actions: ['bamboohr_*'],
	});

	// Get utility tools
	const utilityTools = await bamboohrTools.utilityTools();
	const openAIUtilityTools = utilityTools.toOpenAI();

	// Create an HR assistant that can discover and use tools dynamically
	const response = await openaiClient.chat.completions.create({
		model: 'gpt-5.1',
		messages: [
			{
				role: 'system',
				content: `You are an HR assistant with access to various HR tools.
        Use the tool_search to find appropriate tools for user requests,
        then use tool_execute to execute them.`,
			},
			{
				role: 'user',
				content:
					'Can you help me find tools for managing employee records and then list current employees?',
			},
		],
		tools: openAIUtilityTools,
		tool_choice: 'auto',
	});

	console.log('Assistant response:', response.choices[0].message.content);

	// Handle tool calls if any
	if (response.choices[0].message.tool_calls) {
		console.log('\nTool calls:');
		for (const toolCall of response.choices[0].message.tool_calls) {
			if (toolCall.type === 'function') {
				console.log(`- ${toolCall.function.name}: ${toolCall.function.arguments}`);
			}
		}
	}
};

/**
 * Example 3: Direct usage of utility tools without AI
 */
const directUtilityToolUsage = async (): Promise<void> => {
	console.log('\n🛠️  Example 3: Direct utility tool usage\n');

	// Initialize toolset
	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch all available tools via MCP
	const allTools = await toolset.fetchTools();
	console.log(`Total available tools: ${allTools.length}`);

	// Get utility tools
	const utilityTools = await allTools.utilityTools();

	// Step 1: Search for relevant tools
	const filterTool = utilityTools.getTool('tool_search');
	if (!filterTool) throw new Error('tool_search not found');
	const searchResult = await filterTool.execute({
		query: 'employee management create update list',
		limit: 5,
		minScore: 0.3,
	});

	console.log('Found relevant tools:');
	const foundTools = searchResult.tools as Array<{
		name: string;
		description: string;
		score: number;
	}>;
	for (const tool of foundTools) {
		console.log(`- ${tool.name} (score: ${tool.score.toFixed(2)}): ${tool.description}`);
	}

	// Step 2: Execute one of the found tools
	if (foundTools.length > 0) {
		const executeTool = utilityTools.getTool('tool_execute');
		if (!executeTool) throw new Error('tool_execute not found');
		const firstTool = foundTools[0];

		console.log(`\nExecuting ${firstTool.name}...`);

		try {
			// Prepare parameters based on the tool's schema
			let params = {} satisfies JsonObject;
			if (firstTool.name === 'bamboohr_list_employees') {
				params = { limit: 5 };
			} else if (firstTool.name === 'bamboohr_create_employee') {
				params = {
					name: 'John Doe',
					email: 'john.doe@example.com',
					title: 'Software Engineer',
				};
			}

			const result = await executeTool.execute({
				toolName: firstTool.name,
				params,
			});

			console.log('Execution result:', JSON.stringify(result, null, 2));
		} catch (error) {
			console.error('Execution failed:', error);
		}
	}
};

/**
 * Example 4: Building a dynamic tool router
 */
const dynamicToolRouter = async (): Promise<void> => {
	console.log('\n🔄 Example 4: Dynamic tool router\n');

	const toolset = new StackOneToolSet({
		accountId,
		baseUrl: process.env.STACKONE_BASE_URL ?? 'https://api.stackone.com',
	});

	// Fetch tools from multiple integrations via MCP
	const bamboohrTools = await toolset.fetchTools({
		actions: ['bamboohr_*'],
	});
	const workdayTools = await toolset.fetchTools({
		actions: ['workday_*'],
	});

	// Combine tools
	const combinedTools = new Tools([...bamboohrTools.toArray(), ...workdayTools.toArray()]);

	// Get utility tools for the combined set
	const utilityTools = await combinedTools.utilityTools();

	// Create a router function that finds and executes tools based on intent
	const routeAndExecute = async (intent: string, params: JsonObject = {}) => {
		const filterTool = utilityTools.getTool('tool_search');
		const executeTool = utilityTools.getTool('tool_execute');
		if (!filterTool || !executeTool) throw new Error('Utility tools not found');

		// Find relevant tools
		const searchResult = await filterTool.execute({
			query: intent,
			limit: 1,
			minScore: 0.5,
		});

		const tools = searchResult.tools;
		if (!Array.isArray(tools) || tools.length === 0) {
			return { error: 'No relevant tools found for the given intent' };
		}

		const selectedTool = tools[0] as { name: string; score: number };
		console.log(`Routing to: ${selectedTool.name} (score: ${selectedTool.score.toFixed(2)})`);

		// Execute the selected tool
		return await executeTool.execute({
			toolName: selectedTool.name,
			params,
		});
	};

	// Test the router with different intents
	const intents = [
		{ intent: 'I want to see all employees', params: { limit: 10 } },
		{
			intent: 'Create a new job candidate',
			params: { name: 'Jane Smith', email: 'jane@example.com' },
		},
		{ intent: 'Find recruitment candidates', params: { status: 'active' } },
	] as const satisfies { intent: string; params: JsonObject }[];

	for (const { intent, params } of intents) {
		console.log(`\nIntent: "${intent}"`);
		const result = await routeAndExecute(intent, params);
		console.log('Result:', JSON.stringify(result, null, 2));
	}
};

// Main execution
const main = async () => {
	try {
		// Run examples based on environment setup
		if (process.env.OPENAI_API_KEY) {
			await utilityToolsWithAISDK();
			await utilityToolsWithOpenAI();
		} else {
			console.log('⚠️  OPENAI_API_KEY not found, skipping AI examples\n');
		}

		// These examples work without AI
		await directUtilityToolUsage();
		await dynamicToolRouter();
	} catch (error) {
		console.error('Error running examples:', error);
	}
};

// Run if this file is executed directly
if (import.meta.main) {
	await main();
}

export { utilityToolsWithAISDK, utilityToolsWithOpenAI, directUtilityToolUsage, dynamicToolRouter };
