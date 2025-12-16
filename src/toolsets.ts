import { defu } from 'defu';
import type { MergeExclusive, SimplifyDeep } from 'type-fest';
import { DEFAULT_BASE_URL, UNIFIED_API_PREFIX } from './consts';
import { createFeedbackTool } from './feedback';
import { type StackOneHeaders, normaliseHeaders, stackOneHeadersSchema } from './headers';
import { createMCPClient } from './mcp-client';
import { type RpcActionResponse, RpcClient } from './rpc-client';
import { BaseTool, Tools } from './tool';
import type {
	ExecuteOptions,
	JsonObject,
	JsonSchemaProperties,
	RpcExecuteConfig,
	ToolParameters,
} from './types';
import { StackOneError } from './utils/errors';

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
 * Base configuration for StackOne toolset (without account options)
 */
interface StackOneToolSetBaseConfig extends BaseToolSetConfig {
	apiKey?: string;
	strict?: boolean;
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
 * Class for loading StackOne tools via MCP
 */
export class StackOneToolSet {
	private baseUrl?: string;
	private authentication?: AuthenticationConfig;
	private headers: Record<string, string>;
	private rpcClient?: RpcClient;

	/**
	 * Account ID for StackOne API
	 */
	private accountId?: string;
	private accountIds: string[] = [];

	/**
	 * Initialise StackOne toolset with API key and optional account ID(s)
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

		// Initialise base properties
		this.baseUrl = config?.baseUrl ?? process.env.STACKONE_BASE_URL ?? DEFAULT_BASE_URL;
		this.authentication = authentication;
		this.headers = configHeaders;
		this.rpcClient = config?.rpcClient;
		this.accountId = accountId;
		this.accountIds = config?.accountIds ?? [];

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
	 * Validate that tool name is not from unified API
	 * Unified API tools indicate missing or incorrect account configuration
	 */
	private validateToolName(toolName: string): void {
		if (toolName.startsWith(UNIFIED_API_PREFIX)) {
			throw new ToolSetConfigError(
				`Received unified API tool "${toolName}". This indicates the account is not properly configured. ` +
					`Unified API tools require versioned connectors. Please check your account's integration setup.`,
			);
		}
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
			this.validateToolName(name);

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
				// Extract provider from tool name (assuming format: provider_action)
				const provider = tool.name.split('_')[0]?.toLowerCase();
				return provider && providerSet.has(provider);
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
				const extraHeaders = normaliseHeaders(additionalHeaders);
				// defu merges extraHeaders into baseHeaders, both are already branded types
				const actionHeaders = defu(extraHeaders, baseHeaders) as StackOneHeaders;

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
