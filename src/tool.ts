import * as orama from '@orama/orama';
import { type EmbeddingModel, type ToolSet, jsonSchema } from 'ai';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { EmbeddingManager, combineScores } from './modules/embeddings';
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
   * Return meta tools for tool discovery and execution
   * @param embeddingConfig Optional configuration for vector search using AI SDK embedding models
   * @beta This feature is in beta and may change in future versions
   */
  async metaTools(embeddingConfig?: {
    model?: EmbeddingModel<string>;
  }): Promise<Tools> {
    const embeddingManager = embeddingConfig?.model
      ? new EmbeddingManager({ model: embeddingConfig.model })
      : undefined;
    const oramaDb = await initializeOramaDb(this.tools, embeddingManager);
    const baseTools = [
      metaFilterRelevantTools(oramaDb, this.tools, embeddingManager),
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

/**
 * Available search modes as const array for validation
 */
const META_TOOL_SEARCH_MODES = ['bm25', 'embeddings', 'hybrid'] as const;

/**
 * Search modes for meta tools
 */
export type MetaToolSearchMode = (typeof META_TOOL_SEARCH_MODES)[number];

type OramaDb = ReturnType<typeof orama.create>;

/**
 * Initialize Orama database with BM25 algorithm for tool search
 * Using Orama's BM25 scoring algorithm for relevance ranking
 * Optionally includes vector embeddings for semantic search
 * @see https://docs.orama.com/open-source/usage/create
 * @see https://docs.orama.com/open-source/usage/search/bm25-algorithm/
 * @see https://docs.orama.com/open-source/usage/search/vector-search
 */
async function initializeOramaDb(
  tools: BaseTool[],
  embeddingManager?: EmbeddingManager
): Promise<OramaDb> {
  // Determine schema based on whether embeddings are enabled
  let hasEmbeddings = embeddingManager?.isEnabled;

  const schema = {
    name: 'string' as const,
    description: 'string' as const,
    category: 'string' as const,
    tags: 'string[]' as const,
    ...(hasEmbeddings && {
      embedding: 'vector[1536]' as const, // Default OpenAI text-embedding-3-small dimensions
    }),
  };

  const oramaDb = orama.create({
    schema,
    components: {
      tokenizer: {
        stemming: true,
      },
    },
  });

  // Generate embeddings if needed
  let embeddings: (number[] | null)[] = [];
  if (hasEmbeddings && embeddingManager) {
    try {
      const descriptions = tools.map((tool) => tool.description);
      embeddings = await embeddingManager.generateEmbeddings(descriptions);
    } catch (_error) {
      // If embedding generation fails during indexing, continue without embeddings
      // This will disable vector search but allow text search to work
      embeddings = tools.map(() => null);
      hasEmbeddings = false;
    }
  }

  // Index all tools
  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];

    // Extract category from tool name (e.g., 'hris_create_employee' -> 'hris')
    const parts = tool.name.split('_');
    const category = parts[0];

    // Extract action type
    const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search'];
    const actions = parts.filter((p) => actionTypes.includes(p));

    type DocumentType = {
      name: string;
      description: string;
      category: string;
      tags: string[];
      embedding?: number[];
    };

    const document: DocumentType = {
      name: tool.name,
      description: tool.description,
      category: category,
      tags: [...parts, ...actions],
    };

    // Only add embedding if it exists and is not null
    if (hasEmbeddings && embeddings[i] && Array.isArray(embeddings[i])) {
      document.embedding = embeddings[i] as number[];
    }

    orama.insert(oramaDb, document);
  }

  return oramaDb;
}

