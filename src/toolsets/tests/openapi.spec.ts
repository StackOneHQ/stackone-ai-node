import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import path from 'node:path';
import { OpenAPILoader } from '../../openapi/loader';
import { ParameterLocation } from '../../types';
import type { AuthenticationConfig } from '../base';
import { OpenAPIToolSet, type OpenAPIToolSetConfigFromUrl } from '../openapi';

describe('OpenAPIToolSet', () => {
  const fixturesPath = path.join(import.meta.dir, 'fixtures');
  const petstoreJsonPath = path.join(fixturesPath, 'petstore.json');

  let loadFromFileSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    loadFromFileSpy = spyOn(OpenAPILoader, 'loadFromFile').mockImplementation(() => ({
      pet_findById: {
        name: 'pet_findById',
        description: 'Find pet by ID',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID of pet to return',
            },
          },
          required: ['id'],
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
  });

  afterEach(() => {
    mock.restore();
  });

  it('should initialize with a file path', () => {
    // Create an instance of OpenAPIToolSet
    const toolset = new OpenAPIToolSet({
      filePath: petstoreJsonPath,
    });

    // Verify the toolset was initialized
    expect(toolset).toBeDefined();
    expect(loadFromFileSpy).toHaveBeenCalledWith(petstoreJsonPath, undefined);
  });

  it('should throw error if neither filePath nor url is provided', () => {
    // Attempt to create an instance without filePath or url
    expect(() => new OpenAPIToolSet({})).toThrow();
  });

  it('should throw error if url is provided in constructor instead of fromUrl', () => {
    // Attempt to create an instance with url in constructor
    expect(
      () =>
        new OpenAPIToolSet({
          // @ts-expect-error - Testing invalid input
          url: 'https://example.com/openapi.json',
        })
    ).toThrow();
  });

  it('should create an instance from a URL', async () => {
    // Mock fetch for loading the spec
    const mockResponse = new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // Mock the global fetch function for this test only
    const originalFetch = global.fetch;
    global.fetch = mock(() => Promise.resolve(mockResponse));

    try {
      // Create an instance from a URL
      const toolset = await OpenAPIToolSet.fromUrl({
        url: 'https://example.com/openapi.json',
      });

      // Verify the toolset was initialized
      expect(toolset).toBeDefined();
    } finally {
      // Restore the original fetch function
      global.fetch = originalFetch;
    }
  });

  it('should throw error if URL is not provided to fromUrl', async () => {
    // Attempt to create an instance without URL
    await expect(OpenAPIToolSet.fromUrl({} as OpenAPIToolSetConfigFromUrl)).rejects.toThrow();
  });

  it('should set headers on tools', () => {
    // Create an instance with headers
    const toolset = new OpenAPIToolSet({
      filePath: petstoreJsonPath,
      headers: {
        'X-Test-Header': 'test-value',
      },
    });

    // Get the tool
    const tool = toolset.getTool('pet_findById');

    // Verify the header was set
    const headers = tool.getHeaders();
    expect(headers).toHaveProperty('X-Test-Header', 'test-value');
  });

  it('should use basic authentication', () => {
    // Create an instance of OpenAPIToolSet with basic auth
    const auth: AuthenticationConfig = {
      type: 'basic',
      credentials: {
        username: 'testuser',
        password: 'testpass',
      },
    };

    const toolset = new OpenAPIToolSet({
      filePath: petstoreJsonPath,
      authentication: auth,
    });
    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.authentication).toEqual(auth);

    const tool = toolset.getTool('pet_findById');
    const headers = tool.getHeaders();

    const expectedAuthValue = `Basic ${Buffer.from('testuser:testpass').toString('base64')}`;
    expect(headers.Authorization).toBe(expectedAuthValue);
  });

  it('should use bearer authentication', () => {
    // Create an instance of OpenAPIToolSet with bearer auth
    const auth: AuthenticationConfig = {
      type: 'bearer',
      credentials: {
        token: 'test-token',
      },
    };

    const toolset = new OpenAPIToolSet({
      filePath: petstoreJsonPath,
      authentication: auth,
    });

    // @ts-expect-error - Accessing protected property for testing
    expect(toolset.authentication).toEqual(auth);

    const tool = toolset.getTool('pet_findById');
    const headers = tool.getHeaders();

    expect(headers.Authorization).toBe('Bearer test-token');
  });
});
