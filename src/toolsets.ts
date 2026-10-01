import type { MergeExclusive, SimplifyDeep } from 'type-fest';
import {
	DEFAULT_BASE_URL,
	DEFAULT_TIMEOUT_MS,
	MAX_CONCURRENCY,
	MAX_TOP_K,
	SUBMIT_FEEDBACK_TOOL_NAME,
} from './consts';
import { buildRequestHeaders, isSdkOwnedHeader } from './headers';
import { type McpToolDefinition, isRateLimitFailure, listMcpTools } from './mcp-client';
import { cloneJson, toolParametersFromInputSchema } from './schema';
import { StackOneMcpTool, type StackOneTool, Tools } from './tool';
import type {
	FeedbackCategory,
	FeedbackRating,
	FeedbackSource,
	JsonObject,
	SearchResult,
	StackOneAccount,
	ToolMode,
} from './types';
import { StackOneAPIError } from './utils/error-stackone-api';
import { StackOneError } from './utils/error-stackone';
import { ToolSetConfigError, ToolSetLoadError } from './utils/error-toolset';
import { settleWithConcurrency } from './utils/concurrency';
import { fetchWithRetry, retryTiming } from './utils/fetch-retry';
import { warn } from './utils/logger';

/**
 * Configuration with a single account ID
 */
interface SingleAccountConfig {
	/**
	 * Single account ID for StackOne API operations
	 * Use this when working with a single account. Never read from the environment: with no
	 * account configured, the toolset uses every active account linked to the API key.
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
interface StackOneToolSetBaseConfig {
	/** API key. Defaults to the `STACKONE_API_KEY` environment variable. */
	apiKey?: string;
	/** Defaults to `STACKONE_BASE_URL`, then `https://api.stackone.com`. */
	baseUrl?: string;
	/**
	 * Extra HTTP headers sent with every request. `Authorization`, `x-account-id` and
	 * `User-Agent` are always the SDK's own and cannot be set here.
	 */
	headers?: Record<string, string>;
	/**
	 * Request timeout in milliseconds, applied to every MCP call (listing and `tools/call`) and to
	 * account discovery. Default: 60000 (60s).
	 */
	timeout?: number;
	/**
	 * Execution configuration. Controls default account scoping for tool execution.
	 * Pass `{ accountIds: ['acc-1'] }` to scope tools to specific accounts.
	 */
	execute?: ExecuteToolsConfig;
	/**
	 * How the endpoint lists tools. `'search_execute'` returns two meta tools per connector
	 * instead of one tool per action, keeping the catalog small enough for a model's context.
	 * Defaults to the server's own default (`'individual'`).
	 */
	toolMode?: ToolMode;
}

/**
 * Configuration for StackOne toolset
 * Accepts either accountId (single) or accountIds (multiple), but not both
 */
export type StackOneToolSetConfig = StackOneToolSetBaseConfig & Partial<AccountConfig>;

/**
 * Options for filtering tools when fetching from MCP
 */
export interface FetchToolsOptions {
	/**
	 * The accounts to list tools for. Defaults to the toolset's accounts, then its `accountId`,
	 * then every active account linked to the API key.
	 */
	accountIds?: string[];

	/**
	 * Filter tools by provider names (case-insensitive, matched as a full prefix of the tool
	 * name, so `browser_linkedin` matches `browser_linkedin_search_people`).
	 * @example ['hibob', 'bamboohr']
	 */
	providers?: string[];

	/**
	 * Filter tools by action patterns with glob support
	 * Only tools matching these patterns will be returned
	 * @example ['*_list_employees', 'hibob_create_employees']
	 */
	actions?: string[];

	/**
	 * Override the toolset's `toolMode` for this call. `null` requests the server default.
	 */
	mode?: ToolMode | null;
}

/**
 * Options for {@link StackOneToolSet.search}.
 */
export interface SearchOptions {
	/** Maximum results per connector, 1–50. Default: 10. */
	topK?: number;
	/** Restrict to these accounts. Defaults to the toolset's accounts, then every active one. */
	accountIds?: string[];
}

/**
 * Options for {@link StackOneToolSet.execute}.
 */
export interface ExecuteActionOptions {
	/**
	 * The `session_id` a {@link StackOneToolSet.search} hit carries. Passing it links this call to
	 * that search server-side. Sent only when given.
	 */
	sessionId?: string;
	/** Restrict routing to these accounts. Defaults as for {@link StackOneToolSet.search}. */
	accountIds?: string[];
}

/**
 * Options for {@link StackOneToolSet.submitFeedback}.
 */
