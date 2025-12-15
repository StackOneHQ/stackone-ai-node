import { jsonSchema } from 'ai';
import { BaseTool, type MetaToolSearchResult, StackOneTool, Tools } from './tool';
import type { JsonObject } from './types';

/**
 * Type guard for MetaToolSearchResult array from execute result.
 * Used to safely extract tools from meta_search_tools response.
 */
function isMetaToolSearchResults(value: unknown): value is MetaToolSearchResult[] {
	return (
		Array.isArray(value) &&
		value.every(
			(item) =>
				typeof item === 'object' &&
				item !== null &&
				'name' in item &&
				'description' in item &&
				'score' in item,
		)
	);
}

/** Extract tools from search result with type safety */
function getSearchResults(result: JsonObject): MetaToolSearchResult[] {
	if (!isMetaToolSearchResults(result.tools)) {
		throw new Error('Invalid tools response');
	}
	return result.tools;
}
import {
	type ExecuteConfig,
	type JSONSchema,
	ParameterLocation,
	type ToolParameters,
} from './types';
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

// Create mock tools for meta tools testing
const createMockTools = (): BaseTool[] => {
	const tools: BaseTool[] = [];

	// HRIS tools
	tools.push(
		new BaseTool(
			'bamboohr_create_employee',
			'Create a new employee record in the HRIS system',
			{
				type: 'object',
				properties: {
					name: { type: 'string', description: 'Employee name' },
					email: { type: 'string', description: 'Employee email' },
				},
				required: ['name', 'email'],
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/hris/employees',
				bodyType: 'json',
				params: [],
			},
		),
	);

	tools.push(
		new BaseTool(
			'bamboohr_list_employees',
			'List all employees in the HRIS system',
			{
				type: 'object',
				properties: {
					limit: { type: 'number', description: 'Number of employees to return' },
				},
			},
			{
				kind: 'http',
				method: 'GET',
				url: 'https://api.example.com/hris/employees',
				bodyType: 'json',
				params: [
					{
						name: 'limit',
						location: ParameterLocation.QUERY,
						type: 'number',
					},
				],
			},
		),
	);

	tools.push(
		new BaseTool(
			'bamboohr_create_time_off',
			'Create a time off request for an employee',
			{
				type: 'object',
				properties: {
					employeeId: { type: 'string', description: 'Employee ID' },
					startDate: { type: 'string', description: 'Start date of time off' },
					endDate: { type: 'string', description: 'End date of time off' },
				},
				required: ['employeeId', 'startDate', 'endDate'],
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/hris/time-off',
				bodyType: 'json',
				params: [],
			},
		),
	);

	// ATS tools
	tools.push(
		new BaseTool(
			'workday_create_candidate',
			'Create a new candidate in the ATS',
			{
				type: 'object',
				properties: {
					name: { type: 'string', description: 'Candidate name' },
					email: { type: 'string', description: 'Candidate email' },
				},
				required: ['name', 'email'],
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/ats/candidates',
				bodyType: 'json',
				params: [],
			},
		),
	);

	tools.push(
		new BaseTool(
			'workday_list_candidates',
			'List all candidates in the ATS',
			{
				type: 'object',
				properties: {
					status: { type: 'string', description: 'Filter by candidate status' },
				},
			},
			{
				kind: 'http',
				method: 'GET',
				url: 'https://api.example.com/ats/candidates',
				bodyType: 'json',
				params: [
					{
						name: 'status',
						location: ParameterLocation.QUERY,
						type: 'string',
					},
				],
			},
		),
	);

	// CRM tools
	tools.push(
		new BaseTool(
			'salesforce_create_contact',
			'Create a new contact in the CRM',
			{
				type: 'object',
				properties: {
					name: { type: 'string', description: 'Contact name' },
					company: { type: 'string', description: 'Company name' },
				},
				required: ['name'],
			},
			{
				kind: 'http',
				method: 'POST',
				url: 'https://api.example.com/crm/contacts',
				bodyType: 'json',
				params: [],
			},
		),
	);

	return tools;
};

