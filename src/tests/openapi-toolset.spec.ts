import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import path from 'node:path';
import { OpenAPILoader } from '../openapi/loader';
import { ParameterLocation, Tool } from '../tools';
import { OpenAPIToolSet } from '../toolset';
import { mockFetch } from './utils/fetch-mock';

describe('OpenAPIToolSet', () => {
  // Path to test fixtures
  const fixturesPath = path.join(import.meta.dir, '..', '..', 'test', 'fixtures');
  const petstoreJsonPath = path.join(fixturesPath, 'petstore.json');

  // Set up and tear down mocks
  beforeEach(() => {
    // Set up any common mocks here
  });

  afterEach(() => {
    // Clean up all mocks
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
      filePath: petstoreJsonPath,
      baseUrl: 'https://petstore.swagger.io/v2',
    });

    expect(toolset).toBeDefined();
    expect(loadFromFileSpy).toHaveBeenCalledWith(
      petstoreJsonPath,
      'https://petstore.swagger.io/v2',
      false
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

  it('should load tools from a URL', async () => {
    // Mock the OpenAPILoader.loadFromFile method to avoid the error
    const _loadFromFileSpy = spyOn(OpenAPILoader, 'loadFromFile').mockImplementation(() => ({}));

    // Create a mock for the OpenAPILoader.loadFromUrl method
    const loadFromUrlSpy = spyOn(OpenAPILoader, 'loadFromUrl').mockImplementation(async () => ({
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

    // Call the fromUrl method
    const toolset = await OpenAPIToolSet.fromUrl({
      url: 'https://example.com/petstore.json',
      baseUrl: 'https://petstore.swagger.io/v2',
    });

    expect(toolset).toBeDefined();
    expect(loadFromUrlSpy).toHaveBeenCalledWith(
      'https://example.com/petstore.json',
      'https://petstore.swagger.io/v2',
      false
    );

    // Get all tools
    const tools = toolset.getTools();
    expect(tools.length).toBe(1);

    // Check that tools are instances of Tool
    for (const tool of tools) {
      expect(tool).toBeInstanceOf(Tool);
    }
  });

  it('should throw error if URL is not provided to fromUrl', async () => {
    await expect(OpenAPIToolSet.fromUrl({})).rejects.toThrow();
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
      filePath: petstoreJsonPath,
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
      filePath: petstoreJsonPath,
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
      filePath: petstoreJsonPath,
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

    // Create expected auth value (base64 encoded username:password)
    const expectedAuthValue = `Basic ${Buffer.from('testuser:testpass').toString('base64')}`;

    // Mock fetch to capture the headers
    const fetchMock = mockFetch();

    // Execute the tool to trigger header generation
    tool.execute();

    // Check that the Authorization header was set correctly
    expect(fetchMock.requestHeaders.Authorization).toBe(expectedAuthValue);

    // Restore the original fetch
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
      filePath: petstoreJsonPath,
      baseUrl: 'https://petstore.swagger.io/v2',
      authentication: {
        type: 'bearer',
        credentials: {
          token: 'test-token',
        },
      },
    });

    // Verify the authentication was passed to the tool
    const tools = toolset.getTools();
    const tool = tools.toArray()[0];

    // Mock fetch to capture the headers
    const fetchMock = mockFetch();

    // Execute the tool to trigger header generation
    tool.execute();

    // Check that the Authorization header was set correctly
    expect(fetchMock.requestHeaders.Authorization).toBe('Bearer test-token');

    // Restore the original fetch
    fetchMock.restore();
  });
});
