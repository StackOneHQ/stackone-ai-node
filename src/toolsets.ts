import { defu } from 'defu';
import type { MergeExclusive, SimplifyDeep } from 'type-fest';
import { z } from 'zod/v4';
import { DEFAULT_BASE_URL } from './consts';
import { createFeedbackTool } from './feedback';
import { type StackOneHeaders, normalizeHeaders, stackOneHeadersSchema } from './headers';
import { ToolIndex } from './local-search';
import { createMCPClient } from './mcp-client';
import { type RpcActionResponse, RpcClient } from './rpc-client';
import {
	SemanticSearchClient,
	SemanticSearchError,
	type SemanticSearchResult,
} from './semantic-search';
import { BaseTool, Tools } from './tool';
import type {
	DefenderConfig,
	ExecuteOptions,
	JsonObject,
	JsonSchemaProperties,
	LocalExecuteConfig,
	RpcExecuteConfig,
	SearchConfig,
	ToolParameters,
} from './types';
import { StackOneError } from './utils/error-stackone';
import { StackOneAPIError } from './utils/error-stackone-api';
import { normalizeActionName } from './utils/normalize';

/**
 * Converts RpcActionResponse to JsonObject in a type-safe manner.
 * RpcActionResponse uses z.passthrough() which preserves additional fields,
 * making it structurally compatible with Record<string, JsonValue>.
 */
function rpcResponseToJsonObject(response: RpcActionResponse): JsonObject {
	// RpcActionResponse with passthrough() has the shape:
	// { next?: string | null, data?: ..., [key: string]: unknown }
	// We extract all properties into a plain object
	const result: JsonObject = {};
	for (const [key, value] of Object.entries(response)) {
		result[key] = value as JsonObject[string];
	}
	return result;
}

type ToolInputSchema = Awaited<
	ReturnType<Awaited<ReturnType<typeof createMCPClient>>['client']['listTools']>
>['tools'][number]['inputSchema'];

/**
 * Base exception for toolset errors
 */
export class ToolSetError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ToolSetError';
	}
}

/**
 * Raised when there is an error in the toolset configuration
 */
export class ToolSetConfigError extends ToolSetError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ToolSetConfigError';
	}
}

/**
 * Raised when there is an error loading tools
 */
export class ToolSetLoadError extends ToolSetError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ToolSetLoadError';
	}
}

/**
 * Authentication configuration for toolsets
 */
export interface AuthenticationConfig {
	type: 'basic' | 'bearer';
	credentials?: {
		username?: string;
		password?: string;
		token?: string;
	};
	headers?: Record<string, string>;
}

/**
 * Base configuration for all toolsets
 */
export interface BaseToolSetConfig {
	baseUrl?: string;
	authentication?: AuthenticationConfig;
	headers?: Record<string, string>;
	rpcClient?: RpcClient;
	/** Request timeout in milliseconds. Default: 60000 (60s). */
	timeout?: number;
}

/**
 * Configuration with a single account ID
 */
interface SingleAccountConfig {
	/**
	 * Single account ID for StackOne API operations
	 * Use this when working with a single account
	 */
	accountId: string;
}

/**
 * Configuration with multiple account IDs
 */
interface MultipleAccountsConfig {
	/**
	 * Array of account IDs for filtering tools across multiple accounts
	 * When provided, tools will be fetched for all specified accounts
	 * @example ['account-1', 'account-2']
	 */
	accountIds: string[];
}

/**
 * Account configuration options - either single accountId or multiple accountIds, but not both
 */
type AccountConfig = SimplifyDeep<MergeExclusive<SingleAccountConfig, MultipleAccountsConfig>>;

/**
 * Execution configuration for the StackOneToolSet constructor.
 * Controls default account scoping for tool execution in tools.
 */
export interface ExecuteToolsConfig {
	/** Account IDs to scope tool discovery and execution. */
	accountIds?: string[];
	/** Request timeout in milliseconds. Can also be set as a top-level config param which takes precedence. */
	timeout?: number;
}

/**
 * Base configuration for StackOne toolset (without account options)
 */
interface StackOneToolSetBaseConfig extends BaseToolSetConfig {
	apiKey?: string;
	strict?: boolean;
	/**
	 * Search configuration. Controls default search behavior for `searchTools()`,
	 * `getSearchTool()`, and `searchActionNames()`.
	 *
	 * - Omit or pass `undefined` → search disabled (`null`)
	 * - Pass `null` → search disabled
	 * - Pass `{}` or `{ method: 'auto' }` → search enabled with defaults
	 * - Pass `{ method, topK, minSimilarity }` → search enabled with custom defaults
	 *
	 * Per-call options always override these defaults.
	 */
	search?: SearchConfig | null;
	/**
	 * Execution configuration. Controls default account scoping for tool execution.
	 * Pass `{ accountIds: ['acc-1'] }` to scope tools to specific accounts.
	 */
	execute?: ExecuteToolsConfig;
	/**
	 * Defender configuration. Controls prompt injection detection behavior.
	 *
	 * Currently only `enabled` is applied per-request (mapped to `defender_enabled` in the RPC
	 * payload). The other fields (`blockHighRisk`, `useTier1Classification`,
	 * `useTier2Classification`) are defined for forward compatibility and have no effect until
	 * the backend exposes them as per-request options.
	 *
	 * - Omit or pass `undefined` → uses the project defender settings
	 */
	defender?: DefenderConfig;
}

