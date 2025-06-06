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
      { name: 'pathParam', location: ParameterLocation.PATH },
      { name: 'queryParam', location: ParameterLocation.QUERY },
      { name: 'headerParam', location: ParameterLocation.HEADER },
      { name: 'bodyParam', location: ParameterLocation.BODY },
      { name: 'defaultParam' /* default to body */ },
      { name: 'filter', location: ParameterLocation.QUERY },
      { name: 'proxy', location: ParameterLocation.QUERY },
      { name: 'regularObject', location: ParameterLocation.QUERY },
      { name: 'simple', location: ParameterLocation.QUERY },
      { name: 'simpleString', location: ParameterLocation.QUERY },
      { name: 'simpleNumber', location: ParameterLocation.QUERY },
      { name: 'simpleBoolean', location: ParameterLocation.QUERY },
      { name: 'complexObject', location: ParameterLocation.QUERY },
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
});
