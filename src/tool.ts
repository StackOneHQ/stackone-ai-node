import * as orama from '@orama/orama';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { DEFAULT_HYBRID_ALPHA } from './constants';
import { RequestBuilder } from './modules/requestBuilder';
import type {
  ExecuteConfig,
  ExecuteOptions,
  Experimental_PreExecuteFunction,
  Experimental_ToolCreationOptions,
  HttpExecuteConfig,
  JsonDict,
  LocalExecuteConfig,
  RpcExecuteConfig,
  ToolExecution,
  ToolParameters,
} from './types';
import { StackOneError } from './utils/errors';
import { TfidfIndex } from './utils/tfidf-index';

/**
 * Base class for all tools. Provides common functionality for executing API calls
 * and converting to various formats (OpenAI, AI SDK)
 */
export class BaseTool {
  name: string;
  description: string;
  parameters: ToolParameters;
  executeConfig: ExecuteConfig;
  protected requestBuilder?: RequestBuilder;
  protected experimental_preExecute?: Experimental_PreExecuteFunction;
  #exposeExecutionMetadata = true;
  #headers: Record<string, string>;

  private createExecutionMetadata(): ToolExecution {
    const config = (() => {
      switch (this.executeConfig.kind) {
        case 'http':
          return {
            kind: 'http',
            method: this.executeConfig.method,
            url: this.executeConfig.url,
            bodyType: this.executeConfig.bodyType,
            params: this.executeConfig.params.map((param) => ({ ...param })),
          } satisfies HttpExecuteConfig;
        case 'rpc':
          return {
            kind: 'rpc',
            method: this.executeConfig.method,
            url: this.executeConfig.url,
            payloadKeys: { ...this.executeConfig.payloadKeys },
          } satisfies RpcExecuteConfig;
        case 'local':
          return {
            kind: 'local',
            identifier: this.executeConfig.identifier,
            description: this.executeConfig.description,
          } satisfies LocalExecuteConfig;
        default:
          this.executeConfig satisfies never;
          throw new StackOneError('Unsupported executeConfig kind');
      }
    })();

    return {
      config,
      headers: this.getHeaders(),
    };
  }

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
    this.#headers = { ...(headers ?? {}) };
    if (executeConfig.kind === 'http') {
      this.requestBuilder = new RequestBuilder(executeConfig, this.#headers);
    }
    this.experimental_preExecute = experimental_preExecute;
  }

  /**
   * Set headers for this tool
   */
  setHeaders(headers: Record<string, string>): BaseTool {
    this.#headers = { ...this.#headers, ...headers };
    if (this.requestBuilder) {
      this.requestBuilder.setHeaders(headers);
    }
    return this;
  }

