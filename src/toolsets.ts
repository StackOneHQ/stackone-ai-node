import { defu } from 'defu';
import type { MergeExclusive, SimplifyDeep } from 'type-fest';
import { z } from 'zod/v4';
import { DEFAULT_BASE_URL } from './consts';
import { createFeedbackTool } from './feedback';
import { type StackOneHeaders, normalizeHeaders, stackOneHeadersSchema } from './headers';
import { createMCPClient } from './mcp-client';
import { type RpcActionResponse, RpcClient } from './rpc-client';
import { BaseTool, Tools } from './tool';
import type {
	DefenderConfig,
	DefenderMode,
	ExecuteOptions,
	JsonObject,
	JsonSchemaProperties,
	LocalExecuteConfig,
	RpcExecuteConfig,
	ToolParameters,
} from './types';
import { DEFAULT_DEFENDER_CONFIG } from './types';
import type { BinaryDownloadResult } from './utils/binary-response';
import { StackOneError } from './utils/error-stackone';
import { StackOneAPIError } from './utils/error-stackone-api';

/**
 * Param-style pinned on the /mcp tool-listing URL. The MCP schema and the RPC-execution
 * unwrap (splitEnvelopeParams) must agree on this, so it is pinned rather than following
 * the server default — the server default is free to change without breaking the SDK.
 */
const MCP_PARAM_STYLE = 'flat_prefixed';

/** Matches a flat_prefixed envelope key: `<location>_<field>` (e.g. `path_id`, `query_limit`). */
const FLAT_ENVELOPE_KEY_PATTERN = /^(path|query|body|headers)_(.+)$/;

const ENVELOPE_LOCATIONS = ['path', 'query', 'headers', 'body'] as const;

type EnvelopeLocation = (typeof ENVELOPE_LOCATIONS)[number];

const isEnvelopeLocation = (key: string): key is EnvelopeLocation =>
	(ENVELOPE_LOCATIONS as readonly string[]).includes(key);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Converts an RPC action result to a JsonObject by flattening its top-level properties.
 *
 * RpcActionResponse uses z.passthrough() which preserves additional fields, making it
 * structurally compatible with Record<string, JsonValue>. A BinaryDownloadResult (file
 * download) is flattened the same way - its `content` Buffer rides through under the value
 * cast, so it is not a `JsonValue` (and JSON-stringifies to an unwieldy byte array); callers
 * re-serializing for an LLM must handle that key.
 */
