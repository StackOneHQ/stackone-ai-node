import { type ToolSet, jsonSchema } from 'ai';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { ParameterMapper } from './modules/parameterMapper';
import { RequestBuilder } from './modules/requestBuilder';
import type {
  ExecuteConfig,
  ExecuteOptions,
  JsonDict,
  ParameterTransformer,
  ParameterTransformerMap,
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
  protected parameterMapper: ParameterMapper;
  protected requestBuilder: RequestBuilder;

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
    this.executeConfig = executeConfig;
    this.parameterMapper = new ParameterMapper(transformers);
    this.requestBuilder = new RequestBuilder(executeConfig, headers);
  }

  /**
   * Add a parameter transformer
   */
  public setParameterTransformer(sourceParam: string, config: ParameterTransformer): void {
    this.parameterMapper.addTransformer(sourceParam, config);
  }

  /**
   * Get a parameter transformer
   */
  public getParameterTransformer(sourceParam: string): ParameterTransformer | undefined {
    return this.parameterMapper.getTransformer(sourceParam);
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

      // Map parameters from user input to API parameters
      const mappedParams = this.parameterMapper.mapParameters(inputParams);

      // Execute the request
      return await this.requestBuilder.execute(mappedParams, options);
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
            return await this.execute(args as JsonDict);
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
  getTool(name: string): BaseTool | undefined {
    return this.tools.find((tool) => tool.name === name);
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
