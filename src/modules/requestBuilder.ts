import {
  type ExecuteConfig,
  type ExecuteOptions,
  type JsonDict,
  ParameterLocation,
} from '../types';
import { StackOneAPIError } from '../utils/errors';

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
   * Execute the request
   */
  async execute(params: JsonDict, options?: ExecuteOptions): Promise<JsonDict> {
    // Prepare request parameters
    const [url, bodyParams, queryParams] = this.prepareRequestParams(params);

    // Prepare URL with query parameters
    const urlWithQuery = new URL(url);
    for (const [key, value] of Object.entries(queryParams)) {
      urlWithQuery.searchParams.append(key, String(value));
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
