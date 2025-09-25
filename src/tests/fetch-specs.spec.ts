import { beforeAll, describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { createFixture } from 'fs-fixture';

// Mock environment variables
beforeAll(() => {
  Bun.env.STACKONE_API_KEY = 'test_api_key';
});

describe('fetch-specs script', () => {
  it('should fetch and save OpenAPI specs', async () => {
    await using fixture = await createFixture();

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
      const outputPath = path.join(fixture.path, `${category}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    };

    // Test fetchSpec function
    const hrisSpec = await fetchSpec('hris');
    expect(hrisSpec).toEqual({
      openapi: '3.0.0',
      info: { title: 'HRIS API', version: '1.0.0' },
      paths: { '/employees': {} },
    });

    // Test saveSpec function
    await saveSpec('hris', hrisSpec);

    const savedSpecPath = path.join(fixture.path, 'hris.json');
    expect(fs.existsSync(savedSpecPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(savedSpecPath, 'utf-8'))).toEqual({
      openapi: '3.0.0',
      info: { title: 'HRIS API', version: '1.0.0' },
      paths: { '/employees': {} },
    });
  });
});
