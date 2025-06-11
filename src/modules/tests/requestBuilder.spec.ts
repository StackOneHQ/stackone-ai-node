import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ParameterLocation } from '../../types';
import { StackOneAPIError } from '../../utils/errors';
import { RequestBuilder } from '../requestBuilder';

describe('RequestBuilder', () => {
  let builder: RequestBuilder;
  const mockConfig = {
    method: 'GET',
    url: 'https://api.example.com/test/{pathParam}',
    bodyType: 'json' as const,
    params: [
      { name: 'pathParam', location: ParameterLocation.PATH, type: 'string' as const },
      { name: 'queryParam', location: ParameterLocation.QUERY, type: 'string' as const },
      { name: 'headerParam', location: ParameterLocation.HEADER, type: 'string' as const },
      { name: 'bodyParam', location: ParameterLocation.BODY, type: 'string' as const },
      { name: 'defaultParam', location: ParameterLocation.BODY, type: 'string' as const },
      { name: 'filter', location: ParameterLocation.QUERY, type: 'object' as const },
      { name: 'proxy', location: ParameterLocation.QUERY, type: 'object' as const },
      { name: 'regularObject', location: ParameterLocation.QUERY, type: 'object' as const },
      { name: 'simple', location: ParameterLocation.QUERY, type: 'string' as const },
      { name: 'simpleString', location: ParameterLocation.QUERY, type: 'string' as const },
      { name: 'simpleNumber', location: ParameterLocation.QUERY, type: 'number' as const },
      { name: 'simpleBoolean', location: ParameterLocation.QUERY, type: 'boolean' as const },
      { name: 'complexObject', location: ParameterLocation.QUERY, type: 'object' as const },
      { name: 'deepFilter', location: ParameterLocation.QUERY, type: 'object' as const },
      { name: 'emptyFilter', location: ParameterLocation.QUERY, type: 'object' as const },
    ],
  };

  beforeEach(() => {
    builder = new RequestBuilder(mockConfig, { 'Initial-Header': 'test' });
    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );
  });

  it('should initialize with correct properties', () => {
    expect(builder).toBeDefined();
    expect(builder.getHeaders()).toEqual({ 'Initial-Header': 'test' });
  });

  it('should set and get headers', () => {
    builder.setHeaders({ 'New-Header': 'value' });
    expect(builder.getHeaders()).toEqual({
      'Initial-Header': 'test',
      'New-Header': 'value',
    });
  });

  it('should prepare headers', () => {
    builder.setHeaders({ 'Custom-Header': 'value' });
    const headers = builder.prepareHeaders();

    expect(headers).toEqual({
      'User-Agent': 'stackone-ai-node',
      'Initial-Header': 'test',
      'Custom-Header': 'value',
    });
  });

  it('should prepare request parameters correctly', () => {
    const params = {
      pathParam: 'path-value',
      queryParam: 'query-value',
      headerParam: 'header-value',
      bodyParam: 'body-value',
      defaultParam: 'default-value',
    };

    const [url, bodyParams, queryParams] = builder.prepareRequestParams(params);

    expect(url).toBe('https://api.example.com/test/path-value');
    expect(queryParams).toEqual({ queryParam: 'query-value' });
    expect(bodyParams).toEqual({
      bodyParam: 'body-value',
      defaultParam: 'default-value',
    });
    expect(builder.getHeaders()).toEqual({
      'Initial-Header': 'test',
      headerParam: 'header-value',
    });
  });

  it('should build fetch options for JSON body type', () => {
    const bodyParams = { test: 'value' };
    const options = builder.buildFetchOptions(bodyParams);

    expect(options.method).toBe('GET');
    expect(options.headers).toHaveProperty('Content-Type', 'application/json');
    expect(options.body).toBe(JSON.stringify(bodyParams));
  });

  it('should build fetch options for form body type', () => {
    const formBuilder = new RequestBuilder({
      ...mockConfig,
      bodyType: 'form',
    });

    const bodyParams = { test: 'value' };
    const options = formBuilder.buildFetchOptions(bodyParams);

    expect(options.headers).toHaveProperty('Content-Type', 'application/x-www-form-urlencoded');
    expect(options.body).toBe('test=value');
  });

  it('should build fetch options for multipart-form body type', () => {
    const formBuilder = new RequestBuilder({
      ...mockConfig,
      bodyType: 'multipart-form',
    });

    const bodyParams = { test: 'value' };
    const options = formBuilder.buildFetchOptions(bodyParams);

    expect(options.body).toBeInstanceOf(FormData);
  });

  it('should execute a request successfully', async () => {
    const params = {
      pathParam: 'path-value',
      queryParam: 'query-value',
    };

    const result = await builder.execute(params);

    expect(result).toEqual({ success: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/test/path-value?queryParam=query-value',
      expect.any(Object)
    );
  });

  it('should return request details on dry run', async () => {
    const params = { pathParam: 'path-value' };
    const result = await builder.execute(params, { dryRun: true });

    expect(result).toEqual({
      url: 'https://api.example.com/test/path-value',
      method: 'GET',
      headers: {
        'User-Agent': 'stackone-ai-node',
        'Initial-Header': 'test',
      },
      body: undefined,
      mappedParams: params,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should throw StackOneAPIError when API request fails', async () => {
    global.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      } as Response)
    );

    const params = { pathParam: 'invalid' };

    await expect(builder.execute(params)).rejects.toThrow(StackOneAPIError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should serialize deep object query parameters correctly', async () => {
    const params = {
      pathParam: 'test-value',
      filter: {
        updated_after: '2020-01-01T00:00:00.000Z',
        job_id: '123',
        nested: {
          level2: 'value',
          level3: {
            deep: 'nested-value',
          },
        },
      },
      proxy: {
        custom_field: 'custom-value',
        sort: 'first_name',
      },
      simple: 'simple-value',
    };

    const result = await builder.execute(params, { dryRun: true });
    const url = new URL(result.url as string);

    // Check that deep object parameters are serialized correctly
    expect(url.searchParams.get('filter[updated_after]')).toBe('2020-01-01T00:00:00.000Z');
    expect(url.searchParams.get('filter[job_id]')).toBe('123');
    expect(url.searchParams.get('filter[nested][level2]')).toBe('value');
    expect(url.searchParams.get('filter[nested][level3][deep]')).toBe('nested-value');
    expect(url.searchParams.get('proxy[custom_field]')).toBe('custom-value');
    expect(url.searchParams.get('proxy[sort]')).toBe('first_name');

    // Check that simple parameters are still handled normally
    expect(url.searchParams.get('simple')).toBe('simple-value');

    // Ensure the original filter/proxy objects are not added as strings
    expect(url.searchParams.get('filter')).toBeNull();
    expect(url.searchParams.get('proxy')).toBeNull();
  });

  it('should handle null and undefined values in deep objects', async () => {
    const params = {
      pathParam: 'test-value',
      filter: {
        valid_field: 'value',
        null_field: null,
        undefined_field: undefined,
        empty_string: '',
        zero: 0,
        false_value: false,
      },
    };

    const result = await builder.execute(params, { dryRun: true });
    const url = new URL(result.url as string);

    // Check that valid values are included
    expect(url.searchParams.get('filter[valid_field]')).toBe('value');
    expect(url.searchParams.get('filter[empty_string]')).toBe('');
    expect(url.searchParams.get('filter[zero]')).toBe('0');
    expect(url.searchParams.get('filter[false_value]')).toBe('false');

    // Check that null and undefined values are excluded
    expect(url.searchParams.get('filter[null_field]')).toBeNull();
    expect(url.searchParams.get('filter[undefined_field]')).toBeNull();
  });

  it('should apply deep object serialization to all object parameters', async () => {
    const params = {
      pathParam: 'test-value',
      regularObject: {
        nested: 'value',
        deepNested: {
          level2: 'deep-value',
        },
      },
    };

    const result = await builder.execute(params, { dryRun: true });
    const url = new URL(result.url as string);

    // All objects should now be serialized using deep object notation
    expect(url.searchParams.get('regularObject[nested]')).toBe('value');
    expect(url.searchParams.get('regularObject[deepNested][level2]')).toBe('deep-value');

    // The original object parameter should not be present as a string
    expect(url.searchParams.get('regularObject')).toBeNull();
  });

  it('should handle mixed parameter types with deep object serialization', async () => {
    const params = {
      pathParam: 'test-value',
      simpleString: 'simple-value',
      simpleNumber: 42,
      simpleBoolean: true,
      complexObject: {
        nested: 'nested-value',
        array: [1, 2, 3], // Arrays should be converted to string
        nestedObject: {
          deep: 'deep-value',
        },
      },
    };

    const result = await builder.execute(params, { dryRun: true });
    const url = new URL(result.url as string);

    // Primitive values should be handled normally
    expect(url.searchParams.get('simpleString')).toBe('simple-value');
    expect(url.searchParams.get('simpleNumber')).toBe('42');
    expect(url.searchParams.get('simpleBoolean')).toBe('true');

    // Complex object should use deep object serialization
    expect(url.searchParams.get('complexObject[nested]')).toBe('nested-value');
    expect(url.searchParams.get('complexObject[array]')).toBe('1,2,3'); // Arrays become strings
    expect(url.searchParams.get('complexObject[nestedObject][deep]')).toBe('deep-value');

    // Original complex object should not be present
    expect(url.searchParams.get('complexObject')).toBeNull();
  });

  describe('Security and Performance Improvements', () => {
    it('should throw error when recursion depth limit is exceeded', async () => {
      // Create a deeply nested object that exceeds the default depth limit of 10
      let deepObject: Record<string, unknown> = { value: 'test' };
      for (let i = 0; i < 12; i++) {
        deepObject = { nested: deepObject };
      }

      const params = {
        pathParam: 'test-value',
        deepFilter: deepObject,
      };

      await expect(builder.execute(params, { dryRun: true })).rejects.toThrow(
        'Maximum nesting depth (10) exceeded for parameter serialization'
      );
    });

    it('should throw error when circular reference is detected', async () => {
      const circular: Record<string, unknown> = { a: { b: 'test' } };
      circular.a.circular = circular; // Create circular reference

      const params = {
        pathParam: 'test-value',
        filter: circular,
      };

      await expect(builder.execute(params, { dryRun: true })).rejects.toThrow(
        'Circular reference detected in parameter object'
      );
    });

    it('should validate parameter keys and reject invalid characters', async () => {
      const params = {
        pathParam: 'test-value',
        filter: {
          valid_key: 'test',
          'invalid key with spaces': 'test', // Should trigger validation error
        },
      };

      await expect(builder.execute(params, { dryRun: true })).rejects.toThrow(
        'Invalid parameter key: invalid key with spaces'
      );
    });

    it('should handle special types correctly', async () => {
      const testDate = new Date('2023-01-01T00:00:00.000Z');
      const testRegex = /test-pattern/gi;

      const params = {
        pathParam: 'test-value',
        filter: {
          dateField: testDate,
          regexField: testRegex,
          nullField: null,
          undefinedField: undefined,
          emptyString: '',
        },
      };

      const result = await builder.execute(params, { dryRun: true });
      const url = new URL(result.url as string);

      // Date should be serialized to ISO string
      expect(url.searchParams.get('filter[dateField]')).toBe('2023-01-01T00:00:00.000Z');

      // RegExp should be serialized to string representation
      expect(url.searchParams.get('filter[regexField]')).toBe('/test-pattern/gi');

      // Null and undefined should result in empty string (but won't be added since they're filtered out)
      expect(url.searchParams.get('filter[nullField]')).toBeNull();
      expect(url.searchParams.get('filter[undefinedField]')).toBeNull();

      // Empty string should be preserved
      expect(url.searchParams.get('filter[emptyString]')).toBe('');
    });

    it('should throw error when trying to serialize functions', async () => {
      const params = {
        pathParam: 'test-value',
        filter: {
          validField: 'test',
          functionField: () => 'test', // Functions should not be serializable
        },
      };

      await expect(builder.execute(params, { dryRun: true })).rejects.toThrow(
        'Functions cannot be serialized as parameters'
      );
    });

    it('should handle empty objects correctly', async () => {
      const params = {
        pathParam: 'test-value',
        emptyFilter: {},
        filter: {
          validField: 'test',
          emptyNested: {},
        },
      };

      const result = await builder.execute(params, { dryRun: true });
      const url = new URL(result.url as string);

      // Empty objects should not create any parameters
      expect(url.searchParams.get('emptyFilter')).toBeNull();
      expect(url.searchParams.get('filter[emptyNested]')).toBeNull();

      // Valid fields should still work
      expect(url.searchParams.get('filter[validField]')).toBe('test');
    });

    it('should handle arrays correctly within objects', async () => {
      const params = {
        pathParam: 'test-value',
        filter: {
          arrayField: [1, 2, 3],
          stringArray: ['a', 'b', 'c'],
          mixed: ['string', 42, true],
        },
      };

      const result = await builder.execute(params, { dryRun: true });
      const url = new URL(result.url as string);

      // Arrays should be converted to comma-separated strings
      expect(url.searchParams.get('filter[arrayField]')).toBe('1,2,3');
      expect(url.searchParams.get('filter[stringArray]')).toBe('a,b,c');
      expect(url.searchParams.get('filter[mixed]')).toBe('string,42,true');
    });

    it('should handle nested objects with special types', async () => {
      const params = {
        pathParam: 'test-value',
        filter: {
          nested: {
            dateField: new Date('2023-01-01T00:00:00.000Z'),
            level2: {
              regexField: /test/,
              stringField: 'normal-string',
            },
          },
        },
      };

      const result = await builder.execute(params, { dryRun: true });
      const url = new URL(result.url as string);

      expect(url.searchParams.get('filter[nested][dateField]')).toBe('2023-01-01T00:00:00.000Z');
      expect(url.searchParams.get('filter[nested][level2][regexField]')).toBe('/test/');
      expect(url.searchParams.get('filter[nested][level2][stringField]')).toBe('normal-string');
    });

    it('should maintain performance with large objects', async () => {
      // Create a moderately large object to test performance optimizations
      const largeFilter: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeFilter[`field_${i}`] = `value_${i}`;
        if (i % 10 === 0) {
          largeFilter[`nested_${i}`] = {
            subField1: `sub_value_${i}_1`,
            subField2: `sub_value_${i}_2`,
          };
        }
      }

      const params = {
        pathParam: 'test-value',
        filter: largeFilter,
      };

      const startTime = performance.now();
      const result = await builder.execute(params, { dryRun: true });
      const endTime = performance.now();

      // Should complete in reasonable time (less than 100ms for this size)
      expect(endTime - startTime).toBeLessThan(100);

      const url = new URL(result.url as string);

      // Verify some parameters are correctly serialized
      expect(url.searchParams.get('filter[field_0]')).toBe('value_0');
      expect(url.searchParams.get('filter[field_99]')).toBe('value_99');
      expect(url.searchParams.get('filter[nested_0][subField1]')).toBe('sub_value_0_1');
    });

    it('should allow the same object in different branches after circular check', async () => {
      const sharedObject = { shared: 'value' };
      const params = {
        pathParam: 'test-value',
        filter: {
          branch1: {
            shared: sharedObject,
          },
          branch2: {
            shared: sharedObject, // Same object reference in different branch - should be allowed
          },
        },
      };

      const result = await builder.execute(params, { dryRun: true });
      const url = new URL(result.url as string);

      // Both branches should be serialized correctly
      expect(url.searchParams.get('filter[branch1][shared][shared]')).toBe('value');
      expect(url.searchParams.get('filter[branch2][shared][shared]')).toBe('value');
    });
  });
});
