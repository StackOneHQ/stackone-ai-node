/**
 * E2E test for ai-sdk-integration.ts example
 *
 * Tests the complete flow of using StackOne tools with the AI SDK,
 * including both fetchTools and semantic search paths.
 */

import { openai } from '@ai-sdk/openai';
import { generateText, stepCountIs } from 'ai';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/node';
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

	it('should discover tools via semantic search, convert to AI SDK format, and generate text', async () => {
		// Mock semantic search to return bamboohr results
		server.use(
			http.post('https://api.stackone.com/actions/search', async ({ request }) => {
				const body = (await request.json()) as { query: string };
				return HttpResponse.json({
					results: [
						{
							action_name: 'bamboohr_1.0.0_bamboohr_get_employee_global',
							connector_key: 'bamboohr',
							similarity_score: 0.95,
							label: 'Get Employee',
							description: 'Get employee details from BambooHR',
						},
						{
							action_name: 'bamboohr_1.0.0_bamboohr_list_employees_global',
							connector_key: 'bamboohr',
							similarity_score: 0.88,
							label: 'List Employees',
							description: 'List all employees from BambooHR',
						},
					],
					total_count: 2,
					query: body.query,
				});
			}),
		);

		const toolset = new StackOneToolSet({
			accountId: 'your-bamboohr-account-id',
			baseUrl: 'https://api.stackone.com',
		});

		// Discover tools via semantic search
		const tools = await toolset.searchTools('get employee details', { topK: 5 });
		expect(tools.length).toBeGreaterThan(0);

		// Convert to AI SDK tools
		const aiSdkTools = await tools.toAISDK();
		expect(Object.keys(aiSdkTools).length).toBeGreaterThan(0);
		expect(aiSdkTools).toHaveProperty('bamboohr_get_employee');

		// Each tool should have execute function
		for (const name of Object.keys(aiSdkTools)) {
			expect(typeof aiSdkTools[name].execute).toBe('function');
			expect(aiSdkTools[name].inputSchema).toBeDefined();
		}

		// Use with generateText
		const { text } = await generateText({
			model: openai('gpt-5'),
			tools: aiSdkTools,
			prompt: 'Get all details about employee with id: c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
			stopWhen: stepCountIs(3),
		});

		expect(text).toContain('Michael');
	});
});