describe('Meta Search Tools', () => {
	let tools: Tools;
	let metaTools: Tools;

	beforeEach(async () => {
		const mockTools = createMockTools();
		tools = new Tools(mockTools);
		metaTools = await tools.metaTools(); // default BM25 strategy
	});

	describe('metaTools()', () => {
		it('should return two meta tools', () => {
			expect(metaTools.length).toBe(2);
		});

		it('should include meta_search_tools', () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			expect(filterTool).toBeDefined();
			expect(filterTool?.name).toBe('meta_search_tools');
		});

		it('should include meta_execute_tool', () => {
			const executeTool = metaTools.getTool('meta_execute_tool');
			expect(executeTool).toBeDefined();
			expect(executeTool?.name).toBe('meta_execute_tool');
		});
	});

	describe('meta_search_tools', () => {
		it('should find relevant BambooHR tools', async () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			assert(filterTool, 'filterTool should be defined');

			const result = await filterTool.execute({
				query: 'manage employees in bamboohr',
				limit: 5,
			});

			expect(result.tools).toBeDefined();
			expect(Array.isArray(result.tools)).toBe(true);

			const toolResults = getSearchResults(result);
			const toolNames = toolResults.map((t) => t.name);

			expect(toolNames).toContain('bamboohr_create_employee');
			expect(toolNames).toContain('bamboohr_list_employees');
		});

		it('should find time off related tools', async () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			assert(filterTool, 'filterTool should be defined');

			const result = await filterTool.execute({
				query: 'time off request vacation leave',
				limit: 3,
			});

			const toolResults = getSearchResults(result);
			const toolNames = toolResults.map((t) => t.name);

			expect(toolNames).toContain('bamboohr_create_time_off');
		});

		it('should respect limit parameter', async () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			assert(filterTool, 'filterTool should be defined');

			const result = await filterTool.execute({
				query: 'create',
				limit: 2,
			});

			const toolResults = getSearchResults(result);
			expect(toolResults.length).toBeLessThanOrEqual(2);
		});

		it('should filter by minimum score', async () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			assert(filterTool, 'filterTool should be defined');

			const result = await filterTool.execute({
				query: 'xyz123 nonexistent',
				minScore: 0.8,
			});

			const toolResults = getSearchResults(result);
			expect(toolResults.length).toBe(0);
		});

		it('should include tool configurations in results', async () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			assert(filterTool, 'filterTool should be defined');

			const result = await filterTool.execute({
				query: 'create employee',
				limit: 1,
			});

			const toolResults = getSearchResults(result);
			expect(toolResults.length).toBeGreaterThan(0);

			const firstTool = toolResults[0];
			expect(firstTool).toHaveProperty('name');
			expect(firstTool).toHaveProperty('description');
			expect(firstTool).toHaveProperty('parameters');
			expect(firstTool).toHaveProperty('score');
			expect(typeof firstTool.score).toBe('number');
		});

		it('should handle empty query', async () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			assert(filterTool, 'filterTool should be defined');

			const result = await filterTool.execute({
				query: '',
				limit: 5,
			});

			expect(result.tools).toBeDefined();
			expect(Array.isArray(result.tools)).toBe(true);
		});

		it('should handle string parameters', async () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			assert(filterTool, 'filterTool should be defined');

			const result = await filterTool.execute(
				JSON.stringify({
					query: 'candidates',
					limit: 3,
				}),
			);

			const toolResults = getSearchResults(result);
			const toolNames = toolResults.map((t) => t.name);

			const hasCandidateTool = toolNames.some(
				(name) => name === 'workday_create_candidate' || name === 'workday_list_candidates',
			);
			expect(hasCandidateTool).toBe(true);
		});
	});

	describe('meta_execute_tool', () => {
		it('should execute a tool by name', async () => {
			const executeTool = metaTools.getTool('meta_execute_tool');
			assert(executeTool, 'executeTool should be defined');

			const result = await executeTool.execute({
				toolName: 'bamboohr_list_employees',
				params: { limit: 10 },
			});

			expect(result).toEqual({ limit: 10 });
		});

		it('should handle tools with required parameters', async () => {
			const executeTool = metaTools.getTool('meta_execute_tool');
			assert(executeTool, 'executeTool should be defined');

			const result = await executeTool.execute({
				toolName: 'bamboohr_create_employee',
				params: {
					name: 'John Doe',
					email: 'john@example.com',
				},
			});

			expect(result).toEqual({
				name: 'John Doe',
				email: 'john@example.com',
			});
		});

		it('should throw error for non-existent tool', async () => {
			const executeTool = metaTools.getTool('meta_execute_tool');
			assert(executeTool, 'executeTool should be defined');

			await expect(
				executeTool.execute({
					toolName: 'nonexistent_tool',
					params: {},
				}),
			).rejects.toThrow('Tool nonexistent_tool not found');
		});

		it('should handle string parameters', async () => {
			const executeTool = metaTools.getTool('meta_execute_tool');
			assert(executeTool, 'executeTool should be defined');

			const result = await executeTool.execute(
				JSON.stringify({
					toolName: 'salesforce_create_contact',
					params: {
						name: 'Jane Smith',
						company: 'Acme Corp',
					},
				}),
			);

			expect(result).toEqual({
				name: 'Jane Smith',
				company: 'Acme Corp',
			});
		});

		it('should pass through execution options', async () => {
			const executeTool = metaTools.getTool('meta_execute_tool');
			assert(executeTool, 'executeTool should be defined');

			const result = await executeTool.execute({
				toolName: 'workday_list_candidates',
				params: { status: 'active' },
			});

			expect(result).toEqual({ status: 'active' });
		});
	});

	describe('Integration: meta tools workflow', () => {
		it('should discover and execute tools in sequence', async () => {
			const filterTool = metaTools.getTool('meta_search_tools');
			const executeTool = metaTools.getTool('meta_execute_tool');
			assert(filterTool, 'filterTool should be defined');
			assert(executeTool, 'executeTool should be defined');

			// Step 1: Discover relevant tools
			const searchResult = await filterTool.execute({
				query: 'create new employee in HR system',
				limit: 3,
			});

			const toolResults = getSearchResults(searchResult);
			expect(toolResults.length).toBeGreaterThan(0);

			// Find the create employee tool
			const createEmployeeTool = toolResults.find((t) => t.name === 'bamboohr_create_employee');
			assert(createEmployeeTool, 'createEmployeeTool should be defined');

			// Step 2: Execute the discovered tool
			const executeResult = await executeTool.execute({
				toolName: createEmployeeTool.name,
				params: {
					name: 'Alice Johnson',
					email: 'alice@example.com',
				},
			});

			expect(executeResult).toEqual({
				name: 'Alice Johnson',
				email: 'alice@example.com',
			});
		});
	});

	describe('OpenAI format', () => {
		it('should convert meta tools to OpenAI format', () => {
			const openAITools = metaTools.toOpenAI();

			expect(openAITools).toHaveLength(2);

			const filterTool = openAITools.find((t) => t.function.name === 'meta_search_tools');
			expect(filterTool).toBeDefined();
			expect(filterTool?.function.parameters?.properties).toHaveProperty('query');
			expect(filterTool?.function.parameters?.properties).toHaveProperty('limit');
			expect(filterTool?.function.parameters?.properties).toHaveProperty('minScore');

			const executeTool = openAITools.find((t) => t.function.name === 'meta_execute_tool');
			expect(executeTool).toBeDefined();
			expect(executeTool?.function.parameters?.properties).toHaveProperty('toolName');
			expect(executeTool?.function.parameters?.properties).toHaveProperty('params');
		});
	});

	describe('AI SDK format', () => {
		it('should convert meta tools to AI SDK format', async () => {
			const aiSdkTools = await metaTools.toAISDK();

			expect(aiSdkTools).toHaveProperty('meta_search_tools');
			expect(aiSdkTools).toHaveProperty('meta_execute_tool');

			expect(typeof aiSdkTools.meta_search_tools.execute).toBe('function');
			expect(typeof aiSdkTools.meta_execute_tool.execute).toBe('function');
		});

		it('should execute through AI SDK format', async () => {
			const aiSdkTools = await metaTools.toAISDK();

			expect(aiSdkTools.meta_search_tools.execute).toBeDefined();

			const result = await aiSdkTools.meta_search_tools.execute?.(
				{ query: 'workday candidates', limit: 2 },
				{ toolCallId: 'test-call-1', messages: [] },
			);
			expect(result).toBeDefined();

			const toolResults = (result as { tools: MetaToolSearchResult[] }).tools;
			expect(Array.isArray(toolResults)).toBe(true);

			const toolNames = toolResults.map((t) => t.name);
			expect(toolNames).toContain('workday_create_candidate');
		});
	});
});

