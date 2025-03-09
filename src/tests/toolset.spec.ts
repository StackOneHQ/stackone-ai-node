import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { env } from 'bun';
import { OpenAPILoader } from '../openapi/loader';
import { OpenAPIParser } from '../openapi/parser';
import { ParameterLocation, Tool, type Tools } from '../tools';
import { OpenAPIToolSet, StackOneToolSet } from '../toolset';
import { mockFetch } from './utils/fetch-mock';

// Mock environment variables
env.STACKONE_API_KEY = 'test_key';

describe('ToolSet', () => {
  // Clean up all mocks after each test
  afterEach(() => {
    mock.restore();
  });

  it('should initialize with default values', () => {
    const toolset = new StackOneToolSet();
    expect(toolset).toBeDefined();
  });

  it('should initialize with custom values', () => {
    const baseUrl = 'https://api.example.com';
    const headers = { 'X-Custom-Header': 'test' };

    const toolset = new StackOneToolSet({
      apiKey: 'test_key',
      baseUrl,
      headers,
    });

    // @ts-ignore - Accessing protected properties for testing
    expect(toolset.baseUrl).toBe(baseUrl);
    // @ts-ignore - Accessing protected properties for testing
    expect(toolset.headers['X-Custom-Header']).toBe('test');
  });

  it('should correctly match glob patterns', () => {
    const toolset = new StackOneToolSet({ apiKey: 'test_key' });

    // Test the private _matchGlob method directly
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', 'hris_*')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', 'crm_*')).toBe(false);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', '*_get_*')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', 'hris_get_?mployee')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris.get.employee', 'hris.get.employee')).toBe(true);
  });

  it('should correctly filter tools with a pattern', () => {
    const toolset = new StackOneToolSet({ apiKey: 'test_key' });

    // Test the private _matchesFilter method directly
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('hris_get_employee', 'hris_*')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('crm_get_contact', 'hris_*')).toBe(false);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('hris_get_employee', ['hris_*', 'crm_*'])).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('crm_get_contact', ['hris_*', 'crm_*'])).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('ats_get_candidate', ['hris_*', 'crm_*'])).toBe(false);

    // Test negative patterns
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('hris_get_employee', ['*', '!crm_*'])).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('crm_get_contact', ['*', '!crm_*'])).toBe(false);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('hris_get_employee', ['*', '!hris_*'])).toBe(false);
  });

  it('should get tools with a filter pattern', () => {
    // Mock the OpenAPILoader.loadFromDirectory method to return an empty object
    const loadFromDirectorySpy = spyOn(OpenAPILoader, 'loadFromDirectory').mockImplementation(
      () => ({})
    );

    // Create an instance of StackOneToolSet
    const toolset = new StackOneToolSet({ apiKey: 'test_key' });

    // Create mock tools
    const tool1 = new Tool(
      'hris_get_employee',
      'Get employee details',
      {
        type: 'object',
        properties: { id: { type: 'string' } },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/hris/employees/{id}',
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

    const tool2 = new Tool(
      'crm_get_contact',
      'Get contact details',
      {
        type: 'object',
        properties: { id: { type: 'string' } },
      },
      {
        method: 'GET',
        url: 'https://api.example.com/crm/contacts/{id}',
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

    // Manually set the tools property
    // @ts-expect-error - Accessing protected property for testing
    toolset.tools = [tool1, tool2];

    // Test with no filter (should return all tools)
    const allTools = toolset.getTools();
    expect(allTools.length).toBe(2);

    // Test with HRIS filter
    const hrisTools = toolset.getTools('hris_*');
    expect(hrisTools.length).toBe(1);
    expect(hrisTools.toArray()[0].name).toBe('hris_get_employee');

    // Test with CRM filter
    const crmTools = toolset.getTools('crm_*');
    expect(crmTools.length).toBe(1);
    expect(crmTools.toArray()[0].name).toBe('crm_get_contact');

    // Test with non-matching filter
    const nonMatchingTools = toolset.getTools('non_existent_*');
    expect(nonMatchingTools.length).toBe(0);

    // Restore the original implementation
    loadFromDirectorySpy.mockRestore();
  });
});

describe('StackOneToolSet', () => {
  it('should initialize with API key from constructor', () => {
    const toolset = new StackOneToolSet({ apiKey: 'custom_key' });
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

  it('should correctly filter tools with a pattern', () => {
    // Create a test instance of StackOneToolSet
    const toolset = new StackOneToolSet({ apiKey: 'test_key' });

    // Test the private _matchesFilter method directly
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('hris_get_employee', 'hris_*')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('crm_get_contact', 'hris_*')).toBe(false);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('hris_get_employee', ['hris_*', 'crm_*'])).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('crm_get_contact', ['hris_*', 'crm_*'])).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('ats_get_candidate', ['hris_*', 'crm_*'])).toBe(false);

    // Test negative patterns
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('hris_get_employee', ['*', '!crm_*'])).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('crm_get_contact', ['*', '!crm_*'])).toBe(false);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchesFilter('hris_get_employee', ['*', '!hris_*'])).toBe(false);
  });

  it('should correctly match glob patterns', () => {
    // Create a test instance of StackOneToolSet
    const toolset = new StackOneToolSet({ apiKey: 'test_key' });

    // Test the private _matchGlob method directly
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', 'hris_*')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', 'crm_*')).toBe(false);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', '*_get_*')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', 'hris_get_?mployee')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris_get_employee', 'hris.get.employee')).toBe(false);
    // @ts-ignore - Accessing private method for testing
    expect(toolset._matchGlob('hris.get.employee', 'hris.get.employee')).toBe(true);
    // @ts-ignore - Accessing private method for testing
    // In the _matchGlob implementation, backslashes are used to escape dots in the pattern
    // but the pattern itself doesn't contain the backslashes, so we need to use a raw string
    expect(toolset._matchGlob('hris.get.employee', 'hris\\.get\\.employee')).toBe(false);
  });

  it('should use custom base URL when creating OpenAPIParser', () => {
    // Create a minimal OpenAPI spec
    const minimalSpec = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
      servers: [{ url: 'https://api.stackone.com' }],
    };

    // Create parsers with different base URLs
    const defaultParser = new OpenAPIParser(minimalSpec);
    const customParser = new OpenAPIParser(minimalSpec, 'https://api.custom-domain.com');

    // Access the baseUrl property directly
    expect(defaultParser.baseUrl).toBe('https://api.stackone.com');
    expect(customParser.baseUrl).toBe('https://api.custom-domain.com');
  });

  it('should pass custom base URL from StackOneToolSet to OpenAPIParser', () => {
    // Create a StackOneToolSet with a custom base URL
    const customBaseUrlValue = 'https://api.example-dev.com';
    const toolset = new StackOneToolSet({
      apiKey: 'test-key',
      baseUrl: customBaseUrlValue,
    });

    // Directly check that the baseUrl property is set correctly
    // @ts-ignore - Accessing private property for testing
    expect(toolset.baseUrl).toBe(customBaseUrlValue);
  });

  it('should filter tools correctly with getTools', () => {
    // Mock the OpenAPILoader.loadFromDirectory method to return an empty object
    const loadFromDirectorySpy = spyOn(OpenAPILoader, 'loadFromDirectory').mockImplementation(
      () => ({})
    );

    // Create an instance of StackOneToolSet
    const toolset = new StackOneToolSet({ apiKey: 'test_key' });

    // Create a set of mock tools with different prefixes
    const mockTools = [
      new Tool(
        'hris_get_employee',
        'Get employee details',
        { type: 'object', properties: {} },
        { method: 'GET', url: 'https://api.example.com/test', bodyType: 'json', params: [] }
      ),
      new Tool(
        'hris_list_employees',
        'List employees',
        { type: 'object', properties: {} },
        { method: 'GET', url: 'https://api.example.com/test', bodyType: 'json', params: [] }
      ),
      new Tool(
        'crm_get_contact',
        'Get contact details',
        { type: 'object', properties: {} },
        { method: 'GET', url: 'https://api.example.com/test', bodyType: 'json', params: [] }
      ),
      new Tool(
        'crm_list_contacts',
        'List contacts',
        { type: 'object', properties: {} },
        { method: 'GET', url: 'https://api.example.com/test', bodyType: 'json', params: [] }
      ),
      new Tool(
        'ats_get_candidate',
        'Get candidate details',
        { type: 'object', properties: {} },
        { method: 'GET', url: 'https://api.example.com/test', bodyType: 'json', params: [] }
      ),
    ];

    // Set the tools property directly
    // @ts-expect-error - Accessing protected property for testing
    toolset.tools = mockTools;

    // Test base class getTools method with no filter (should return all tools)
    const allTools = toolset.getTools();
    expect(allTools.length).toBe(5);

    // Test base class getTools method with a filter pattern
    const hrisTools = toolset.getTools('hris_*');
    expect(hrisTools.length).toBe(2);
    expect(hrisTools.toArray().map((t) => t.name)).toContain('hris_get_employee');
    expect(hrisTools.toArray().map((t) => t.name)).toContain('hris_list_employees');

    // Test base class getTools method with headers
    const customHeaders = { 'x-custom-header': 'test-value' };
    const toolsWithHeaders = toolset.getTools(undefined, customHeaders);
    expect(toolsWithHeaders.length).toBe(5);
    expect(toolsWithHeaders.toArray()[0].getHeaders()['x-custom-header']).toBe('test-value');

    // Clean up
    loadFromDirectorySpy.mockRestore();
  });

  it('should apply account ID as a header when using getStackOneTools', () => {
    // Mock the OpenAPILoader.loadFromDirectory method to return an empty object
    const loadFromDirectorySpy = spyOn(OpenAPILoader, 'loadFromDirectory').mockImplementation(
      () => ({})
    );

    // Create an instance of StackOneToolSet
    const toolset = new StackOneToolSet({ apiKey: 'test_key' });

    // Create a mock tool
    const tool = new Tool(
      'test_tool',
      'Test tool',
      {
        type: 'object',
        properties: {},
      },
      {
        method: 'GET',
        url: 'https://api.example.com/test',
        bodyType: 'json',
        params: [],
      }
    );

    // Manually set the tools property
    // @ts-expect-error - Accessing protected property for testing
    toolset.tools = [tool];

    // Get the tool with an account ID using getStackOneTools
    const accountId = 'test-account-id';
    const tools = toolset.getStackOneTools(undefined, accountId);

    // Verify that the account ID was set as a header
    const toolInstance = tools.toArray()[0];
    const headers = toolInstance.getHeaders();
    expect(headers['x-account-id']).toBe(accountId);

    // Test with a filter pattern
    const filteredTools = toolset.getStackOneTools('test_*', accountId);
    expect(filteredTools.length).toBe(1);
    expect(filteredTools.toArray()[0].getHeaders()['x-account-id']).toBe(accountId);

    // Test with a non-matching filter pattern
    const nonMatchingTools = toolset.getStackOneTools('non_existent_*', accountId);
    expect(nonMatchingTools.length).toBe(0);

    // Clean up
    loadFromDirectorySpy.mockRestore();
  });

  // Replace the single test with multiple focused tests
  describe('real tool loading', () => {
    // Create a toolset once for all tests in this group
    const toolset = new StackOneToolSet({ apiKey: 'test_key' });
    let allTools: Tools;
    let verticals: string[] = [];

    // Setup before running the tests
    beforeEach(() => {
      // Get all tools without any filter
      allTools = toolset.getTools();

      // Extract verticals from tool names
      const verticalSet = new Set<string>();
      for (const tool of allTools) {
        const vertical = tool.name.split('_')[0];
        if (vertical) {
          verticalSet.add(vertical);
        }
      }
      verticals = Array.from(verticalSet);
    });

    it('should load tools from the .oas directory', () => {
      // Verify that tools were loaded
      expect(allTools.length).toBeGreaterThan(0);
    });

    it('should have at least one vertical', () => {
      // Verify we have at least one vertical
      expect(verticals.length).toBeGreaterThan(0);
    });

    it('should filter tools by vertical', () => {
      // Skip if no verticals found
      if (verticals.length === 0) {
        return;
      }

      // Test filtering with the first vertical we found
      const firstVertical = verticals[0];
      const verticalTools = toolset.getTools(`${firstVertical}_*`);

      // Verify that filtered tools were loaded
      expect(verticalTools.length).toBeGreaterThan(0);

      // Verify that all tools start with the vertical prefix
      for (const tool of verticalTools) {
        expect(tool.name.startsWith(`${firstVertical}_`)).toBe(true);
      }
    });

    it('should filter tools with multiple patterns', () => {
      // Skip if less than 2 verticals found
      if (verticals.length < 2) {
        return;
      }

      // Use the first two verticals for testing multiple filters
      const patterns = [`${verticals[0]}_*`, `${verticals[1]}_*`];
      const multiFilterTools = toolset.getTools(patterns);

      // Verify that filtered tools were loaded
      expect(multiFilterTools.length).toBeGreaterThan(0);

      // Verify that all tools start with either vertical prefix
      for (const tool of multiFilterTools) {
        const matchesPattern =
          tool.name.startsWith(`${verticals[0]}_`) || tool.name.startsWith(`${verticals[1]}_`);
        expect(matchesPattern).toBe(true);
      }
    });
  });
});

