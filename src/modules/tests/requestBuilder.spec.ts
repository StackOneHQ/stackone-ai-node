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
});