export interface SubmitFeedbackOptions {
	/** The verdict: `'positive'`, `'negative'` or `'neutral'`. */
	rating: FeedbackRating;
	/** The tools or action ids the feedback is about. */
	toolNames: string[];
	/** An optional one-line reason. */
	feedback?: string;
	/** What the feedback is about, e.g. `'search'` or `'execute'`. */
	category?: FeedbackCategory;
	/** The session to attach the feedback to — the `session_id` of a search hit. */
	sessionId?: string;
	/** Who produced the feedback. Default: `'model'`. */
	source?: FeedbackSource;
	/**
	 * The feedback is sent through the first of these accounts. Defaults as for
	 * {@link StackOneToolSet.fetchTools}, in the order given or discovered.
	 */
	accountIds?: string[];
}

/** One served tool, with the account it was listed for. What the catalog cache holds. */
interface CatalogEntry {
	definition: McpToolDefinition;
	accountId: string;
	endpoint: string;
}

const describeError = (error: unknown): string =>
	error instanceof Error ? error.message : String(error);

/**
 * Whether a tool belongs to one of the given providers (case-insensitive).
 *
 * Matched as a full prefix rather than on the first underscore-separated token: splitting on
 * "_" reads `browser_linkedin_search_people` as provider `browser`, so asking for
 * `browser_linkedin` returned nothing at all — silently, since an empty result is
 * indistinguishable from a provider with no tools.
 */
function matchesProvider(toolName: string, providers: readonly string[]): boolean {
	const lowered = toolName.toLowerCase();
	return providers.some((provider) => lowered.startsWith(`${provider.toLowerCase()}_`));
}

/**
 * Whether a tool name matches a glob pattern, with the semantics of Python's `fnmatch`: `*` any
 * run, `?` one character, `[seq]` / `[!seq]` a character class. Everything else is literal.
 */
function matchGlob(value: string, pattern: string): boolean {
	let source = '';
	for (let index = 0; index < pattern.length; index++) {
		const char = pattern[index] as string;
		if (char === '*') {
			source += '.*';
		} else if (char === '?') {
			source += '.';
		} else if (char === '[') {
			let end = index + 1;
			if (pattern[end] === '!') {
				end++;
			}
			if (pattern[end] === ']') {
				end++;
			}
			end = pattern.indexOf(']', end);
			if (end === -1) {
				source += '\\[';
			} else {
				let body = pattern
					.slice(index + 1, end)
					.replaceAll('\\', '\\\\')
					.replaceAll(']', '\\]');
				if (body.startsWith('!')) {
					body = `^${body.slice(1)}`;
				} else if (body.startsWith('^')) {
					body = `\\${body}`;
				}
				source += `[${body}]`;
				index = end;
			}
		} else {
			source += char.replace(/[.+^${}()|[\]\\/]/g, '\\$&');
		}
	}
	return new RegExp(`^${source}$`, 's').test(value);
}

const isPlainObject = (value: unknown): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The connector a meta tool belongs to: its name minus the account id and the suffix.
 *
 * The account id is stripped by identity, not by splitting on the last underscore. Account ids
 * are nanoid-shaped and nanoid's alphabet includes `_`, so splitting turned
 * `mock_acc_1_execute_action` into connector `mock_acc` and made every action on that account
 * unroutable — with an error blaming the caller's action id.
 */
function connectorOf(tool: StackOneTool, suffix: string): string {
	let stem = tool.name.endsWith(suffix) ? tool.name.slice(0, -suffix.length) : tool.name;
	const account = tool.getAccountId();
	if (account && stem.endsWith(`_${account}`)) {
		stem = stem.slice(0, -(account.length + 1));
	}
	return stem.toLowerCase();
}

/** A search hit's score, or 0 for one without a numeric score, so it sorts last. */
function scoreOf(action: SearchResult): number {
	const score = action.similarity_score;
	return typeof score === 'number' && !Number.isNaN(score) ? score : 0;
}

const assertAccountIdList = (accountIds: unknown, parameter: string): void => {
	if (accountIds === undefined) {
		return;
	}
	if (typeof accountIds === 'string') {
		throw new ToolSetConfigError(
			`${parameter} must be an array of account ids, not a string. Did you mean ["${accountIds}"]?`,
		);
	}
	if (!Array.isArray(accountIds) || accountIds.some((id) => typeof id !== 'string')) {
		throw new ToolSetConfigError(`${parameter} must be an array of account id strings`);
	}
	// An empty id would be sent with no x-account-id, so reject it rather than let the server
	// answer for an account nobody chose.
	if (accountIds.includes('')) {
		throw new ToolSetConfigError(`${parameter} must not contain an empty account id`);
	}
};

