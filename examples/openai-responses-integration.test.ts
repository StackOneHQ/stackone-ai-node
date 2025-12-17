/**
 * E2E test for openai-responses-integration.ts example
 *
 * Tests the complete flow of using StackOne tools with OpenAI Responses API.
 */

import OpenAI from 'openai';
import { StackOneToolSet } from '../src';

describe('openai-responses-integration example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
		vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should fetch tools, convert to OpenAI Responses format, and create response with tool calls', async () => {
		const toolset = new StackOneToolSet({
			accountId: 'your-stackone-account-id',
		});

		// Fetch tools via MCP with action filter
		const tools = await toolset.fetchTools({
			actions: ['*_list_*'],
		});
		const openAIResponsesTools = tools.toOpenAIResponses();

		// Verify tools are in OpenAI Responses format
		expect(Array.isArray(openAIResponsesTools)).toBe(true);
		expect(openAIResponsesTools.length).toBeGreaterThan(0);

		// Initialize OpenAI client
		const openai = new OpenAI();

		// Create a response with tool calls using the Responses API
		const response = await openai.responses.create({
			model: 'gpt-5',
			instructions: 'You are a helpful assistant that can access various tools.',
			input: 'What is the employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA phone number?',
			tools: openAIResponsesTools,
		});

		// Verify the response contains expected data
		expect(response.id).toBeDefined();
		expect(response.model).toBeDefined();

		// Check if the model made any tool calls
		const toolCalls = response.output.filter(
			(item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === 'function_call',
		);

		expect(toolCalls.length).toBeGreaterThan(0);

		const toolCall = toolCalls[0];
		expect(toolCall.name).toBe('bamboohr_get_employee');

		// Parse the arguments to verify they contain the expected fields
		const args = JSON.parse(toolCall.arguments);
		expect(args.id).toBe('c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA');
	});
});
