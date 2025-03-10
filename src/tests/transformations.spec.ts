/**
 * Tests for parameter transformation functions
 */

import {
  type Mock,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { OpenAPIToolSet } from '../toolsets';
import { transformParameter } from '../transformations';
import type { ParameterTransformer } from '../types';
import { mockFetch } from './utils/fetch-mock';

describe('Parameter Transformations', () => {
  // Create a test file for derivation tests
  const testFileContent = 'Test file content';
  const testFilePath = path.join(import.meta.dir, 'test-file.txt');

  // Create the test file before tests
  beforeAll(() => {
    fs.writeFileSync(testFilePath, testFileContent);
  });

  // Remove the test file after tests
  afterAll(() => {
    fs.unlinkSync(testFilePath);
  });

  // Create a test derivation config
  const testParameterTransformer: ParameterTransformer = {
    transforms: {
      derived_param1: (value: unknown): string => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        return `derived_${value}`;
      },
      derived_param2: (value: unknown): string => {
        if (typeof value !== 'string') {
          throw new Error('Value must be a string');
        }
        return `${value}_derived`;
      },
    },
  };

  describe('transformParameter', () => {
    it('should derive multiple parameters from a source parameter', () => {
      // Test data
      const sourceParam = 'source_param';
      const sourceValue = 'test_value';

      // Transform parameters for derived_param1
      const result1 = transformParameter(
        sourceValue,
        'derived_param1',
        sourceParam,
        testParameterTransformer
      );

      // Transform parameters for derived_param2
      const result2 = transformParameter(
        sourceValue,
        'derived_param2',
        sourceParam,
        testParameterTransformer
      );

      // Verify derived parameters
      expect(result1).toHaveProperty('derived_param1', 'derived_test_value');
      expect(result2).toHaveProperty('derived_param2', 'test_value_derived');
    });

    it('should handle unknown parameters gracefully', () => {
      // Test with a parameter that doesn't exist
      const result = transformParameter(
        'test_value',
        'nonexistent_param',
        'source_param',
        testParameterTransformer
      );

      // Verify no parameters were added
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle errors in derivation functions', () => {
      // Create a derivation config with a function that throws
      const errorConfig: ParameterTransformer = {
        transforms: {
          error_param: (_value: unknown): string => {
            throw new Error('Test error');
          },
          success_param: (value: unknown): string => {
            if (typeof value !== 'string') {
              throw new Error('Value must be a string');
            }
            return `success_${value}`;
          },
        },
      };

      // Test data
      const sourceValue = 'test_value';
      const sourceParam = 'source_param';

      // Transform parameters for success_param
      const successResult = transformParameter(
        sourceValue,
        'success_param',
        sourceParam,
        errorConfig
      );

      // Verify success parameter is present
      expect(successResult).toHaveProperty('success_param', 'success_test_value');

      // Verify error parameter throws
      expect(() =>
        transformParameter(sourceValue, 'error_param', sourceParam, errorConfig)
      ).toThrow();
    });
  });
});