/**
 * The StackOne toolset: lists the served tool catalog and exposes it to agent frameworks.
 *
 * A thin client over the MCP endpoint. Tools are listed from it, per account, and executed over
 * its `tools/call`; the only other request is `GET /accounts`, to discover accounts. Schemas and
 * arguments are passed through as served, never rewritten, filtered or invented.
 *
 * An API key is enough: with no account configured, the toolset lists every active account
 * linked to the key.
 */
export class StackOneToolSet {
	readonly #apiKey: string;
	readonly #baseUrl: string;
	readonly #headers: Record<string, string>;
	readonly #timeout: number;
	readonly #toolMode: ToolMode | undefined;
	readonly #accountId: string | undefined;
	#accountIds: string[];

	/**
	 * The listing per account scope, not the Tools built from it. Tools are mutable
	 * (`setAccountId` rebinds one), so handing the same instances back on a cache hit let one
	 * caller silently rescope every later caller's tools.
	 */
	readonly #catalogCache = new Map<string, readonly CatalogEntry[]>();
	#discoveredAccountIds: string[] | undefined;
	#discovering: Promise<string[]> | undefined;
	/**
	 * Bumped by {@link clearCatalogCache}. A listing already in flight when the cache is cleared
	 * captured the generation it started under, and refuses to write back if it has moved —
	 * otherwise the stale catalog would land after the clear and be served for the life of the
	 * process, which is the one thing the clear exists to prevent.
	 */
	#cacheGeneration = 0;

	/**
	 * Falls back to `STACKONE_API_KEY` and `STACKONE_BASE_URL`, but never reads an account id from
	 * the environment: `accountId` / `accountIds` must be passed, or every active account is used.
	 *
	 * @throws ToolSetConfigError If no API key is given or found in `STACKONE_API_KEY`, or both
	 *   `accountId` and `accountIds` are given, or `accountId` is an empty string.
	 */
	constructor(config: StackOneToolSetConfig = {}) {
		if (config.accountId != null && config.accountIds != null) {
			throw new ToolSetConfigError(
				'Cannot provide both accountId and accountIds. Use accountId for a single account or accountIds for multiple accounts.',
			);
		}
		// An empty accountId is usually an unset variable, and treating it as unset would silently
		// widen every call to all active accounts.
		if (config.accountId === '') {
			throw new ToolSetConfigError('accountId must not be an empty string');
		}
		assertAccountIdList(config.accountIds, 'accountIds');
		assertAccountIdList(config.execute?.accountIds, 'execute.accountIds');

		const apiKey = config.apiKey || process.env.STACKONE_API_KEY;
		if (!apiKey) {
			throw new ToolSetConfigError(
				'API key must be provided either through the apiKey option or the STACKONE_API_KEY environment variable',
			);
		}

		const ignoredHeaders = Object.keys(config.headers ?? {}).filter(isSdkOwnedHeader);
		if (ignoredHeaders.length > 0) {
			warn(
				`Ignoring headers ${ignoredHeaders.map((name) => `"${name}"`).join(', ')}: the SDK sets them itself. Use the apiKey and accountId options instead.`,
			);
		}

		this.#apiKey = apiKey;
		this.#baseUrl = config.baseUrl ?? process.env.STACKONE_BASE_URL ?? DEFAULT_BASE_URL;
		this.#headers = { ...config.headers };
		this.#timeout = config.timeout ?? config.execute?.timeout ?? DEFAULT_TIMEOUT_MS;
		this.#toolMode = config.toolMode;
		this.#accountId = config.accountId;
		this.#accountIds = [...(config.accountIds ?? config.execute?.accountIds ?? [])];
	}

	/**
	 * Set account IDs for filtering tools
	 * @param accountIds Array of account IDs to filter tools by
	 * @returns This toolset instance for chaining
	 */
	setAccounts(accountIds: string[]): this {
		assertAccountIdList(accountIds, 'accountIds');
		this.#accountIds = [...accountIds];
		this.clearCatalogCache();
		return this;
	}

	/**
	 * Invalidate the cached tool catalog and discovered accounts.
	 *
	 * Call when linked accounts change outside of {@link setAccounts} or when you need to force a
	 * fresh fetch from the StackOne MCP endpoint. A listing already in flight will not write its
	 * result back into the cache.
	 */
	clearCatalogCache(): void {
		this.#cacheGeneration += 1;
		this.#catalogCache.clear();
		this.#discoveredAccountIds = undefined;
		this.#discovering = undefined;
	}

	/**
	 * Get tools in OpenAI function calling format.
	 *
	 * @param options - Options
	 * @param options.accountIds - Account IDs to scope tools. Defaults to the toolset's accounts.
	 * @returns List of tool definitions in OpenAI function format.
	 *
	 * @example
	 * ```typescript
	 * const toolset = new StackOneToolSet();
	 * const tools = await toolset.openai();
	 * ```
	 */
	async openai(options?: { accountIds?: string[] }): Promise<ReturnType<Tools['toOpenAI']>> {
		const tools = await this.fetchTools({ accountIds: options?.accountIds });
		return tools.toOpenAI();
	}