describe('Meta Search Tools - Hybrid Strategy', () => {
	describe('Hybrid BM25 + TF-IDF search', () => {
		it('should search using hybrid strategy with default alpha', async () => {
			const tools = new Tools(createMockTools());
			const metaTools = await tools.metaTools();
			const searchTool = metaTools.getTool('meta_search_tools');
			assert(searchTool, 'searchTool should be defined');

			const result = await searchTool.execute({
				query: 'manage employees',
				limit: 5,
			});

			expect(result.tools).toBeDefined();
			expect(Array.isArray(result.tools)).toBe(true);
			const toolResults = getSearchResults(result);
			expect(toolResults.length).toBeGreaterThan(0);
		});

		it('should search using hybrid strategy with custom alpha', async () => {
			const tools = new Tools(createMockTools());
			const metaTools = await tools.metaTools(0.7);
			const searchTool = metaTools.getTool('meta_search_tools');
			assert(searchTool, 'searchTool should be defined');

			const result = await searchTool.execute({
				query: 'create candidate',
				limit: 3,
			});

			const toolResults = getSearchResults(result);
			const toolNames = toolResults.map((t) => t.name);
			expect(toolNames).toContain('workday_create_candidate');
		});

		it('should combine BM25 and TF-IDF scores', async () => {
			const tools = new Tools(createMockTools());
			const metaTools = await tools.metaTools(0.5);
			const searchTool = metaTools.getTool('meta_search_tools');
			assert(searchTool, 'searchTool should be defined');

			const result = await searchTool.execute({
				query: 'employee',
				limit: 10,
			});

			const toolResults = getSearchResults(result);
			expect(toolResults.length).toBeGreaterThan(0);

			for (const tool of toolResults) {
				expect(tool.score).toBeGreaterThanOrEqual(0);
				expect(tool.score).toBeLessThanOrEqual(1);
			}
		});

		it('should find relevant tools', async () => {
			const tools = new Tools(createMockTools());
			const metaTools = await tools.metaTools();
			const searchTool = metaTools.getTool('meta_search_tools');
			assert(searchTool, 'searchTool should be defined');

			const result = await searchTool.execute({
				query: 'time off vacation',
				limit: 3,
			});

			const toolResults = getSearchResults(result);
			const toolNames = toolResults.map((t) => t.name);
			expect(toolNames).toContain('bamboohr_create_time_off');
		});
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
