import { describe, expect, it } from 'bun:test';
import { ParameterLocation, StackOneAPIError, StackOneTool, Tools } from '../models';

// Create a mock tool for testing
const createMockTool = (): StackOneTool => {
  return new StackOneTool(
    'Test tool',
    {
      type: 'object',
      properties: { id: { type: 'string', description: 'ID parameter' } },
    },
    {
      headers: {},
      method: 'GET',
      url: 'https://api.example.com/test/{id}',
      name: 'test_tool',
      parameterLocations: { id: ParameterLocation.PATH },
    },
    'test_key'
  );
};

describe('StackOneTool', () => {
  it('should initialize with correct properties', () => {
    const tool = createMockTool();

    expect(tool.name).toBe('test_tool');
    expect(tool.description).toBe('Test tool');
    expect((tool.parameters as { type: string }).type).toBe('object');
    expect(
      (tool.parameters as unknown as { properties: { id: { type: string } } }).properties.id.type
    ).toBe('string');
  });

  it('should execute with parameters', async () => {
    // Save original fetch
    const originalFetch = globalThis.fetch;

    try {
      // Replace fetch with mock implementation
      globalThis.fetch = async () => {
        return {
          ok: true,
          json: async () => ({ id: '123', name: 'Test User' }),
          status: 200,
          statusText: 'OK',
        } as Response;
      };

      const tool = createMockTool();
      const result = await tool.execute({ id: '123' });

      expect(result).toEqual({ id: '123', name: 'Test User' });
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  it('should execute with string arguments', async () => {
    // Save original fetch
    const originalFetch = globalThis.fetch;

    try {
      // Replace fetch with mock implementation
      globalThis.fetch = async () => {
        return {
          ok: true,
          json: async () => ({ id: '123', name: 'Test User' }),
          status: 200,
          statusText: 'OK',
        } as Response;
      };

      const tool = createMockTool();
      const result = await tool.execute('{"id": "123"}');

      expect(result).toEqual({ id: '123', name: 'Test User' });
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
  });

  it('should handle API errors', async () => {
    // Save original fetch
    const originalFetch = globalThis.fetch;

    try {
      // Replace fetch with error mock implementation
      globalThis.fetch = async () => {
        return {
          ok: false,
          json: async () => ({ error: 'Not found' }),
          status: 404,
          statusText: 'Not Found',
        } as Response;
      };

      const tool = createMockTool();

      await expect(tool.execute({ id: '123' })).rejects.toThrow(StackOneAPIError);
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
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
      (openAIFormat.function.parameters as { properties: { id: { type: string } } }).properties.id
        .type
    ).toBe('string');
  });

  it('should convert to AI SDK tool format', () => {
    const tool = createMockTool();
    const aiSdkTool = tool.toAISDKTool();

    expect(aiSdkTool).toBeDefined();
    expect(typeof aiSdkTool.execute).toBe('function');
    expect(aiSdkTool.description).toBe('Test tool');

    // Check that parameters is a JSON Schema
    expect(aiSdkTool.parameters).toBeDefined();
    expect(aiSdkTool.parameters[Symbol.for('vercel.ai.schema')]).toBe(true);

    // Validate the schema structure
    expect(aiSdkTool.parameters.jsonSchema).toBeDefined();
    expect(aiSdkTool.parameters.jsonSchema.type).toBe('object');

    // Use type assertions to handle possibly undefined properties
    const properties = aiSdkTool.parameters.jsonSchema.properties as Record<
      string,
      { type: string }
    >;
    expect(properties).toBeDefined();
    expect(properties.id).toBeDefined();
    expect(properties.id.type).toBe('string');
  });

  it('should convert complex parameter types to zod schema', () => {
    const complexTool = new StackOneTool(
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
        headers: {},
        method: 'GET',
        url: 'https://example.com/complex',
        name: 'complex_tool',
        parameterLocations: {},
      },
      'test_key'
    );

    const aiSdkTool = complexTool.toAISDKTool();

    // Check that parameters is a JSON Schema
    expect(aiSdkTool.parameters).toBeDefined();
    expect(aiSdkTool.parameters[Symbol.for('vercel.ai.schema')]).toBe(true);

    // Validate the schema structure
    const schema = aiSdkTool.parameters.jsonSchema;
    expect(schema.type).toBe('object');

    // Use type assertions to handle possibly undefined properties
    const properties = schema.properties as Record<string, { type: string }>;
    expect(properties.stringParam.type).toBe('string');
    expect(properties.numberParam.type).toBe('number');
    expect(properties.booleanParam.type).toBe('boolean');
    expect(properties.arrayParam.type).toBe('array');
    expect(properties.objectParam.type).toBe('object');
  });

  it('should execute AI SDK tool with parameters', async () => {
    // Save original fetch
    const originalFetch = globalThis.fetch;

    try {
      // Replace fetch with mock implementation
      globalThis.fetch = async () => {
        return {
          ok: true,
          json: async () => ({ id: '123', name: 'Test User' }),
          status: 200,
          statusText: 'OK',
        } as Response;
      };

      const stackOneTool = createMockTool();
      const aiSdkTool = stackOneTool.toAISDKTool();

      // Mock the ToolExecutionOptions
      const mockOptions = {
        toolCallId: 'test-tool-call-id',
        messages: [],
      };

      // Execute the AI SDK tool
      const result = await aiSdkTool.execute({ id: '123' }, mockOptions);

      expect(result).toEqual({ id: '123', name: 'Test User' });
    } finally {
      // Restore original fetch
      globalThis.fetch = originalFetch;
    }
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
    const tool = createMockTool();
    const tools = new Tools([tool]);

    const openAITools = tools.toOpenAI();

    expect(openAITools.length).toBe(1);
    expect(openAITools[0].type).toBe('function');
    expect(openAITools[0].function.name).toBe('test_tool');
    expect(openAITools[0].function.description).toBe('Test tool');
    expect(openAITools[0].function.parameters?.type).toBe('object');
    expect(
      (openAITools[0].function.parameters as { properties: { id: { type: string } } }).properties.id
        .type
    ).toBe('string');
  });

  it('should convert all tools to AI SDK tools', () => {
    const tool1 = createMockTool();
    const tool2 = new StackOneTool(
      'Another tool',
      {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
      {
        headers: {},
        method: 'POST',
        url: 'https://api.example.com/test',
        name: 'another_tool',
        parameterLocations: { name: ParameterLocation.BODY },
      },
      'test_key'
    );

    const tools = new Tools([tool1, tool2]);

    const aiSdkTools = tools.toAISDKTools();

    expect(Object.keys(aiSdkTools).length).toBe(2);
    expect(aiSdkTools.test_tool).toBeDefined();
    expect(aiSdkTools.another_tool).toBeDefined();
    expect(typeof aiSdkTools.test_tool.execute).toBe('function');
    expect(typeof aiSdkTools.another_tool.execute).toBe('function');
  });

  it('should be iterable', () => {
    const tool1 = createMockTool();
    const tool2 = new StackOneTool(
      'Another tool',
      {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
      {
        headers: {},
        method: 'POST',
        url: 'https://api.example.com/test',
        name: 'another_tool',
        parameterLocations: { name: ParameterLocation.BODY },
      },
      'test_key'
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
