import {
  type ExecuteConfig,
  type ExecuteOptions,
  type JsonDict,
  ParameterLocation,
} from '../types';
import { StackOneAPIError } from '../utils/errors';

interface SerializationOptions {
  maxDepth?: number;
  strictValidation?: boolean;
}

class ParameterSerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParameterSerializationError';
  }
}

/**
 * Builds and executes HTTP requests
 */
export class RequestBuilder {
  private method: string;
  private url: string;
  private bodyType: 'json' | 'multipart-form' | 'form';
  private params: ExecuteConfig['params'];
  private headers: Record<string, string>;

  constructor(config: ExecuteConfig, headers: Record<string, string> = {}) {
    this.method = config.method;
    this.url = config.url;
    this.bodyType = config.bodyType;
    this.params = config.params;
    this.headers = { ...headers };
  }

  /**
   * Set headers for the request
   */
  setHeaders(headers: Record<string, string>): RequestBuilder {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  /**
   * Get the current headers
   */
  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  /**
   * Prepare headers for the API request
   */
  prepareHeaders(): Record<string, string> {
    return {
      'User-Agent': 'stackone-ai-node',
      ...this.headers,
    };
  }

  /**
   * Prepare URL and parameters for the API request
   */
  prepareRequestParams(params: JsonDict): [string, JsonDict, JsonDict] {
    let url = this.url;
    const bodyParams: JsonDict = {};
    const queryParams: JsonDict = {};

    for (const [key, value] of Object.entries(params)) {
      // Find the parameter configuration in the params array
      const paramConfig = this.params.find((p) => p.name === key);
      const paramLocation = paramConfig?.location;

      switch (paramLocation) {
        case ParameterLocation.PATH:
          // Replace path parameter in URL
          url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
          break;
        case ParameterLocation.QUERY:
          // Add to query parameters
          queryParams[key] = value;
          break;
        case ParameterLocation.HEADER:
          // Add to headers
          this.headers[key] = String(value);
          break;
        case ParameterLocation.BODY:
          // Add to body parameters
          bodyParams[key] = value;
          break;
        default:
          paramLocation satisfies undefined; // exhaustive check
          // Default to body parameters
          bodyParams[key] = value;
          break;
      }
    }

    return [url, bodyParams, queryParams];
  }

  /**
   * Build the fetch options for the request
   */
  buildFetchOptions(bodyParams: JsonDict): RequestInit {
    const headers = this.prepareHeaders();
    const fetchOptions: RequestInit = {
      method: this.method,
      headers,
    };

    // Handle different body types
    if (Object.keys(bodyParams).length > 0) {
      switch (this.bodyType) {
        case 'json':
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json',
          };
          fetchOptions.body = JSON.stringify(bodyParams);
          break;
        case 'form': {
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/x-www-form-urlencoded',
          };
          const formBody = new URLSearchParams();
          for (const [key, value] of Object.entries(bodyParams)) {
            formBody.append(key, String(value));
          }
          fetchOptions.body = formBody.toString();
          break;
        }
        case 'multipart-form': {
          // Handle file uploads
          const formData = new FormData();
          for (const [key, value] of Object.entries(bodyParams)) {
            formData.append(key, String(value));
          }
          fetchOptions.body = formData;
          // Don't set Content-Type for FormData, it will be set automatically with the boundary
          break;
        }
      }
    }