/**
 * Configuration for StackOne toolset
 * Accepts either accountId (single) or accountIds (multiple), but not both
 */
export type StackOneToolSetConfig = StackOneToolSetBaseConfig & Partial<AccountConfig>;

/**
 * Options for filtering tools when fetching from MCP
 */
interface FetchToolsOptions {
	/**
	 * Filter tools by account IDs
	 * Only tools available on these accounts will be returned
	 */
	accountIds?: string[];

	/**
	 * Filter tools by provider names
	 * Only tools from these providers will be returned
	 * @example ['hibob', 'bamboohr']
	 */
	providers?: string[];

	/**
	 * Filter tools by action patterns with glob support
	 * Only tools matching these patterns will be returned
	 * @example ['*_list_employees', 'hibob_create_employees']
	 */
	actions?: string[];
}

/**
 * Search mode for tool discovery.
 *
 * - `"auto"` (default): try semantic search first, fall back to local BM25+TF-IDF if the API is unavailable
 * - `"semantic"`: use only the semantic search API; throws SemanticSearchError on failure
 * - `"local"`: use only local BM25+TF-IDF search (no API call to the semantic search endpoint)
 */
export type SearchMode = 'auto' | 'semantic' | 'local';

/**
 * Options for searchTools() and SearchTool
 */
export interface SearchToolsOptions {
	/** Optional provider/connector filter (e.g., "bamboohr", "slack") */
	connector?: string;
	/** Maximum number of tools to return */
	topK?: number;
	/** Minimum similarity score threshold 0-1 */
	minSimilarity?: number;
	/** Optional account IDs (uses setAccounts() if not provided) */
	accountIds?: string[];
	/** Search backend to use */
	search?: SearchMode;
}

/**
 * Options for searchActionNames()
 */
export interface SearchActionNamesOptions {
	/** Optional provider/connector filter */
	connector?: string;
	/** Optional account IDs to scope results */
	accountIds?: string[];
	/** Maximum number of results */
	topK?: number;
	/** Minimum similarity score threshold 0-1 */
	minSimilarity?: number;
}

/**
 * Callable search tool that wraps StackOneToolSet.searchTools().
 *
 * Designed for agent loops — call `search()` with a query to get Tools back.
 *
 * @example
 * ```typescript
 * const toolset = new StackOneToolSet({ apiKey: 'sk-xxx' });
 * const searchTool = toolset.getSearchTool();
 * const tools = await searchTool.search('manage employee records', { accountIds: ['acc-123'] });
 * ```
 */
export class SearchTool {
	private readonly toolset: StackOneToolSet;
	private readonly defaultConfig: SearchConfig;

	constructor(toolset: StackOneToolSet, config: SearchConfig = {}) {
		this.toolset = toolset;
		this.defaultConfig = config;
	}

	/**
	 * Search for tools using natural language.
	 *
	 * @param query - Natural language description of needed functionality
	 * @param options - Search options (connector, topK, minSimilarity, accountIds, search).
	 *   Per-call options override the defaults from the constructor config.
	 * @returns Tools collection with matched tools
	 */
	async search(query: string, options?: SearchToolsOptions): Promise<Tools> {
		return this.toolset.searchTools(query, {
			...options,
			search: options?.search ?? this.defaultConfig.method,
			topK: options?.topK ?? this.defaultConfig.topK,
			minSimilarity: options?.minSimilarity ?? this.defaultConfig.minSimilarity,
		});
	}
}

// --- Internal tool_search + tool_execute ---

const searchInputSchema = z.object({
	query: z
		.string()
		.transform((v) => v.trim())
		.refine((v) => v.length > 0, { message: 'query must be a non-empty string' }),
	connector: z.string().optional(),
	top_k: z.number().int().min(1).max(50).optional(),
});

const searchParameters = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
			description:
				'Natural language description of what you need (e.g. "create an employee", "list time off requests")',
		},
		connector: {
			type: 'string',
			description: 'Optional connector filter (e.g. "bamboohr", "hibob")',
		},
		top_k: {
			type: 'integer',
			description: 'Max results to return (1-50, default 5)',
			minimum: 1,
			maximum: 50,
		},
	},
	required: ['query'],
} as const satisfies ToolParameters;

const executeInputSchema = z.object({
	tool_name: z
		.string()
		.transform((v) => v.trim())
		.refine((v) => v.length > 0, { message: 'tool_name must be a non-empty string' }),
	parameters: z.record(z.string(), z.unknown()).optional().default({}),
});

const executeParameters = {
	type: 'object',
	properties: {
		tool_name: {
			type: 'string',
			description: 'Exact tool name from tool_search results',
		},
		parameters: {
			type: 'object',
			description: 'Parameters for the tool. Pass an empty object {} if no parameters are needed.',
		},
	},
	required: ['tool_name'],
} as const satisfies ToolParameters;

