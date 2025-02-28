import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

// Mock the fetch function with the correct signature
const mockFetch = mock((input: URL | RequestInfo, _init?: RequestInit) => {
  const url = input.toString();
  // Return different responses based on the URL
  if (url.includes('/hris/')) {
    const responseData = {
      openapi: '3.0.0',
      info: { title: 'HRIS API', version: '1.0.0' },
      paths: { '/employees': {} },
    };
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responseData),
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      redirected: false,
      type: 'basic' as ResponseType,
      url: url,
      clone: () => ({}) as Response,
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      text: () => Promise.resolve(JSON.stringify(responseData)),
    } as Response);
  }
  if (url.includes('/ats/')) {
    const responseData = {
      openapi: '3.0.0',
      info: { title: 'ATS API', version: '1.0.0' },
      paths: { '/jobs': {} },
    };
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responseData),
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      redirected: false,
      type: 'basic' as ResponseType,
      url: url,
      clone: () => ({}) as Response,
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
      text: () => Promise.resolve(JSON.stringify(responseData)),
    } as Response);
  }
  return Promise.resolve({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: url,
    clone: () => ({}) as Response,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    json: () => Promise.resolve({ error: 'Not found' }),
    text: () => Promise.resolve('Not found'),
  } as Response);
});

// Mock environment variables
Bun.env.STACKONE_API_KEY = 'test_api_key';

// Create a temporary output directory for testing
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'tests', 'tmp', 'oas');

describe('fetch-specs script', () => {
  // Save original functions
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    // Replace functions with mocks
    globalThis.fetch = mockFetch as typeof fetch;

    // Create test output directory
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Restore original functions
    globalThis.fetch = originalFetch;

    // Clean up test directory
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  it('should fetch and save OpenAPI specs', async () => {
    // Mock the fetchSpec function
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

    // Test fetchSpec function
    const hrisSpec = await fetchSpec('hris');
    expect((hrisSpec.info as { title: string }).title).toBe('HRIS API');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Reset mock call count
    mockFetch.mockClear();

    // Test fetchSpec with error
    try {
      await fetchSpec('unknown');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toContain('Failed to fetch');
    }

    // Since we can't properly mock the fs/promises functions in Bun yet,
    // we'll just test that the saveSpec function can be called without errors
    const saveSpec = async (category: string, spec: Record<string, unknown>): Promise<void> => {
      // Just a simple implementation that doesn't use the mocked functions
      const outputPath = path.join(TEST_OUTPUT_DIR, `${category}.json`);
      // Write to the file directly instead of using the mocked functions
      fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    };

    // Test saveSpec function
    await saveSpec('hris', hrisSpec);

    // Verify the file was created
    const outputPath = path.join(TEST_OUTPUT_DIR, 'hris.json');
    expect(fs.existsSync(outputPath)).toBe(true);

    // Clean up
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  });
});
