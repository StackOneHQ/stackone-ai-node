import type { JSONSchema7 as AISDKJSONSchema } from 'ai';
import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources';
import * as orama from '@orama/orama';
import type { ChatCompletionFunctionTool } from 'openai/resources/chat/completions';
import type { FunctionTool as OpenAIResponsesFunctionTool } from 'openai/resources/responses/responses';
import type { OverrideProperties } from 'type-fest';
import { peerDependencies } from '../package.json';
import { DEFAULT_HYBRID_ALPHA } from './consts';
import { RequestBuilder } from './requestBuilder';
import type {
	AISDKToolDefinition,
	AISDKToolResult,
	ExecuteConfig,
	ExecuteOptions,
	HttpExecuteConfig,
	JsonObject,
	JSONSchema,
	LocalExecuteConfig,
	RpcExecuteConfig,
	ToolExecution,
	ToolParameters,
} from './types';

import { StackOneError } from './utils/error-stackone';
import { TfidfIndex } from './utils/tfidf-index';
import { tryImport } from './utils/try-import';

/**
 * JSON Schema with type narrowed to 'object'
 * Used for tool parameter schemas which are always objects
 */
type ObjectJSONSchema = OverrideProperties<JSONSchema, { type: 'object' }>;

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
						params: this.executeConfig.params.map((param) => ({
							...param,
						})),
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
	) {
		this.name = name;
		this.description = description;
		this.parameters = parameters;
		this.executeConfig = executeConfig;
		this.#headers = { ...headers };
		if (executeConfig.kind === 'http') {
			this.requestBuilder = new RequestBuilder(executeConfig, this.#headers);
		}
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
	async execute(inputParams?: JsonObject | string, options?: ExecuteOptions): Promise<JsonObject> {
		try {
			if (!this.requestBuilder || this.executeConfig.kind !== 'http') {
				// Non-HTTP tools provide their own execute override (e.g. RPC, local meta tools).
				throw new StackOneError(
					'BaseTool.execute is only available for HTTP-backed tools. Provide a custom execute implementation for non-HTTP tools.',
				);
			}
			// Validate params is either undefined, string, or object
			if (
				inputParams !== undefined &&
				typeof inputParams !== 'string' &&
				typeof inputParams !== 'object'
			) {
				throw new StackOneError(
					`Invalid parameters type. Expected object or string, got ${typeof inputParams}. Parameters: ${JSON.stringify(
						inputParams,
					)}`,
				);
			}

			// Convert string params to object
			const params = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};

			// Execute the request directly with parameters
			return await this.requestBuilder.execute(params, options);
		} catch (error) {
			if (error instanceof StackOneError) {
				throw error;
			}
			throw new StackOneError(
				`Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	/**
	 * Convert the tool parameters to a pure JSON Schema format
	 * This is framework-agnostic and can be used with any LLM that accepts JSON Schema
	 */
	toJsonSchema(): ObjectJSONSchema {
		return {
			type: 'object',
			properties: this.parameters.properties,
			required: this.parameters.required,
		};
	}

	/**
	 * Convert the tool to OpenAI Chat Completions API format
	 */
	toOpenAI(): ChatCompletionFunctionTool {
		return {
			type: 'function',
			function: {
				name: this.name,
				description: this.description,
				parameters: this.toJsonSchema(),
			},
		};
	}

	/**
	 * Convert the tool to Anthropic format
	 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
	 */
	toAnthropic(): AnthropicTool {
		return {
			name: this.name,
			description: this.description,
			input_schema: this.toJsonSchema(),
		};
	}

	/**
	 * Convert the tool to OpenAI Responses API format
	 * @see https://platform.openai.com/docs/api-reference/responses
	 */
	toOpenAIResponses(options: { strict?: boolean } = {}): OpenAIResponsesFunctionTool {
		const { strict = true } = options;
		return {
			type: 'function',
			name: this.name,
			description: this.description,
			strict,
			parameters: {
				...this.toJsonSchema(),
				...(strict ? { additionalProperties: false } : {}),
			},
		};
	}

	/**
	 * Convert the tool to AI SDK format
	 */
	async toAISDK(
		options: { executable?: boolean; execution?: ToolExecution | false } = {
			executable: true,
		},
	): Promise<AISDKToolResult> {
		const schema = {
			...this.toJsonSchema(),
			additionalProperties: false,
		} satisfies AISDKJSONSchema;

		/** AI SDK is optional dependency, import only when needed */
		const ai = await tryImport<typeof import('ai')>(
			'ai',
			`npm install ai (requires ${peerDependencies.ai})`,
		);
		const schemaObject = ai.jsonSchema(schema);

		const executionOption =
			options.execution !== undefined
				? options.execution
				: this.#exposeExecutionMetadata
					? this.createExecutionMetadata()
					: false;

		const toolDefinition = {
			inputSchema: schemaObject,
			description: this.description,
			execution: executionOption !== false ? executionOption : undefined,
			execute:
				(options.executable ?? true)
					? async (args: Record<string, unknown>) => {
							try {
								return await this.execute(args as JsonObject);
							} catch (error) {
								return `Error executing tool: ${
									error instanceof Error ? error.message : String(error)
								}`;
							}
						}
					: undefined,
		} satisfies AISDKToolDefinition;

		return {
			[this.name]: toolDefinition,
		} satisfies AISDKToolResult;
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
	 * Convert all tools to pure JSON Schema format
	 * Returns an array of objects with name, description, and schema
	 */
	toJsonSchema(): Array<{ name: string; description: string; parameters: JSONSchema }> {
		return this.tools.map((tool) => ({
			name: tool.name,
			description: tool.description,
			parameters: tool.toJsonSchema(),
		}));
	}

	/**
	 * Convert all tools to OpenAI Chat Completions API format
	 */
	toOpenAI(): ChatCompletionFunctionTool[] {
		return this.tools.map((tool) => tool.toOpenAI());
	}

	/**
	 * Convert all tools to Anthropic format
	 * @see https://docs.anthropic.com/en/docs/build-with-claude/tool-use
	 */
	toAnthropic(): AnthropicTool[] {
		return this.tools.map((tool) => tool.toAnthropic());
	}

	/**
	 * Convert all tools to OpenAI Responses API format
	 * @see https://platform.openai.com/docs/api-reference/responses
	 */
	toOpenAIResponses(options: { strict?: boolean } = {}): OpenAIResponsesFunctionTool[] {
		return this.tools.map((tool) => tool.toOpenAIResponses(options));
	}

	/**
	 * Convert all tools to AI SDK format
	 */
	async toAISDK(
		options: { executable?: boolean; execution?: ToolExecution | false } = {
			executable: true,
		},
	): Promise<AISDKToolResult> {
		const result: AISDKToolResult = {};
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
		// Extract integration from tool name (e.g., 'bamboohr_create_employee' -> 'bamboohr')
		const parts = tool.name.split('_');
		const integration = parts[0];

		// Extract action type
		const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search'];
		const actions = parts.filter((p) => actionTypes.includes(p));

		// Build text corpus for TF-IDF (similar weighting strategy as in tool-calling-evals)
		const text = [
			`${tool.name} ${tool.name} ${tool.name}`, // boost name
			`${integration} ${actions.join(' ')}`,
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
			integration: 'string' as const,
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
		// Extract integration from tool name (e.g., 'bamboohr_create_employee' -> 'bamboohr')
		const parts = tool.name.split('_');
		const integration = parts[0];

		// Extract action type
		const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search'];
		const actions = parts.filter((p) => actionTypes.includes(p));

		await orama.insert(oramaDb, {
			name: tool.name,
			description: tool.description,
			integration: integration,
			tags: [...parts, ...actions],
		});
	}

	return oramaDb;
}

function metaSearchTools(
	oramaDb: OramaDb,
	tfidfIndex: TfidfIndex,
	allTools: BaseTool[],
	hybridAlpha = DEFAULT_HYBRID_ALPHA,
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
	tool.execute = async (inputParams?: JsonObject | string): Promise<JsonObject> => {
		try {
			// Validate params is either undefined, string, or object
			if (
				inputParams !== undefined &&
				typeof inputParams !== 'string' &&
				typeof inputParams !== 'object'
			) {
				throw new StackOneError(
					`Invalid parameters type. Expected object or string, got ${typeof inputParams}. Parameters: ${JSON.stringify(
						inputParams,
					)}`,
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
					...scoreMap.get(doc.name),
					bm25: clamp01(hit.score),
				});
			}

			for (const r of tfidfResults) {
				scoreMap.set(r.id, {
					...scoreMap.get(r.id),
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

					return {
						name: tool.name,
						description: tool.description,
						parameters: tool.parameters,
						score: r.score,
					};
				})
				.filter((t): t is MetaToolSearchResult => t !== null)
				.slice(0, limit);

			// Convert to JSON-serialisable format (removes undefined values)
			return JSON.parse(JSON.stringify({ tools: toolConfigs })) satisfies JsonObject;
		} catch (error) {
			if (error instanceof StackOneError) {
				throw error;
			}
			throw new StackOneError(
				`Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
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

function metaExecuteTool(tools: Tools): BaseTool {
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
		inputParams?: JsonObject | string,
		options?: ExecuteOptions,
	): Promise<JsonObject> => {
		try {
			// Validate params is either undefined, string, or object
			if (
				inputParams !== undefined &&
				typeof inputParams !== 'string' &&
				typeof inputParams !== 'object'
			) {
				throw new StackOneError(
					`Invalid parameters type. Expected object or string, got ${typeof inputParams}. Parameters: ${JSON.stringify(
						inputParams,
					)}`,
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
				`Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	};
	return tool;
}
