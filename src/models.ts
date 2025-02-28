/// <reference types="bun-types" />
import { type Schema, type Tool, type ToolExecutionOptions, jsonSchema, tool } from 'ai';
// Import OpenAPI and JSON Schema types
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

// Type aliases for common types
export type JsonDict = Record<string, unknown>;
export type Headers = Record<string, string>;

// JSON Schema related types
export type JsonSchemaProperties = Record<string, JSONSchema7Definition>;
export type JsonSchemaType = JSONSchema7['type'];

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

  constructor(message: string, statusCode: number, responseBody: unknown) {
    super(message);
    this.name = 'StackOneAPIError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
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
  FILE = 'file', // For file uploads
}

/**
 * Configuration for executing a tool against an API endpoint
 */
export interface ExecuteConfig {
  headers: Headers;
  method: string;
  url: string;
  name: string;
  bodyType?: string;
  parameterLocations: Record<string, ParameterLocation>;
}

/**
 * Schema definition for tool parameters
 */
export interface ToolParameters {
  type: string;
  properties: JsonSchemaProperties;
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
 * Base class for all StackOne tools. Provides functionality for executing API calls
 * and converting to various formats (OpenAI, AI SDK)
 */
export class StackOneTool {
  name: string;
  description: string;
  parameters: ToolParameters;
  _executeConfig: ExecuteConfig;
  private _apiKey: string;
  private _accountId?: string;

  constructor(
    description: string,
    parameters: ToolParameters,
    executeConfig: ExecuteConfig,
    apiKey: string,
    accountId?: string
  ) {
    this.name = executeConfig.name;
    this.description = description;
    this.parameters = parameters;
    this._executeConfig = executeConfig;
    this._apiKey = apiKey;
    this._accountId = accountId;
  }

  /**
   * Prepare headers for the API request
   * @returns Headers to use in the request
   */
  private _prepareHeaders(): Headers {
    const authString = Buffer.from(`${this._apiKey}:`).toString('base64');
    const headers: Headers = {
      Authorization: `Basic ${authString}`,
      'User-Agent': 'stackone-node/1.0.0',
    };

    if (this._accountId) {
      headers['x-account-id'] = this._accountId;
    }

    // Add predefined headers
    return { ...headers, ...this._executeConfig.headers };
  }

  /**
   * Prepare URL and parameters for the API request
   * @param params Arguments to process
   * @returns Tuple of [url, bodyParams, queryParams]
   */
  private _prepareRequestParams(params: JsonDict): [string, JsonDict, JsonDict] {
    let url = this._executeConfig.url;
    const bodyParams: JsonDict = {};
    const queryParams: JsonDict = {};

    for (const [key, value] of Object.entries(params)) {
      const paramLocation = this._executeConfig.parameterLocations[key];

      switch (paramLocation) {
        case ParameterLocation.PATH:
          url = url.replace(`{${key}}`, String(value));
          break;
        case ParameterLocation.QUERY:
          queryParams[key] = value;
          break;
        case ParameterLocation.BODY:
        case ParameterLocation.FILE:
          bodyParams[key] = value;
          break;
        default:
          // Default behavior
          if (url.includes(`{${key}}`)) {
            url = url.replace(`{${key}}`, String(value));
          } else if (
            this._executeConfig.method === 'GET' ||
            this._executeConfig.method === 'DELETE'
          ) {
            queryParams[key] = value;
          } else {
            bodyParams[key] = value;
          }
      }
    }

    return [url, bodyParams, queryParams];
  }

  /**
   * Execute the tool with the given parameters
   * @param params Tool arguments as string or object
   * @returns API response as object
   * @throws StackOneAPIError If the API request fails
   * @throws Error If the arguments are invalid
   */
  async execute(params?: string | JsonDict): Promise<JsonDict> {
    try {
      // Parse arguments
      let kwargs: JsonDict = {};
      if (typeof params === 'string') {
        kwargs = JSON.parse(params);
      } else if (params) {
        kwargs = params;
      }

      // Prepare request
      const headers = this._prepareHeaders();
      const [url, bodyParams, queryParams] = this._prepareRequestParams(kwargs);

      // Build URL with query parameters
      const urlWithQuery = new URL(url);
      for (const [key, value] of Object.entries(queryParams)) {
        urlWithQuery.searchParams.append(key, String(value));
      }

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: this._executeConfig.method,
        headers,
      };

      // Add body if needed
      if (Object.keys(bodyParams).length > 0) {
        const bodyType = this._executeConfig.bodyType || 'json';
        if (bodyType === 'json') {
          fetchOptions.body = JSON.stringify(bodyParams);
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json',
          };
        } else if (bodyType === 'form') {
          const formData = new URLSearchParams();
          for (const [key, value] of Object.entries(bodyParams)) {
            formData.append(key, String(value));
          }
          fetchOptions.body = formData;
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/x-www-form-urlencoded',
          };
        } else if (bodyType === 'multipart') {
          const formData = new FormData();
          for (const [key, value] of Object.entries(bodyParams)) {
            // Convert value to string or Blob as required by FormData.append
            if (value instanceof Blob) {
              formData.append(key, value);
            } else {
              formData.append(key, String(value));
            }
          }
          fetchOptions.body = formData;
          // Content-Type is automatically set by the browser for FormData
        }
      }

