import { type ToolSet, jsonSchema } from 'ai';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { RequestBuilder } from './modules/requestBuilder';
import type {
  ExecuteConfig,
  ExecuteOptions,
  Experimental_PreExecuteFunction,
  Experimental_ToolCreationOptions,
  JsonDict,
  ToolParameters,
} from './types';
import { StackOneError } from './utils/errors';

/**
 * Base class for all tools. Provides common functionality for executing API calls
 * and converting to various formats (OpenAI, AI SDK)
 */
export class BaseTool {
  name: string;
  description: string;
  parameters: ToolParameters;
  executeConfig: ExecuteConfig;
  protected requestBuilder: RequestBuilder;
  protected experimental_preExecute?: Experimental_PreExecuteFunction;

  constructor(
    name: string,
    description: string,
    parameters: ToolParameters,
    executeConfig: ExecuteConfig,
    headers?: Record<string, string>,
    experimental_preExecute?: Experimental_PreExecuteFunction
  ) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.executeConfig = executeConfig;
    this.requestBuilder = new RequestBuilder(executeConfig, headers);
    this.experimental_preExecute = experimental_preExecute;
  }

  /**
   * Set headers for this tool
   */
  setHeaders(headers: Record<string, string>): BaseTool {
    this.requestBuilder.setHeaders(headers);
    return this;
  }

  /**
   * Get the current headers
   */
  getHeaders(): Record<string, string> {
    return this.requestBuilder.getHeaders();
  }

  /**
   * Execute the tool with the provided parameters
   */
  async execute(inputParams?: JsonDict | string, options?: ExecuteOptions): Promise<JsonDict> {
    try {
      // Validate params is either undefined, string, or object
      if (
        inputParams !== undefined &&
        typeof inputParams !== 'string' &&
        typeof inputParams !== 'object'
      ) {
        throw new StackOneError(
          `Invalid parameters type. Expected object or string, got ${typeof inputParams}. Parameters: ${JSON.stringify(inputParams)}`
        );
      }

      // Convert string params to object
      const params = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};

      // Apply experimental preExecute function (either from tool creation or execution options)
      let processedParams = params;

      // Prioritize tool-level experimental_preExecute over execution-time experimental_PreExecute
      const preExecuteFunction = this.experimental_preExecute || options?.experimental_PreExecute;

      if (preExecuteFunction) {
        processedParams = await preExecuteFunction(params);
      }

      // Execute the request directly with processed parameters
      return await this.requestBuilder.execute(processedParams, options);
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
   */
  toOpenAI(): ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: {
          type: 'object',
          properties: this.parameters.properties,
          required: this.parameters.required,
        },
      },
    };
  }

  /**
   * Convert the tool to AI SDK format
   */
  toAISDK(options: { executable?: boolean } = { executable: true }): ToolSet {
    const schema = {
      type: 'object' as const,
      properties: this.parameters.properties || {},
      required: this.parameters.required || [],
      additionalProperties: false,
    };

    return {
      [this.name]: {
        parameters: jsonSchema(schema),
        description: this.description,
        ...(options.executable && {
          execute: async (args: Record<string, unknown>) => {
            try {
              return await this.execute(args as JsonDict);
            } catch (error) {
              return `Error executing tool: ${error instanceof Error ? error.message : String(error)}`;
            }
          },
        }),
      },
    } as ToolSet;
  }
}

/**
 * StackOne-specific tool class with additional functionality
 */
export class StackOneTool extends BaseTool {
  constructor(
    name: string,
    description: string,
    parameters: ToolParameters,
    executeConfig: ExecuteConfig,
    headers?: Record<string, string>,
    experimental_preExecute?: Experimental_PreExecuteFunction
  ) {
    super(name, description, parameters, executeConfig, headers, experimental_preExecute);
  }

  /**
   * Get the current account ID
   */
  getAccountId(): string | undefined {
    return this.getHeaders()['x-account-id'];
  }

  /**
   * Set the account ID for this tool
   */
  setAccountId(accountId: string): StackOneTool {
    this.setHeaders({ 'x-account-id': accountId });
    return this;
  }
}

/**
 * Collection of tools with utility methods
 */
export class Tools implements Iterable<BaseTool> {
  private tools: BaseTool[];

  constructor(tools: BaseTool[]) {
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
   */
  getTool(name: string, options?: Experimental_ToolCreationOptions): BaseTool | undefined {
    const originalTool = this.tools.find((tool) => tool.name === name);
    if (!originalTool) {
      return undefined;
    }

    // If no experimental options provided, return original tool
    if (!options?.experimental_schemaOverride && !options?.experimental_preExecute) {
      return originalTool;
    }

    // Create a new tool with experimental schema override and preExecute
    let parameters = originalTool.parameters;

    // Apply schema override if provided
    if (options.experimental_schemaOverride) {
      parameters = options.experimental_schemaOverride(originalTool.parameters);
    }

    // Create new tool instance with modified schema and preExecute function
    if (originalTool instanceof StackOneTool) {
      const newTool = new StackOneTool(
        originalTool.name,
        originalTool.description,
        parameters,
        originalTool.executeConfig,
        originalTool.getHeaders(),
        options.experimental_preExecute
      );
      return newTool;
    } else {
      const newTool = new BaseTool(
        originalTool.name,
        originalTool.description,
        parameters,
        originalTool.executeConfig,
        originalTool.getHeaders(),
        options.experimental_preExecute
      );
      return newTool;
    }
  }

  /**
   * Get a StackOne tool by name
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
   */
  isStackOneTool(tool: BaseTool): tool is StackOneTool {
    return tool instanceof StackOneTool;
  }

  /**
   * Get all StackOne tools in the collection
   */
  getStackOneTools(): StackOneTool[] {
    return this.tools.filter((tool): tool is StackOneTool => tool instanceof StackOneTool);
  }

  /**
   * Convert all tools to OpenAI format
   */
  toOpenAI(): ChatCompletionTool[] {
    return this.tools.map((tool) => tool.toOpenAI());
  }

  /**
   * Convert all tools to AI SDK format
   */
  toAISDK(): ToolSet {
    const result: ToolSet = {};
    for (const tool of this.tools) {
      Object.assign(result, tool.toAISDK());
    }
    return result;
  }

  /**
   * Filter tools by a predicate function
   */
  filter(predicate: (tool: BaseTool) => boolean): Tools {
    return new Tools(this.tools.filter(predicate));
  }

  /**
   * Iterator implementation
   */
  [Symbol.iterator](): Iterator<BaseTool> {
    let index = 0;
    const tools = this.tools;

    return {
      next(): IteratorResult<BaseTool> {
        if (index < tools.length) {
          return { value: tools[index++], done: false };
        }
        return { value: undefined as unknown as BaseTool, done: true };
      },
    };
  }

  /**
   * Convert to array
   */
  toArray(): BaseTool[] {
    return [...this.tools];
  }

  /**
   * Map tools to a new array
   */
  map<T>(mapper: (tool: BaseTool) => T): T[] {
    return this.tools.map(mapper);
  }

  /**
   * Execute a function for each tool
   */
  forEach(callback: (tool: BaseTool) => void): void {
    this.tools.forEach(callback);
  }
}