  /**
   * Get the current headers
   */
  getHeaders(): Record<string, string> {
    if (this.requestBuilder) {
      const currentHeaders = this.requestBuilder.getHeaders();
      this.#headers = { ...currentHeaders };
      return currentHeaders;
    }
    return { ...this.#headers };
  }

  /**
   * Control whether execution metadata should be exposed in AI SDK conversions.
   */
  setExposeExecutionMetadata(expose: boolean): this {
    this.#exposeExecutionMetadata = expose;
    return this;
  }

  /**
   * Execute the tool with the provided parameters
   */
  async execute(inputParams?: JsonDict | string, options?: ExecuteOptions): Promise<JsonDict> {
    try {
      if (!this.requestBuilder || this.executeConfig.kind !== 'http') {
        // Non-HTTP tools provide their own execute override (e.g. RPC, local meta tools).
        throw new StackOneError(
          'BaseTool.execute is only available for HTTP-backed tools. Provide a custom execute implementation for non-HTTP tools.'
        );
      }
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

      if (this.experimental_preExecute) {
        processedParams = await this.experimental_preExecute(params);
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
  async toAISDK(
    options: { executable?: boolean; execution?: ToolExecution | false } = {
      executable: true,
    }
  ) {
    const schema = {
      type: 'object' as const,
      properties: this.parameters.properties || {},
      required: this.parameters.required || [],
      additionalProperties: false,
    };

    /** AI SDK is optional dependency, import only when needed */
    let jsonSchema: typeof import('ai').jsonSchema;
    try {
      const ai = await import('ai');
      jsonSchema = ai.jsonSchema;
    } catch {
      throw new StackOneError(
        'AI SDK is not installed. Please install it with: npm install ai@4.x|5.x or bun add ai@4.x|5.x'
      );
    }

    const schemaObject = jsonSchema(schema);
    const toolDefinition: Record<string, unknown> = {
      inputSchema: schemaObject, // v5
      parameters: schemaObject, // v4 (backward compatibility)
      description: this.description,
    };

    const executionOption =
      options.execution !== undefined
        ? options.execution
        : this.#exposeExecutionMetadata
          ? this.createExecutionMetadata()
          : false;

    if (executionOption !== false) {
      toolDefinition.execution = executionOption;
    }

    if (options.executable ?? true) {
      toolDefinition.execute = async (args: Record<string, unknown>) => {
        try {
          return await this.execute(args as JsonDict);
        } catch (error) {
          return `Error executing tool: ${error instanceof Error ? error.message : String(error)}`;
        }
      };
    }

    return {
      [this.name]: {
        ...toolDefinition,
      },
    };
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
    }
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
  async toAISDK(
    options: { executable?: boolean; execution?: ToolExecution | false } = {
      executable: true,
    }
  ) {
    const result: Record<string, unknown> = {};
    for (const tool of this.tools) {
      Object.assign(result, await tool.toAISDK(options));
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
   * Return meta tools for tool discovery and execution
   * @beta This feature is in beta and may change in future versions
   * @param hybridAlpha - Weight for BM25 in hybrid search (0-1). If not provided, uses DEFAULT_HYBRID_ALPHA (0.2).
   */
  async metaTools(hybridAlpha = DEFAULT_HYBRID_ALPHA): Promise<Tools> {
    const oramaDb = await initializeOramaDb(this.tools);
    const tfidfIndex = initializeTfidfIndex(this.tools);
    const baseTools = [
      metaSearchTools(oramaDb, tfidfIndex, this.tools, hybridAlpha),
      metaExecuteTool(this),
    ];
    const tools = new Tools(baseTools);
    return tools;
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

/**
 * Result from meta_search_tools
 */
export interface MetaToolSearchResult {
  name: string;
  description: string;
  parameters: ToolParameters;
  score: number;
}

type OramaDb = ReturnType<typeof orama.create>;

/**
 * Initialize TF-IDF index for tool search
 */
function initializeTfidfIndex(tools: BaseTool[]): TfidfIndex {
  const index = new TfidfIndex();
  const corpus = tools.map((tool) => {
    // Extract category from tool name (e.g., 'hris_create_employee' -> 'hris')
    const parts = tool.name.split('_');
    const category = parts[0];

    // Extract action type
    const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search'];
    const actions = parts.filter((p) => actionTypes.includes(p));

    // Build text corpus for TF-IDF (similar weighting strategy as in tool-calling-evals)
    const text = [
      `${tool.name} ${tool.name} ${tool.name}`, // boost name
      `${category} ${actions.join(' ')}`,
      tool.description,
      parts.join(' '),
    ].join(' ');

    return { id: tool.name, text };
  });

  index.build(corpus);
  return index;
}

/**
 * Initialize Orama database with BM25 algorithm for tool search
 * Using Orama's BM25 scoring algorithm for relevance ranking
 * @see https://docs.orama.com/open-source/usage/create
 * @see https://docs.orama.com/open-source/usage/search/bm25-algorithm/
 */
async function initializeOramaDb(tools: BaseTool[]): Promise<OramaDb> {
  // Create Orama database schema with BM25 scoring algorithm
  // BM25 provides better relevance ranking for natural language queries
  const oramaDb = orama.create({
    schema: {
      name: 'string' as const,
      description: 'string' as const,
      category: 'string' as const,
      tags: 'string[]' as const,
    },
    components: {
      tokenizer: {
        stemming: true,
      },
    },
  });

  // Index all tools
  for (const tool of tools) {
    // Extract category from tool name (e.g., 'hris_create_employee' -> 'hris')
    const parts = tool.name.split('_');
    const category = parts[0];

    // Extract action type
    const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search'];
    const actions = parts.filter((p) => actionTypes.includes(p));

    orama.insert(oramaDb, {
      name: tool.name,
      description: tool.description,
      category: category,
      tags: [...parts, ...actions],
    });
  }

  return oramaDb;
}

export function metaSearchTools(
  oramaDb: OramaDb,
  tfidfIndex: TfidfIndex,
  allTools: BaseTool[],
  hybridAlpha = DEFAULT_HYBRID_ALPHA
): BaseTool {
  const name = 'meta_search_tools' as const;
  const description =
    `Searches for relevant tools based on a natural language query using hybrid BM25 + TF-IDF search (alpha=${hybridAlpha}). This tool should be called first to discover available tools before executing them.` as const;
  const parameters = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Natural language query describing what tools you need (e.g., "tools for managing employees", "create time off request")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of tools to return (default: 5)',
        default: 5,
      },
      minScore: {
        type: 'number',
        description: 'Minimum relevance score (0-1) for results (default: 0.3)',
        default: 0.3,
      },
    },
    required: ['query'],
  } as const satisfies ToolParameters;

  const executeConfig = {
    kind: 'local',
    identifier: name,
    description: 'local://get-relevant-tools',
  } as const satisfies LocalExecuteConfig;

  const tool = new BaseTool(name, description, parameters, executeConfig);
  tool.execute = async (inputParams?: JsonDict | string): Promise<JsonDict> => {
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
      const limit = params.limit || 5;
      const minScore = params.minScore ?? 0.3;
      const query = params.query || '';

      // Hybrid: BM25 + TF-IDF fusion
      const alpha = Math.max(0, Math.min(1, hybridAlpha));

      // Get results from both algorithms
      const [bm25Results, tfidfResults] = await Promise.all([
        orama.search(oramaDb, {
          term: query,
          limit: Math.max(50, limit),
        } as Parameters<typeof orama.search>[1]),
        Promise.resolve(tfidfIndex.search(query, Math.max(50, limit))),
      ]);

      // Build score map
      const scoreMap = new Map<string, { bm25?: number; tfidf?: number }>();

      for (const hit of bm25Results.hits) {
        const doc = hit.document as { name: string };
        scoreMap.set(doc.name, {
          ...(scoreMap.get(doc.name) || {}),
          bm25: clamp01(hit.score),
        });
      }

      for (const r of tfidfResults) {
        scoreMap.set(r.id, {
          ...(scoreMap.get(r.id) || {}),
          tfidf: clamp01(r.score),
        });
      }

      // Fuse scores
      const fused: Array<{ name: string; score: number }> = [];
      for (const [name, scores] of scoreMap) {
        const bm25 = scores.bm25 ?? 0;
        const tfidf = scores.tfidf ?? 0;
        const score = alpha * bm25 + (1 - alpha) * tfidf;
        fused.push({ name, score });
      }

      fused.sort((a, b) => b.score - a.score);

      const toolConfigs = fused
        .filter((r) => r.score >= minScore)
        .map((r) => {
          const tool = allTools.find((t) => t.name === r.name);
          if (!tool) return null;

          const result: MetaToolSearchResult = {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            score: r.score,
          };
          return result;
        })
        .filter((t): t is MetaToolSearchResult => t !== null)
        .slice(0, limit);

      return { tools: toolConfigs } satisfies JsonDict;
    } catch (error) {
      if (error instanceof StackOneError) {
        throw error;
      }
      throw new StackOneError(
        `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };
  return tool;
}

/**
 * Clamp value to [0, 1]
 */
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function metaExecuteTool(tools: Tools): BaseTool {
  const name = 'meta_execute_tool' as const;
  const description =
    'Executes a specific tool by name with the provided parameters. Use this after discovering tools with meta_search_tools.' as const;
  const parameters = {
    type: 'object',
    properties: {
      toolName: {
        type: 'string',
        description: 'Name of the tool to execute',
      },
      params: {
        type: 'object',
        description: 'Parameters to pass to the tool',
      },
    },
    required: ['toolName', 'params'],
  } as const satisfies ToolParameters;

  const executeConfig = {
    kind: 'local',
    identifier: name,
    description: 'local://execute-tool',
  } as const satisfies LocalExecuteConfig;

  // Create the tool instance
  const tool = new BaseTool(name, description, parameters, executeConfig);

  // Override the execute method to handle tool execution
  // receives tool name and parameters and executes the tool
  tool.execute = async (
    inputParams?: JsonDict | string,
    options?: ExecuteOptions
  ): Promise<JsonDict> => {
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

      // Extract tool name and parameters
      const { toolName, params: toolParams } = params;

      // Find the tool by name
      const toolToExecute = tools.getTool(toolName);
      if (!toolToExecute) {
        throw new StackOneError(`Tool ${toolName} not found`);
      }

      // Execute the tool with the provided parameters
      return await toolToExecute.execute(toolParams, options);
    } catch (error) {
      if (error instanceof StackOneError) {
        throw error;
      }
      throw new StackOneError(
        `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };
  return tool;
}
