import { jsonSchema } from 'ai';
import { BaseTool, StackOneTool, Tools } from './tool';
import {
	type ExecuteConfig,
	type JSONSchema,
	ParameterLocation,
	type ToolParameters,
} from './types';
import { StackOneAPIError } from './utils/error-stackone-api';

// Create a mock tool for testing
const createMockTool = (headers?: Record<string, string>): BaseTool => {
	const name = 'test_tool';
	const description = 'Test tool';
	const parameters: ToolParameters = {
		type: 'object',
		properties: { id: { type: 'string', description: 'ID parameter' } },
	};
	const executeConfig: ExecuteConfig = {
		kind: 'http',
		method: 'GET',
		url: 'https://api.example.com/test/{id}',
		bodyType: 'json',
		params: [
			{
				name: 'id',
				location: ParameterLocation.PATH,
				type: 'string',
			},
		],
	};

	return new BaseTool(name, description, parameters, executeConfig, headers);
};

describe('StackOneTool', () => {
	it('should execute with parameters', async () => {
		const tool = createMockTool();
		const result = await tool.execute({ id: '123' });
		expect(result).toEqual({ id: '123', name: 'Test' });
	});

	it('should execute with string arguments', async () => {
		const tool = createMockTool();
		const result = await tool.execute('{"id":"123"}');

		expect(result).toEqual({ id: '123', name: 'Test' });
	});

	it('should handle API errors', async () => {
		const tool = createMockTool();

		await expect(tool.execute({ id: 'invalid' })).rejects.toSatisfy((error) => {
			expect(error).toBeInstanceOf(StackOneAPIError);
			const apiError = error as StackOneAPIError;
			expect(apiError.statusCode).toBe(400);
			expect(apiError.responseBody).toEqual({ error: 'Invalid ID' });
			return true;
		});
	});

	it('should convert to OpenAI Chat Completions API tool format', () => {
		const tool = createMockTool();
		const openAIFormat = tool.toOpenAI();

		expect(openAIFormat.type).toBe('function');
		expect(openAIFormat.function.name).toBe('test_tool');
		expect(openAIFormat.function.description).toBe('Test tool');
		expect(openAIFormat.function.parameters?.type).toBe('object');
		expect(
			(
				openAIFormat.function.parameters as {
					properties: { id: { type: string } };
				}
			).properties.id.type,
		).toBe('string');
	});

	it('should convert to Anthropic tool format', () => {
		const tool = createMockTool();
		const anthropicFormat = tool.toAnthropic();

		expect(anthropicFormat.name).toBe('test_tool');
		expect(anthropicFormat.description).toBe('Test tool');
		expect(anthropicFormat.input_schema.type).toBe('object');
		const properties = anthropicFormat.input_schema.properties as Record<string, { type: string }>;
		expect(properties.id).toBeDefined();
		expect(properties.id.type).toBe('string');
	});

	it('should convert to OpenAI Responses API tool format', () => {
		const tool = createMockTool();
		const responsesFormat = tool.toOpenAIResponses();

		expect(responsesFormat.type).toBe('function');
		expect(responsesFormat.name).toBe('test_tool');
		expect(responsesFormat.description).toBe('Test tool');
		expect(responsesFormat.strict).toBe(true);
		expect(responsesFormat.parameters?.type).toBe('object');
		expect(
			(
				responsesFormat.parameters as {
					properties: { id: { type: string } };
					additionalProperties: boolean;
				}
			).properties.id.type,
		).toBe('string');
		expect(
			(responsesFormat.parameters as { additionalProperties: boolean }).additionalProperties,
		).toBe(false);
	});

	it('should convert to OpenAI Responses API tool format with strict disabled', () => {
		const tool = createMockTool();
		const responsesFormat = tool.toOpenAIResponses({ strict: false });

		expect(responsesFormat.type).toBe('function');
		expect(responsesFormat.name).toBe('test_tool');
		expect(responsesFormat.strict).toBe(false);
		expect(responsesFormat.parameters).toBeDefined();
		expect(
			(responsesFormat.parameters as { additionalProperties?: boolean }).additionalProperties,
		).toBeUndefined();
	});

	it('should convert to AI SDK tool format', async () => {
		const tool = createMockTool();

		const aiSdkTool = await tool.toAISDK();

		// Test the basic structure
		expect(aiSdkTool).toBeDefined();
		expect(aiSdkTool.test_tool).toBeDefined();
		expect(typeof aiSdkTool.test_tool.execute).toBe('function');
		expect(aiSdkTool.test_tool.description).toBe('Test tool');
		expect(aiSdkTool.test_tool.inputSchema).toBeDefined();

		// TODO: Remove ts-ignore once AISDKToolDefinition properly types inputSchema.jsonSchema
		// @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
		const schema = aiSdkTool.test_tool.inputSchema.jsonSchema;
		expect(schema).toBeDefined();
		expect(schema.type).toBe('object');
		expect(schema.properties?.id).toBeDefined();
		expect(schema.properties?.id.type).toBe('string');
	});

	it('should convert to Claude Agent SDK tool format', async () => {
		const tool = createMockTool();

		const claudeTool = await tool.toClaudeAgentSdkTool();

		expect(claudeTool).toBeDefined();
		expect(claudeTool.name).toBe('test_tool');
		expect(claudeTool.description).toBe('Test tool');
		expect(claudeTool.inputSchema).toBeDefined();
		expect(typeof claudeTool.handler).toBe('function');

		// Test the handler returns content in the expected format
		const result = await claudeTool.handler({ id: 'test-123' });
		expect(result).toHaveProperty('content');
		expect(Array.isArray(result.content)).toBe(true);
		expect(result.content[0]).toHaveProperty('type', 'text');
		expect(result.content[0]).toHaveProperty('text');
	});

	it('should include execution metadata by default in AI SDK conversion', async () => {
		const tool = createMockTool();

		const aiSdkTool = await tool.toAISDK();
		const execution = aiSdkTool.test_tool.execution;

		expect(execution).toBeDefined();
		expect(execution?.config.kind).toBe('http');
		if (execution?.config.kind === 'http') {
			expect(execution.config.method).toBe('GET');
			expect(execution.config.url).toBe('https://api.example.com/test/{id}');
		}
		expect(execution?.headers).toEqual({});
	});

	it('should allow disabling execution metadata exposure for AI SDK conversion', async () => {
		const tool = createMockTool().setExposeExecutionMetadata(false);

		const aiSdkTool = await tool.toAISDK();

		expect(aiSdkTool.test_tool.execution).toBeUndefined();
	});

	it('should convert complex parameter types to zod schema', async () => {
		const complexTool = new BaseTool(
			'complex_tool',
			'Complex tool',
			{
				type: 'object',
				properties: {
					stringParam: { type: 'string', description: 'A string parameter' },
					numberParam: { type: 'number', description: 'A number parameter' },
					booleanParam: { type: 'boolean', description: 'A boolean parameter' },
					arrayParam: {
						type: 'array',
						description: 'An array parameter',
						items: { type: 'string' },
					},
					objectParam: {
						type: 'object',
						description: 'An object parameter',
						properties: { nestedString: { type: 'string' } },
					},
				},
			},
			{
				kind: 'http',
				method: 'GET',
				url: 'https://example.com/complex',
				bodyType: 'json',
				params: [],
			},
		);

		const aiSdkTool = await complexTool.toAISDK();

		// Check that the tool is defined
		expect(aiSdkTool).toBeDefined();
		expect(aiSdkTool.complex_tool).toBeDefined();

		// Check that inputSchema is defined
		expect(aiSdkTool.complex_tool.inputSchema).toBeDefined();

		// TODO: Remove ts-ignore once AISDKToolDefinition properly types inputSchema.jsonSchema
		// @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
		const schema = aiSdkTool.complex_tool.inputSchema.jsonSchema;
		expect(schema).toBeDefined();
		expect(schema.type).toBe('object');

		// Check that the properties are defined with correct types
		expect(schema.properties).toBeDefined();
		expect(schema.properties?.stringParam.type).toBe('string');
		expect(schema.properties?.numberParam.type).toBe('number');
		expect(schema.properties?.booleanParam.type).toBe('boolean');
		expect(schema.properties?.arrayParam.type).toBe('array');
		expect(schema.properties?.objectParam.type).toBe('object');
	});

	it('should execute AI SDK tool with parameters', async () => {
		const tool = createMockTool();
		const aiSdkTool = await tool.toAISDK();

		expect(aiSdkTool.test_tool.execute).toBeDefined();

		const result = await aiSdkTool.test_tool.execute?.(
			{ id: '123' },
			{ toolCallId: 'test-tool-call-id', messages: [] },
		);
		expect(result).toEqual({ id: '123', name: 'Test' });
	});

	it('should return error message as string when AI SDK tool execution fails', async () => {
		const tool = createMockTool();
		const aiSdkTool = await tool.toAISDK();

		expect(aiSdkTool.test_tool.execute).toBeDefined();

		// 'invalid' id returns 400 error via MSW handler
		const result = await aiSdkTool.test_tool.execute?.(
			{ id: 'invalid' },
			{ toolCallId: 'test-tool-call-id', messages: [] },
		);
		expect(result).toMatch(/Error executing tool:/);
	});

	it('should set and get headers', () => {
		const tool = createMockTool();

		// Set headers
		const headers = { 'X-Custom-Header': 'test-value' };
		tool.setHeaders(headers);

		// Headers should include custom header
		const updatedHeaders = tool.getHeaders();
		expect(updatedHeaders['X-Custom-Header']).toBe('test-value');

		// Set additional headers
		tool.setHeaders({ 'X-Another-Header': 'another-value' });

		// Headers should include all headers
		const finalHeaders = tool.getHeaders();
		expect(finalHeaders['X-Custom-Header']).toBe('test-value');
		expect(finalHeaders['X-Another-Header']).toBe('another-value');
	});

	it('should use basic authentication', async () => {
		const headers = {
			Authorization: `Basic ${Buffer.from('testuser:testpass').toString('base64')}`,
		};
		const tool = createMockTool(headers);

		const result = await tool.execute({ id: '123' });
		expect(result).toEqual({ id: '123', name: 'Test' });
	});

	it('should use bearer authentication', async () => {
		const headers = {
			Authorization: 'Bearer test-token',
		};
		const tool = createMockTool(headers);

		const result = await tool.execute({ id: '123' });
		expect(result).toEqual({ id: '123', name: 'Test' });
	});

	it('should use api-key authentication', async () => {
		const apiKey = 'test-api-key';
		const headers = {
			Authorization: `Bearer ${apiKey}`,
		};
		const tool = createMockTool(headers);

		const result = await tool.execute({ id: '123' });
		expect(result).toEqual({ id: '123', name: 'Test' });
	});
});