    return fetchOptions;
  }

  /**
   * Validates parameter keys to prevent injection attacks
   */
  private validateParameterKey(key: string): void {
    if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
      throw new ParameterSerializationError(`Invalid parameter key: ${key}`);
    }
  }

  /**
   * Safely serializes values to strings with special type handling
   */
  private serializeValue(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (value instanceof RegExp) {
      return value.toString();
    }
    if (typeof value === 'function') {
      throw new ParameterSerializationError('Functions cannot be serialized as parameters');
    }
    if (value == null) {
      return '';
    }
    return String(value);
  }

  /**
   * Serialize an object into deep object query parameters with security protections
   * Converts {filter: {updated_after: "2020-01-01", job_id: "123"}}
   * to filter[updated_after]=2020-01-01&filter[job_id]=123
   */
  private serializeDeepObject(
    obj: unknown,
    prefix: string,
    depth = 0,
    visited = new WeakSet<object>(),
    options: SerializationOptions = {}
  ): [string, string][] {
    const maxDepth = options.maxDepth ?? 10;
    const strictValidation = options.strictValidation ?? true;
    const params: [string, string][] = [];

    // Recursion depth protection
    if (depth > maxDepth) {
      throw new ParameterSerializationError(
        `Maximum nesting depth (${maxDepth}) exceeded for parameter serialization`
      );
    }

    if (obj == null) {
      return params;
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      // Circular reference protection
      if (visited.has(obj)) {
        throw new ParameterSerializationError('Circular reference detected in parameter object');
      }
      visited.add(obj);

      try {
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          if (strictValidation) {
            this.validateParameterKey(key);
          }

          const nestedKey = `${prefix}[${key}]`;
          if (value != null) {
            if (this.shouldUseDeepObjectSerialization(key, value)) {
              // Recursively handle nested objects
              params.push(
                ...this.serializeDeepObject(value, nestedKey, depth + 1, visited, options)
              );
            } else {
              params.push([nestedKey, this.serializeValue(value)]);
            }
          }
        }
      } finally {
        // Remove from visited set to allow the same object in different branches
        visited.delete(obj);
      }
    } else {
      // For non-object values, use the prefix as-is
      params.push([prefix, this.serializeValue(obj)]);
    }

    return params;
  }

  /**
   * Check if a parameter should use deep object serialization
   * Applies to all plain object parameters (excludes special types and arrays)
   */
  private shouldUseDeepObjectSerialization(_key: string, value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof RegExp) &&
      typeof value !== 'function'
    );
  }

  /**
   * Builds all query parameters with optimized batching
   */
  private buildQueryParameters(queryParams: JsonDict): [string, string][] {
    const allParams: [string, string][] = [];

    for (const [key, value] of Object.entries(queryParams)) {
      if (this.shouldUseDeepObjectSerialization(key, value)) {
        // Use deep object serialization for complex parameters
        allParams.push(...this.serializeDeepObject(value, key));
      } else {
        // Use safe string conversion for primitive values
        allParams.push([key, this.serializeValue(value)]);
      }
    }

    return allParams;
  }

  /**
   * Execute the request
   */
  async execute(params: JsonDict, options?: ExecuteOptions): Promise<JsonDict> {
    // Prepare request parameters
    const [url, bodyParams, queryParams] = this.prepareRequestParams(params);

    // Prepare URL with query parameters using optimized batching
    const urlWithQuery = new URL(url);
    const serializedParams = this.buildQueryParameters(queryParams);

    // Batch append all parameters
    for (const [paramKey, paramValue] of serializedParams) {
      urlWithQuery.searchParams.append(paramKey, paramValue);
    }

    // Build fetch options
    const fetchOptions = this.buildFetchOptions(bodyParams);

    // If dryRun is true, return the request details instead of making the API call
    if (options?.dryRun) {
      return {
        url: urlWithQuery.toString(),
        method: this.method,
        headers: fetchOptions.headers,
        body: fetchOptions.body instanceof FormData ? '[FormData]' : fetchOptions.body,
        mappedParams: params,
      };
    }

    // Execute the request
    const response = await fetch(urlWithQuery.toString(), fetchOptions);

    // Check if the response is OK
    if (!response.ok) {
      const responseBody = await response.json().catch(() => null);
      throw new StackOneAPIError(
        `API request failed with status ${response.status} for ${url}`,
        response.status,
        responseBody,
        bodyParams
      );
    }

    // Parse the response
    return (await response.json()) as JsonDict;
  }
}