const localConfig = (id: string): LocalExecuteConfig => ({
	kind: 'local',
	identifier: `meta:${id}`,
});

/** @internal */
export function createSearchTool(
	toolset: StackOneToolSet,
	accountIds?: string[],
	connectors?: string,
): BaseTool {
	const connectorLine = connectors ? ` Available connectors: ${connectors}.` : '';
	const tool = new BaseTool(
		'tool_search',
		`Search for available tools by describing what you need. Returns matching tool names, descriptions, and parameter schemas. Use the returned parameter schemas to know exactly what to pass when calling tool_execute.${connectorLine}`,
		searchParameters,
		localConfig('search'),
	);

	tool.execute = async (inputParams?: JsonObject | string): Promise<JsonObject> => {
		try {
			const raw = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
			const parsed = searchInputSchema.parse(raw);

			const searchConfig = toolset.getSearchConfig() ?? {};
			const results = await toolset.searchTools(parsed.query, {
				connector: parsed.connector,
				topK: parsed.top_k ?? searchConfig.topK,
				minSimilarity: searchConfig.minSimilarity,
				search: searchConfig.method,
				accountIds,
			});

			return {
				tools: results.toArray().map((t) => ({
					name: t.name,
					description: t.description,
					parameters: t.parameters.properties as unknown as JsonObject,
				})),
				total: results.length,
				query: parsed.query,
			};
		} catch (error) {
			if (error instanceof StackOneAPIError) {
				return { error: error.message, status_code: error.statusCode };
			}
			if (error instanceof SyntaxError || error instanceof z.ZodError) {
				return {
					error: `Invalid input: ${error instanceof z.ZodError ? error.issues.map((i) => i.message).join(', ') : error.message}`,
				};
			}
			throw error;
		}
	};

	return tool;
}

/** @internal */
export function createExecuteTool(
	toolset: StackOneToolSet,
	accountIds?: string[],
	connectors?: string,
): BaseTool {
	let cachedTools: Awaited<ReturnType<typeof toolset.fetchTools>> | null = null;

	const connectorLine = connectors ? ` Available connectors: ${connectors}.` : '';
	const tool = new BaseTool(
		'tool_execute',
		`Execute a tool by name with the given parameters. Use tool_search first to find available tools. The parameters field must match the parameter schema returned by tool_search. Pass parameters as a nested object matching the schema structure.${connectorLine}`,
		executeParameters,
		localConfig('execute'),
	);

	tool.execute = async (
		inputParams?: JsonObject | string,
		executeOptions?: ExecuteOptions,
	): Promise<JsonObject> => {
		let toolName = 'unknown';
		try {
			const raw = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams || {};
			const parsed = executeInputSchema.parse(raw);
			toolName = parsed.tool_name;

			if (!cachedTools) {
				cachedTools = await toolset.fetchTools({ accountIds });
			}
			const target = cachedTools.getTool(parsed.tool_name);

			if (!target) {
				return {
					error: `Tool "${parsed.tool_name}" not found. Use tool_search to find available tools.`,
				};
			}

			return await target.execute(parsed.parameters as JsonObject, executeOptions);
		} catch (error) {
			if (error instanceof StackOneAPIError) {
				return {
					error: error.message,
					status_code: error.statusCode,
					response_body: error.responseBody as JsonObject,
					tool_name: toolName,
				};
			}
			if (error instanceof SyntaxError || error instanceof z.ZodError) {
				return {
					error: `Invalid input: ${error instanceof z.ZodError ? error.issues.map((i) => i.message).join(', ') : error.message}`,
					tool_name: toolName,
				};
			}
			throw error;
		}
	};

	return tool;
}

/**
 * Class for loading StackOne tools via MCP
 */
export class StackOneToolSet {
	private baseUrl?: string;
	private authentication?: AuthenticationConfig;
	private headers: Record<string, string>;
	private rpcClient?: RpcClient;
	private readonly timeout: number;
	private readonly searchConfig: SearchConfig | null;
	private readonly executeConfig: ExecuteToolsConfig | undefined;
	private readonly defenderConfig?: DefenderConfig;

	/**
	 * Account ID for StackOne API
	 */
	private accountId?: string;
	private accountIds: string[] = [];