describe('BaseTool - additional coverage', () => {
	it('should throw error when execute is called on non-HTTP tool', async () => {
		const rpcTool = new BaseTool(
			'rpc_tool',
			'RPC tool',
			{ type: 'object', properties: {} },
			{
				kind: 'rpc',
				method: 'test_method',
				url: 'https://api.example.com/rpc',
				payloadKeys: { action: 'action', body: 'body' },
			},
		);

		await expect(rpcTool.execute({})).rejects.toThrow(
			'BaseTool.execute is only available for HTTP-backed tools',
		);
	});

	it('should throw error for invalid parameter type', async () => {
		const tool = createMockTool();

		// @ts-expect-error - intentionally passing invalid type
		await expect(tool.execute(12345)).rejects.toThrow('Invalid parameters type');
	});

	it('should create execution metadata for RPC config in toAISDK', async () => {
		const rpcTool = new BaseTool(
			'rpc_tool',
			'RPC tool',
			{ type: 'object', properties: {} },
			{
				kind: 'rpc',
				method: 'test_method',
				url: 'https://api.example.com/rpc',
				payloadKeys: { action: 'action', body: 'body', headers: 'headers' },
			},
		);

		const aiSdkTool = await rpcTool.toAISDK({ executable: false });
		const execution = aiSdkTool.rpc_tool.execution;

		expect(execution).toBeDefined();
		expect(execution?.config.kind).toBe('rpc');
		if (execution?.config.kind === 'rpc') {
			expect(execution.config.method).toBe('test_method');
			expect(execution.config.url).toBe('https://api.example.com/rpc');
			expect(execution.config.payloadKeys).toEqual({
				action: 'action',
				body: 'body',
				headers: 'headers',
			});
		}
	});

	it('should create execution metadata for local config in toAISDK', async () => {
		const localTool = new BaseTool(
			'local_tool',
			'Local tool',
			{ type: 'object', properties: {} },
			{
				kind: 'local',
				identifier: 'local_test',
				description: 'local://test',
			},
		);

		const aiSdkTool = await localTool.toAISDK({ executable: false });
		const execution = aiSdkTool.local_tool.execution;

		expect(execution).toBeDefined();
		expect(execution?.config.kind).toBe('local');
		if (execution?.config.kind === 'local') {
			expect(execution.config.identifier).toBe('local_test');
			expect(execution.config.description).toBe('local://test');
		}
	});

	it('should allow providing custom execution metadata in toAISDK', async () => {
		const tool = createMockTool();
		const customExecution = {
			config: {
				kind: 'http' as const,
				method: 'POST' as const,
				url: 'https://custom.example.com',
				bodyType: 'json' as const,
				params: [],
			},
			headers: { 'X-Custom': 'value' },
		};

		const aiSdkTool = await tool.toAISDK({ execution: customExecution });
		const execution = aiSdkTool.test_tool.execution;

		expect(execution).toBeDefined();
		expect(execution?.config.kind).toBe('http');
		if (execution?.config.kind === 'http') {
			expect(execution.config.url).toBe('https://custom.example.com');
		}
		expect(execution?.headers).toEqual({ 'X-Custom': 'value' });
	});

	it('should return undefined execution when execution option is false', async () => {
		const tool = createMockTool();

		const aiSdkTool = await tool.toAISDK({ execution: false });
		expect(aiSdkTool.test_tool.execution).toBeUndefined();
	});

	it('should return undefined execute when executable option is false', async () => {
		const tool = createMockTool();

		const aiSdkTool = await tool.toAISDK({ executable: false });
		expect(aiSdkTool.test_tool.execute).toBeUndefined();
	});

	it('should get headers from tool without requestBuilder', () => {
		const rpcTool = new BaseTool(
			'rpc_tool',
			'RPC tool',
			{ type: 'object', properties: {} },
			{
				kind: 'rpc',
				method: 'test_method',
				url: 'https://api.example.com/rpc',
				payloadKeys: { action: 'action', body: 'body' },
			},
			{ 'X-Custom': 'value' },
		);

		expect(rpcTool.getHeaders()).toEqual({ 'X-Custom': 'value' });
	});

	it('should set headers on tool without requestBuilder', () => {
		const rpcTool = new BaseTool(
			'rpc_tool',
			'RPC tool',
			{ type: 'object', properties: {} },
			{
				kind: 'rpc',
				method: 'test_method',
				url: 'https://api.example.com/rpc',
				payloadKeys: { action: 'action', body: 'body' },
			},
		);

		rpcTool.setHeaders({ 'X-New-Header': 'new-value' });
		expect(rpcTool.getHeaders()).toEqual({ 'X-New-Header': 'new-value' });
	});
});

