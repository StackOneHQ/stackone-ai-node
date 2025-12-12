/**
 * E2E test for tanstack-ai-integration.ts example
 *
 * Tests the complete flow of using StackOne tools with TanStack AI.
 *
 * Note: TanStack AI requires Zod schemas for tool input validation.
 * This test validates tool setup and schema conversion, but the actual
 * chat() call requires Zod schemas which are not directly exposed by
 * StackOne tools.
 */

import { StackOneToolSet } from '../src';

describe('tanstack-ai-integration example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
		vi.stubEnv('OPENAI_API_KEY', 'test-openai-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should fetch tools and convert to TanStack AI format', async () => {
		const toolset = new StackOneToolSet({
			accountId: 'your-bamboohr-account-id',
			baseUrl: 'https://api.stackone.com',
		});

		// Fetch all tools for this account via MCP
		const tools = await toolset.fetchTools();
		expect(tools.length).toBeGreaterThan(0);

		// Get a specific tool
		const employeeTool = tools.getTool('bamboohr_get_employee');
		expect(employeeTool).toBeDefined();

		// Create TanStack AI compatible tool wrapper
		// Use toJsonSchema() to get the parameter schema in JSON Schema format
		const getEmployeeTool = {
			name: employeeTool!.name,
			description: employeeTool!.description,
			inputSchema: employeeTool!.toJsonSchema(),
			execute: async (args: Record<string, unknown>) => {
				return employeeTool!.execute(args);
			},
		};

		expect(getEmployeeTool.name).toBe('bamboohr_get_employee');
		expect(getEmployeeTool.description).toContain('employee');
		expect(getEmployeeTool.inputSchema).toBeDefined();
		expect(getEmployeeTool.inputSchema.type).toBe('object');
		expect(typeof getEmployeeTool.execute).toBe('function');
	});

	it('should execute tool directly', async () => {
		const toolset = new StackOneToolSet({
			accountId: 'your-bamboohr-account-id',
			baseUrl: 'https://api.stackone.com',
		});

		const tools = await toolset.fetchTools();
		const employeeTool = tools.getTool('bamboohr_get_employee');
		assert(employeeTool !== undefined, 'Expected to find bamboohr_get_employee tool');

		// Create TanStack AI compatible tool wrapper
		const getEmployeeTool = {
			name: employeeTool.name,
			description: employeeTool.description,
			inputSchema: employeeTool.toJsonSchema(),
			execute: async (args: Record<string, unknown>) => {
				return employeeTool.execute(args);
			},
		};

		// Execute the tool directly to verify it works
		const result = await getEmployeeTool.execute({
			id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA',
		});

		expect(result).toBeDefined();
		expect(result).toHaveProperty('data');
	});
});