	/**
	 * Initialize StackOne toolset with API key and optional account ID(s)
	 * @param config Configuration object containing API key and optional account ID(s)
	 */
	constructor(config?: StackOneToolSetConfig) {
		// Validate mutually exclusive account options
		if (config?.accountId != null && config?.accountIds != null) {
			throw new ToolSetConfigError(
				'Cannot provide both accountId and accountIds. Use accountId for a single account or accountIds for multiple accounts.',
			);
		}

		const apiKey = config?.apiKey || process.env.STACKONE_API_KEY;

		if (!apiKey && config?.strict) {
			throw new ToolSetConfigError(
				'No API key provided. Set STACKONE_API_KEY environment variable or pass apiKey in config.',
			);
		}

		if (!apiKey) {
			console.warn(
				'No API key provided. Set STACKONE_API_KEY environment variable or pass apiKey in config.',
			);
		}

		const authentication: AuthenticationConfig = {
			type: 'basic',
			credentials: {
				username: apiKey || '',
				password: '',
			},
		};

		const accountId = config?.accountId || process.env.STACKONE_ACCOUNT_ID;

		const configHeaders = {
			...config?.headers,
			...(accountId ? { 'x-account-id': accountId } : {}),
		};

		// Initialize base properties
		this.baseUrl = config?.baseUrl ?? process.env.STACKONE_BASE_URL ?? DEFAULT_BASE_URL;
		this.authentication = authentication;
		this.headers = configHeaders;
		this.rpcClient = config?.rpcClient;
		this.timeout = config?.timeout ?? config?.execute?.timeout ?? 60_000;
		this.accountId = accountId;
		this.accountIds = config?.accountIds ?? [];

		// Resolve search config: undefined/null → disabled, object → custom with defaults
		this.searchConfig = config?.search != null ? { method: 'auto', ...config.search } : null;
		this.executeConfig = config?.execute;

		this.defenderConfig = config?.defender;

		// Set Authentication headers if provided
		if (this.authentication) {
			// Only set auth headers if they don't already exist in custom headers
			const needsAuthHeader = !('Authorization' in this.headers);

			if (needsAuthHeader) {
				switch (this.authentication.type) {
					case 'basic':
						if (this.authentication.credentials?.username) {
							const username = this.authentication.credentials.username;
							const password = this.authentication.credentials.password || '';
							const authString = Buffer.from(`${username}:${password}`).toString('base64');
							this.headers.Authorization = `Basic ${authString}`;
						}
						break;
					case 'bearer':
						if (this.authentication.credentials?.token) {
							this.headers.Authorization = `Bearer ${this.authentication.credentials.token}`;
						}
						break;

					default:
						this.authentication.type satisfies never;
						throw new ToolSetError(
							`Unsupported authentication type: ${String(this.authentication.type)}`,
						);
				}
			}

			// Add any additional headers from authentication config, but don't override existing ones
			if (this.authentication.headers) {
				this.headers = { ...this.authentication.headers, ...this.headers };
			}
		}
	}

	private semanticSearchClient?: SemanticSearchClient;

	/**
	 * Set account IDs for filtering tools
	 * @param accountIds Array of account IDs to filter tools by
	 * @returns This toolset instance for chaining
	 */
	setAccounts(accountIds: string[]): this {
		this.accountIds = accountIds;
		return this;
	}

	/**
	 * Get or lazily create the semantic search client.
	 */
	private getSemanticClient(): SemanticSearchClient {
		if (!this.semanticSearchClient) {
			const apiKey = this.getApiKey();
			this.semanticSearchClient = new SemanticSearchClient({
				apiKey,
				baseUrl: this.baseUrl,
			});
		}
		return this.semanticSearchClient;
	}

	/**
	 * Get the current search config.
	 */
	getSearchConfig(): SearchConfig | null {
		return this.searchConfig;
	}

	/**
	 * Extract the API key from authentication config.
	 */
	private getApiKey(): string {
		const credentials = this.authentication?.credentials ?? {};
		const apiKeyFromAuth =
			this.authentication?.type === 'basic'
				? credentials.username
				: this.authentication?.type === 'bearer'
					? credentials.token
					: credentials.username;

		const apiKey = apiKeyFromAuth || process.env.STACKONE_API_KEY;
		if (!apiKey) {
			throw new ToolSetConfigError(
				'API key is required for semantic search. Provide apiKey in config or set STACKONE_API_KEY environment variable.',
			);
		}
		return apiKey;
	}

	/**
	 * Get a callable search tool that returns Tools collections.
	 *
	 * Returns a SearchTool instance that wraps `searchTools()` for use in agent loops.
	 *
	 * @param options - Options including the default search mode
	 * @returns SearchTool instance
	 *
	 * @example
	 * ```typescript
	 * const toolset = new StackOneToolSet({ apiKey: 'sk-xxx' });
	 * const searchTool = toolset.getSearchTool();
	 * const tools = await searchTool.search('manage employee records', { accountIds: ['acc-123'] });
	 * ```
	 */
	getSearchTool(options?: { search?: SearchMode }): SearchTool {
		if (this.searchConfig === null) {
			throw new ToolSetConfigError(
				'Search is disabled. Initialize StackOneToolSet with a search config to enable.',
			);
		}

		const config: SearchConfig = options?.search
			? { ...this.searchConfig, method: options.search }
			: this.searchConfig;

		return new SearchTool(this, config);
	}

	/**
	 * Get tool_search + tool_execute for agent-driven discovery.
	 *
	 * Returns a Tools collection with two tools that let the LLM
	 * discover and execute tools on-demand.
	 *
	 * @param options - Options to scope tool discovery
	 * @returns Tools collection containing tool_search and tool_execute
	 */
	getTools(options?: { accountIds?: string[] }): Tools {
		const accountIds =
			options?.accountIds ??
			this.executeConfig?.accountIds ??
			(this.accountIds.length > 0 ? this.accountIds : undefined);
		return this.buildTools(accountIds);
	}