describe('Tools', () => {
	it('should get tool by name', () => {
		const tool = createMockTool();
		const tools = new Tools([tool]);

		expect(tools.getTool('test_tool')).toBe(tool);
		expect(tools.getTool('nonexistent')).toBeUndefined();
	});

	it('should convert all tools to OpenAI format', () => {
		const tool1 = new BaseTool(
			'tool1',
			'Tool 1',
			{
				type: 'object',
				properties: { id: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'GET',
				url: 'https://api.example.com/test/{id}',
				bodyType: 'json',
				params: [
					{
						name: 'id',
						location: ParameterLocation.PATH,
						type: 'string',
					},
				],
			},
		);

		const tool2 = new BaseTool(
			'tool2',
			'Tool 2',
			{
				type: 'object',
				properties: { id: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'GET',
				url: 'https://api.example.com/test/{id}',
				bodyType: 'json',
				params: [
					{
						name: 'id',
						location: ParameterLocation.PATH,
						type: 'string',
					},
				],
			},
			{
				authorization: 'Bearer test_key',
			},
		);

		const tools = new Tools([tool1, tool2]);
		const openAITools = tools.toOpenAI();

		expect(openAITools).toBeInstanceOf(Array);
		expect(openAITools.length).toBe(2);
		expect(openAITools[0].type).toBe('function');
		expect(openAITools[0].function.name).toBe('tool1');
		expect(openAITools[1].function.name).toBe('tool2');
	});

	it('should convert all tools to Anthropic format', () => {
		const tool1 = new BaseTool(
			'tool1',
			'Tool 1',
			{
				type: 'object',
				properties: { id: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'GET',
				url: 'https://api.example.com/test/{id}',
				bodyType: 'json',
				params: [
					{
						name: 'id',
						location: ParameterLocation.PATH,
						type: 'string',
					},
				],
			},
		);

		const tool2 = new BaseTool(
			'tool2',
			'Tool 2',
			{
				type: 'object',
				properties: { name: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/test',
				bodyType: 'json',
				params: [
					{
						name: 'name',
						location: ParameterLocation.BODY,
						type: 'string',
					},
				],
			},
		);

		const tools = new Tools([tool1, tool2]);
		const anthropicTools = tools.toAnthropic();

		expect(anthropicTools).toBeInstanceOf(Array);
		expect(anthropicTools.length).toBe(2);
		expect(anthropicTools[0].name).toBe('tool1');
		expect(anthropicTools[0].description).toBe('Tool 1');
		expect(anthropicTools[0].input_schema.type).toBe('object');
		expect(anthropicTools[1].name).toBe('tool2');
		expect(anthropicTools[1].description).toBe('Tool 2');
	});

	it('should convert all tools to OpenAI Responses API tools', () => {
		const tool1 = new StackOneTool(
			'tool1',
			'Tool 1',
			{
				type: 'object',
				properties: { id: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'GET',
				url: 'https://api.example.com/test/{id}',
				bodyType: 'json',
				params: [],
			},
		);
		const tool2 = new StackOneTool(
			'tool2',
			'Tool 2',
			{
				type: 'object',
				properties: { name: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/test',
				bodyType: 'json',
				params: [],
			},
		);

		const tools = new Tools([tool1, tool2]);
		const responsesTools = tools.toOpenAIResponses();

		expect(responsesTools).toBeInstanceOf(Array);
		expect(responsesTools.length).toBe(2);
		expect(responsesTools[0].type).toBe('function');
		expect(responsesTools[0].name).toBe('tool1');
		expect(responsesTools[0].strict).toBe(true);
		expect(responsesTools[1].name).toBe('tool2');
		expect(responsesTools[1].strict).toBe(true);
	});

	it('should convert all tools to OpenAI Responses API tools with strict disabled', () => {
		const tool1 = createMockTool();
		const tools = new Tools([tool1]);
		const responsesTools = tools.toOpenAIResponses({ strict: false });

		expect(responsesTools[0].strict).toBe(false);
	});

	it('should convert all tools to AI SDK tools', async () => {
		const tool1 = createMockTool();
		const tool2 = new StackOneTool(
			'another_tool',
			'Another tool',
			{
				type: 'object',
				properties: { name: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/test',
				bodyType: 'json',
				params: [
					{
						name: 'name',
						location: ParameterLocation.BODY,
						type: 'string',
					},
				],
			},
			{
				authorization: 'Bearer test_key',
			},
		);

		const tools = new Tools([tool1, tool2]);

		const aiSdkTools = await tools.toAISDK();

		expect(Object.keys(aiSdkTools).length).toBe(2);
		expect(aiSdkTools.test_tool).toBeDefined();
		expect(aiSdkTools.another_tool).toBeDefined();
		expect(typeof aiSdkTools.test_tool.execute).toBe('function');
		expect(typeof aiSdkTools.another_tool.execute).toBe('function');
	});

	it('should convert all tools to Claude Agent SDK MCP server', async () => {
		const tool1 = createMockTool();
		const tool2 = new StackOneTool(
			'another_tool',
			'Another tool',
			{
				type: 'object',
				properties: { name: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/test',
				bodyType: 'json',
				params: [
					{
						name: 'name',
						location: ParameterLocation.BODY,
						type: 'string',
					},
				],
			},
			{
				authorization: 'Bearer test_key',
			},
		);

		const tools = new Tools([tool1, tool2]);

		const mcpServer = await tools.toClaudeAgentSdk();

		expect(mcpServer).toBeDefined();
		expect(mcpServer.type).toBe('sdk');
		expect(mcpServer.name).toBe('stackone-tools');
		expect(mcpServer.instance).toBeDefined();
	});

	it('should convert all tools to Claude Agent SDK MCP server with custom options', async () => {
		const tool1 = createMockTool();
		const tools = new Tools([tool1]);

		const mcpServer = await tools.toClaudeAgentSdk({
			serverName: 'my-custom-server',
			serverVersion: '2.0.0',
		});

		expect(mcpServer).toBeDefined();
		expect(mcpServer.type).toBe('sdk');
		expect(mcpServer.name).toBe('my-custom-server');
		expect(mcpServer.instance).toBeDefined();
	});

	it('should be iterable', () => {
		const tool1 = createMockTool();
		const tool2 = new StackOneTool(
			'another_tool',
			'Another tool',
			{
				type: 'object',
				properties: { name: { type: 'string' } },
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/test',
				bodyType: 'json',
				params: [
					{
						name: 'name',
						location: ParameterLocation.BODY,
						type: 'string',
					},
				],
			},
			{
				authorization: 'Bearer test_key',
			},
		);

		const tools = new Tools([tool1, tool2]);

		let count = 0;
		for (const tool of tools) {
			expect(tool).toBeDefined();
			expect(tool.name).toBeDefined();
			count++;
		}

		expect(count).toBe(2);
	});
});

describe('BaseTool.connector', () => {
	it('should extract connector prefix from tool name', () => {
		const tool = new BaseTool(
			'bamboohr_list_employees',
			'List employees',
			{ type: 'object', properties: {} },
			{ kind: 'http', method: 'GET', url: 'https://example.com', bodyType: 'json', params: [] },
		);
		expect(tool.connector).toBe('bamboohr');
	});

	it('should return the name itself for single-segment names', () => {
		const tool = new BaseTool(
			'bamboohr',
			'BambooHR',
			{ type: 'object', properties: {} },
			{ kind: 'http', method: 'GET', url: 'https://example.com', bodyType: 'json', params: [] },
		);
		expect(tool.connector).toBe('bamboohr');
	});

	it('should return empty string for empty name', () => {
		const tool = new BaseTool(
			'',
			'Empty',
			{ type: 'object', properties: {} },
			{ kind: 'http', method: 'GET', url: 'https://example.com', bodyType: 'json', params: [] },
		);
		expect(tool.connector).toBe('');
	});

	it('should return lowercase connector', () => {
		const tool = new BaseTool(
			'BambooHR_create_employee',
			'Create employee',
			{ type: 'object', properties: {} },
			{ kind: 'http', method: 'POST', url: 'https://example.com', bodyType: 'json', params: [] },
		);
		expect(tool.connector).toBe('bamboohr');
	});
});

describe('Tools.getConnectors', () => {
	it('should return unique connector names from tool names', () => {
		const tools = new Tools([
			new BaseTool(
				'bamboohr_create_employee',
				'Create employee',
				{ type: 'object', properties: {} },
				{ kind: 'http', method: 'POST', url: 'https://example.com', bodyType: 'json', params: [] },
			),
			new BaseTool(
				'bamboohr_list_employees',
				'List employees',
				{ type: 'object', properties: {} },
				{ kind: 'http', method: 'GET', url: 'https://example.com', bodyType: 'json', params: [] },
			),
			new BaseTool(
				'hibob_create_employee',
				'Create employee',
				{ type: 'object', properties: {} },
				{ kind: 'http', method: 'POST', url: 'https://example.com', bodyType: 'json', params: [] },
			),
			new BaseTool(
				'slack_send_message',
				'Send message',
				{ type: 'object', properties: {} },
				{ kind: 'http', method: 'POST', url: 'https://example.com', bodyType: 'json', params: [] },
			),
		]);

		const connectors = tools.getConnectors();
		expect(connectors).toEqual(new Set(['bamboohr', 'hibob', 'slack']));
	});

	it('should return empty set for empty tools', () => {
		const tools = new Tools([]);
		expect(tools.getConnectors()).toEqual(new Set());
	});

	it('should return lowercase connector names', () => {
		const tools = new Tools([
			new BaseTool(
				'BambooHR_create_employee',
				'Create employee',
				{ type: 'object', properties: {} },
				{ kind: 'http', method: 'POST', url: 'https://example.com', bodyType: 'json', params: [] },
			),
		]);

		const connectors = tools.getConnectors();
		expect(connectors).toEqual(new Set(['bamboohr']));
	});
});

describe('Schema Validation', () => {
	describe('Array Items in Schema', () => {
		it('should preserve array items when provided', () => {
			const tool = new StackOneTool(
				'test_tool',
				'Test tool',
				{
					type: 'object',
					properties: {
						arrayWithItems: {
							type: 'array',
							description: 'Array with items',
							items: { type: 'number' },
						},
					},
				},
				{
					kind: 'http',
					method: 'GET',
					url: 'https://example.com/test',
					bodyType: 'json',
					params: [],
				},
				{ authorization: 'Bearer test_api_key' },
			);

			const parameters = tool.toOpenAI().function.parameters;
			const properties = parameters?.properties as Record<string, JSONSchema>;

			expect(properties.arrayWithItems.items).toBeDefined();
			expect((properties.arrayWithItems.items as JSONSchema).type).toBe('number');
		});

		it('should handle nested object structure', () => {
			const tool = new StackOneTool(
				'test_tool',
				'Test tool',
				{
					type: 'object',
					properties: {
						nestedObject: {
							type: 'object',
							properties: {
								nestedArray: {
									type: 'array',
									items: { type: 'string' },
								},
							},
						},
					},
				},
				{
					kind: 'http',
					method: 'GET',
					url: 'https://example.com/test',
					bodyType: 'json',
					params: [],
				},
				{ authorization: 'Bearer test_api_key' },
			);

			const parameters = tool.toOpenAI().function.parameters;
			expect(parameters).toBeDefined();
			const properties = parameters?.properties as Record<string, JSONSchema>;
			const nestedObject = properties.nestedObject;

			expect(nestedObject.type).toBe('object');
			expect(nestedObject.properties).toBeDefined();
		});
	});

	describe('AI SDK Integration', () => {
		it('should convert to AI SDK tool format with correct schema structure', async () => {
			const tool = new StackOneTool(
				'test_tool',
				'Test tool with arrays',
				{
					type: 'object',
					properties: {
						arrayWithItems: { type: 'array', items: { type: 'string' } },
					},
				},
				{
					kind: 'http',
					method: 'GET',
					url: 'https://example.com/test',
					bodyType: 'json',
					params: [],
				},
				{ authorization: 'Bearer test_api_key' },
			);

			const aiSdkTool = await tool.toAISDK();
			const toolObj = aiSdkTool[tool.name];

			expect(toolObj).toBeDefined();
			expect(typeof toolObj.execute).toBe('function');
			// TODO: Remove ts-ignore once AISDKToolDefinition properly types inputSchema.jsonSchema
			// @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
			expect(toolObj.inputSchema.jsonSchema.type).toBe('object');

			// @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
			const arrayWithItems = toolObj.inputSchema.jsonSchema.properties?.arrayWithItems;
			expect(arrayWithItems?.type).toBe('array');
			expect((arrayWithItems?.items as JSONSchema)?.type).toBe('string');
		});

		it('should handle nested filter object for AI SDK', async () => {
			const tool = new StackOneTool(
				'test_nested_arrays',
				'Test nested arrays',
				{
					type: 'object',
					properties: {
						filter: {
							type: 'object',
							properties: {
								type_ids: {
									type: 'array',
									items: { type: 'string' },
									description: 'List of type IDs',
								},
								status: { type: 'string' },
							},
						},
					},
				},
				{
					kind: 'http',
					method: 'GET',
					url: 'https://example.com/test',
					bodyType: 'json',
					params: [],
				},
				{ authorization: 'Bearer test_api_key' },
			);

			const parameters = tool.toOpenAI().function.parameters;
			expect(parameters).toBeDefined();
			const aiSchema = jsonSchema(parameters as JSONSchema);
			expect(aiSchema).toBeDefined();

			const aiSdkTool = await tool.toAISDK();
			// TODO: Remove ts-ignore once AISDKToolDefinition properly types inputSchema.jsonSchema
			// @ts-ignore - jsonSchema is available on Schema wrapper from ai sdk
			const filterProp = aiSdkTool[tool.name].inputSchema.jsonSchema.properties?.filter as
				| (JSONSchema & { properties: Record<string, JSONSchema> })
				| undefined;

			expect(filterProp?.type).toBe('object');
			expect(filterProp?.properties.type_ids.type).toBe('array');
			expect(filterProp?.properties.type_ids.items).toBeDefined();
		});
	});
});
