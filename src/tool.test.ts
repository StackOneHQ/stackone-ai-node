import { BaseTool, StackOneTool, Tools } from './tool';
import { type ExecuteConfig, ParameterLocation, type ToolParameters } from './types';
import { StackOneAPIError } from './utils/errors';

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
	it('should initialize with correct properties', () => {
		const tool = createMockTool();

		expect(tool.description).toBe('Test tool');
		expect((tool.parameters as { type: string }).type).toBe('object');
		expect(
			(tool.parameters as unknown as { properties: { id: { type: string } } }).properties.id.type,
		).toBe('string');
	});

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

	it('should convert to OpenAI tool format', () => {
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
});

describe('Tools', () => {
	it('should initialize with tools array', () => {
		const tool = createMockTool();
		const tools = new Tools([tool]);

		expect(tools.length).toBe(1);
	});

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

describe('Tool', () => {
	it('should initialize with correct properties', () => {
		const tool = createMockTool();

		expect(tool.name).toBe('test_tool');
		expect(tool.description).toBe('Test tool');
		expect((tool.parameters as { type: string }).type).toBe('object');
		expect(
			(tool.parameters as unknown as { properties: { id: { type: string } } }).properties.id.type,
		).toBe('string');
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

	it('should execute with parameters', async () => {
		const tool = createMockTool();
		const result = await tool.execute({ id: '123' });
		expect(result).toEqual({ id: '123', name: 'Test' });
	});

	it('should convert to OpenAI tool format', () => {
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
});
