/**
 * E2E test for claude-agent-sdk-integration.ts example
 *
 * Tests the setup of StackOne tools with Claude Agent SDK.
 *
 * Note: The Claude Agent SDK spawns a subprocess to run claude-code, which
 * requires the ANTHROPIC_API_KEY environment variable and a running claude-code
 * installation. This test validates the tool setup and MCP server creation,
 * but does not test the actual query execution.
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { StackOneToolSet } from '../src';

describe('claude-agent-sdk-integration example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('should fetch tools and create Claude Agent SDK tool wrapper', async () => {
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
		assert(employeeTool !== undefined);

		// Create Claude Agent SDK tool from StackOne tool
		const getEmployeeTool = tool(
			employeeTool.name,
			employeeTool.description,
			{
				id: z.string().describe('The employee ID'),
			},
			async (args) => {
				const result = await employeeTool.execute(args);
				return {
					content: [{ type: 'text' as const, text: JSON.stringify(result) }],
				};
			},
		);

		expect(getEmployeeTool.name).toBe('bamboohr_get_employee');
		expect(getEmployeeTool.description).toContain('employee');
		expect(getEmployeeTool.inputSchema).toHaveProperty('id');
		expect(typeof getEmployeeTool.handler).toBe('function');
	});

	it('should create MCP server with StackOne tools', async () => {
		const toolset = new StackOneToolSet({
			accountId: 'your-bamboohr-account-id',
			baseUrl: 'https://api.stackone.com',
		});

		const tools = await toolset.fetchTools();
		const employeeTool = tools.getTool('bamboohr_get_employee');
		assert(employeeTool !== undefined);

		// Create Claude Agent SDK tool
		const getEmployeeTool = tool(
			employeeTool.name,
			employeeTool.description,
			{
				id: z.string().describe('The employee ID'),
			},
			async (args) => {
				const result = await employeeTool.execute(args);
				return {
					content: [{ type: 'text' as const, text: JSON.stringify(result) }],
				};
			},
		);

		// Create an MCP server with the StackOne tool
		const mcpServer = createSdkMcpServer({
			name: 'stackone-tools',
			version: '1.0.0',
			tools: [getEmployeeTool],
		});

		// Verify MCP server was created
		expect(mcpServer).toBeDefined();
		expect(mcpServer.name).toBe('stackone-tools');
		expect(mcpServer.instance).toBeDefined();
	});

	it('should execute tool handler directly', async () => {
		const toolset = new StackOneToolSet({
			accountId: 'your-bamboohr-account-id',
			baseUrl: 'https://api.stackone.com',
		});

		const tools = await toolset.fetchTools();
		const employeeTool = tools.getTool('bamboohr_get_employee');
		assert(employeeTool !== undefined);

		// Create Claude Agent SDK tool
		const getEmployeeTool = tool(
			employeeTool.name,
			employeeTool.description,
			{
				id: z.string().describe('The employee ID'),
			},
			async (args) => {
				const result = await employeeTool.execute(args);
				return {
					content: [{ type: 'text' as const, text: JSON.stringify(result) }],
				};
			},
		);

		// Execute the tool handler directly
		const result = await getEmployeeTool.handler(
			{ id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA' },
			{} as unknown,
		);

		expect(result).toBeDefined();
		expect(result.content).toHaveLength(1);
		expect(result.content[0]?.type).toBe('text');

		// Parse the result text and verify it contains employee data
		const textContent = result.content[0];
		assert(textContent?.type === 'text');
		const data = JSON.parse(textContent.text) as unknown;
		expect(data).toHaveProperty('data');
	});
});