	/**
	 * Build tool_search + tool_execute tools scoped to this toolset.
	 */
	private buildTools(accountIds?: string[], connectors?: string): Tools {
		if (this.searchConfig === null) {
			throw new ToolSetConfigError(
				'Search is disabled. Initialize StackOneToolSet with a search config to enable.',
			);
		}

		const searchTool = createSearchTool(this, accountIds, connectors);
		const executeTool = createExecuteTool(this, accountIds, connectors);
		return new Tools([searchTool, executeTool]);
	}

	/**
	 * Get tools in OpenAI function calling format.
	 *
	 * @param options - Options
	 * @param options.mode - Tool mode.
	 *   `undefined` (default): fetch all tools and convert to OpenAI format.
	 *   `"search_and_execute"`: return two tools (tool_search + tool_execute)
	 *   that let the LLM discover and execute tools on-demand.
	 * @param options.accountIds - Account IDs to scope tools. Overrides the `execute`
	 *   config from the constructor.
	 * @returns List of tool definitions in OpenAI function format.
	 *
	 * @example
	 * ```typescript
	 * // All tools
	 * const toolset = new StackOneToolSet();
	 * const tools = await toolset.openai();
	 *
	 * // Search and execute for agent-driven discovery
	 * const toolset = new StackOneToolSet({ search: {} });
	 * const tools = await toolset.openai({ mode: 'search_and_execute' });
	 * ```
	 */
	async openai(options?: {
		mode?: 'search_and_execute';
		accountIds?: string[];
	}): Promise<ReturnType<Tools['toOpenAI']>> {
		const effectiveAccountIds = options?.accountIds ?? this.executeConfig?.accountIds;

		if (options?.mode === 'search_and_execute') {
			// Discover available connectors for dynamic descriptions
			let connectors: string | undefined;
			try {
				const allTools = await this.fetchTools({ accountIds: effectiveAccountIds });
				const connectorSet = allTools.getConnectors();
				if (connectorSet.size > 0) {
					connectors = Array.from(connectorSet).sort().join(', ');
				}
			} catch {
				// Best-effort: if discovery fails, use generic descriptions
			}
			return this.buildTools(effectiveAccountIds, connectors).toOpenAI();
		}

		const tools = await this.fetchTools({ accountIds: effectiveAccountIds });
		return tools.toOpenAI();
	}

	/**
	 * Search for and fetch tools using semantic or local search.
	 *
	 * This method discovers relevant tools based on natural language queries.
	 *
	 * @param query - Natural language description of needed functionality
	 *   (e.g., "create employee", "send a message")
	 * @param options - Search options
	 * @returns Tools collection with matched tools from linked accounts
	 * @throws SemanticSearchError if the API call fails and search is "semantic"
	 *
	 * @example
	 * ```typescript
	 * // Semantic search (default with local fallback)
	 * const tools = await toolset.searchTools('manage employee records', { topK: 5 });
	 *
	 * // Explicit semantic search
	 * const tools = await toolset.searchTools('manage employees', { search: 'semantic' });
	 *
	 * // Local BM25+TF-IDF search
	 * const tools = await toolset.searchTools('manage employees', { search: 'local' });
	 *
	 * // Filter by connector
	 * const tools = await toolset.searchTools('create time off request', {
	 *   connector: 'bamboohr',
	 *   search: 'semantic',
	 * });
	 * ```
	 */
	async searchTools(query: string, options?: SearchToolsOptions): Promise<Tools> {
		if (this.searchConfig === null) {
			throw new ToolSetConfigError(
				'Search is disabled. Initialize StackOneToolSet with a search config to enable.',
			);
		}

		const search = options?.search ?? this.searchConfig.method ?? 'auto';
		const topK = options?.topK ?? this.searchConfig.topK;
		const minSimilarity = options?.minSimilarity ?? this.searchConfig.minSimilarity;
		const mergedOptions = { ...options, search, topK, minSimilarity };

		const allTools = await this.fetchTools({ accountIds: mergedOptions.accountIds });
		const availableConnectors = allTools.getConnectors();

		if (availableConnectors.size === 0) {
			return new Tools([]);
		}

		// Local-only search — skip semantic API entirely
		if (search === 'local') {
			return this.localSearch(query, allTools, mergedOptions);
		}

		try {
			// Determine which connectors to search
			let connectorsToSearch: Set<string>;
			if (mergedOptions.connector) {
				const connectorLower = mergedOptions.connector.toLowerCase();
				connectorsToSearch = availableConnectors.has(connectorLower)
					? new Set([connectorLower])
					: new Set();
				if (connectorsToSearch.size === 0) {
					return new Tools([]);
				}
			} else {
				connectorsToSearch = availableConnectors;
			}

			// Search each connector in parallel — in auto mode, treat missing
			// API key as "semantic unavailable" and fall back to local search.
			let client: SemanticSearchClient;
			try {
				client = this.getSemanticClient();
			} catch (error) {
				if (search === 'auto' && error instanceof ToolSetConfigError) {
					return this.localSearch(query, allTools, mergedOptions);
				}
				throw error;
			}
			const allResults: SemanticSearchResult[] = [];
			let lastError: SemanticSearchError | undefined;

			const searchPromises = [...connectorsToSearch].map(async (connector) => {
				try {
					const response = await client.search(query, {
						connector,
						topK: mergedOptions.topK,
						minSimilarity: mergedOptions.minSimilarity,
					});
					return response.results;
				} catch (error) {
					if (error instanceof SemanticSearchError) {
						lastError = error;
						return [];
					}
					throw error;
				}
			});

			const resultArrays = await Promise.all(searchPromises);
			for (const results of resultArrays) {
				allResults.push(...results);
			}

			// If ALL connector searches failed, re-raise to trigger fallback
			if (allResults.length === 0 && lastError) {
				throw lastError;
			}

			// Sort by score, apply topK
			allResults.sort((a, b) => b.similarityScore - a.similarityScore);
			const topResults =
				mergedOptions.topK != null ? allResults.slice(0, mergedOptions.topK) : allResults;

			if (topResults.length === 0) {
				return new Tools([]);
			}

			// 1. Parse composite IDs to MCP-format action names, deduplicate
			const seenNames = new Set<string>();
			const actionNames: string[] = [];
			for (const result of topResults) {
				const name = normalizeActionName(result.id);
				if (seenNames.has(name)) {
					continue;
				}
				seenNames.add(name);
				actionNames.push(name);
			}

			if (actionNames.length === 0) {
				return new Tools([]);
			}

			// 2. Use MCP tools (already fetched) — schemas come from the source of truth
			// 3. Filter to only the tools search found, preserving search relevance order
			const actionOrder = new Map(actionNames.map((name, i) => [name, i]));
			const matchedTools = allTools.toArray().filter((t) => seenNames.has(t.name));
			matchedTools.sort(
				(a, b) =>
					(actionOrder.get(a.name) ?? Number.POSITIVE_INFINITY) -
					(actionOrder.get(b.name) ?? Number.POSITIVE_INFINITY),
			);

			// Auto mode: if semantic returned results but none matched MCP tools, fall back to local
			if (search === 'auto' && matchedTools.length === 0) {
				return this.localSearch(query, allTools, mergedOptions);
			}

			return new Tools(matchedTools);
		} catch (error) {
			if (error instanceof SemanticSearchError) {
				if (search === 'semantic') {
					throw error;
				}

				// Auto mode: silently fall back to local search
				return this.localSearch(query, allTools, mergedOptions);
			}
			throw error;
		}
	}

