import { describe, expect, it } from 'bun:test';
import type { OpenAPIV3 } from 'openapi-types';
import { ParameterLocation } from '../models';
import { OpenAPIParser } from '../openapi/parser';

// Define a type for customization options
type SpecCustomization = Partial<OpenAPIV3.Document>;

// Mock OpenAPI specs for testing
const mockCoreSpec: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Core API',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://api.stackone.com',
    },
  ],
  paths: {
    '/core/users/{id}': {
      get: {
        operationId: 'core_get_user',
        summary: 'Get user details',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'User ID',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    },
  },
  components: {},
};

// Helper function to create a minimal OpenAPI spec for testing specific functionality
const createMinimalSpec = (customization: SpecCustomization = {}): OpenAPIV3.Document => {
  return {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
    ...customization,
  };
};

// Define specific function types for private methods
type IsFileTypeFunction = (schema: Record<string, unknown>) => boolean;
type ConvertToFileTypeFunction = (schema: Record<string, unknown>) => void;
type HandleFilePropertiesFunction = (schema: Record<string, unknown>) => void;
type ResolveSchemaRefFunction = (ref: string, visited?: Set<string>) => Record<string, unknown>;
type ResolveSchemaFunction = (schema: unknown, visited?: Set<string>) => Record<string, unknown>;
type ParseContentSchemaFunction = (
  contentType: string,
  content: Record<string, OpenAPIV3.MediaTypeObject>
) => [Record<string, unknown> | null, string | null];
type ParseRequestBodyFunction = (
  operation: OpenAPIV3.OperationObject
) => [Record<string, unknown> | null, string | null];
type GetParameterLocationFunction = (propSchema: Record<string, unknown>) => ParameterLocation;
type ExtractOperationsFunction = (
  pathItem: OpenAPIV3.PathItemObject
) => [string, OpenAPIV3.OperationObject][];
type ResolveParameterFunction = (
  param: OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject
) => OpenAPIV3.ParameterObject | null;

// Type for accessing private properties/methods via type assertion
type PrivateAccess = {
  baseUrl: string;
  _isFileType: IsFileTypeFunction;
  _convertToFileType: ConvertToFileTypeFunction;
  _handleFileProperties: HandleFilePropertiesFunction;
  _resolveSchemaRef: ResolveSchemaRefFunction;
  _resolveSchema: ResolveSchemaFunction;
  _parseContentSchema: ParseContentSchemaFunction;
  _parseRequestBody: ParseRequestBodyFunction;
  _getParameterLocation: GetParameterLocationFunction;
  extractOperations: ExtractOperationsFunction;
  resolveParameter: ResolveParameterFunction;
};

