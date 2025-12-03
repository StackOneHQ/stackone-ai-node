import { createFixture } from 'fs-fixture';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/node.ts';
import type { AuthenticationConfig } from '../base';
import { OpenAPIToolSet, type OpenAPIToolSetConfigFromUrl } from '../openapi';

const petstoreSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Swagger Petstore',
    description: 'This is a sample server Petstore server.',
    version: '1.0.0',
  },
  servers: [{ url: 'https://petstore.swagger.io/v2' }],
  paths: {
    '/pet/{petId}': {
      get: {
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        operationId: 'getPetById',
        parameters: [
          {
            name: 'petId',
            in: 'path',
            description: 'ID of pet to return',
            required: true,
            schema: { type: 'integer', format: 'int64' },
          },
        ],
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Pet' },
              },
            },
          },
          '400': { description: 'Invalid ID supplied' },
          '404': { description: 'Pet not found' },
        },
      },
    },
    '/pet': {
      post: {
        summary: 'Add a new pet to the store',
        description: 'Add a new pet to the store',
        operationId: 'addPet',
        requestBody: {
          description: 'Pet object that needs to be added to the store',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Pet' },
            },
          },
          required: true,
        },
        responses: {
          '200': {
            description: 'successful operation',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Pet' },
              },
            },
          },
          '405': { description: 'Invalid input' },
        },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        required: ['name', 'photoUrls'],
        properties: {
          id: { type: 'integer', format: 'int64', example: 10 },
          name: { type: 'string', example: 'doggie' },
          category: {
            type: 'object',
            properties: {
              id: { type: 'integer', format: 'int64', example: 1 },
              name: { type: 'string', example: 'Dogs' },
            },
          },
          photoUrls: { type: 'array', items: { type: 'string' } },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer', format: 'int64' },
                name: { type: 'string' },
              },
            },
          },
          status: {
            type: 'string',
            description: 'pet status in the store',
            enum: ['available', 'pending', 'sold'],
          },
        },
      },
    },
  },
} as const;

describe('OpenAPIToolSet', () => {
  afterEach(() => {
    server.events.removeAllListeners('request:start');
  });

  it('should initialize with a file path', async () => {
    await using fixture = await createFixture({
      'petstore.json': JSON.stringify(petstoreSpec),
    });

    const toolset = new OpenAPIToolSet({
      filePath: fixture.getPath('petstore.json'),
    });

    expect(toolset).toBeDefined();
    expect(toolset.getTool('getPetById')).toBeDefined();
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
    server.use(
      http.get('https://example.com/openapi.json', () =>
        HttpResponse.json({
          paths: {},
        })
      )
    );

    const recordedRequests: Request[] = [];
    server.events.on('request:start', ({ request }) => {
      recordedRequests.push(request);
    });

    // Create an instance from a URL
    const toolset = await OpenAPIToolSet.fromUrl({
      url: 'https://example.com/openapi.json',
    });

    // Verify the toolset was initialized
    expect(toolset).toBeDefined();
    expect(recordedRequests).toHaveLength(1);
    expect(recordedRequests[0]?.url).toBe('https://example.com/openapi.json');
  });

  it('should throw error if URL is not provided to fromUrl', async () => {
    // Attempt to create an instance without URL
    await expect(OpenAPIToolSet.fromUrl({} as OpenAPIToolSetConfigFromUrl)).rejects.toThrow();
  });

  it('should set headers on tools', async () => {
    await using fixture = await createFixture({
      'petstore.json': JSON.stringify(petstoreSpec),
    });

    const toolset = new OpenAPIToolSet({
      filePath: fixture.getPath('petstore.json'),
      headers: {
        'X-Test-Header': 'test-value',
      },
    });

    const tool = toolset.getTool('getPetById');
    const headers = tool.getHeaders();
    expect(headers).toHaveProperty('X-Test-Header', 'test-value');
  });

  it('should use basic authentication', async () => {
    await using fixture = await createFixture({
      'petstore.json': JSON.stringify(petstoreSpec),
    });

    const auth: AuthenticationConfig = {
      type: 'basic',
      credentials: {
        username: 'testuser',
        password: 'testpass',
      },
    };

    const toolset = new OpenAPIToolSet({
      filePath: fixture.getPath('petstore.json'),
      authentication: auth,
    });

    const tool = toolset.getTool('getPetById');
    const headers = tool.getHeaders();

    const expectedAuthValue = `Basic ${Buffer.from('testuser:testpass').toString('base64')}`;
    expect(headers.Authorization).toBe(expectedAuthValue);
  });

  it('should use bearer authentication', async () => {
    await using fixture = await createFixture({
      'petstore.json': JSON.stringify(petstoreSpec),
    });

    const auth: AuthenticationConfig = {
      type: 'bearer',
      credentials: {
        token: 'test-token',
      },
    };

    const toolset = new OpenAPIToolSet({
      filePath: fixture.getPath('petstore.json'),
      authentication: auth,
    });

    const tool = toolset.getTool('getPetById');
    const headers = tool.getHeaders();

    expect(headers.Authorization).toBe('Bearer test-token');
  });
});