	/**
	 * Search for action names without fetching tools.
	 *
	 * Useful when you need to inspect search results before fetching,
	 * or when building custom filtering logic.
	 *
	 * @param query - Natural language description of needed functionality
	 * @param options - Search options
	 * @returns List of SemanticSearchResult with action names, scores, and metadata
	 *
	 * @example
	 * ```typescript
	 * // Lightweight: inspect results before fetching
	 * const results = await toolset.searchActionNames('manage employees');
	 * for (const r of results) {
	 *   console.log(`${r.id}: ${r.similarityScore.toFixed(2)}`);
	 * }
	 *
	 * // Then fetch specific high-scoring actions
	 * const selected = results
	 *   .filter(r => r.similarityScore > 0.7)
	 *   .map(r => r.id);
	 * const tools = await toolset.fetchTools({ actions: selected });
	 * ```
	 */
	async searchActionNames(
		query: string,
		options?: SearchActionNamesOptions,
	): Promise<SemanticSearchResult[]> {
		if (this.searchConfig === null) {
			throw new ToolSetConfigError(
				'Search is disabled. Initialize StackOneToolSet with a search config to enable.',
			);
		}

		const effectiveTopK = options?.topK ?? this.searchConfig.topK;
		const effectiveMinSimilarity = options?.minSimilarity ?? this.searchConfig.minSimilarity;

		// Resolve available connectors from account IDs
		let availableConnectors: Set<string> | undefined;
		const effectiveAccountIds = options?.accountIds || this.accountIds;
		if (effectiveAccountIds.length > 0) {
			const allTools = await this.fetchTools({ accountIds: effectiveAccountIds });
			availableConnectors = allTools.getConnectors();
			if (availableConnectors.size === 0) {
				return [];
			}
		}

		try {
			const client = this.getSemanticClient();
			let allResults: SemanticSearchResult[] = [];

			if (availableConnectors) {
				// Parallel per-connector search (only user's connectors)
				let connectorsToSearch: Set<string>;
				if (options?.connector) {
					const connectorLower = options.connector.toLowerCase();
					connectorsToSearch = availableConnectors.has(connectorLower)
						? new Set([connectorLower])
						: new Set();
				} else {
					connectorsToSearch = availableConnectors;
				}

				const searchPromises = [...connectorsToSearch].map(async (connector) => {
					try {
						const response = await client.search(query, {
							connector,
							topK: effectiveTopK,
							minSimilarity: effectiveMinSimilarity,
						});
						return response.results;
					} catch {
						return [];
					}
				});

				const resultArrays = await Promise.all(searchPromises);
				for (const results of resultArrays) {
					allResults.push(...results);
				}
			} else {
				// No account filtering — single global search
				const response = await client.search(query, {
					connector: options?.connector,
					topK: effectiveTopK,
					minSimilarity: effectiveMinSimilarity,
				});
				allResults = response.results;
			}

			// Sort by score — return raw results (consumers can normalize the composite ID if needed)
			allResults.sort((a, b) => b.similarityScore - a.similarityScore);

			return effectiveTopK != null ? allResults.slice(0, effectiveTopK) : allResults;
		} catch (error) {
			if (error instanceof SemanticSearchError) {
				return [];
			}
			throw error;
		}
	}