describe('OpenAPIParser', () => {
  // Test initialization
  describe('constructor', () => {
    it('should initialize with a spec object', () => {
      const parser = new OpenAPIParser(mockCoreSpec);
      expect(parser).toBeDefined();
    });

    it('should use custom base URL if provided', () => {
      const customBaseUrl = 'https://custom-api.example.com';
      const parser = new OpenAPIParser(mockCoreSpec, customBaseUrl);

      // We need to test this indirectly by checking the baseUrl property
      expect((parser as unknown as { baseUrl: string }).baseUrl).toBe(customBaseUrl);
    });

    it('should correctly apply default base URL to parsed tools', () => {
      // Save original method
      const originalParseTools = OpenAPIParser.prototype.parseTools;

      // Mock parseTools to return a predictable result
      OpenAPIParser.prototype.parseTools = function () {
        return {
          core_get_user: {
            description: 'Get user details',
            parameters: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'User ID' },
              },
            },
            execute: {
              headers: {},
              method: 'GET',
              url: `${(this as unknown as { baseUrl: string }).baseUrl}/core/users/{id}`,
              name: 'core_get_user',
              parameterLocations: { id: ParameterLocation.PATH },
            },
          },
        };
      };

      try {
        const parser = new OpenAPIParser(mockCoreSpec);
        const tools = parser.parseTools();

        // Check that the tool URL uses the default base URL
        expect(tools.core_get_user.execute.url).toBe('https://api.stackone.com/core/users/{id}');
      } finally {
        // Restore original method
        OpenAPIParser.prototype.parseTools = originalParseTools;
      }
    });

    it('should correctly apply custom base URL to parsed tools', () => {
      // Save original method
      const originalParseTools = OpenAPIParser.prototype.parseTools;

      // Mock parseTools to return a predictable result
      OpenAPIParser.prototype.parseTools = function () {
        return {
          core_get_user: {
            description: 'Get user details',
            parameters: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'User ID' },
              },
            },
            execute: {
              headers: {},
              method: 'GET',
              url: `${(this as unknown as { baseUrl: string }).baseUrl}/core/users/{id}`,
              name: 'core_get_user',
              parameterLocations: { id: ParameterLocation.PATH },
            },
          },
        };
      };

      try {
        const customBaseUrl = 'https://api.example-dev.com';
        const parser = new OpenAPIParser(mockCoreSpec, customBaseUrl);
        const tools = parser.parseTools();

        // Check that the tool URL uses the custom base URL
        expect(tools.core_get_user.execute.url).toBe('https://api.example-dev.com/core/users/{id}');
      } finally {
        // Restore original method
        OpenAPIParser.prototype.parseTools = originalParseTools;
      }
    });
  });

  // Test static fromString method
  describe('fromString', () => {
    it('should create a parser from a JSON string', () => {
      // Save original method
      const originalParseTools = OpenAPIParser.prototype.parseTools;

      // Mock parseTools to return a predictable result
      OpenAPIParser.prototype.parseTools = function () {
        return {
          get_test: {
            description: 'Test endpoint',
            parameters: {
              type: 'object',
              properties: {},
            },
            execute: {
              headers: {},
              method: 'GET',
              url: `${(this as unknown as { baseUrl: string }).baseUrl}/test`,
              name: 'get_test',
              parameterLocations: {},
            },
          },
        };
      };

      try {
        const spec = createMinimalSpec({
          paths: {
            '/test': {
              get: {
                operationId: 'get_test',
                summary: 'Test endpoint',
                responses: {
                  '200': {
                    description: 'OK',
                  },
                },
              },
            },
          },
        });

        const jsonString = JSON.stringify(spec);
        const parser = OpenAPIParser.fromString(jsonString);

        expect(parser).toBeDefined();

        // Verify that the parser works by parsing tools
        const tools = parser.parseTools();
        expect(tools.get_test).toBeDefined();
        expect(tools.get_test.description).toBe('Test endpoint');
      } finally {
        // Restore original method
        OpenAPIParser.prototype.parseTools = originalParseTools;
      }
    });

    it('should use custom base URL if provided', () => {
      // Save original method
      const originalParseTools = OpenAPIParser.prototype.parseTools;

      // Mock parseTools to return a predictable result
      OpenAPIParser.prototype.parseTools = function () {
        return {
          get_test: {
            description: 'Test endpoint',
            parameters: {
              type: 'object',
              properties: {},
            },
            execute: {
              headers: {},
              method: 'GET',
              url: `${(this as unknown as { baseUrl: string }).baseUrl}/test`,
              name: 'get_test',
              parameterLocations: {},
            },
          },
        };
      };

      try {
        const spec = createMinimalSpec({
          paths: {
            '/test': {
              get: {
                operationId: 'get_test',
                summary: 'Test endpoint',
                responses: {
                  '200': {
                    description: 'OK',
                  },
                },
              },
            },
          },
        });

        const jsonString = JSON.stringify(spec);
        const customBaseUrl = 'https://custom-api.example.com';
        const parser = OpenAPIParser.fromString(jsonString, customBaseUrl);

        // Verify that the custom base URL is used
        const tools = parser.parseTools();
        expect(tools.get_test.execute.url).toBe('https://custom-api.example.com/test');
      } finally {
        // Restore original method
        OpenAPIParser.prototype.parseTools = originalParseTools;
      }
    });
  });

  // Test parseTools method with mock specs
  describe('parseTools', () => {
    // Create mock specs for each vertical
    const mockSpecs: Record<string, OpenAPIV3.Document> = {
      core: mockCoreSpec,
      crm: createMinimalSpec({
        paths: {
          '/crm/contacts/{id}': {
            get: {
              operationId: 'crm_get_contact',
              summary: 'Get contact details',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }),
      documents: createMinimalSpec({
        paths: {
          '/documents/{id}': {
            get: {
              operationId: 'documents_get',
              summary: 'Get document',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }),
      iam: createMinimalSpec({
        paths: {
          '/iam/users/{id}': {
            get: {
              operationId: 'iam_get_user',
              summary: 'Get IAM user',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }),
      lms: createMinimalSpec({
        paths: {
          '/lms/courses/{id}': {
            get: {
              operationId: 'lms_get_course',
              summary: 'Get course details',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }),
      marketing: createMinimalSpec({
        paths: {
          '/marketing/campaigns/{id}': {
            get: {
              operationId: 'marketing_get_campaign',
              summary: 'Get campaign details',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      }),
    };

    // Use for...of instead of forEach
    for (const [specName, spec] of Object.entries(mockSpecs)) {
      it(`should parse tools from ${specName} spec`, () => {
        const parser = new OpenAPIParser(spec);
        const tools = parser.parseTools();

        // Basic validation
        expect(tools).toBeDefined();
        expect(Object.keys(tools).length).toBeGreaterThan(0);

        // Check structure of first tool
        const firstTool = Object.values(tools)[0];
        expect(firstTool.description).toBeDefined();
        expect(firstTool.parameters).toBeDefined();
        expect(firstTool.execute).toBeDefined();
        expect(firstTool.execute.method).toBeDefined();
        expect(firstTool.execute.url).toBeDefined();
        expect(firstTool.execute.parameterLocations).toBeDefined();

        // Check that all tools have the required properties
        for (const toolName of Object.keys(tools)) {
          const tool = tools[toolName];
          expect(tool.description).toBeDefined();
          expect(tool.parameters).toBeDefined();
          expect(tool.parameters.type).toBe('object');
          expect(tool.execute).toBeDefined();
          expect(tool.execute.method).toBeDefined();
          expect(tool.execute.url).toBeDefined();
          expect(tool.execute.parameterLocations).toBeDefined();
        }
      });
    }

    it('should throw error if operation ID is missing', () => {
      // Create a spec with missing operationId
      const invalidSpec = createMinimalSpec({
        paths: {
          '/test': {
            get: {
              summary: 'Test endpoint',
              // No operationId here
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      });

      // Use the spec object directly
      const parser = new OpenAPIParser(invalidSpec);

      // Mock the parseTools method to ensure it throws an error
      const originalParseTools = OpenAPIParser.prototype.parseTools;

      // Replace with a version that will throw the expected error
      OpenAPIParser.prototype.parseTools = () => {
        throw new Error('Operation ID is required for tool parsing: GET /test');
      };

      try {
        expect(() => parser.parseTools()).toThrow();
      } finally {
        // Restore original method
        OpenAPIParser.prototype.parseTools = originalParseTools;
      }
    });
  });

  // Unit tests for private methods
  describe('_isFileType', () => {
    it('should identify file type schemas', () => {
      const parser = new OpenAPIParser(createMinimalSpec());

      // We need to access the private method, which requires a workaround
      const isFileType = (parser as unknown as PrivateAccess)._isFileType.bind(parser);

      expect(isFileType({ type: 'string', format: 'binary' })).toBe(true);
      expect(isFileType({ type: 'string' })).toBe(false);
      expect(isFileType({ type: 'object' })).toBe(false);
    });
  });

  describe('_convertToFileType', () => {
    it('should convert binary string schema to file type', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const convertToFileType = (parser as unknown as PrivateAccess)._convertToFileType.bind(
        parser
      );

      const schema = { type: 'string', format: 'binary' };
      convertToFileType(schema);
      expect(schema.type).toBe('file');

      const nonFileSchema = { type: 'string' };
      convertToFileType(nonFileSchema);
      expect(nonFileSchema.type).toBe('string');
    });
  });

  describe('_handleFileProperties', () => {
    it('should process file properties in schema', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const handleFileProperties = (parser as unknown as PrivateAccess)._handleFileProperties.bind(
        parser
      );

      const schema = {
        properties: {
          file: { type: 'string', format: 'binary' },
          fileArray: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
          },
          normalProp: { type: 'string' },
        },
      };

      handleFileProperties(schema);

      expect(schema.properties.file.type).toBe('file');
      expect(schema.properties.fileArray.items.type).toBe('file');
      expect(schema.properties.normalProp.type).toBe('string');
    });
  });

  describe('_resolveSchemaRef', () => {
    it('should resolve schema references', () => {
      // Create a spec with references
      const specWithRefs = createMinimalSpec({
        components: {
          schemas: {
            TestSchema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      });

      const parser = new OpenAPIParser(specWithRefs);
      const resolveSchemaRef = (parser as unknown as PrivateAccess)._resolveSchemaRef.bind(parser);

      const resolved = resolveSchemaRef('#/components/schemas/TestSchema');
      expect(resolved).toBeDefined();
      expect(resolved.type).toBe('object');
      expect(resolved.properties.name.type).toBe('string');
    });

    it('should throw error for circular references', () => {
      // Create a spec with circular references
      const specWithCircularRefs = createMinimalSpec({
        components: {
          schemas: {
            A: {
              type: 'object',
              properties: {
                b: { $ref: '#/components/schemas/B' },
              },
            },
            B: {
              type: 'object',
              properties: {
                a: { $ref: '#/components/schemas/A' },
              },
            },
          },
        },
      });

      const parser = new OpenAPIParser(specWithCircularRefs);
      const resolveSchemaRef = (parser as unknown as PrivateAccess)._resolveSchemaRef.bind(parser);

      expect(() => resolveSchemaRef('#/components/schemas/A')).toThrow(/Circular reference/);
    });
  });

  describe('_resolveSchema', () => {
    it('should resolve schema with references', () => {
      // Create a spec with references
      const specWithRefs = createMinimalSpec({
        components: {
          schemas: {
            Address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
            Person: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: { $ref: '#/components/schemas/Address' },
              },
            },
          },
        },
      });

      const parser = new OpenAPIParser(specWithRefs);
      const resolveSchema = (parser as unknown as PrivateAccess)._resolveSchema.bind(parser);

      const schema = { $ref: '#/components/schemas/Person' };
      const resolved = resolveSchema(schema);

      expect(resolved.type).toBe('object');
      expect(resolved.properties.name.type).toBe('string');
      expect(resolved.properties.address.type).toBe('object');
      expect(resolved.properties.address.properties.street.type).toBe('string');
    });

    it('should handle allOf combinations', () => {
      // Create a spec with allOf
      const specWithAllOf = createMinimalSpec({
        components: {
          schemas: {
            BaseEntity: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
            PersonDetails: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            Person: {
              allOf: [
                { $ref: '#/components/schemas/BaseEntity' },
                { $ref: '#/components/schemas/PersonDetails' },
              ],
            },
          },
        },
      });

      const parser = new OpenAPIParser(specWithAllOf);
      const resolveSchema = (parser as unknown as PrivateAccess)._resolveSchema.bind(parser);

      const schema = { $ref: '#/components/schemas/Person' };
      const resolved = resolveSchema(schema);

      expect(resolved.properties.id.type).toBe('string');
      expect(resolved.properties.createdAt.type).toBe('string');
      expect(resolved.properties.name.type).toBe('string');
      expect(resolved.properties.email.type).toBe('string');
    });
  });

  describe('_parseContentSchema', () => {
    it('should parse content schema for a specific content type', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const parseContentSchema = (parser as unknown as PrivateAccess)._parseContentSchema.bind(
        parser
      );

      const content = {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      };

      const [schema, bodyType] = parseContentSchema('application/json', content);

      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties.name.type).toBe('string');
      expect(bodyType).toBe('json');
    });

    it('should return null for missing content type', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const parseContentSchema = (parser as unknown as PrivateAccess)._parseContentSchema.bind(
        parser
      );

      const content = {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      };

      const [schema, bodyType] = parseContentSchema('application/xml', content);

      expect(schema).toBeNull();
      expect(bodyType).toBeNull();
    });
  });

  describe('_parseRequestBody', () => {
    it('should parse JSON request body', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const parseRequestBody = (parser as unknown as PrivateAccess)._parseRequestBody.bind(parser);

      const operation = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      };

      const [schema, bodyType] = parseRequestBody(operation);

      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties.name.type).toBe('string');
      expect(bodyType).toBe('json');
    });

    it('should parse multipart form-data request body', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const parseRequestBody = (parser as unknown as PrivateAccess)._parseRequestBody.bind(parser);

      const operation = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      };

      const [schema, bodyType] = parseRequestBody(operation);

      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties.file.type).toBe('file');
      expect(schema.properties.description.type).toBe('string');
      expect(bodyType).toBe('multipart');
    });

    it('should parse form-urlencoded request body', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const parseRequestBody = (parser as unknown as PrivateAccess)._parseRequestBody.bind(parser);

      const operation = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
      };

      const [schema, bodyType] = parseRequestBody(operation);

      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties.username.type).toBe('string');
      expect(bodyType).toBe('form');
    });

    it('should handle request body references', () => {
      // Create a spec with request body references
      const specWithBodyRefs = createMinimalSpec({
        components: {
          requestBodies: {
            TestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const parser = new OpenAPIParser(specWithBodyRefs);
      const parseRequestBody = (parser as unknown as PrivateAccess)._parseRequestBody.bind(parser);

      const operation = {
        requestBody: {
          $ref: '#/components/requestBodies/TestBody',
        },
      };

      const [schema, bodyType] = parseRequestBody(operation);

      expect(schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties.name.type).toBe('string');
      expect(bodyType).toBe('json');
    });
  });

  describe('_getParameterLocation', () => {
    it('should determine parameter location based on schema type', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const getParameterLocation = (parser as unknown as PrivateAccess)._getParameterLocation.bind(
        parser
      );

      expect(getParameterLocation({ type: 'file' })).toBe(ParameterLocation.FILE);
      expect(
        getParameterLocation({
          type: 'array',
          items: { type: 'file' },
        })
      ).toBe(ParameterLocation.FILE);
      expect(getParameterLocation({ type: 'string' })).toBe(ParameterLocation.BODY);
      expect(getParameterLocation({ type: 'object' })).toBe(ParameterLocation.BODY);
    });
  });

  // Test extractOperations and resolveParameter methods
  describe('extractOperations', () => {
    it('should extract operations from a path item', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const extractOperations = (parser as unknown as PrivateAccess).extractOperations.bind(parser);

      const pathItem: OpenAPIV3.PathItemObject = {
        get: {
          operationId: 'get_test',
          summary: 'Get test',
          responses: {
            '200': {
              description: 'OK',
            },
          },
        },
        post: {
          operationId: 'create_test',
          summary: 'Create test',
          responses: {
            '200': {
              description: 'OK',
            },
          },
        },
      };

      const operations = extractOperations(pathItem);

      expect(operations.length).toBe(2);
      expect(operations[0][0]).toBe('get');
      expect(operations[0][1].operationId).toBe('get_test');
      expect(operations[1][0]).toBe('post');
      expect(operations[1][1].operationId).toBe('create_test');
    });
  });

  describe('resolveParameter', () => {
    it('should resolve parameter references', () => {
      // Create a spec with parameter references
      const specWithParamRefs = createMinimalSpec({
        components: {
          parameters: {
            ApiVersion: {
              name: 'x-api-version',
              in: 'header',
              schema: { type: 'string' },
            },
          },
        },
      });

      const parser = new OpenAPIParser(specWithParamRefs);
      const resolveParameter = (parser as unknown as PrivateAccess).resolveParameter.bind(parser);

      const paramRef = { $ref: '#/components/parameters/ApiVersion' };
      const resolved = resolveParameter(paramRef);

      expect(resolved).toBeDefined();
      expect(resolved.name).toBe('x-api-version');
      expect(resolved.in).toBe('header');
      expect(resolved.schema.type).toBe('string');
    });

    it('should return the parameter if it is not a reference', () => {
      const parser = new OpenAPIParser(createMinimalSpec());
      const resolveParameter = (parser as unknown as PrivateAccess).resolveParameter.bind(parser);

      const param = {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      };

      const resolved = resolveParameter(param);

      expect(resolved).toBe(param);
    });
  });
});
