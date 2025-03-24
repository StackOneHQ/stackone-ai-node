import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { BaseTool, StackOneTool, Tools } from '../tool';
import { type ExecuteConfig, ParameterLocation, type ToolParameters } from '../types';
import { StackOneAPIError } from '../utils/errors';
import { type FetchMockResult, mockFetch } from './utils/fetch-mock';

// Create a mock tool for testing
const createMockTool = (headers?: Record<string, string>): BaseTool => {
  const name = 'test_tool';
  const description = 'Test tool';
  const parameters: ToolParameters = {
    type: 'object',
    properties: { id: { type: 'string', description: 'ID parameter' } },
  };
  const executeConfig: ExecuteConfig = {
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

// Set up and tear down mocks
beforeEach(() => {
  // Set up any common mocks here
});

afterEach(() => {
  // Clean up all mocks
  mock.restore();
});

describe('StackOneTool', () => {
  // Test-specific fetch mock
  let fetchMock: FetchMockResult;

  beforeEach(() => {
    // Set up a default fetch mock for each test
    fetchMock = mockFetch({
      defaultResponse: {
        json: async () => ({ id: '123', name: 'Test' }),
        text: async () => JSON.stringify({ id: '123', name: 'Test' }),
      },
    });
  });

  afterEach(() => {
    // Clean up the fetch mock
    fetchMock.restore();
  });

  it('should initialize with correct properties', () => {
    const tool = createMockTool();

    expect(tool.description).toBe('Test tool');
    expect((tool.parameters as { type: string }).type).toBe('object');
    expect(
      (tool.parameters as unknown as { properties: { id: { type: string } } }).properties.id.type
    ).toBe('string');
  });

  it('should execute with parameters', async () => {
    const tool = createMockTool();

    // Mock fetch to capture the URL and return a response
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ id: '123', name: 'Test' }),
        text: async () => JSON.stringify({ id: '123', name: 'Test' }),
        headers: new Headers(),
        redirected: false,
        type: 'basic',
        url: url.toString(),
        clone: () => ({}) as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
      } as Response;
    });

    // Execute the tool
    const result = await tool.execute({ id: '123' });

    // Check that the URL was constructed correctly
    expect(fetchSpy.mock.calls[0][0].toString()).toBe('https://api.example.com/test/123');
    expect(result).toEqual({ id: '123', name: 'Test' });

    // Restore the original fetch
    fetchSpy.mockRestore();
  });

  it('should execute with string arguments', async () => {
    const tool = createMockTool();
    const result = await tool.execute('{"id":"123"}');

    expect(result).toEqual({ id: '123', name: 'Test' });
    expect(fetchMock.requestUrl).toContain('https://api.example.com/test/123');
  });

  it('should handle API errors', async () => {
    // Override the default fetch mock with an error response
    fetchMock.restore();
    fetchMock = mockFetch({
      defaultResponse: {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid ID' }),
        text: async () => JSON.stringify({ error: 'Invalid ID' }),
      },
    });

    const tool = createMockTool();

    try {
      await tool.execute({ id: 'invalid' });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(StackOneAPIError);
      const apiError = error as StackOneAPIError;
      expect(apiError.statusCode).toBe(400);
      expect(apiError.responseBody).toEqual({ error: 'Invalid ID' });
    }
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
      ).properties.id.type
    ).toBe('string');
  });

  it('should convert to AI SDK tool format', () => {
    const tool = createMockTool();

    const aiSdkTool = tool.toAISDK();

    // Test the basic structure
    expect(aiSdkTool).toBeDefined();
    expect(aiSdkTool.test_tool).toBeDefined();
    expect(typeof aiSdkTool.test_tool.execute).toBe('function');
    expect(aiSdkTool.test_tool.description).toBe('Test tool');
    expect(aiSdkTool.test_tool.parameters).toBeDefined();

    // The actual schema is in parameters.jsonSchema
    const schema = aiSdkTool.test_tool.parameters.jsonSchema;
    expect(schema).toBeDefined();
    expect(schema.type).toBe('object');
    expect(schema.properties.id).toBeDefined();
    expect(schema.properties.id.type).toBe('string');
  });

  it('should convert complex parameter types to zod schema', () => {
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
        method: 'GET',
        url: 'https://example.com/complex',
        bodyType: 'json',
        params: [],
      }
    );

    const aiSdkTool = complexTool.toAISDK();

    // Check that the tool is defined
    expect(aiSdkTool).toBeDefined();
    expect(aiSdkTool.complex_tool).toBeDefined();

    // Check that parameters are defined
    expect(aiSdkTool.complex_tool.parameters).toBeDefined();

    // The actual schema is in parameters.jsonSchema
    const schema = aiSdkTool.complex_tool.parameters.jsonSchema;
    expect(schema).toBeDefined();
    expect(schema.type).toBe('object');

    // Check that the properties are defined with correct types
    expect(schema.properties).toBeDefined();
    expect(schema.properties.stringParam.type).toBe('string');
    expect(schema.properties.numberParam.type).toBe('number');
    expect(schema.properties.booleanParam.type).toBe('boolean');
    expect(schema.properties.arrayParam.type).toBe('array');
    expect(schema.properties.objectParam.type).toBe('object');
  });

  it('should execute AI SDK tool with parameters', async () => {
    // Mock fetch with a custom response
    const fetchMock = mockFetch({
      defaultResponse: {
        json: async () => ({ id: '123', name: 'Test' }),
        text: async () => JSON.stringify({ id: '123', name: 'Test' }),
      },
    });

    const tool = createMockTool();
    const aiSdkTool = tool.toAISDK();

    // Mock the ToolExecutionOptions
    const mockOptions = {
      toolCallId: 'test-tool-call-id',
      messages: [],
    };

    // Execute the AI SDK tool
    if (!aiSdkTool.test_tool.execute) {
      throw new Error('test_tool.execute is undefined');
    }
    const result = await aiSdkTool.test_tool.execute({ id: '123' }, mockOptions);

    expect(result).toEqual({ id: '123', name: 'Test' });

    // Restore the original fetch
    fetchMock.restore();
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
      }
    );

    const tool2 = new BaseTool(
      'tool2',
      'Tool 2',
      {
        type: 'object',
        properties: { id: { type: 'string' } },
      },
      {
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
      }
    );

    const tools = new Tools([tool1, tool2]);
    const openAITools = tools.toOpenAI();

    expect(openAITools).toBeInstanceOf(Array);
    expect(openAITools.length).toBe(2);
    expect(openAITools[0].type).toBe('function');
    expect(openAITools[0].function.name).toBe('tool1');
    expect(openAITools[1].function.name).toBe('tool2');
  });

  it('should convert all tools to AI SDK tools', () => {
    const tool1 = createMockTool();
    const tool2 = new StackOneTool(
      'another_tool',
      'Another tool',
      {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
      {
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
      }
    );

    const tools = new Tools([tool1, tool2]);

    const aiSdkTools = tools.toAISDK();

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
      }
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
      (tool.parameters as unknown as { properties: { id: { type: string } } }).properties.id.type
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
    // Create tool with authentication header already set
    const headers = {
      Authorization: `Basic ${Buffer.from('testuser:testpass').toString('base64')}`,
    };
    const tool = createMockTool(headers);

    // Mock fetch to capture the headers
    const fetchMock = mockFetch();

    // Execute the tool
    await tool.execute({ id: '123' });

    // Check that the Authorization header was set correctly
    const expectedAuthValue = `Basic ${Buffer.from('testuser:testpass').toString('base64')}`;
    expect(fetchMock.requestHeaders.Authorization).toBe(expectedAuthValue);

    // Restore the original fetch
    fetchMock.restore();
  });

  it('should use bearer authentication', async () => {
    // Create tool with authentication header already set
    const headers = {
      Authorization: 'Bearer test-token',
    };
    const tool = createMockTool(headers);

    // Mock fetch to capture the headers
    const fetchMock = mockFetch();

    // Execute the tool
    await tool.execute({ id: '123' });

    // Check that the Authorization header was set correctly
    expect(fetchMock.requestHeaders.Authorization).toBe('Bearer test-token');

    // Restore the original fetch
    fetchMock.restore();
  });

  it('should use api-key authentication', () => {
    const apiKey = 'test-api-key';

    // Create tool with authentication header already set
    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };
    const tool = createMockTool(headers);

    // Execute the tool to trigger authentication header generation
    // Mock fetch to capture the headers
    const fetchMock = mockFetch();

    // Execute the tool to trigger header generation
    tool.execute();

    // Check that the Authorization header was set correctly
    expect(fetchMock.requestHeaders.Authorization).toBe(`Bearer ${apiKey}`);

    // Restore the original fetch
    fetchMock.restore();
  });

  it('should execute with parameters', async () => {
    const tool = createMockTool();

    // Mock fetch to capture the URL and return a response
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ id: '123', name: 'Test' }),
        text: async () => JSON.stringify({ id: '123', name: 'Test' }),
        headers: new Headers(),
        redirected: false,
        type: 'basic',
        url: url.toString(),
        clone: () => ({}) as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
      } as Response;
    });

    // Execute the tool
    const result = await tool.execute({ id: '123' });

    // Check that the URL was constructed correctly
    expect(fetchSpy.mock.calls[0][0].toString()).toBe('https://api.example.com/test/123');
    expect(result).toEqual({ id: '123', name: 'Test' });

    // Restore the original fetch
    fetchSpy.mockRestore();
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
      ).properties.id.type
    ).toBe('string');
  });
});