	/**
	 * List the accounts linked to this API key.
	 *
	 * Each entry carries at least `id`, `provider` and `status`. Only accounts with
	 * `status === 'active'` can serve tools.
	 *
	 * @throws StackOneAPIError If the API answers with an error status, including a 429 that
	 *   outlasted its retries.
	 * @throws ToolSetLoadError If the API cannot be reached, or answers with something that is
	 *   not a JSON list (including a body that is not valid UTF-8).
	 */
	async fetchAccounts(): Promise<StackOneAccount[]> {
		const url = `${this.#baseUrl.replace(/\/+$/, '')}/accounts`;
		let response: Response;
		try {
			response = await fetchWithRetry(
				url,
				{
					headers: buildRequestHeaders({ apiKey: this.#apiKey, extraHeaders: this.#headers }),
					signal: AbortSignal.timeout(this.#timeout),
				},
				{ deadline: retryTiming.now() + this.#timeout },
			);
		} catch (error) {
			throw new ToolSetLoadError(`Could not reach ${url}: ${describeError(error)}`, {
				cause: error,
			});
		}

		let bytes: ArrayBuffer;
		try {
			bytes = await response.arrayBuffer();
		} catch (error) {
			throw new ToolSetLoadError(
				`Could not read the response from ${url}: ${describeError(error)}`,
				{
					cause: error,
				},
			);
		}

		if (!response.ok) {
			// Carry the status, so a caller can tell a 401 from a 429.
			const text = new TextDecoder().decode(bytes).trim();
			throw new StackOneAPIError(
				`Listing accounts at ${url} failed with ${response.status} ${response.statusText}: ${text}`,
				response.status,
				text,
			);
		}

		let body: unknown;
		try {
			body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
		} catch (error) {
			throw new ToolSetLoadError(`Invalid JSON returned by ${url}: ${describeError(error)}`, {
				cause: error,
			});
		}
		const accounts =
			typeof body === 'object' && body !== null && !Array.isArray(body) && 'data' in body
				? (body as { data: unknown }).data
				: body;
		if (!Array.isArray(accounts)) {
			throw new ToolSetLoadError(
				`Unexpected /accounts response shape: expected a list, got ${accounts === null ? 'null' : typeof accounts}`,
			);
		}
		return accounts as StackOneAccount[];
	}

	/**
	 * The active accounts linked to this API key.
	 *
	 * The MCP endpoint requires an `x-account-id` on every request, so an API key on its own is
	 * not enough to list tools. Rather than make every caller supply one, ask the API which
	 * accounts the key has.
	 *
	 * For organisations with many linked accounts, discovery lists the catalog of every one of
	 * them: pass explicit `accountIds` to avoid the round trips and the context they cost.
	 *
	 * @throws ToolSetConfigError If the key has no accounts, or none are active.
	 */
	async #discoverAccountIds(): Promise<string[]> {
		if (this.#discoveredAccountIds) {
			return this.#discoveredAccountIds;
		}
		// Shared while in flight, so concurrent search() and fetchTools() calls on a fresh toolset
		// make one GET /accounts between them rather than one each.
		if (!this.#discovering) {
			const discovering = this.#fetchActiveAccountIds().finally(() => {
				if (this.#discovering === discovering) {
					this.#discovering = undefined;
				}
			});
			this.#discovering = discovering;
		}
		return this.#discovering;
	}

	async #fetchActiveAccountIds(): Promise<string[]> {
		const generation = this.#cacheGeneration;
		const accounts = await this.fetchAccounts();
		const active = accounts
			.filter(
				(account) => account?.status === 'active' && typeof account.id === 'string' && account.id,
			)
			.map((account) => account.id);
		if (active.length === 0) {
			if (accounts.length === 0) {
				throw new ToolSetConfigError(
					'This API key has no linked accounts. Link one in the StackOne dashboard, or pass accountId explicitly.',
				);
			}
			const listed = accounts
				.map((account) => `${String(account?.provider)} (${String(account?.status)})`)
				.join(', ');
			throw new ToolSetConfigError(
				`None of this API key's ${accounts.length} linked accounts are active: ${listed}. Re-link them in the StackOne dashboard, or pass accountId explicitly.`,
			);
		}
		if (generation === this.#cacheGeneration) {
			this.#discoveredAccountIds = active;
		}
		return active;
	}