describe('OpenAPIToolSet', () => {
  // Clean up all mocks after each test
  afterEach(() => {
    mock.restore();
  });

  it('should initialize with a file path', () => {
    // Mock the OpenAPILoader.loadFromFile method
    const loadFromFileSpy = spyOn(OpenAPILoader, 'loadFromFile').mockImplementation(() => ({
      pet_findById: {
        name: 'pet_findById',
        description: 'Find pet by ID',
        parameters: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
        execute: {
          method: 'GET',
          url: 'https://petstore.swagger.io/v2/pet/{id}',
          bodyType: 'json',
          params: [
            {
              name: 'id',
              location: ParameterLocation.PATH,
              type: 'string',
            },
          ],
        },
      },
      pet_findByStatus: {
        name: 'pet_findByStatus',
        description: 'Find pets by status',
        parameters: {
          type: 'object',
          properties: { status: { type: 'string' } },
        },
        execute: {
          method: 'GET',
          url: 'https://petstore.swagger.io/v2/pet/findByStatus',
          bodyType: 'json',
          params: [
            {
              name: 'status',
              location: ParameterLocation.QUERY,
              type: 'string',
            },
          ],
        },
      },
    }));

    const toolset = new OpenAPIToolSet({
      filePath: '/path/to/petstore.json',
      baseUrl: 'https://petstore.swagger.io/v2',
    });

    expect(toolset).toBeDefined();
    expect(loadFromFileSpy).toHaveBeenCalledWith(
      '/path/to/petstore.json',
      'https://petstore.swagger.io/v2'
    );

    // Get all tools
    const tools = toolset.getTools();
    expect(tools.length).toBe(2);

    // Check that tools are instances of Tool
    for (const tool of tools) {
      expect(tool).toBeInstanceOf(Tool);
    }
  });

  it('should throw error if neither filePath nor url is provided', () => {
    expect(() => new OpenAPIToolSet({})).toThrow();
  });

  it('should throw error if URL is not provided', async () => {
    // @ts-expect-error - This is expected to throw
    await expect(OpenAPIToolSet.fromUrl({})).rejects.toThrow('URL must be provided');
  });

  it('should filter tools with a pattern', () => {
    // Mock the OpenAPILoader.loadFromFile method
    spyOn(OpenAPILoader, 'loadFromFile').mockImplementation(() => ({
      pet_findById: {
        name: 'pet_findById',
        description: 'Find pet by ID',
        parameters: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
        execute: {
          method: 'GET',
          url: 'https://petstore.swagger.io/v2/pet/{id}',
          bodyType: 'json',
          params: [
            {
              name: 'id',
              location: ParameterLocation.PATH,
              type: 'string',
            },
          ],
        },
      },
      pet_findByStatus: {
        name: 'pet_findByStatus',
        description: 'Find pets by status',
        parameters: {
          type: 'object',
          properties: { status: { type: 'string' } },
        },
        execute: {
          method: 'GET',
          url: 'https://petstore.swagger.io/v2/pet/findByStatus',
          bodyType: 'json',
          params: [
            {
              name: 'status',
              location: ParameterLocation.QUERY,
              type: 'string',
            },
          ],
        },
      },
    }));

    const toolset = new OpenAPIToolSet({
      filePath: '/path/to/petstore.json',
      baseUrl: 'https://petstore.swagger.io/v2',
    });

    // Get all tools
    const allTools = toolset.getTools();
    expect(allTools.length).toBe(2);

    // Get pet_findById tool
    const findByIdTools = toolset.getTools('pet_findById');
    expect(findByIdTools.length).toBe(1);
    expect(findByIdTools.toArray()[0].name).toBe('pet_findById');
  });

  it('should apply custom headers to tools', () => {
    // Mock the OpenAPILoader.loadFromFile method
    spyOn(OpenAPILoader, 'loadFromFile').mockImplementation(() => ({
      pet_findById: {
        name: 'pet_findById',
        description: 'Find pet by ID',
        parameters: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
        execute: {
          method: 'GET',
          url: 'https://petstore.swagger.io/v2/pet/{id}',
          bodyType: 'json',
          params: [
            {
              name: 'id',
              location: ParameterLocation.PATH,
              type: 'string',
            },
          ],
        },
      },
    }));

    const toolset = new OpenAPIToolSet({
      filePath: '/path/to/petstore.json',
      baseUrl: 'https://petstore.swagger.io/v2',
    });

    // Get tools with custom headers
    const customHeaders = {
      'X-Custom-Header': 'test-value',
      'X-API-Version': '1.0.0',
    };

    const tools = toolset.getTools('pet_*', customHeaders);

    // Check that headers were applied to all tools
    for (const tool of tools) {
      const headers = tool.getHeaders();
      expect(headers['X-Custom-Header']).toBe('test-value');
      expect(headers['X-API-Version']).toBe('1.0.0');
    }
  });

  it('should use basic authentication', () => {
    // Mock the OpenAPILoader.loadFromFile method
    spyOn(OpenAPILoader, 'loadFromFile').mockImplementation(() => ({
      test_tool: {
        name: 'test_tool',
        description: 'Test tool',
        parameters: {
          type: 'object',
          properties: {},
        },
        execute: {
          method: 'GET',
          url: 'https://example.com/test',
          bodyType: 'json',
          params: [],
        },
      },
    }));

    // Create a toolset with basic authentication
    const toolset = new OpenAPIToolSet({
      filePath: '/path/to/petstore.json',
      baseUrl: 'https://petstore.swagger.io/v2',
      authentication: {
        type: 'basic',
        credentials: {
          username: 'testuser',
          password: 'testpass',
        },
      },
    });

    // Verify the authentication was passed to the tool
    const tools = toolset.getTools();
    const tool = tools.toArray()[0];

    // Execute the tool to trigger authentication header generation
    // Mock fetch to capture the headers
    const fetchMock = mockFetch();

    // Execute the tool to trigger header generation
    tool.execute();

    // Check that the Authorization header was set correctly
    const expectedAuthValue = `Basic ${Buffer.from('testuser:testpass').toString('base64')}`;
    expect(fetchMock.requestHeaders.Authorization).toBe(expectedAuthValue);

    // Restore original fetch
    fetchMock.restore();
  });

  it('should use bearer authentication', () => {
    // Mock the OpenAPILoader.loadFromFile method
    spyOn(OpenAPILoader, 'loadFromFile').mockImplementation(() => ({
      test_tool: {
        name: 'test_tool',
        description: 'Test tool',
        parameters: {
          type: 'object',
          properties: {},
        },
        execute: {
          method: 'GET',
          url: 'https://example.com/test',
          bodyType: 'json',
          params: [],
        },
      },
    }));

    // Create a toolset with bearer authentication
    const toolset = new OpenAPIToolSet({
      filePath: '/path/to/petstore.json',
      baseUrl: 'https://petstore.swagger.io/v2',
      authentication: {
        type: 'bearer',
        credentials: {
          token: 'test_key',
        },
      },
    });

    // Verify the authentication was passed to the tool
    const tools = toolset.getTools();
    const tool = tools.toArray()[0];

    // Execute the tool to trigger authentication header generation
    // Mock fetch to capture the headers
    const fetchMock = mockFetch();

    // Execute the tool to trigger header generation
    tool.execute();

    // Check that the Authorization header was set correctly
    expect(fetchMock.requestHeaders.Authorization).toBe('Bearer test_key');

    // Restore original fetch
    fetchMock.restore();
  });
});