	/**
	 * Run local BM25+TF-IDF search over already-fetched tools.
	 */
	private async localSearch(
		query: string,
		allTools: Tools,
		options?: Pick<SearchToolsOptions, 'connector' | 'topK' | 'minSimilarity'>,
	): Promise<Tools> {
		const availableConnectors = allTools.getConnectors();
		if (availableConnectors.size === 0) {
			return new Tools([]);
		}

		const index = new ToolIndex(allTools.toArray());
		const results = await index.search(query, options?.topK ?? 5, options?.minSimilarity ?? 0.0);

		const matchedNames = results.map((r) => r.name);
		const toolMap = new Map(allTools.toArray().map((t) => [t.name, t]));
		const filterConnectors = options?.connector
			? new Set([options.connector.toLowerCase()])
			: availableConnectors;

		const matchedTools = matchedNames
			.filter((name) => toolMap.has(name))
			.map((name) => toolMap.get(name)!)
			.filter((tool) => tool.connector && filterConnectors.has(tool.connector));

		return new Tools(options?.topK != null ? matchedTools.slice(0, options.topK) : matchedTools);
	}

	/**
	 * Fetch tools from MCP with optional filtering
	 * @param options Optional filtering options for account IDs, providers, and actions
	 * @returns Collection of tools matching the filter criteria
	 */
	async fetchTools(options?: FetchToolsOptions): Promise<Tools> {
		// Use account IDs from options, or fall back to instance state
		const effectiveAccountIds = options?.accountIds || this.accountIds;

		// Fetch tools (with account filtering if needed)
		let tools: Tools;
		if (effectiveAccountIds.length > 0) {
			const toolsPromises = effectiveAccountIds.map(async (accountId) => {
				const headers = { 'x-account-id': accountId };
				const mergedHeaders = { ...this.headers, ...headers };

				// Create a temporary toolset instance with the account-specific headers
				const tempHeaders = mergedHeaders;
				const originalHeaders = this.headers;
				this.headers = tempHeaders;

				try {
					const tools = await this.fetchToolsFromMcp();
					return tools.toArray();
				} finally {
					// Restore original headers
					this.headers = originalHeaders;
				}
			});

			const toolArrays = await Promise.all(toolsPromises);
			const allTools = toolArrays.flat();
			tools = new Tools(allTools);
		} else {
			// No account filtering - fetch all tools
			tools = await this.fetchToolsFromMcp();
		}

		// Apply provider and action filters
		const filteredTools = this.filterTools(tools, options);

		// Add feedback tool
		const feedbackTool = createFeedbackTool(undefined, this.accountId, this.baseUrl);
		const toolsWithFeedback = new Tools([...filteredTools.toArray(), feedbackTool]);

		return toolsWithFeedback;
	}

	/**
	 * Fetch tool definitions from MCP
	 */
	private async fetchToolsFromMcp(): Promise<Tools> {
		if (!this.baseUrl) {
			throw new ToolSetConfigError('baseUrl is required to fetch MCP tools');
		}

		await using clients = await createMCPClient({
			baseUrl: `${this.baseUrl}/mcp`,
			headers: this.headers,
		});

		await clients.client.connect(clients.transport);
		const listToolsResult = await clients.client.listTools();
		const actionsClient = this.getActionsClient();

		const tools = listToolsResult.tools.map(({ name, description, inputSchema }) => {
			return this.createRpcBackedTool({
				actionsClient,
				name,
				description,
				inputSchema,
			});
		});

		return new Tools(tools);
	}

	/**
	 * Filter tools by providers and actions
	 * @param tools Tools collection to filter
	 * @param options Filtering options
	 * @returns Filtered tools collection
	 */
	private filterTools(tools: Tools, options?: FetchToolsOptions): Tools {
		let filteredTools = tools.toArray();

		// Filter by providers if specified
		if (options?.providers && options.providers.length > 0) {
			const providerSet = new Set(options.providers.map((p) => p.toLowerCase()));
			filteredTools = filteredTools.filter((tool) => {
				return tool.connector && providerSet.has(tool.connector);
			});
		}

		// Filter by actions if specified (with glob support)
		if (options?.actions && options.actions.length > 0) {
			filteredTools = filteredTools.filter((tool) =>
				options.actions?.some((pattern) => this.matchGlob(tool.name, pattern)),
			);
		}

		return new Tools(filteredTools);
	}

	/**
	 * Check if a string matches a glob pattern
	 * @param str String to check
	 * @param pattern Glob pattern
	 * @returns True if the string matches the pattern
	 */
	private matchGlob(str: string, pattern: string): boolean {
		// Convert glob pattern to regex
		const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');

		// Create regex with start and end anchors
		const regex = new RegExp(`^${regexPattern}$`);

		// Test if the string matches the pattern
		return regex.test(str);
	}