	/**
	 * The accounts a call is scoped to, in the order they were given: the call's own, then the
	 * toolset's, then its single account, then every active account in `GET /accounts` order.
	 */
	async #accountsInOrder(accountIds: string[] | undefined): Promise<string[]> {
		assertAccountIdList(accountIds, 'accountIds');
		let scope = accountIds?.length ? accountIds : this.#accountIds;
		if (scope.length === 0 && this.#accountId) {
			scope = [this.#accountId];
		}
		if (scope.length === 0) {
			scope = await this.#discoverAccountIds();
		}
		return scope;
	}

	async #resolveAccountScope(accountIds: string[] | undefined): Promise<string[]> {
		// Sorted and deduplicated: the listing order, and the cache key, must not depend on the
		// order the caller happened to name the accounts in.
		return [...new Set(await this.#accountsInOrder(accountIds))].sort();
	}

	#endpoint(mode: ToolMode | undefined): string {
		const endpoint = `${this.#baseUrl.replace(/\/+$/, '')}/mcp`;
		return mode ? `${endpoint}?tool-mode=${mode}` : endpoint;
	}

	/**
	 * Keyed on what was fetched, not on how it is filtered: providers and actions narrow the list
	 * in memory, so they must not force a refetch. The base URL and API key belong in it, so a
	 * catalog is never served for a host or key other than the one it was listed from.
	 */
	#cacheKey(scope: readonly string[], mode: ToolMode | undefined): string {
		return JSON.stringify([scope, mode ?? null, this.#baseUrl, this.#apiKey]);
	}

	/**
	 * List every scoped account's catalog, tolerating accounts that fail.
	 *
	 * One unusable account must not cost the caller every other account's tools, so a failing
	 * account is skipped with a warning — unless every account fails, which is an error rather
	 * than an empty catalog. A 429 that outlasted its retries is not the account's fault but the
	 * key's, so it fails the whole listing instead: skipping it would hand back a catalog missing
	 * whichever accounts happened to be throttled. A degraded listing is not cached: the warning
	 * fires once, and every later call would otherwise serve the short list silently for the life
	 * of the process.
	 */
	async #listCatalog(
		scope: readonly string[],
		mode: ToolMode | undefined,
	): Promise<CatalogEntry[]> {
		const generation = this.#cacheGeneration;
		const endpoint = this.#endpoint(mode);
		const listAccount = async (accountId: string): Promise<CatalogEntry[]> => {
			const definitions = await listMcpTools({
				endpoint,
				headers: buildRequestHeaders({
					apiKey: this.#apiKey,
					accountId,
					extraHeaders: this.#headers,
				}),
				timeout: this.#timeout,
			});
			return definitions.map((definition) => ({ definition, accountId, endpoint }));
		};

		const store = (listing: CatalogEntry[]): void => {
			if (generation === this.#cacheGeneration) {
				this.#catalogCache.set(this.#cacheKey(scope, mode), listing);
			}
		};

		if (scope.length === 1) {
			const listing = await listAccount(scope[0] as string);
			store(listing);
			return listing;
		}

		const settled = await settleWithConcurrency(
			scope,
			MAX_CONCURRENCY,
			listAccount,
			isRateLimitFailure,
		);
		const listing: CatalogEntry[] = [];
		const failures: string[] = [];
		settled.forEach((outcome, index) => {
			if (outcome.status === 'fulfilled') {
				listing.push(...outcome.value);
			} else {
				failures.push(`${scope[index]}: ${describeError(outcome.reason)}`);
			}
		});
		if (failures.length > 0 && listing.length === 0) {
			throw new ToolSetLoadError(`No account returned tools. ${failures.join(' | ')}`);
		}
		for (const failure of failures) {
			warn(`Skipping account that failed to list tools — ${failure}`);
		}
		if (failures.length === 0) {
			store(listing);
		}
		return listing;
	}

