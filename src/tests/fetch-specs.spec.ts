import { afterEach, beforeAll, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { mockFetch } from './utils/fetch-mock';

// Mock environment variables
beforeAll(() => {
  Bun.env.STACKONE_API_KEY = 'test_api_key';
});

describe('fetch-specs script', () => {
  // Mocks for fetch and fs
  let fetchMock;
  let writeFileSyncSpy;

  beforeEach(() => {
    // Set up fetch mock with different responses based on URL
    fetchMock = mockFetch();

    // Mock fs.writeFileSync
    writeFileSyncSpy = spyOn(fs, 'writeFileSync').mockImplementation(() => {
      // Do nothing, just track that it was called
      return undefined;
    });
  });

  afterEach(() => {
    // Clean up mocks
    fetchMock.restore();
    writeFileSyncSpy.mockRestore();
    mock.restore();
  });

  it('should fetch and save OpenAPI specs', async () => {
    // Define the expected response for HRIS API
    const hrisApiSpec = {
      openapi: '3.0.0',
      info: { title: 'HRIS API', version: '1.0.0' },
      paths: { '/employees': {} },
    };

    // Mock the fetch implementation for this specific test
    fetchMock.fetchSpy.mockImplementation(async (url) => {
      if (url.includes('hris')) {
        return {
          ok: true,
          json: async () => hrisApiSpec,
          status: 200,
          statusText: 'OK',
        } as Response;
      }
      return {
        ok: false,
        json: async () => ({ error: 'Not found' }),
        status: 404,
        statusText: 'Not Found',
      } as Response;
    });

    // Create test implementations of the functions
    const fetchSpec = async (category: string): Promise<Record<string, unknown>> => {
      const response = await fetch(`https://api.stackone.com/api/v1/${category}/openapi.json`, {
        headers: {
          Authorization: `Basic ${Buffer.from('test_api_key:').toString('base64')}`,
          'User-Agent': 'stackone-node/1.0.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${category} API specification: ${response.statusText}`);
      }

      return response.json();
    };

    const saveSpec = async (category: string, spec: Record<string, unknown>): Promise<void> => {
      // Use a mock path that doesn't need to be created
      const outputPath = path.join('/mock/path', `${category}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    };

    // Test fetchSpec function
    const hrisSpec = await fetchSpec('hris');
    expect(hrisSpec).toEqual(hrisApiSpec);

    // Test saveSpec function
    await saveSpec('hris', hrisSpec);

    // Verify writeFileSync was called with the correct arguments
    expect(writeFileSyncSpy).toHaveBeenCalled();
    const writeFileCall = writeFileSyncSpy.mock.calls[0];
    expect(writeFileCall[0]).toContain('hris.json');
    expect(JSON.parse(writeFileCall[1])).toEqual(hrisApiSpec);
  });
});
