/**
 * E2E test for claude-agent-sdk-integration.ts example
 *
 * Tests the MCP server that `tools.toClaudeAgentSdk()` hands to the Claude Agent SDK.
 *
 * Note: The Claude Agent SDK spawns a subprocess to run claude-code, which
 * requires the ANTHROPIC_API_KEY environment variable and a running claude-code
 * installation. This test connects an MCP client to the server instead, which is
 * what the SDK does, but does not test the actual query execution.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { TEST_BASE_URL } from '../../mocks/constants';
import { StackOneToolSet } from '../../src';

const fetchTools = async () => {
	const toolset = new StackOneToolSet({
		accountId: 'your-bamboohr-account-id',
		baseUrl: TEST_BASE_URL,
	});
	return toolset.fetchTools();
};

/** Connects an MCP client to the server, as the Claude Agent SDK does. */
const connect = async (tools: Awaited<ReturnType<typeof fetchTools>>): Promise<Client> => {
	const { instance } = await tools.toClaudeAgentSdk();
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	const client = new Client({ name: 'claude-agent-sdk', version: '1.0.0' });
	await instance.connect(serverTransport);
	await client.connect(clientTransport);
	return client;
};

describe('claude-agent-sdk-integration example e2e', () => {
	beforeEach(() => {
		vi.stubEnv('STACKONE_API_KEY', 'test-key');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('creates an SDK MCP server from the fetched tools', async () => {
		const mcpServer = await (await fetchTools()).toClaudeAgentSdk();

		expect(mcpServer).toMatchObject({ type: 'sdk', name: 'stackone-tools' });
		expect(mcpServer.instance).toBeDefined();
	});

	it('serves each tool with its schema', async () => {
		const tools = await fetchTools();
		const client = await connect(tools);

		const { tools: listed } = await client.listTools();
		await client.close();

		const employeeTool = tools.getTool('bamboohr_get_employee');
		assert(employeeTool !== undefined);
		expect(listed.find((tool) => tool.name === 'bamboohr_get_employee')?.inputSchema).toEqual(
			employeeTool.toAnthropic().input_schema,
		);
	});

	it('runs a tool call with the model arguments against StackOne', async () => {
		const client = await connect(await fetchTools());

		const result = await client.callTool({
			name: 'bamboohr_get_employee',
			arguments: { id: 'c28xIQaWQ6MzM5MzczMDA2NzMzMzkwNzIwNA' },
		});
		await client.close();

		expect(result.isError).toBeUndefined();
		const [content] = CallToolResultSchema.parse(result).content;
		assert(content?.type === 'text');
		expect(JSON.parse(content.text)).toMatchObject({ isError: false, result: { data: {} } });
	});
});
