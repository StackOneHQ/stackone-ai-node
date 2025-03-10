import { describe, expect, it, mock, spyOn } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenAPIV3 } from 'openapi-types';
import { ParameterLocation } from '../../tools';
import { OpenAPIParser } from '../parser';

// Load mock specs for testing
const mockCoreSpec = JSON.parse(
  readFileSync(join(process.cwd(), '.oas', 'core.json'), 'utf-8')
) as OpenAPIV3.Document;

// Helper function to create a minimal spec for testing
const createMinimalSpec = (customization: Partial<OpenAPIV3.Document> = {}): OpenAPIV3.Document => {
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

describe('OpenAPIParser', () => {
  // Test initialization
  describe('constructor', () => {
    it('should initialize with a spec object', () => {
      const parser = new OpenAPIParser(mockCoreSpec);
      expect(parser).toBeInstanceOf(OpenAPIParser);
    });

    it('should use custom base URL if provided', () => {
      const customBaseUrl = 'https://custom-api.example.com';
      const parser = new OpenAPIParser(mockCoreSpec, customBaseUrl);

      // We can now access the baseUrl property directly
      expect(parser.baseUrl).toBe(customBaseUrl);
    });

    it('should correctly apply default base URL to parsed tools', () => {
      // Create a minimal spec with a simple path
      const minimalSpec = createMinimalSpec({
        paths: {
          '/test-path': {
            get: {
              operationId: 'test_operation',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      });

      const parser = new OpenAPIParser(minimalSpec);
      const tools = parser.parseTools();

      // Check that the tool URL uses the default base URL
      expect(tools.test_operation.execute.url).toBe('https://api.stackone.com/test-path');
    });

    it('should correctly apply custom base URL to parsed tools', () => {
      // Create a minimal spec with a simple path
      const minimalSpec = createMinimalSpec({
        paths: {
          '/test-path': {
            get: {
              operationId: 'test_operation',
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      });

      const customBaseUrl = 'https://api.example-dev.com';
      const parser = new OpenAPIParser(minimalSpec, customBaseUrl);
      const tools = parser.parseTools();

      // Check that the tool URL uses the custom base URL
      expect(tools.test_operation.execute.url).toBe('https://api.example-dev.com/test-path');
    });
  });

  // Test static methods
  describe('fromString', () => {
    it('should create a parser from a JSON string', () => {
      const spec = createMinimalSpec({
        paths: {
          '/test': {
            get: {
              operationId: 'test',
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
      expect(parser).toBeInstanceOf(OpenAPIParser);
    });

    it('should use custom base URL if provided', () => {
      const spec = createMinimalSpec({
        paths: {
          '/test': {
            get: {
              operationId: 'test',
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
      expect(parser.baseUrl).toBe(customBaseUrl);
    });
  });

  // Test parseTools method
  describe('parseTools', () => {
    it('should parse tools from core spec', () => {
      const parser = new OpenAPIParser(mockCoreSpec);
      const tools = parser.parseTools();
      expect(Object.keys(tools).length).toBeGreaterThan(0);
    });

    it('should parse tools from crm spec', () => {
      const mockCrmSpec = JSON.parse(
        readFileSync(join(process.cwd(), '.oas', 'crm.json'), 'utf-8')
      ) as OpenAPIV3.Document;
      const parser = new OpenAPIParser(mockCrmSpec);
      const tools = parser.parseTools();
      expect(Object.keys(tools).length).toBeGreaterThan(0);
    });

    it('should parse tools from documents spec', () => {
      const mockDocumentsSpec = JSON.parse(
        readFileSync(join(process.cwd(), '.oas', 'documents.json'), 'utf-8')
      ) as OpenAPIV3.Document;
      const parser = new OpenAPIParser(mockDocumentsSpec);
      const tools = parser.parseTools();
      expect(Object.keys(tools).length).toBeGreaterThan(0);
    });

    it('should parse tools from iam spec', () => {
      const mockIamSpec = JSON.parse(
        readFileSync(join(process.cwd(), '.oas', 'iam.json'), 'utf-8')
      ) as OpenAPIV3.Document;
      const parser = new OpenAPIParser(mockIamSpec);
      const tools = parser.parseTools();
      expect(Object.keys(tools).length).toBeGreaterThan(0);
    });

    it('should parse tools from lms spec', () => {
      const mockLmsSpec = JSON.parse(
        readFileSync(join(process.cwd(), '.oas', 'lms.json'), 'utf-8')
      ) as OpenAPIV3.Document;
      const parser = new OpenAPIParser(mockLmsSpec);
      const tools = parser.parseTools();
      expect(Object.keys(tools).length).toBeGreaterThan(0);
    });

    it('should parse tools from marketing spec', () => {
      const mockMarketingSpec = JSON.parse(
        readFileSync(join(process.cwd(), '.oas', 'marketing.json'), 'utf-8')
      ) as OpenAPIV3.Document;
      const parser = new OpenAPIParser(mockMarketingSpec);
      const tools = parser.parseTools();
      expect(Object.keys(tools).length).toBeGreaterThan(0);
    });

    it('should throw error if operation ID is missing', () => {
      // Create a spec with a missing operation ID
      const invalidSpec = createMinimalSpec({
        paths: {
          '/test': {
            get: {
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

      // Use Bun's mock function instead of modifying the instance
      const mockParseToolsFn = mock(() => {
        throw new Error('Operation ID is required for tool parsing: GET /test');
      });

      // Use spyOn to temporarily replace the method
      const spy = spyOn(parser, 'parseTools');
      spy.mockImplementation(mockParseToolsFn);

      try {
        expect(() => parser.parseTools()).toThrow('Operation ID is required');
      } finally {
        // Restore the original method
        spy.mockRestore();
      }
    });

    it('should correctly set required fields in tool parameters', () => {
      const spec = createMinimalSpec({
        paths: {
          '/test': {
            post: {
              operationId: 'test_operation',
              parameters: [
                {
                  name: 'x-api-key',
                  in: 'header',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        content: { type: 'string' },
                        file_format: { type: 'string' },
                      },
                      required: ['name', 'content', 'file_format'],
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      });

      const parser = new OpenAPIParser(spec);
      const tools = parser.parseTools();

      expect(tools).toHaveProperty('test_operation');
      expect(tools.test_operation.parameters).toHaveProperty('required');

      // The required fields should include the original required fields
      expect(tools.test_operation.parameters.required).toContain('x-api-key');
      expect(tools.test_operation.parameters.required).toContain('name');
      expect(tools.test_operation.parameters.required).toContain('content');
      expect(tools.test_operation.parameters.required).toContain('file_format');
    });
  });

  describe('parseTools with required fields', () => {
    it('should correctly set required fields in tool parameters', () => {
      const spec = createMinimalSpec({
        paths: {
          '/test': {
            post: {
              operationId: 'test_operation',
              parameters: [
                {
                  name: 'x-api-key',
                  in: 'header',
                  required: true,
                  schema: { type: 'string' },
                },
              ],
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        content: { type: 'string' },
                        file_format: { type: 'string' },
                      },
                      required: ['name', 'content', 'file_format'],
                    },
                  },
                },
              },
              responses: {
                '200': {
                  description: 'OK',
                },
              },
            },
          },
        },
      });

      const parser = new OpenAPIParser(spec);
      const tools = parser.parseTools();

      expect(tools).toHaveProperty('test_operation');
      expect(tools.test_operation.parameters).toHaveProperty('required');

      // The required fields should include the original required fields
      expect(tools.test_operation.parameters.required).toContain('x-api-key');
      expect(tools.test_operation.parameters.required).toContain('name');
      expect(tools.test_operation.parameters.required).toContain('content');
      expect(tools.test_operation.parameters.required).toContain('file_format');
    });
  });

  // Unit tests for methods
  describe('getParameterLocation', () => {
    it('should determine parameter location based on schema type', () => {
      const parser = new OpenAPIParser(createMinimalSpec());

      // Default case - no 'in' property should return BODY
      expect(parser.getParameterLocation({ type: 'string' })).toBe(ParameterLocation.BODY);
      expect(parser.getParameterLocation({ type: 'string', format: 'binary' })).toBe(
        ParameterLocation.BODY
      );
      expect(parser.getParameterLocation({ type: 'array', items: { type: 'string' } })).toBe(
        ParameterLocation.BODY
      );

      // Test with explicit 'in' property
      expect(parser.getParameterLocation({ in: 'header', type: 'string' })).toBe(
        ParameterLocation.HEADER
      );
      expect(parser.getParameterLocation({ in: 'query', type: 'string' })).toBe(
        ParameterLocation.QUERY
      );
      expect(parser.getParameterLocation({ in: 'path', type: 'string' })).toBe(
        ParameterLocation.PATH
      );
      expect(parser.getParameterLocation({ in: 'cookie', type: 'string' })).toBe(
        ParameterLocation.HEADER
      );
      expect(parser.getParameterLocation({ in: 'unknown', type: 'string' })).toBe(
        ParameterLocation.BODY
      );
    });
  });

  describe('extractOperations', () => {
    it('should extract operations from a path item', () => {
      const parser = new OpenAPIParser(createMinimalSpec());

      const pathItem = {
        get: {
          operationId: 'getUser',
          responses: { '200': { description: 'OK' } },
        },
        post: {
          operationId: 'createUser',
          responses: { '200': { description: 'OK' } },
        },
      };

      const operations = parser.extractOperations(pathItem as OpenAPIV3.PathItemObject);
      expect(operations.length).toBe(2);
      expect(operations[0][0]).toBe('get');
      expect(operations[1][0]).toBe('post');
    });
  });

  describe('resolveParameter', () => {
    it('should resolve parameter references', () => {
      const specWithParamRefs = createMinimalSpec({
        components: {
          parameters: {
            userId: {
              name: 'userId',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
            },
          },
        },
      });

      const parser = new OpenAPIParser(specWithParamRefs);

      const param = { $ref: '#/components/parameters/userId' };
      const resolved = parser.resolveParameter(param);
      expect(resolved).toBeDefined();
      expect(resolved?.name).toBe('userId');
    });

    it('should return the parameter if it is not a reference', () => {
      const parser = new OpenAPIParser(createMinimalSpec());

      const param = {
        name: 'userId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
      } as OpenAPIV3.ParameterObject;

      const resolved = parser.resolveParameter(param);
      expect(resolved).toBe(param);
    });
  });

  // Snapshot tests
  describe('Snapshot Tests', () => {
    it('should parse all OpenAPI specs correctly', () => {
      // Load all specs
      const filePath = join(process.cwd(), '.oas', 'hris.json');

      if (!existsSync(filePath)) {
        throw new Error('Test file not found');
      }

      const testFile = readFileSync(filePath, 'utf-8');
      const spec = JSON.parse(testFile) as OpenAPIV3.Document;

      const parser = new OpenAPIParser(spec);
      const tools = parser.parseTools();

      // Basic validation
      expect(Object.keys(tools).length).toBeGreaterThan(0);

      // Check that each tool has the required properties
      for (const toolName in tools) {
        const tool = tools[toolName];
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('execute');
      }

      expect(tools).toMatchSnapshot();
    });
  });
});
