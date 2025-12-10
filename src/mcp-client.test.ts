/**
 * MCP client factory tests.
 * Tests the createMCPClient function for creating MCP protocol clients.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createMCPClient } from './mcp-client';

test('createMCPClient creates client with required options', async () => {
	const mcpClient = await createMCPClient({
		baseUrl: 'https://api.example.com/mcp',
	});

	expect(mcpClient.client).toBeInstanceOf(Client);
	expect(mcpClient.transport).toBeInstanceOf(StreamableHTTPClientTransport);
	expect(typeof mcpClient[Symbol.asyncDispose]).toBe('function');
});

test('createMCPClient creates client with custom headers', async () => {
	const mcpClient = await createMCPClient({
		baseUrl: 'https://api.example.com/mcp',
		headers: {
			Authorization: 'Bearer test-token',
			'x-custom-header': 'custom-value',
		},
	});

	expect(mcpClient.client).toBeInstanceOf(Client);
	expect(mcpClient.transport).toBeInstanceOf(StreamableHTTPClientTransport);
});

test('createMCPClient provides asyncDispose for cleanup', async () => {
	const mcpClient = await createMCPClient({
		baseUrl: 'https://api.example.com/mcp',
	});

	// Spy on close methods
	const clientCloseSpy = vi.spyOn(mcpClient.client, 'close').mockResolvedValue(undefined);
	const transportCloseSpy = vi.spyOn(mcpClient.transport, 'close').mockResolvedValue(undefined);

	// Call asyncDispose
	await mcpClient[Symbol.asyncDispose]();

	expect(clientCloseSpy).toHaveBeenCalledOnce();
	expect(transportCloseSpy).toHaveBeenCalledOnce();
});

test('createMCPClient can connect and list tools from MCP server', async () => {
	await using mcpClient = await createMCPClient({
		baseUrl: 'https://api.stackone-dev.com/mcp',
		headers: {
			Authorization: `Basic ${Buffer.from('test-key:').toString('base64')}`,
			'x-account-id': 'test-account',
		},
	});

	await mcpClient.client.connect(mcpClient.transport);
	const result = await mcpClient.client.listTools();

	expect(result.tools).toBeDefined();
	expect(Array.isArray(result.tools)).toBe(true);
	expect(result.tools.length).toBeGreaterThan(0);

	const tool = result.tools[0];
	expect(tool.name).toBe('dummy_action');
	expect(tool.description).toBe('Dummy tool');
	expect(tool.inputSchema).toBeDefined();
});
