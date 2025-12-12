/**
 * E2E test for ai-sdk-integration.ts example
 *
 * Tests the complete flow of using StackOne tools with the AI SDK.
 */

import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs } from 'ai';
import { StackOneToolSet } from '../src';

describe('ai-sdk-integration example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
		vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should fetch tools, convert to AI SDK format, and generate text with tool calls', async () => {
		const toolset = new StackOneToolSet({
			accountId: 'your-bamboohr-account-id',
			baseUrl: 'https://api.stackone.com',
		});

		// Fetch all tools for this account via MCP
		const tools = await toolset.fetchTools();
		expect(tools.length).toBeGreaterThan(0);

		// Convert to AI SDK tools
		const aiSdkTools = await tools.toAISDK();
		expect(aiSdkTools).toBeDefined();
		expect(Object.keys(aiSdkTools).length).toBeGreaterThan(0);

		// Verify the tools have the expected structure
		const toolNames = Object.keys(aiSdkTools);
		expect(toolNames).toContain('bamboohr_list_employees');
		expect(toolNames).toContain('bamboohr_get_employee');

		// The AI SDK will automatically call the tool if needed
		const { text } = await generateText({
			model: openai('gpt-5'),
			tools: aiSdkTools,
			prompt: 'Get all details about employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
			stopWhen: stepCountIs(3),
		});

		// The mocked OpenAI response includes 'Michael' in the text
		expect(text).toContain('Michael');
	});
});
