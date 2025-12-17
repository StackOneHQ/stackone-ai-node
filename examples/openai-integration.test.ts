/**
 * E2E test for openai-integration.ts example
 *
 * Tests the complete flow of using StackOne tools with OpenAI Chat Completions API.
 */

import OpenAI from 'openai';
import { StackOneToolSet } from '../src';

describe('openai-integration example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
		vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should fetch tools, convert to OpenAI format, and create chat completion with tool calls', async () => {
		const toolset = new StackOneToolSet({
			accountId: 'your-bamboohr-account-id',
			baseUrl: 'https://api.stackone.com',
		});

		// Fetch all tools for this account via MCP
		const tools = await toolset.fetchTools();
		const openAITools = tools.toOpenAI();

		// Verify tools are in OpenAI format
		expect(Array.isArray(openAITools)).toBe(true);
		expect(openAITools.length).toBeGreaterThan(0);
		expect(openAITools[0]).toHaveProperty('type', 'function');
		expect(openAITools[0]).toHaveProperty('function');

		// Initialize OpenAI client
		const openai = new OpenAI();

		// Create a chat completion with tool calls
		const response = await openai.chat.completions.create({
			model: 'gpt-5',
			messages: [
				{
					role: 'system',
					content: 'You are a helpful assistant that can access BambooHR information.',
				},
				{
					role: 'user',
					content:
						'What is the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA phone number?',
				},
			],
			tools: openAITools,
		});

		// Verify the response contains tool calls
		expect(response.choices.length).toBeGreaterThan(0);

		const choice = response.choices[0];
		expect(choice.message.tool_calls).toBeDefined();
		expect(choice.message.tool_calls!.length).toBeGreaterThan(0);

		const toolCall = choice.message.tool_calls![0];
		assert(toolCall.type === 'function');
		expect(toolCall.function.name).toBe('bamboohr_get_employee');

		// Parse the arguments to verify they contain the expected fields
		const args: unknown = JSON.parse(toolCall.function.arguments);
		assert(typeof args === 'object' && args !== null && 'id' in args);
		expect(args.id).toBe('c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA');
	});
});