	/**
	 * Build an executable tool from a served catalog entry, on a deep copy of its schema. Every
	 * tool — per-action, meta or feedback — executes over `tools/call` on the endpoint and account
	 * that listed it.
	 */
	#createTool(entry: CatalogEntry): StackOneTool {
		const { definition, accountId, endpoint } = entry;
		return new StackOneMcpTool({
			name: definition.name,
			description: definition.description ?? '',
			parameters: toolParametersFromInputSchema(cloneJson(definition.inputSchema)),
			endpoint,
			apiKey: this.#apiKey,
			accountId,
			timeout: this.#timeout,
			extraHeaders: this.#headers,
		});
	}

	/**
	 * Fetch tools with optional filtering by account IDs, providers, and actions.
	 *
	 * The listing is cached per account scope and mode; filters are applied in memory, and every
	 * call builds fresh tool instances, so mutating one caller's tools never affects another's.
	 *
	 * `stackone_submit_feedback` is served once per account listing; it is returned once.
	 *
	 * Rate limits: a request answered 429 is retried up to 3 times, after the server's
	 * `Retry-After` (capped at 30s) or a 1s/2s/4s backoff, unless that wait would outlast the
	 * `timeout`. One still rate limited after that fails the whole call: an account that fails any other way is skipped with a warning, but a 429
	 * never yields a partial catalog.
	 *
	 * @throws ToolSetConfigError If no account is configured and none can be discovered.
	 * @throws StackOneAPIError If the API refuses a listing (e.g. 412 for a dead account), or
	 *   still answers 429 after the retries, on any account.
	 * @throws ToolSetLoadError If the catalog cannot be loaded.
	 */
	async fetchTools(options: FetchToolsOptions = {}): Promise<Tools> {
		try {
			const mode = options.mode === undefined ? this.#toolMode : (options.mode ?? undefined);
			const scope = await this.#resolveAccountScope(options.accountIds);
			const listing =
				this.#catalogCache.get(this.#cacheKey(scope, mode)) ??
				(await this.#listCatalog(scope, mode));

			let seenFeedbackTool = false;
			let tools = listing
				.filter(({ definition }) => {
					// Global rather than account-scoped, so every account's listing carries an
					// identical copy. Keep the first.
					if (definition.name !== SUBMIT_FEEDBACK_TOOL_NAME) {
						return true;
					}
					const first = !seenFeedbackTool;
					seenFeedbackTool = true;
					return first;
				})
				.map((entry) => this.#createTool(entry));

			if (options.providers?.length) {
				const providers = options.providers;
				tools = tools.filter((tool) => matchesProvider(tool.name, providers));
			}
			if (options.actions?.length) {
				const actions = options.actions;
				tools = tools.filter((tool) => actions.some((pattern) => matchGlob(tool.name, pattern)));
			}

			warnOnDuplicateNames(tools);
			return new Tools(tools);
		} catch (error) {
			// StackOneAPIError carries the HTTP status. Re-wrapping it would throw that away, so a
			// caller could not tell a 401 from a 429.
			if (error instanceof StackOneError) {
				throw error;
			}
			throw new ToolSetLoadError(`Error fetching tools: ${describeError(error)}`, {
				cause: error,
			});
		}
	}

	/**
	 * The server's per-connector meta tools, whatever this toolset's own mode.
	 *
	 * The mode is passed down rather than switched on the instance, so a concurrent
	 * `fetchTools()` can never read the switched mode and cache meta tools under the wrong key.
	 */
	async #metaTools(suffix: string, accountIds: string[] | undefined): Promise<StackOneTool[]> {
		const tools = await this.fetchTools({ accountIds, mode: 'search_execute' });
		return tools.getStackOneTools().filter((tool) => tool.name.endsWith(suffix));
	}

	/**
	 * Find actions matching a natural-language query.
	 *
	 * Searches every linked connector and ranks the results together, so a catalog of hundreds of
	 * tools never has to fit in a model's context. A connector that fails to search is skipped
	 * with a warning, unless they all fail.
	 *
	 * Rate limits: a request answered 429 is retried up to 3 times, after the server's
	 * `Retry-After` (capped at 30s) or a 1s/2s/4s backoff, unless that wait would outlast the
	 * `timeout`. One still rate limited after that fails the whole search rather than being
	 * skipped.
	 *
	 * @param query What you want to do, e.g. "list recent comments".
	 * @returns Actions carrying at least `action_id`, best first, each with the
	 *   `session_id` of the search that found it when the server issued one. Pass it to
	 *   {@link execute} and {@link submitFeedback} to link the calls.
	 * @throws ToolSetConfigError If `topK` is not an integer between 1 and 50.
	 * @throws StackOneAPIError With status 429 if a request is still rate limited after retries.
	 * @throws ToolSetLoadError If every connector fails.
	 */
	async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
		const topK = options.topK === undefined ? 10 : options.topK;
		// The server rejects anything outside 1..50, but only after a round trip per connector —
		// and that reads like an outage rather than a typo. Fail here, where the caller can see why.
		if (typeof topK !== 'number' || !Number.isInteger(topK) || topK < 1 || topK > MAX_TOP_K) {
			throw new ToolSetConfigError(
				`topK must be an integer between 1 and ${MAX_TOP_K}, got ${JSON.stringify(topK) ?? String(topK)}`,
			);
		}
		if (typeof query !== 'string') {
			throw new ToolSetConfigError(`query must be a string, got ${typeof query}`);
		}

		const tools = await this.#metaTools('_search_actions', options.accountIds);
		if (tools.length === 0) {
			return [];
		}

		const searchOne = async (tool: StackOneTool): Promise<SearchResult[]> => {
			const found = await tool.execute({ query, top_k: topK });
			const actions = (Array.isArray(found.actions) ? found.actions : []).filter(
				(action): action is SearchResult => isPlainObject(action),
			);
			// The server returns session_id once per search, beside the actions. Results from every
			// connector are merged and re-ranked below, so this is the last point at which a hit can
			// still be traced to the search that produced it.
			const sessionId = found.session_id;
			if (typeof sessionId !== 'string' || !sessionId) {
				return actions;
			}
			return actions.map((action) => ({ ...action, session_id: sessionId }));
		};

		// Fan out the way fetchTools() does: serially, a dozen connectors would cost the sum of
		// their latencies on the headline call.
		const settled = await settleWithConcurrency(
			tools,
			MAX_CONCURRENCY,
			searchOne,
			isRateLimitFailure,
		);
		const results: SearchResult[] = [];
		const failures: string[] = [];
		settled.forEach((outcome, index) => {
			if (outcome.status === 'fulfilled') {
				results.push(...outcome.value);
			} else {
				failures.push(`${tools[index]?.name}: ${describeError(outcome.reason)}`);
			}
		});
		if (failures.length > 0 && results.length === 0) {
			throw new ToolSetLoadError(`No connector returned results. ${failures.join(' | ')}`);
		}
		for (const failure of failures) {
			warn(`Skipping connector that failed to search — ${failure}`);
		}

		// Concatenating per-connector results would leave them grouped by connector, so results[0]
		// would be the best hit of whichever connector answered first rather than the best hit
		// overall. The server scores every action on the same scale, so rank globally.
		return results.sort((left, right) => scoreOf(right) - scoreOf(left));
	}

	/**
	 * Execute an action by id, as returned by {@link search}.
	 *
	 * Always runs through the connector's `*_execute_action` meta tool, so `args` is the nested
	 * envelope every action's `example_request` shows — `{ query: {...}, path: {...}, body: {...} }`.
	 * The flat, prefixed form belongs to `fetchTools()` tools, whose own served schema names the
	 * keys. The connector is the longest one whose name prefixes `actionId`, and `actionId` is
	 * pinned last, so a model-supplied `action_id` in `args` cannot replace it.
	 *
	 * `args.headers` is forwarded to the action: `*_execute_action` serves `headers` as an open
	 * object, so any header name is declared — except `Authorization`, `x-account-id` and
	 * `User-Agent`, which the SDK sets itself and drops here with a warning.
	 *
	 * @param actionId The action to run, e.g. `linear_list_issues`.
	 * @param args The action's arguments.
	 * @param options.sessionId The `session_id` a search hit carries, to link this call to it.
	 * @returns The action's result.
	 * @throws ToolSetConfigError If the arguments are malformed.
	 * @throws ToolSetLoadError If no linked connector serves the action.
	 * @throws StackOneAPIError If the action fails.
	 */
	async execute(
		actionId: string,
		args?: JsonObject,
		options: ExecuteActionOptions = {},
	): Promise<JsonObject> {
		if (typeof actionId !== 'string' || !actionId) {
			throw new ToolSetConfigError(
				`actionId must be a non-empty string, got ${JSON.stringify(actionId) ?? String(actionId)}`,
			);
		}
		if (args !== undefined && !isPlainObject(args)) {
			throw new ToolSetConfigError(
				`arguments must be a JSON object, got ${Array.isArray(args) ? 'array' : args === null ? 'null' : typeof args}`,
			);
		}
		const { sessionId } = options;
		if (sessionId !== undefined && (typeof sessionId !== 'string' || !sessionId)) {
			throw new ToolSetConfigError(
				`sessionId must be a non-empty string, got ${JSON.stringify(sessionId)}`,
			);
		}

		const suffix = '_execute_action';
		const lowered = actionId.toLowerCase();
		const matches = (await this.#metaTools(suffix, options.accountIds)).filter((tool) =>
			lowered.startsWith(`${connectorOf(tool, suffix)}_`),
		);
		if (matches.length === 0) {
			throw new ToolSetLoadError(
				`No connector found for "${actionId}". Use search() to discover valid action ids.`,
			);
		}

		// Longest connector wins: with both `browser` and `browser_linkedin` linked, the first
		// token alone would route every browser_linkedin action to browser.
		const longest = Math.max(...matches.map((tool) => connectorOf(tool, suffix).length));
		const finalists = matches.filter((tool) => connectorOf(tool, suffix).length === longest);
		const [tool] = finalists as [StackOneTool, ...StackOneTool[]];
		if (finalists.length > 1) {
			// The same provider linked twice. Picking one silently would run the action against an
			// account the caller never chose.
			warn(
				`"${actionId}" matches ${finalists.length} connectors (${finalists.map((t) => t.name).join(', ')}); using ${tool.name}. Pass accountIds to choose.`,
			);
		}

		// action_id LAST, deleted first so it is last in key order too. Spreading the arguments
		// over it would let a model-supplied "action_id" replace the action the caller pinned — the
		// exact thing a host app pins it for. session_id only when given: the served schema makes
		// it an optional string, so an absent key is valid and a null is not.
		const callArguments: JsonObject = { ...args };
		delete callArguments.action_id;
		if (sessionId !== undefined) {
			delete callArguments.session_id;
			callArguments.session_id = sessionId;
		}
		callArguments.action_id = actionId;

		return tool.execute(callArguments);
	}

	/**
	 * Record a verdict on how well the tools served this session, through the server's
	 * `stackone_submit_feedback` tool.
	 *
	 * The tool is found in the served catalog, never built here: the server serves it only when
	 * feedback is enabled for the project, and a client-side stand-in would report success for
	 * feedback that went nowhere. Unset optional fields are omitted, never sent as null.
	 *
	 * Makes exactly one `tools/call`, on the first account: the first of `accountIds` when given,
	 * otherwise the toolset's first, otherwise the first active account `GET /accounts` lists.
	 *
	 * @example
	 * ```typescript
	 * const [hit] = await toolset.search('list recent comments');
	 * if (!hit) throw new Error('No action matched');
	 * await toolset.execute(hit.action_id, {}, { sessionId: hit.session_id });
	 * await toolset.submitFeedback({
	 *   rating: 'positive',
	 *   toolNames: [hit.action_id],
	 *   sessionId: hit.session_id,
	 * });
	 * ```
	 *
	 * @throws ToolSetConfigError If `toolNames` is not a list, `sessionId` is empty or not a string,
	 *   or `accountIds` holds an empty id.
	 * @throws ToolSetLoadError If feedback is not enabled for this project.
	 */
	async submitFeedback(options: SubmitFeedbackOptions): Promise<JsonObject> {
		const { rating, toolNames, feedback, category, sessionId, source = 'model' } = options;
		if (typeof (toolNames as unknown) === 'string') {
			throw new ToolSetConfigError(
				`toolNames must be an array of tool names, not a string. Did you mean ["${String(toolNames)}"]?`,
			);
		}
		if (!Array.isArray(toolNames)) {
			throw new ToolSetConfigError('toolNames must be an array of tool names');
		}
		if (sessionId !== undefined && (typeof sessionId !== 'string' || !sessionId)) {
			throw new ToolSetConfigError(
				`sessionId must be a non-empty string, got ${JSON.stringify(sessionId)}`,
			);
		}

		// One account, one tools/call: the tool is global, so every account's copy records the same
		// feedback, and calling each would record it once per account. The first account, in the
		// order given, is the one a caller can predict. search_execute lists two meta tools per
		// connector where individual mode lists every action.
		const accountIds = (await this.#accountsInOrder(options.accountIds)).slice(0, 1);
		const tool = (await this.fetchTools({ accountIds, mode: 'search_execute' })).getTool(
			SUBMIT_FEEDBACK_TOOL_NAME,
		);
		if (!tool) {
			throw new ToolSetLoadError(
				`The server did not serve ${SUBMIT_FEEDBACK_TOOL_NAME}: feedback is not enabled for this project.`,
			);
		}

		const args: JsonObject = { rating, tool_names: [...toolNames] };
		const optional = { feedback, category, session_id: sessionId, source };
		for (const [key, value] of Object.entries(optional)) {
			if (value !== undefined && value !== null) {
				args[key] = value;
			}
		}
		return tool.execute(args);
	}
}

/**
 * Two accounts on one provider serve identically named tools, and `getTool()` returns whichever
 * was listed first. OpenAI accepts duplicate function names without complaint, so nothing
 * downstream surfaces it either — the only symptom would be an action running against an
 * account the caller never chose.
 */
function warnOnDuplicateNames(tools: readonly StackOneTool[]): void {
	const counts = new Map<string, number>();
	for (const tool of tools) {
		counts.set(tool.name, (counts.get(tool.name) ?? 0) + 1);
	}
	const clashing = [...counts]
		.filter(([name, count]) => count > 1 && name !== SUBMIT_FEEDBACK_TOOL_NAME)
		.map(([name]) => name)
		.sort();
	if (clashing.length > 0) {
		warn(
			`${clashing.length} tool name(s) are served by more than one account (${clashing.slice(0, 5).join(', ')}). getTool() will return the first one listed — pass accountIds to choose.`,
		);
	}
}