export function metaFilterRelevantTools(
  oramaDb: OramaDb,
  allTools: BaseTool[],
  embeddingManager?: EmbeddingManager
): BaseTool {
  const name = 'meta_filter_relevant_tools' as const;
  const description =
    'Searches for relevant tools based on a natural language query. This tool should be called first to discover available tools before executing them.' as const;

  const hasVectorSearch = embeddingManager?.isEnabled;

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
      ...(hasVectorSearch && {
        mode: {
          type: 'string',
          description:
            'Search mode: "bm25" (BM25 only), "embeddings" (semantic only), "hybrid" (combined) (default: "hybrid")',
          enum: [...META_TOOL_SEARCH_MODES],
          default: 'hybrid',
        },
        hybridWeights: {
          type: 'object',
          description: 'Weights for hybrid search (default: { bm25: 0.5, embeddings: 0.5 })',
          properties: {
            bm25: { type: 'number', minimum: 0, maximum: 1 },
            embeddings: { type: 'number', minimum: 0, maximum: 1 },
          },
          default: { bm25: 0.5, embeddings: 0.5 },
        },
      }),
    },
    required: ['query'],
  } as const satisfies ToolParameters;

  const executeConfig = {
    method: 'LOCAL',
    url: 'local://get-relevant-tools',
    bodyType: 'json',
    params: [],
  } as const satisfies ExecuteConfig;

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

      // Determine search mode
      const mode: MetaToolSearchMode = params.mode || (hasVectorSearch ? 'hybrid' : 'bm25');
      const hybridWeights = params.hybridWeights || { bm25: 0.5, embeddings: 0.5 };
      const limit = params.limit || 5;
      const minScore = params.minScore ?? 0.3;
      const query = params.query || '';

      type SearchResult = Awaited<ReturnType<typeof orama.search>>;
      let results: SearchResult;

      switch (mode) {
        case 'bm25':
          // BM25-only search
          results = await orama.search(oramaDb, {
            term: query,
            limit,
          } as Parameters<typeof orama.search>[1]);
          break;

        case 'embeddings': {
          if (!hasVectorSearch || !embeddingManager) {
            // Fall back to BM25 if vector search is not available
            results = await orama.search(oramaDb, {
              term: query,
              limit,
            } as Parameters<typeof orama.search>[1]);
            break;
          }
          // Embeddings-only search
          let queryEmbedding: number[] | null = null;
          try {
            queryEmbedding = await embeddingManager.generateEmbedding(query);
          } catch (error) {
            throw new StackOneError(
              `Failed to generate query embedding: ${error instanceof Error ? error.message : String(error)}`
            );
          }

          if (!queryEmbedding) {
            throw new StackOneError('Failed to generate query embedding');
          }

          results = await orama.search(oramaDb, {
            mode: 'vector',
            vector: {
              value: queryEmbedding,
              property: 'embedding',
            },
            similarity: minScore,
            limit,
          } as Parameters<typeof orama.search>[1]);
          break;
        }

        case 'hybrid': {
          if (!hasVectorSearch || !embeddingManager) {
            // Fall back to BM25 if vector search is not available
            results = await orama.search(oramaDb, {
              term: query,
              limit,
            } as Parameters<typeof orama.search>[1]);
            break;
          }
          // Hybrid search: combine BM25 and embeddings results
          let queryEmbedding: number[] | null = null;
          try {
            queryEmbedding = await embeddingManager.generateEmbedding(query);
          } catch (_error) {
            // Embedding generation failed, will fall back to BM25-only search
            queryEmbedding = null;
          }

          if (!queryEmbedding) {
            // Fall back to BM25-only if embedding fails
            results = await orama.search(oramaDb, {
              term: query,
              limit,
            } as Parameters<typeof orama.search>[1]);
          } else {
            // Perform both searches in parallel
            const [bm25Results, embeddingResults] = await Promise.all([
              orama.search(oramaDb, {
                term: query,
                limit: Math.min(limit * 2, 20), // Get more results for better hybridization
              } as Parameters<typeof orama.search>[1]),
              orama.search(oramaDb, {
                mode: 'vector',
                vector: {
                  value: queryEmbedding,
                  property: 'embedding',
                },
                similarity: Math.max(minScore - 0.2, 0), // Lower threshold for vector to get more candidates
                limit: Math.min(limit * 2, 20),
              } as Parameters<typeof orama.search>[1]),
            ]);

            // Combine results by document ID and compute hybrid scores
            type CombinedResultItem = {
              hit: (typeof bm25Results.hits)[0];
              bm25Score: number;
              embeddingScore: number;
              combinedScore: number;
            };
            const combinedResults = new Map<string, CombinedResultItem>();

            // Process BM25 results
            for (const hit of bm25Results.hits) {
              const id = (hit.document as { name: string }).name;
              combinedResults.set(id, {
                hit,
                bm25Score: hit.score,
                embeddingScore: 0,
                combinedScore: hit.score * hybridWeights.bm25,
              });
            }

            // Process embedding results and combine scores
            for (const hit of embeddingResults.hits) {
              const id = (hit.document as { name: string }).name;
              const existing = combinedResults.get(id);
              if (existing) {
                existing.embeddingScore = hit.score;
                existing.combinedScore = combineScores(
                  existing.bm25Score,
                  hit.score,
                  hybridWeights
                );
              } else {
                combinedResults.set(id, {
                  hit,
                  bm25Score: 0,
                  embeddingScore: hit.score,
                  combinedScore: hit.score * hybridWeights.embeddings,
                });
              }
            }

            // Convert back to search results format
            const sortedResults = Array.from(combinedResults.values())
              .sort((a, b) => b.combinedScore - a.combinedScore)
              .slice(0, limit)
              .map((item) => ({ ...item.hit, score: item.combinedScore }));

            results = {
              count: sortedResults.length,
              elapsed: bm25Results.elapsed,
              hits: sortedResults,
            };
          }
          break;
        }

        default: {
          // Exhaustive check - this should never happen due to validation above
          mode satisfies never;
          throw new StackOneError(`Unhandled search mode: ${mode}`);
        }
      }

      // Filter results by minimum score
      const filteredResults = results.hits.filter((hit) => hit.score >= minScore);

      // Map the results to include tool configurations
      const toolConfigs = filteredResults
        .map((hit) => {
          const doc = hit.document as { name: string };
          const tool = allTools.find((t) => t.name === doc.name);
          if (!tool) return null;

          const result: MetaToolSearchResult = {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            score: hit.score,
          };
          return result;
        })
        .filter(Boolean);

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

export function metaExecuteTool(tools: Tools): BaseTool {
  const name = 'meta_execute_tool' as const;
  const description =
    'Executes a specific tool by name with the provided parameters. Use this after discovering tools with meta_filter_relevant_tools.' as const;
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
    method: 'LOCAL',
    url: 'local://execute-tool',
    bodyType: 'json',
    params: [],
  } as const satisfies ExecuteConfig;

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