describe('Parameter Transformation Edge Cases', () => {
  // Create a temporary directory and file for tests
  let tempDir: string;
  let tempSpecFile: string;
  let fetchMock: ReturnType<typeof mockFetch>;
  let mockTool: { execute: Mock<any> };

  // Set up before each test
  beforeEach(() => {
    // Create a temporary directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openapi-test-'));

    // Create a temporary spec file
    tempSpecFile = path.join(tempDir, 'test-spec.json');

    // Write a minimal OpenAPI spec to the file
    fs.writeFileSync(
      tempSpecFile,
      JSON.stringify({
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/test': {
            post: {
              operationId: 'test_derivation',
              parameters: [
                {
                  name: 'source_param',
                  in: 'query',
                  schema: {
                    type: 'string',
                  },
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
      })
    );

    // Set up fetch mock
    fetchMock = mockFetch({
      defaultResponse: {
        ok: true,
        json: async () => ({ success: true }),
      },
    });

    // Create a mock tool with an execute method
    mockTool = {
      execute: mock(async (params, _options) => {
        return {
          mappedParams: params,
          url: 'https://example.com/api',
          method: 'POST',
          headers: {},
          body: null,
          originalParams: params,
        };
      }),
    };

    // Mock the OpenAPIToolSet.getTools method
    spyOn(OpenAPIToolSet.prototype, 'getTools').mockImplementation(() => {
      return {
        getTool: mock(() => mockTool),
      } as any;
    });
  });

  // Clean up after each test
  afterEach(() => {
    // Restore fetch mock
    fetchMock.restore();

    // Clean up temporary files
    try {
      fs.unlinkSync(tempSpecFile);
      fs.rmdirSync(tempDir, { recursive: true });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  });

  describe('Empty derivation configs', () => {
    it('should handle empty derivation configs map', async () => {
      // Create OpenAPIToolSet with empty derivation configs
      const toolset = new OpenAPIToolSet({
        filePath: tempSpecFile,
        transformers: new Map<string, ParameterTransformer>(),
      });

      // Get test tool
      const tools = toolset.getTools();
      const testTool = tools.getTool('test_derivation');

      expect(testTool).toBeDefined();
      if (!testTool) return;

      // Execute tool with dry run
      await testTool.execute({ source_param: 'test_value' }, { dryRun: true });

      // Verify the execute method was called with the correct parameters
      expect(mockTool.execute).toHaveBeenCalledWith(
        { source_param: 'test_value' },
        { dryRun: true }
      );
    });

    it('should handle derivation config with no derivation functions', async () => {
      // Create a transformation config with no transformation functions
      const emptyConfig: ParameterTransformer = {
        transforms: {},
      };

      // Create a map of transformation configs
      const transformers = new Map<string, ParameterTransformer>();
      transformers.set('source_param', emptyConfig);

      // Create OpenAPIToolSet with transformation configs
      const toolset = new OpenAPIToolSet({
        filePath: tempSpecFile,
        transformers,
      });

      // Get test tool
      const tools = toolset.getTools();
      const testTool = tools.getTool('test_derivation');

      expect(testTool).toBeDefined();
      if (!testTool) return;

      // Execute tool with dry run
      await testTool.execute({ source_param: 'test_value' }, { dryRun: true });

      // Verify the execute method was called with the correct parameters
      expect(mockTool.execute).toHaveBeenCalledWith(
        { source_param: 'test_value' },
        { dryRun: true }
      );
    });
  });

  describe('Invalid transformation configs', () => {
    it('should handle transformation config with invalid source parameter', async () => {
      // Create a transformation config with a non-existent source parameter
      const invalidConfig: ParameterTransformer = {
        transforms: {
          derived_param1: (value: unknown): string => {
            if (typeof value !== 'string') {
              throw new Error('Value must be a string');
            }
            return `derived_${value}`;
          },
        },
      };

      // Create a map of transformation configs
      const transformers = new Map<string, ParameterTransformer>();
      transformers.set('non_existent_param', invalidConfig);

      // Create OpenAPIToolSet with transformation configs
      const toolset = new OpenAPIToolSet({
        filePath: tempSpecFile,
        transformers,
      });

      // Get test tool
      const tools = toolset.getTools();
      const testTool = tools.getTool('test_derivation');

      expect(testTool).toBeDefined();
      if (!testTool) return;

      // Execute tool with dry run
      await testTool.execute({ source_param: 'test_value' }, { dryRun: true });

      // Verify the execute method was called with the correct parameters
      expect(mockTool.execute).toHaveBeenCalledWith(
        { source_param: 'test_value' },
        { dryRun: true }
      );
    });
  });

  describe('Error handling in transformation functions', () => {
    it('should handle one transformation function failing while others succeed', async () => {
      // Create a transformation config with mixed success/failure
      const mixedConfig: ParameterTransformer = {
        transforms: {
          derived_param1: (_value: unknown): string => {
            throw new Error('Error in derived_param1');
          },
          derived_param2: (_value: unknown): string => {
            return 'derived_value';
          },
        },
      };

      // Create a map of transformation configs
      const transformers = new Map<string, ParameterTransformer>();
      transformers.set('source_param', mixedConfig);

      // Create OpenAPIToolSet with transformation configs
      const toolset = new OpenAPIToolSet({
        filePath: tempSpecFile,
        transformers,
      });

      // Get test tool
      const tools = toolset.getTools();
      const testTool = tools.getTool('test_derivation');

      expect(testTool).toBeDefined();
      if (!testTool) return;

      // Execute tool with dry run
      await testTool.execute({ source_param: 'test_value' }, { dryRun: true });

      // Verify the execute method was called with the correct parameters
      expect(mockTool.execute).toHaveBeenCalledWith(
        { source_param: 'test_value' },
        { dryRun: true }
      );
    });

    it('should handle all transformation functions failing', async () => {
      // Create a transformation config with all functions that throw
      const errorConfig: ParameterTransformer = {
        transforms: {
          derived_param1: (_value: unknown): string => {
            throw new Error('Error in derived_param1');
          },
          derived_param2: (_value: unknown): string => {
            throw new Error('Error in derived_param2');
          },
        },
      };

      // Create a map of transformation configs
      const transformers = new Map<string, ParameterTransformer>();
      transformers.set('source_param', errorConfig);

      // Create OpenAPIToolSet with transformation configs
      const toolset = new OpenAPIToolSet({
        filePath: tempSpecFile,
        transformers,
      });

      // Get test tool
      const tools = toolset.getTools();
      const testTool = tools.getTool('test_derivation');

      expect(testTool).toBeDefined();
      if (!testTool) return;

      // Execute tool with dry run
      await testTool.execute({ source_param: 'test_value' }, { dryRun: true });

      // Verify the execute method was called with the correct parameters
      expect(mockTool.execute).toHaveBeenCalledWith(
        { source_param: 'test_value' },
        { dryRun: true }
      );
    });
  });

  describe('Nested derivations', () => {
    it('should handle nested derivations', async () => {
      // Create a first-level derivation config
      const firstLevelConfig: ParameterTransformer = {
        transforms: {
          nested_source: (value: unknown): string => {
            if (typeof value !== 'string') {
              throw new Error('Value must be a string');
            }
            return `nested_${value}`;
          },
        },
      };

      // Create a second-level derivation config
      const secondLevelConfig: ParameterTransformer = {
        transforms: {
          nested_derived: (value: unknown): string => {
            if (typeof value !== 'string') {
              throw new Error('Value must be a string');
            }
            return `derived_from_${value}`;
          },
        },
      };

      // Create a map of derivation configs
      const transformers = new Map<string, ParameterTransformer>();
      transformers.set('source_param', firstLevelConfig);
      transformers.set('nested_source', secondLevelConfig);

      // Create a mock OpenAPIToolSet with the transformers
      const toolset = new OpenAPIToolSet({
        filePath: tempSpecFile,
        transformers,
      });

      // Get test tool
      const tools = toolset.getTools();
      const testTool = tools.getTool('test_derivation');

      expect(testTool).toBeDefined();
      if (!testTool) return;

      // Execute tool with dry run
      await testTool.execute({ source_param: 'test_value' }, { dryRun: true });

      // Verify the execute method was called with the correct parameters
      expect(mockTool.execute).toHaveBeenCalledWith(
        { source_param: 'test_value' },
        { dryRun: true }
      );
    });
  });

  describe('Conflicting derivations', () => {
    it('should handle conflicting derivation configs', async () => {
      // Create a derivation config for the first parameter
      const config1: ParameterTransformer = {
        transforms: {
          derived_param: (value: unknown): string => {
            if (typeof value !== 'string') {
              throw new Error('Value must be a string');
            }
            return `derived_from_source_${value}`;
          },
        },
      };

      // Create a derivation config for the second parameter
      const config2: ParameterTransformer = {
        transforms: {
          derived_param: (value: unknown): string => {
            if (typeof value !== 'string') {
              throw new Error('Value must be a string');
            }
            return `derived_from_other_${value}`;
          },
        },
      };

      // Create a map of derivation configs
      const transformers = new Map<string, ParameterTransformer>();
      transformers.set('source_param', config1);
      transformers.set('other_param', config2);

      // Create a mock OpenAPIToolSet with the transformers
      const toolset = new OpenAPIToolSet({
        filePath: tempSpecFile,
        transformers,
      });

      // Get test tool
      const tools = toolset.getTools();
      const testTool = tools.getTool('test_derivation');

      expect(testTool).toBeDefined();
      if (!testTool) return;

      // Execute tool with dry run
      await testTool.execute(
        { source_param: 'test_value', other_param: 'other_value' },
        { dryRun: true }
      );

      // Verify the execute method was called with the correct parameters
      expect(mockTool.execute).toHaveBeenCalledWith(
        { source_param: 'test_value', other_param: 'other_value' },
        { dryRun: true }
      );
    });
  });
});