      // Make the request
      const response = await fetch(urlWithQuery.toString(), fetchOptions);

      // Handle errors
      if (!response.ok) {
        let responseBody: string | JsonDict = '';
        try {
          responseBody = await response.json();
        } catch (_e) {
          // If response is not JSON, use text
          responseBody = await response.text();
        }
        throw new StackOneAPIError(
          `API request failed with status ${response.status}`,
          response.status,
          responseBody
        );
      }

      // Parse response
      const result = await response.json();
      return typeof result === 'object' && result !== null ? result : { result };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in arguments: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Convert this tool to OpenAI's tool format
   * @returns Tool definition in OpenAI tool format
   */
  toOpenAI(): ChatCompletionTool {
    // Clean properties and handle special types
    const properties: Record<string, JSONSchema7> = {};
    const required: string[] = [];

    for (const [name, propValue] of Object.entries(this.parameters.properties)) {
      if (typeof propValue === 'object' && propValue !== null) {
        const prop = propValue as JSONSchema7;
        // Only keep standard JSON Schema properties
        const cleanedProp: JSONSchema7 = {};

        // Copy basic properties
        if ('type' in prop) {
          cleanedProp.type = prop.type;
        }
        if ('description' in prop) {
          cleanedProp.description = prop.description;
        }
        if ('enum' in prop) {
          cleanedProp.enum = prop.enum;
        }

        // Handle array types
        if (cleanedProp.type === 'array') {
          // Ensure all arrays have an items property
          if ('items' in prop && typeof prop.items === 'object' && prop.items !== null) {
            const itemsObj = prop.items as JSONSchema7;
            cleanedProp.items = Object.fromEntries(
              Object.entries(itemsObj).filter(([k]) => ['type', 'description', 'enum'].includes(k))
            ) as JSONSchema7;
          } else {
            // Default to string items if not specified
            cleanedProp.items = { type: 'string' };
          }
        }

        // Handle object types
        if (cleanedProp.type === 'object' && 'properties' in prop) {
          const propProperties = prop.properties as Record<string, JSONSchema7>;
          cleanedProp.properties = Object.fromEntries(
            Object.entries(propProperties).map(([k, v]) => {
              const propValue = v as JSONSchema7;
              // Recursively ensure arrays in nested objects have items
              if (propValue.type === 'array' && !('items' in propValue)) {
                return [k, { ...propValue, items: { type: 'string' } }];
              }
              return [
                k,
                Object.fromEntries(
                  Object.entries(propValue).filter(([sk]) =>
                    ['type', 'description', 'enum', 'items'].includes(sk)
                  )
                ) as JSONSchema7,
              ];
            })
          ) as Record<string, JSONSchema7>;
        }

        properties[name] = cleanedProp;
      }
    }

    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
      },
    };
  }

  /**
   * Convert this tool to an AI SDK tool
   * @returns AI SDK tool
   */
  toAISDKTool() {
    // Create a wrapper function that will handle the execution
    const executeWrapper = async (
      args: unknown,
      _options: ToolExecutionOptions
    ): Promise<JsonDict> => {
      try {
        return await this.execute(args as JsonDict);
      } catch (error) {
        if (error instanceof StackOneError) {
          throw new Error(`StackOne Error: ${error.message}`);
        }
        throw error;
      }
    };

    // Get the OpenAI format which already has the correct JSON Schema structure
    const openAIFormat = this.toOpenAI();

    // Use the OpenAI function parameters as our JSON schema
    const schema = jsonSchema(openAIFormat.function.parameters as JSONSchema7);

    // Return the AI SDK tool
    return tool({
      description: this.description,
      parameters: schema,
      execute: executeWrapper,
    });
  }
}

/**
 * Collection of StackOne tools
 */
export class Tools {
  private tools: StackOneTool[];

  constructor(tools: StackOneTool[]) {
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
   * @returns The tool, or undefined if not found
   */
  getTool(name: string): StackOneTool | undefined {
    return this.tools.find((tool) => tool.name === name);
  }

  /**
   * Convert all tools to OpenAI format
   * @returns Array of tools in the format expected by OpenAI's API
   */
  toOpenAI(): ChatCompletionTool[] {
    return this.tools.map((tool) => tool.toOpenAI());
  }

  /**
   * Convert all tools to AI SDK tools
   * @returns Object with tool names as keys and AI SDK tools as values
   */
  toAISDKTools(): Record<string, Tool<Schema<unknown>, JsonDict>> {
    const result: Record<string, Tool<Schema<unknown>, JsonDict>> = {};

    for (const stackOneTool of this.tools) {
      result[stackOneTool.name] = stackOneTool.toAISDKTool();
    }

    return result;
  }

  /**
   * Iterate over the tools
   */
  [Symbol.iterator](): Iterator<StackOneTool> {
    let index = 0;
    const tools = this.tools;

    return {
      next(): IteratorResult<StackOneTool> {
        if (index < tools.length) {
          return { value: tools[index++], done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}
