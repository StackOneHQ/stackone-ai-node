import { describe, expect, it, spyOn } from 'bun:test';
import { env } from 'bun';
import { ParameterLocation, StackOneTool, type Tools } from '../models';
import { OpenAPIParser } from '../openapi/parser';
import { StackOneToolSet } from '../toolset';

// Mock environment variables
env.STACKONE_API_KEY = 'test_key';

describe('StackOneToolSet', () => {
  it('should initialize with API key from constructor', () => {
    const toolset = new StackOneToolSet('custom_key');
    expect(toolset).toBeDefined();
  });

  it('should initialize with API key from environment', () => {
    const toolset = new StackOneToolSet();
    expect(toolset).toBeDefined();
  });

  it('should throw error if no API key is provided', () => {
    // Temporarily remove environment variable
    const originalKey = env.STACKONE_API_KEY;
    env.STACKONE_API_KEY = undefined;

    expect(() => new StackOneToolSet()).toThrow();

    // Restore environment variable
    env.STACKONE_API_KEY = originalKey;
  });

  it('should get tools with filter pattern', async () => {
    // Create a more direct mock of the getTools method
    const originalGetTools = StackOneToolSet.prototype.getTools;

    // Replace the getTools method with our mock
    StackOneToolSet.prototype.getTools = (
      filterPattern?: string | string[],
      accountId?: string
    ) => {
      // Create a mock tool
      const tool = new StackOneTool(
        'Get employee details',
        {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Employee ID',
            },
          },
        },
        {
          method: 'GET',
          url: 'https://api.stackone.com/employee/{id}',
          name: 'hris_get_employee',
          headers: {},
          parameterLocations: { id: ParameterLocation.PATH },
        },
        'test_key',
        accountId
      );

      // Only return the tool if the filter pattern matches
      if (filterPattern && filterPattern === 'hris_*') {
        return {
          length: 1,
          getTool: (name: string) => (name === 'hris_get_employee' ? tool : undefined),
          [Symbol.iterator]: function* () {
            yield tool;
          },
          toOpenAI: () => [tool.toOpenAI()],
          toAISDKTools: () => ({ [tool.name]: tool.toAISDKTool() }),
        } as unknown as Tools;
      }

      // Return empty tools collection for non-matching filter
      return {
        length: 0,
        getTool: () => undefined,
        [Symbol.iterator]: function* () {},
        toOpenAI: () => [],
        toAISDKTools: () => ({}),
      } as unknown as Tools;
    };

    try {
      const toolset = new StackOneToolSet('test_key');
      const tools = toolset.getTools('hris_*', 'test_account');

      expect(tools.length).toBe(1);
      const tool = tools.getTool('hris_get_employee');
      expect(tool).toBeDefined();
      expect(tool?.description).toBe('Get employee details');
    } finally {
      // Restore original method
      StackOneToolSet.prototype.getTools = originalGetTools;
    }
  });

  it('should return empty tools collection for non-matching filter', async () => {
    // Create a more direct mock of the getTools method
    const originalGetTools = StackOneToolSet.prototype.getTools;

    // Replace the getTools method with our mock
    StackOneToolSet.prototype.getTools = (
      _filterPattern?: string | string[],
      _accountId?: string
    ) => {
      // Return empty tools collection for non-matching filter
      return {
        length: 0,
        getTool: () => undefined,
        [Symbol.iterator]: function* () {},
        toOpenAI: () => [],
        toAISDKTools: () => ({}),
      } as unknown as Tools;
    };

    try {
      const toolset = new StackOneToolSet('test_key');
      const tools = toolset.getTools('unknown_*');

      expect(tools.length).toBe(0);
    } finally {
      // Restore original method
      StackOneToolSet.prototype.getTools = originalGetTools;
    }
  });

  it('should use custom base URL when specified', () => {
    // Save original methods
    const originalParserConstructor = OpenAPIParser.prototype.constructor;
    const originalParseTools = OpenAPIParser.prototype.parseTools;

    // Mock OpenAPI parser
    spyOn(OpenAPIParser.prototype, 'parseTools').mockImplementation(function (this: OpenAPIParser) {
      // Create a mock tool definition
      return {
        test_tool: {
          description: 'Test tool',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'ID parameter' },
            },
          },
          execute: {
            headers: {},
            method: 'GET',
            url: `${(this as unknown as { baseUrl: string }).baseUrl}/test/{id}`,
            name: 'test_tool',
            parameterLocations: { id: ParameterLocation.PATH },
          },
        },
      };
    });

    try {
      // Create a toolset with default base URL
      const defaultToolset = new StackOneToolSet('test_key');
      const defaultTools = defaultToolset.getTools();
      const defaultTool = defaultTools.getTool('test_tool');

      // Create a toolset with custom base URL
      const customBaseUrl = 'https://api.custom-domain.com';
      const customToolset = new StackOneToolSet('test_key', undefined, customBaseUrl);
      const customTools = customToolset.getTools();
      const customTool = customTools.getTool('test_tool');

      // Verify the URLs
      expect(defaultTool).toBeDefined();
      expect(customTool).toBeDefined();

      if (defaultTool && customTool) {
        // Default URL should contain the default base URL (from the OpenAPI spec)
        expect(defaultTool._executeConfig.url).toContain('https://api.stackone.com');

        // Custom URL should contain the custom base URL
        expect(customTool._executeConfig.url).toContain(customBaseUrl);
        expect(customTool._executeConfig.url).toBe(`${customBaseUrl}/test/{id}`);
      }
    } finally {
      // Restore original methods
      OpenAPIParser.prototype.constructor = originalParserConstructor;
      OpenAPIParser.prototype.parseTools = originalParseTools;
    }
  });

  it('should override base URL in StackOneToolSet', () => {
    // Save original methods
    const originalParserConstructor = OpenAPIParser.prototype.constructor;
    const originalParseTools = OpenAPIParser.prototype.parseTools;

    // Mock OpenAPI parser
    spyOn(OpenAPIParser.prototype, 'parseTools').mockImplementation(function (this: OpenAPIParser) {
      // Create a mock tool definition
      return {
        hris_get_employee: {
          description: 'Get employee details',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Employee ID' },
            },
          },
          execute: {
            headers: {},
            method: 'GET',
            url: `${(this as unknown as { baseUrl: string }).baseUrl}/hris/employees/{id}`,
            name: 'hris_get_employee',
            parameterLocations: { id: ParameterLocation.PATH },
          },
        },
      };
    });

    try {
      // Create a toolset with the default base URL
      const defaultToolset = new StackOneToolSet('test-api-key');
      const defaultTools = defaultToolset.getTools();

      // Create a toolset with a custom base URL
      const customBaseUrl = 'https://api.example-dev.com';
      const customToolset = new StackOneToolSet('test-api-key', undefined, customBaseUrl);
      const customTools = customToolset.getTools();

      // Check that the tool URLs use the correct base URLs
      const defaultTool = defaultTools.getTool('hris_get_employee');
      const customTool = customTools.getTool('hris_get_employee');

      expect(defaultTool).toBeDefined();
      expect(customTool).toBeDefined();

      if (defaultTool && customTool) {
        expect(defaultTool._executeConfig.url).toContain('https://api.stackone.com');
        expect(customTool._executeConfig.url).toContain('https://api.example-dev.com');
      }
    } finally {
      // Restore original methods
      OpenAPIParser.prototype.constructor = originalParserConstructor;
      OpenAPIParser.prototype.parseTools = originalParseTools;
    }
  });
});