	private getActionsClient(): RpcClient {
		if (this.rpcClient) {
			return this.rpcClient;
		}

		const credentials = this.authentication?.credentials ?? {};
		const apiKeyFromAuth =
			this.authentication?.type === 'basic'
				? credentials.username
				: this.authentication?.type === 'bearer'
					? credentials.token
					: credentials.username;

		const apiKey = apiKeyFromAuth || process.env.STACKONE_API_KEY;
		const password = this.authentication?.type === 'basic' ? (credentials.password ?? '') : '';

		if (!apiKey) {
			throw new ToolSetConfigError(
				'StackOne API key is required to create an actions client. Provide rpcClient, configure authentication credentials, or set the STACKONE_API_KEY environment variable.',
			);
		}

		this.rpcClient = new RpcClient({
			serverURL: this.baseUrl,
			security: {
				username: apiKey,
				password,
			},
			timeout: this.timeout,
		});

		return this.rpcClient;
	}

	private createRpcBackedTool({
		actionsClient,
		name,
		description,
		inputSchema,
	}: {
		actionsClient: RpcClient;
		name: string;
		description?: string;
		inputSchema: ToolInputSchema;
	}): BaseTool {
		const executeConfig = {
			kind: 'rpc',
			method: 'POST',
			url: `${this.baseUrl}/actions/rpc`,
			payloadKeys: {
				action: 'action',
				body: 'body',
				headers: 'headers',
				path: 'path',
				query: 'query',
			},
		} as const satisfies RpcExecuteConfig; // Mirrors StackOne RPC payload layout so metadata/debug stays in sync.

		const toolParameters = {
			...inputSchema,

			// properties are not well typed in MCP spec
			properties: inputSchema?.properties as JsonSchemaProperties,
		} satisfies ToolParameters;

		const tool = new BaseTool(
			name,
			description ?? '',
			toolParameters,
			executeConfig,
			this.headers,
		).setExposeExecutionMetadata(false);

		tool.execute = async (
			inputParams?: JsonObject | string,
			options?: ExecuteOptions,
		): Promise<JsonObject> => {
			try {
				if (
					inputParams !== undefined &&
					typeof inputParams !== 'object' &&
					typeof inputParams !== 'string'
				) {
					throw new StackOneError(
						`Invalid parameters type. Expected object or string, got ${typeof inputParams}. Parameters: ${JSON.stringify(inputParams)}`,
					);
				}

				const parsedParams =
					typeof inputParams === 'string' ? JSON.parse(inputParams) : (inputParams ?? {});

				const currentHeaders = tool.getHeaders();
				const baseHeaders = this.buildActionHeaders(currentHeaders);

				const pathParams = this.extractRecord(parsedParams, 'path');
				const queryParams = this.extractRecord(parsedParams, 'query');
				const additionalHeaders = this.extractRecord(parsedParams, 'headers');
				const extraHeaders = normalizeHeaders(additionalHeaders);
				// defu merges extraHeaders into baseHeaders, both are already branded types
				const actionHeaders = defu(extraHeaders, baseHeaders);

				const bodyPayload = this.extractRecord(parsedParams, 'body');
				const rpcBody: JsonObject = bodyPayload ? { ...bodyPayload } : {};
				for (const [key, value] of Object.entries(parsedParams)) {
					if (key === 'body' || key === 'headers' || key === 'path' || key === 'query') {
						continue;
					}
					rpcBody[key] = value as JsonObject[string];
				}

				if (options?.dryRun) {
					const requestPayload = {
						action: name,
						body: rpcBody,
						...(this.defenderConfig?.enabled !== undefined
							? { defender_enabled: this.defenderConfig.enabled }
							: {}),
						headers: actionHeaders,
						path: pathParams ?? undefined,
						query: queryParams ?? undefined,
					};

					return {
						url: executeConfig.url,
						method: executeConfig.method,
						headers: actionHeaders,
						body: JSON.stringify(requestPayload),
						mappedParams: parsedParams,
					} satisfies JsonObject;
				}

				const response = await actionsClient.actions.rpcAction({
					action: name,
					body: rpcBody,
					...(this.defenderConfig?.enabled !== undefined
						? { defender_enabled: this.defenderConfig.enabled }
						: {}),
					headers: actionHeaders,
					path: pathParams ?? undefined,
					query: queryParams ?? undefined,
				});

				return rpcResponseToJsonObject(response);
			} catch (error) {
				if (error instanceof StackOneError) {
					throw error;
				}
				throw new StackOneError(`Error executing RPC action ${name}`, { cause: error });
			}
		};

		return tool;
	}

	private buildActionHeaders(headers: Record<string, string>): StackOneHeaders {
		const sanitizedEntries = Object.entries(headers).filter(
			([key]) => key.toLowerCase() !== 'authorization',
		);

		return stackOneHeadersSchema.parse(
			Object.fromEntries(sanitizedEntries.map(([key, value]) => [key, String(value)])),
		);
	}

	private extractRecord(
		params: JsonObject,
		key: 'body' | 'headers' | 'path' | 'query',
	): JsonObject | undefined {
		const value = params[key];
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			return value as JsonObject;
		}
		return undefined;
	}
}
