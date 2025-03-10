// Import OpenAPI and JSON Schema types
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { transformParameter } from './transformations';
import type {
  JsonDict,
  JsonSchemaProperties,
  JsonSchemaType,
  ParameterTransformer,
  ParameterTransformerMap,
} from './types';
// Type aliases for common types

/**
 * Base exception for StackOne errors
 */
export class StackOneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StackOneError';
  }
}

/**
 * Raised when the StackOne API returns an error
 */
export class StackOneAPIError extends StackOneError {
  statusCode: number;
  responseBody: unknown;
  providerErrors?: unknown[];
  requestBody?: unknown;

  constructor(message: string, statusCode: number, responseBody: unknown, requestBody?: unknown) {
    // Extract the error message from responseBody if it exists
    let errorMessage = message;
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'message' in responseBody &&
      responseBody.message &&
      typeof responseBody.message === 'string'
    ) {
      errorMessage = `${message}: ${responseBody.message}`;
    }

    super(errorMessage);
    this.name = 'StackOneAPIError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    this.requestBody = requestBody;

    // Extract provider errors if they exist
    if (
      responseBody &&
      typeof responseBody === 'object' &&
      'provider_errors' in responseBody &&
      Array.isArray(responseBody.provider_errors)
    ) {
      this.providerErrors = responseBody.provider_errors;
    }
  }

  toString(): string {
    // Format the main error message
    let errorMessage = `API Error: ${this.statusCode} - ${this.message.replace(` for ${this._getUrlFromMessage()}`, '')}`;

    // Add the URL on a new line for better readability
    const url = this._getUrlFromMessage();
    if (url) {
      errorMessage += `\nEndpoint: ${url}`;
    }

    // Add request headers information (for debugging)
    errorMessage += '\n\nRequest Headers:';
    errorMessage += '\n- Authorization: [REDACTED]';
    errorMessage += '\n- User-Agent: stackone-ai-node';

    // Add request body information if available
    if (this.requestBody) {
      errorMessage += '\n\nRequest Body:';
      try {
        if (typeof this.requestBody === 'object') {
          errorMessage += `\n${JSON.stringify(this.requestBody, null, 2)}`;
        } else {
          errorMessage += ` ${String(this.requestBody)}`;
        }
      } catch (_e) {
        errorMessage += ' [Unable to stringify request body]';
      }
    }

    // Add provider error information if available
    if (this.providerErrors && this.providerErrors.length > 0) {
      const providerError = this.providerErrors[0];
      if (typeof providerError === 'object' && providerError !== null) {
        errorMessage += '\n\nProvider Error:';

        if ('status' in providerError) {
          errorMessage += ` ${providerError.status}`;
        }

        // Include raw error message if available
        if (
          'raw' in providerError &&
          typeof providerError.raw === 'object' &&
          providerError.raw !== null &&
          'error' in providerError.raw
        ) {
          errorMessage += ` - ${providerError.raw.error}`;
        }

        // Add provider URL on a new line
        if ('url' in providerError) {
          errorMessage += `\nProvider Endpoint: ${providerError.url}`;
        }
      }
    }

    return errorMessage;
  }

  // Helper method to extract URL from the error message
  private _getUrlFromMessage(): string | null {
    const match = this.message.match(/ for (https?:\/\/[^\s:]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Valid locations for parameters in requests
 */
export enum ParameterLocation {
  HEADER = 'header',
  QUERY = 'query',
  PATH = 'path',
  BODY = 'body',
}

/**
 * Configuration for executing a tool against an API endpoint
 */
export interface ExecuteConfig {
  method: string;
  url: string;
  bodyType: 'json' | 'multipart-form' | 'form';
  params: {
    name: string;
    location: ParameterLocation;
    type: JsonSchemaType;
    derivedFrom?: string; // this is the name of the param that this one is derived from.
  }[]; // this params are the full list of params used to execute. This should come straight from the OpenAPI spec.
}

/**
 * Options for executing a tool
 */
export interface ExecuteOptions {
  /**
   * If true, returns the request details instead of making the actual API call
   * Useful for debugging and testing transformed parameters
   */
  dryRun?: boolean;
}

/**
 * Schema definition for tool parameters
 */
export interface ToolParameters {
  type: string;
  properties: JsonSchemaProperties; // these are the params we will expose to the user/agent in the tool. These might be higher level params.
  required?: string[]; // list of required parameter names
}

/**
 * Complete definition of a tool including its schema and execution config
 */
export interface ToolDefinition {
  description: string;
  parameters: ToolParameters;
  execute: ExecuteConfig;
}

/**
 * Authentication configuration for tools
 */
export interface AuthConfig {
  type: 'basic' | 'bearer';
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
}

/**
 * Base class for all tools. Provides common functionality for executing API calls
 * and converting to various formats (OpenAI, AI SDK)
 */
export class Tool {
  name: string;
  description: string;
  parameters: ToolParameters;
  _executeConfig: ExecuteConfig;
  protected _headers: Record<string, string>;
  protected _transformers: ParameterTransformerMap;

  constructor(
    name: string,
    description: string,
    parameters: ToolParameters,
    executeConfig: ExecuteConfig,
    headers?: Record<string, string>,
    transformers?: ParameterTransformerMap
  ) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this._executeConfig = executeConfig;
    this._headers = headers || {};
    this._transformers = transformers || new Map<string, ParameterTransformer>();
  }

  /**
   * Add a derivation configuration for a parameter
   * @param sourceParam The source parameter name
   * @param config The derivation configuration
   */
  public addParameterTransformer(sourceParam: string, config: ParameterTransformer): void {
    this._transformers.set(sourceParam, config);
  }

  /**
   * Get the derivation configuration for a parameter
   * @param sourceParam The source parameter name
   * @returns The derivation configuration, or undefined if not found
   */
  public getParameterTransformer(sourceParam: string): ParameterTransformer | undefined {
    return this._transformers.get(sourceParam);
  }

  /**
   * Set headers for this tool
   * @param headers The headers to set
   * @returns This tool instance for chaining
   */
  setHeaders(headers: Record<string, string>): Tool {
    this._headers = { ...this._headers, ...headers };
    return this;
  }

  /**
   * Get the current headers
   * @returns The current headers
   */
  getHeaders(): Record<string, string> {
    return { ...this._headers };
  }

  /**
   * Prepare headers for the API request
   * @returns Headers to use in the request
   */
  protected _prepareHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'stackone-ai-node',
      ...this._headers,
    };

    return headers;
  }

  /**
   * Prepare URL and parameters for the API request
   * @param params Arguments to process
   * @returns Tuple of [url, bodyParams, queryParams]
   */
  protected _prepareRequestParams(params: JsonDict): [string, JsonDict, JsonDict] {
    let url = this._executeConfig.url;
    const bodyParams: JsonDict = {};
    const queryParams: JsonDict = {};

    for (const [key, value] of Object.entries(params)) {
      // Find the parameter configuration in the params array
      const paramConfig = this._executeConfig.params.find((p) => p.name === key);
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
          // Add to headers (will be handled separately)
          this._headers[key] = String(value);
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
   * Map parameters from user input to API parameters
   * @param userParams Parameters provided by the user
   * @returns Mapped parameters for the API
   */
  protected _mapParameters(userParams: JsonDict | string | undefined): JsonDict {
    // If no parameters provided, return empty object
    if (!userParams) return {};

    // If parameters are provided as a string, parse them as JSON
    const params = typeof userParams === 'string' ? JSON.parse(userParams) : userParams;

    // Create a copy of the parameters to avoid modifying the original
    const mappedParams: JsonDict = { ...params };

    // Process transformed parameters
    for (const [sourceParam, config] of this._transformers.entries()) {
      // Skip if source parameter is not present
      if (!(sourceParam in params)) continue;

      // Get the source parameter value
      const sourceValue = params[sourceParam];

      // Process each derivation function
      for (const targetParam of Object.keys(config.transforms)) {
        try {
          // Derive the parameter value
          const derivedValues = transformParameter(sourceValue, targetParam, sourceParam, config);

          // Add derived values to mapped parameters
          Object.assign(mappedParams, derivedValues);
        } catch (error) {
          // Log error but continue processing other parameters
          console.error(`Error deriving parameter ${targetParam}:`, error);
        }
      }
    }

    return mappedParams;
  }

  /**
   * Execute the tool with the provided parameters
   * @param params Parameters for the tool execution
   * @param options Options for execution (e.g., dryRun)
   * @returns Promise resolving to the API response or request details if dryRun is true
   * @throws StackOneError If there is an error executing the tool
   */
  async execute(params?: JsonDict | string, options?: ExecuteOptions): Promise<JsonDict> {
    try {
      // Map parameters from user input to API parameters
      const mappedParams = this._mapParameters(params);

      // Prepare request parameters
      const [url, bodyParams, queryParams] = this._prepareRequestParams(mappedParams);

      // Prepare headers
      const headers = this._prepareHeaders();

      // Prepare URL with query parameters
      const urlWithQuery = new URL(url);
      for (const [key, value] of Object.entries(queryParams)) {
        urlWithQuery.searchParams.append(key, String(value));
      }

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: this._executeConfig.method,
        headers,
      };

      // Handle different body types
      if (Object.keys(bodyParams).length > 0) {
        switch (this._executeConfig.bodyType) {
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

            // Handle file_path parameter
            if ('file_path' in mappedParams) {
              const _filePath = mappedParams.file_path as string;
              // This will be handled by the derivation functions
              // The actual file handling is done in the execute method
            }

            fetchOptions.body = formData;
            // Don't set Content-Type for FormData, it will be set automatically with the boundary
            break;
          }
        }
      }

      // If dryRun is true, return the request details instead of making the API call
      if (options?.dryRun) {
        return {
          url: urlWithQuery.toString(),
          method: this._executeConfig.method,
          headers: fetchOptions.headers,
          body: fetchOptions.body instanceof FormData ? '[FormData]' : fetchOptions.body,
          mappedParams,
          originalParams: params,
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
      const responseData = (await response.json()) as JsonDict;
      return responseData;
    } catch (error) {
      if (error instanceof StackOneError) {
        throw error;
      }
      throw new StackOneError(
        `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert the tool to OpenAI format
   * @returns The tool in OpenAI format
   */
  toOpenAI(): ChatCompletionTool {
    // Create a deep copy of the parameters to avoid modifying the original
    const parametersObj = {
      type: 'object',
      properties: {} as Record<string, any>,
      required: this.parameters.required,
    };

    // Convert properties to JSON Schema
    if (this.parameters.properties) {
      for (const [key, prop] of Object.entries(this.parameters.properties)) {
        parametersObj.properties[key] = prop;
      }
    }

    // Create the OpenAI tool
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: parametersObj,
      },
    };
  }

  /**
   * Convert the tool to AI SDK format
   */
  toAISDK(): Record<string, any> {
    // Create a simple wrapper function
    const executeWrapper = async (params: Record<string, unknown>) => {
      return await this.execute(params as JsonDict);
    };

    // Return an object with the tool name as the key
    return {
      [this.name]: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: this.parameters.properties || {},
          required: this.parameters.required,
        },
        execute: executeWrapper,
      },
    };
  }
}

/**
 * StackOne-specific tool class with additional functionality
 */
export class StackOneTool extends Tool {
  /**
   * Get the current account ID
   * @returns The current account ID or undefined if not set
   */
  getAccountId(): string | undefined {
    return this._headers['x-account-id'];
  }

  /**
   * Set the account ID for this tool
   * @param accountId The account ID to set
   * @returns This tool instance for chaining
   */
  setAccountId(accountId: string): StackOneTool {
    this._headers['x-account-id'] = accountId;
    return this;
  }
}

/**
 * Collection of tools with utility methods
 */
export class Tools implements Iterable<Tool> {
  private tools: Tool[];

  constructor(tools: Tool[]) {
    this.tools = tools;
  }

  /**
   * Get the number of tools in the collection
   */
  get length(): number {
    return this.tools.length;
  }

  /**
   * Get a tool by name
   * @param name Name of the tool to get
   * @returns The tool with the specified name, or undefined if not found
   */
  getTool(name: string): Tool | undefined {
    return this.tools.find((tool) => tool.name === name);
  }

  /**
   * Get a StackOne tool by name
   * @param name Name of the tool to get
   * @returns The StackOne tool with the specified name, or undefined if not found
   */
  getStackOneTool(name: string): StackOneTool {
    const tool = this.getTool(name);
    if (tool instanceof StackOneTool) {
      return tool;
    }
    throw new StackOneError(`Tool ${name} is not a StackOne tool`);
  }

  /**
   * Check if a tool is a StackOne tool
   * @param tool The tool to check
   * @returns True if the tool is a StackOne tool, false otherwise
   */
  isStackOneTool(tool: Tool): tool is StackOneTool {
    return tool instanceof StackOneTool;
  }

  /**
   * Get all StackOne tools in the collection
   * @returns Array of StackOne tools
   */
  getStackOneTools(): StackOneTool[] {
    return this.tools.filter((tool): tool is StackOneTool => tool instanceof StackOneTool);
  }

  /**
   * Convert all tools to OpenAI format
   * @returns Array of tools in OpenAI format
   */
  toOpenAI(): ChatCompletionTool[] {
    return this.tools.map((tool) => tool.toOpenAI());
  }

  /**
   * Convert all tools to AI SDK format
   * @returns Object mapping tool names to AI SDK tools
   */
  toAISDK(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const tool of this.tools) {
      Object.assign(result, tool.toAISDK());
    }
    return result;
  }

  /**
   * Filter tools by a predicate function
   * @param predicate Function to filter tools
   * @returns New Tools collection with filtered tools
   */
  filter(predicate: (tool: Tool) => boolean): Tools {
    return new Tools(this.tools.filter(predicate));
  }

  /**
   * Iterator implementation
   */
  [Symbol.iterator](): Iterator<Tool> {
    let index = 0;
    const tools = this.tools;

    return {
      next(): IteratorResult<Tool> {
        if (index < tools.length) {
          return { value: tools[index++], done: false };
        }
        return { value: undefined as any, done: true };
      },
    };
  }

  /**
   * Convert to array
   * @returns Array of tools
   */
  toArray(): Tool[] {
    return [...this.tools];
  }

  /**
   * Map tools to a new array
   * @param mapper Function to map each tool
   * @returns Array of mapped values
   */
  map<T>(mapper: (tool: Tool) => T): T[] {
    return this.tools.map(mapper);
  }

  /**
   * Execute a function for each tool
   * @param callback Function to execute for each tool
   */
  forEach(callback: (tool: Tool) => void): void {
    this.tools.forEach(callback);
  }
}