function rpcResponseToJsonObject(response: RpcActionResponse | BinaryDownloadResult): JsonObject {
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
	 * Execution configuration. Controls default account scoping for tool execution.
	 * Pass `{ accountIds: ['acc-1'] }` to scope tools to specific accounts.
	 */
	execute?: ExecuteToolsConfig;
	/**
	 * Defender configuration. Controls prompt injection detection behavior for all tool calls.
	 *
	 * - Omit or pass `undefined` (default) → defer to the project dashboard setting
	 * - Pass `{ useProjectSettings: true }` → same as omitting; explicit form of the default
	 * - Pass `{ enabled, blockHighRisk, ... }` → explicit SDK-level config, overrides project settings
	 * - Pass `null` → defender explicitly disabled, overrides project settings
	 */
	defender?: DefenderConfig | null;
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

/** Wire-format defender config sent to the backend RPC action. */
interface DefenderApiConfig {
	enabled: boolean;
	block_high_risk: boolean;
	use_tier1_classification: boolean;
	use_tier2_classification: boolean;
}

/** Type guard: discriminate the `useProjectSettings: true` variant of DefenderConfig. */
function usesProjectSettings(config: DefenderConfig): config is { useProjectSettings: true } {
	return 'useProjectSettings' in config && config.useProjectSettings === true;
}

/**
 * Shapes already logged this process, keyed by mode + serialized wire payload.
 * Ensures we surface one warning per distinct override shape, not per construction.
 */
const loggedDefenderShapes = new Set<string>();

/**
 * Test-only: clear the once-per-process dedupe cache for defender override warnings.
 * @internal
 */
export function __resetDefenderInfoLog(): void {
	loggedDefenderShapes.clear();
}

/** Wrap text in yellow ANSI, only when stderr is a TTY and color isn't suppressed. */
function colorizeOverrideWarning(text: string): string {
	if (process.env.NO_COLOR) return text;
	if (!process.env.FORCE_COLOR && !process.stderr.isTTY) return text;
	return `\x1b[33m${text}\x1b[0m`;
}

/**
 * Warn once when the SDK overrides the project dashboard's defender setting.
 * Silent for `project` mode (no override) and for repeat constructions with the same shape.
 */
function logDefenderOverride(
	config: DefenderConfig | null,
	wireFields: { defender_config: DefenderApiConfig } | Record<string, never>,
): void {
	if (config === null) {
		const key = 'disabled';
		if (loggedDefenderShapes.has(key)) return;
		loggedDefenderShapes.add(key);
		console.warn(
			colorizeOverrideWarning(
				'Defender forcibly disabled via SDK config; project dashboard setting will be ignored.',
			),
		);
		return;
	}
	if (usesProjectSettings(config)) return;
	const key = `explicit:${JSON.stringify(wireFields)}`;
	if (loggedDefenderShapes.has(key)) return;
	loggedDefenderShapes.add(key);
	const fields = (wireFields as { defender_config: DefenderApiConfig }).defender_config;
	console.warn(
		colorizeOverrideWarning(
			`Defender configured via SDK (enabled=${fields.enabled}, blockHighRisk=${fields.block_high_risk}, useTier1Classification=${fields.use_tier1_classification}, useTier2Classification=${fields.use_tier2_classification}); project dashboard setting will be ignored.`,
		),
	);
}

/**
 * Map SDK DefenderConfig to the wire-format sent in the RPC body.
 *
 * - `null` → explicitly disabled (all fields false, overrides project setting)
 * - `{ useProjectSettings: true }` → empty object (omitted from payload, project setting controls)
 * - explicit object → wire format with missing fields filled from `DEFAULT_DEFENDER_CONFIG`
 */
function buildDefenderFields(
	config: DefenderConfig | null,
): { defender_config: DefenderApiConfig } | Record<string, never> {
	if (config === null) {
		return {
			defender_config: {
				enabled: false,
				block_high_risk: false,
				use_tier1_classification: false,
				use_tier2_classification: false,
			},
		};
	}
	if (usesProjectSettings(config)) {
		return {};
	}
	return {
		defender_config: {
			enabled: config.enabled ?? DEFAULT_DEFENDER_CONFIG.enabled,
			block_high_risk: config.blockHighRisk ?? DEFAULT_DEFENDER_CONFIG.blockHighRisk,
			use_tier1_classification:
				config.useTier1Classification ?? DEFAULT_DEFENDER_CONFIG.useTier1Classification,
			use_tier2_classification:
				config.useTier2Classification ?? DEFAULT_DEFENDER_CONFIG.useTier2Classification,
		},
	};
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
	private readonly executeConfig: ExecuteToolsConfig | undefined;
	private readonly defenderConfig: DefenderConfig | null;
	private readonly defenderFields: { defender_config: DefenderApiConfig } | Record<string, never>;

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
		this.executeConfig = config?.execute;

		// Resolve defender config:
		//   undefined  → defer to project dashboard setting (normalized to { useProjectSettings: true })
		//   null       → explicitly disabled (overrides project setting)
		//   object     → validate then store as-is
		const defenderInput = config?.defender;
		if (
			defenderInput != null &&
			typeof defenderInput === 'object' &&
			usesProjectSettings(defenderInput) &&
			Object.keys(defenderInput).length > 1
		) {
			throw new ToolSetConfigError(
				'Cannot combine useProjectSettings: true with explicit defender options. Use one or the other.',
			);
		}
		this.defenderConfig =
			defenderInput === undefined ? { useProjectSettings: true } : defenderInput;
		this.defenderFields = buildDefenderFields(this.defenderConfig);
		logDefenderOverride(this.defenderConfig, this.defenderFields);

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

	private catalogCache: Map<string, Tools> = new Map();

	/**
	 * Resolved defender behavior for this toolset.
	 *
	 * - `'project'` — SDK adds no `defender_config` to the RPC payload; the project dashboard controls.
	 * - `'disabled'` — SDK forces defender off (overrides the dashboard).
	 * - `'explicit'` — SDK sends an explicit `defender_config` (overrides the dashboard).
	 */
	get defenderMode(): DefenderMode {
		if (this.defenderConfig === null) return 'disabled';
		if (usesProjectSettings(this.defenderConfig)) return 'project';
		return 'explicit';
	}

	/**
	 * Set account IDs for filtering tools
	 * @param accountIds Array of account IDs to filter tools by
	 * @returns This toolset instance for chaining
	 */
	setAccounts(accountIds: string[]): this {
		this.accountIds = accountIds;
		this.clearCatalogCache();
		return this;
	}

	/**
	 * Invalidate cached tool catalog and local search index.
	 *
	 * Call when linked accounts change outside of {@link setAccounts} or when
	 * you need to force a fresh fetch from the StackOne MCP endpoint.
	 */
	clearCatalogCache(): void {
		this.catalogCache.clear();
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
	 * Get tools in OpenAI function calling format.
	 *
	 * @param options - Options
	 * @param options.accountIds - Account IDs to scope tools. Overrides the `execute`
	 *   config from the constructor.
	 * @returns List of tool definitions in OpenAI function format.
	 *
	 * @example
	 * ```typescript
	 * const toolset = new StackOneToolSet();
	 * const tools = await toolset.openai();
	 * ```
	 */
	async openai(options?: {
		accountIds?: string[];
	}): Promise<ReturnType<Tools['toOpenAI']>> {
		const effectiveAccountIds = options?.accountIds ?? this.executeConfig?.accountIds;

		const tools = await this.fetchTools({ accountIds: effectiveAccountIds });
		return tools.toOpenAI();
	}




	/**
	 * Fetch tools from MCP with optional filtering
	 * @param options Optional filtering options for account IDs, providers, and actions
	 * @returns Collection of tools matching the filter criteria
	 */
	async fetchTools(options?: FetchToolsOptions): Promise<Tools> {
		// Use account IDs from options, or fall back to instance state
		const effectiveAccountIds = options?.accountIds || this.accountIds;

		const cacheKey = JSON.stringify({
			accountIds: [...effectiveAccountIds].sort(),
			providers: options?.providers?.length ? [...options.providers].sort() : null,
			actions: options?.actions?.length ? [...options.actions].sort() : null,
		});
		const cached = this.catalogCache.get(cacheKey);
		if (cached) {
			return cached;
		}

		// Fetch tools (with account filtering if needed)
		// Headers are threaded as parameters per request — never mutate this.headers,
		// since concurrent callers would clobber each other's x-account-id.
		let tools: Tools;
		if (effectiveAccountIds.length > 0) {
			const toolsPromises = effectiveAccountIds.map(async (accountId) => {
				const requestHeaders = { ...this.headers, 'x-account-id': accountId };
				const accountTools = await this.fetchToolsFromMcp(requestHeaders);
				return accountTools.toArray();
			});

			const toolArrays = await Promise.all(toolsPromises);
			const allTools = toolArrays.flat();
			tools = new Tools(allTools);
		} else {
			// No account filtering - fetch all tools
			tools = await this.fetchToolsFromMcp(this.headers);
		}

		// Apply provider and action filters
		const filteredTools = this.filterTools(tools, options);

		// Add feedback tool
		const feedbackTool = createFeedbackTool(undefined, this.accountId, this.baseUrl);
		const toolsWithFeedback = new Tools([...filteredTools.toArray(), feedbackTool]);

		this.catalogCache.set(cacheKey, toolsWithFeedback);
		return toolsWithFeedback;
	}

	/**
	 * Fetch tool definitions from MCP using the given request headers.
	 * Headers are passed in (not read from this.headers) so concurrent callers
	 * can each scope their request to a different x-account-id safely.
	 */
	private async fetchToolsFromMcp(requestHeaders: Record<string, string>): Promise<Tools> {
		if (!this.baseUrl) {
			throw new ToolSetConfigError('baseUrl is required to fetch MCP tools');
		}

		await using clients = await createMCPClient({
			baseUrl: `${this.baseUrl}/mcp?param-style=${MCP_PARAM_STYLE}`,
			headers: requestHeaders,
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
				headers: requestHeaders,
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
		headers,
	}: {
		actionsClient: RpcClient;
		name: string;
		description?: string;
		inputSchema: ToolInputSchema;
		headers: Record<string, string>;
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
			headers,
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

				const envelope = this.splitEnvelopeParams(parsedParams);
				const pathParams = envelope.path;
				const queryParams = envelope.query;
				const extraHeaders = normalizeHeaders(envelope.headers);
				// defu merges extraHeaders into baseHeaders, both are already branded types
				const actionHeaders = defu(extraHeaders, baseHeaders);

				const rpcBody: JsonObject = envelope.body;

				if (options?.dryRun) {
					const requestPayload = {
						action: name,
						body: rpcBody,
						...this.defenderFields,
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
					...this.defenderFields,
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

	/**
	 * Splits LLM-supplied tool arguments into the RPC envelope (path/query/headers/body).
	 *
	 * Tools are listed with `?param-style=flat_prefixed`, so keys arrive as `<location>_<field>`
	 * (for example `path_id`, `query_limit`). The prefix carries the parameter location, so the
	 * split needs no per-action schema. A bare object-valued `path`/`query`/`headers`/`body` key
	 * is still bucketed for clients holding a cached nested schema, and any other key falls
	 * through to the body.
	 */
	private splitEnvelopeParams(params: JsonObject): {
		path?: JsonObject;
		query?: JsonObject;
		headers?: JsonObject;
		body: JsonObject;
	} {
		// Null-prototype buckets so API fields named after Object.prototype members
		// (`constructor`, `toString`, `__proto__`) are stored as ordinary own properties
		// instead of colliding with the prototype chain and being dropped.
		const buckets: Record<EnvelopeLocation, JsonObject> = {
			path: Object.create(null),
			query: Object.create(null),
			headers: Object.create(null),
			body: Object.create(null),
		};

		// Keeps whichever value reaches a field first, so the pass order below is what decides
		// precedence rather than the order the caller happened to supply keys in.
		const assignField = (bucket: JsonObject, field: string, value: unknown): void => {
			if (!Object.hasOwn(bucket, field)) {
				bucket[field] = value as JsonObject[string];
			}
		};

		const entries = Object.entries(params);

		// First pass: explicit flat_prefixed keys. Applied before anything else so a prefixed
		// key always wins over the same field carried in a nested envelope or as a bare key.
		for (const [key, value] of entries) {
			const match = key.match(FLAT_ENVELOPE_KEY_PATTERN);
			if (match) {
				assignField(buckets[match[1] as EnvelopeLocation], match[2], value);
			}
		}

		// Second pass: nested envelopes from clients on a cached schema, then bare body fields.
		for (const [key, value] of entries) {
			if (FLAT_ENVELOPE_KEY_PATTERN.test(key)) {
				continue;
			}
			if (isEnvelopeLocation(key)) {
				// Reserved keys name an envelope, never a body field. A non-object value cannot
				// be bucketed, so it is dropped rather than leaked into the body under its
				// reserved name.
				if (isPlainObject(value)) {
					for (const [field, fieldValue] of Object.entries(value)) {
						assignField(buckets[key], field, fieldValue);
					}
				}
				continue;
			}
			assignField(buckets.body, key, value);
		}

		// Spread onto ordinary objects so downstream JSON and schema handling sees plain records.
		return {
			path: Object.keys(buckets.path).length > 0 ? { ...buckets.path } : undefined,
			query: Object.keys(buckets.query).length > 0 ? { ...buckets.query } : undefined,
			headers: Object.keys(buckets.headers).length > 0 ? { ...buckets.headers } : undefined,
			body: { ...buckets.body },
		};
	}
}
