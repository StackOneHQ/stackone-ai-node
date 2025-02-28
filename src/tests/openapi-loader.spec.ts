import { beforeAll, describe, expect, it, mock, spyOn } from 'bun:test';
import fs from 'node:fs';
import type { ToolDefinition } from '../models';
import { loadSpecs } from '../openapi/loader';
import { OpenAPIParser } from '../openapi/parser';

// Mock OpenAPI specs
const mockSpecs = {
  hris: {
    openapi: '3.0.0',
    info: {
      title: 'HRIS API',
      version: '1.0.0',
    },
    paths: {},
  },
  ats: {
    openapi: '3.0.0',
    info: {
      title: 'ATS API',
      version: '1.0.0',
    },
    paths: {},
  },
};

// Mock tool definitions
const mockToolDefinitions: Record<string, ToolDefinition> = {
  get_employee: {
    description: 'Get employee details',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Employee ID' },
      },
    },
    execute: {
      method: 'GET',
      url: 'https://api.stackone.com/employee/{id}',
      name: 'get_employee',
      headers: {},
      parameterLocations: {},
    },
  },
};

describe('Loader', () => {
  // Mock the OpenAPIParser
  const mockParseTools = mock(() => mockToolDefinitions);

  beforeAll(() => {
    // Mock the OpenAPIParser.parseTools method
    // @ts-ignore - Mock implementation
    OpenAPIParser.prototype.parseTools = mockParseTools;
  });

  it('should load specs from OAS directory', () => {
    // Mock fs.existsSync to return true
    const mockExistsSync = spyOn(fs, 'existsSync');
    mockExistsSync.mockImplementation(() => true);

    // Mock fs.readdirSync to return test files
    const mockReadDirSync = spyOn(fs, 'readdirSync');
    (mockReadDirSync.mockImplementation as unknown as (callback: () => string[]) => void)(() => [
      'hris.json',
      'ats.json',
      'not-json.txt',
    ]);

    // Mock fs.readFileSync to return mock specs
    const originalReadFileSync = fs.readFileSync;
    fs.readFileSync = mock(
      (
        path: fs.PathOrFileDescriptor,
        _options?: BufferEncoding | { encoding?: BufferEncoding; flag?: string }
      ) => {
        const fileName = typeof path === 'string' ? path.split('/').pop() : '';

        if (fileName === 'hris.json') {
          return Buffer.from(JSON.stringify(mockSpecs.hris));
        }
        if (fileName === 'ats.json') {
          return Buffer.from(JSON.stringify(mockSpecs.ats));
        }

        return Buffer.from('{}');
      }
    ) as unknown as typeof fs.readFileSync;

    const specs = loadSpecs();

    // Should have loaded two specs (hris and ats)
    expect(Object.keys(specs).length).toBe(2);
    expect(specs.hris).toBeDefined();
    expect(specs.ats).toBeDefined();

    // Each spec should have the mock tool definitions
    expect(specs.hris).toEqual(mockToolDefinitions);
    expect(specs.ats).toEqual(mockToolDefinitions);

    // Verify the parser was called twice (once for each spec)
    expect(mockParseTools).toHaveBeenCalledTimes(2);

    // Clean up mocks
    mockExistsSync.mockRestore();
    mockReadDirSync.mockRestore();
    fs.readFileSync = originalReadFileSync;
  });

  it('should return empty object if OAS directory does not exist', () => {
    // Mock fs.existsSync to return false
    const mockExistsSync = spyOn(fs, 'existsSync');
    mockExistsSync.mockImplementation(() => false);

    const specs = loadSpecs();

    // Should return an empty object
    expect(Object.keys(specs).length).toBe(0);

    // Clean up mock
    mockExistsSync.mockRestore();
  });
});
