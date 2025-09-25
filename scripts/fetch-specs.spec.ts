import { beforeAll, describe, expect, it } from 'bun:test';
import { createFixture } from 'fs-fixture';
import { saveSpec } from './fetch-specs';

// Mock environment variables
beforeAll(() => {
  Bun.env.STACKONE_API_KEY = 'test_api_key';
});

describe('fetch-specs script', () => {
  it('should fetch and save OpenAPI specs', async () => {
    const category = 'hris';

    const response = await fetch(`https://api.stackone.com/api/v1/${category}/openapi.json`, {
      headers: {
        Authorization: `Basic ${Buffer.from('test_api_key:').toString('base64')}`,
        'User-Agent': 'stackone-node/1.0.0',
      },
    });

    expect(response.ok).toBe(true);

    // Test fetchSpec function
    const hrisSpec = await response.json();
    expect(hrisSpec).toMatchInlineSnapshot(`
      {
        "info": {
          "title": "HRIS API",
          "version": "1.0.0",
        },
        "openapi": "3.0.0",
        "paths": {
          "/employees": {},
        },
      }
    `);
  });
  it('should save OpenAPI specs to file', async () => {
    await using fixture = await createFixture();

    // Test saveSpec function
    await saveSpec('hris', {}, fixture.path);

    expect(await fixture.exists('hris.ts')).toBe(true);
  });
});
