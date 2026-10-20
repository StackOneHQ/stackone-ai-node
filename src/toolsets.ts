import type { MergeExclusive, SimplifyDeep } from 'type-fest';
import {
	DEFAULT_BASE_URL,
	DEFAULT_TIMEOUT_MS,
	EXECUTE_ACTION_TOOL_NAME,
	FAILED_ACCOUNT_RETRY_MS,
	MAX_CONCURRENCY,
	MAX_TOP_K,
	SEARCH_ACTIONS_TOOL_NAME,
	SUBMIT_FEEDBACK_TOOL_NAME,
} from './consts';
import { buildRequestHeaders, isSdkOwnedHeader } from './headers';
import {
	type EndUserSource,
	HttpRateLimitError,
	type McpToolDefinition,
	isRateLimitFailure,
	listMcpTools,
	withEndUser,
	withEndUsers,
} from './mcp-client';
import { cloneJson, toolParametersFromInputSchema } from './schema';
import { StackOneMcpTool, type StackOneTool, Tools, warnOnDuplicateNames } from './tool';
import type {
	ActionResult,
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
	 * account configured, the toolset uses every active shared account linked to the API key
	 * (non-shared ones too with `includeNonShared`).
	 */
	accountId: string;
}

/**
 * Configuration with multiple account IDs
 */
interface MultipleAccountsConfig {
	/**
	 * Array of account IDs for filtering tools across multiple accounts
	 * When provided, tools will be fetched for all specified accounts. `null` is the same as
	 * leaving it unset.
	 * @example ['account-1', 'account-2']
	 */
	accountIds: string[] | null;
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
	/** Account IDs to scope tool discovery and execution. `null` is the same as leaving it unset. */
	accountIds?: string[] | null;
	/** Request timeout in milliseconds. Can also be set as a top-level config param which takes precedence. */
	timeout?: number;
}

/**
 * Base configuration for StackOne toolset (without account options)
 */
interface StackOneToolSetBaseConfig {
	/** API key. Defaults to the `STACKONE_API_KEY` environment variable. */
	apiKey?: string;
	/**
	 * Defaults to `STACKONE_BASE_URL`, then `https://api.stackone.com`. An empty value counts as
	 * unset, as in Python, so an empty variable falls through rather than producing hostless URLs.
	 */
	baseUrl?: string;
	/**
	 * Extra HTTP headers sent with every request. `Authorization`, `x-account-id` and
	 * `User-Agent` are always the SDK's own and cannot be set here. `x-end-user-id` can: it is
	 * passed through as given, unless `GET /accounts` reported the account's end user, which
	 * then replaces it.
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
	 * How the endpoint lists tools. `'search_execute'` returns one `stackone_search_actions` and
	 * one `stackone_execute_action` spanning every account in scope (with `stackone_list_accounts`)
	 * instead of one tool per action, keeping the catalog small enough for a model's context.
	 * Defaults to the server's own default (`'individual'`).
	 */
	toolMode?: ToolMode;
	/**
	 * Whether account discovery — used when no account id is passed — includes non-shared accounts
	 * (`shared: false`). Each belongs to a single end user, so by default discovery skips them,
	 * with a warning, rather than put every end user's accounts in one context. Account ids
	 * passed explicitly are always used. Default: `false`.
	 */
	includeNonShared?: boolean;
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
	 * then every active shared account linked to the API key (non-shared ones too with
	 * `includeNonShared`). `null` is the same as leaving it unset.
	 */
	accountIds?: string[] | null;

	/**
	 * Filter tools by provider names (case-insensitive). In individual mode a provider is matched
	 * as a full prefix of the tool name, so `browser_linkedin` matches
	 * `browser_linkedin_search_people`. In `search_execute` mode it narrows the account scope to
	 * the accounts `GET /accounts` reports on one of these providers.
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
	/** Maximum results, 1–50. Default: 10. */
	topK?: number;
	/**
	 * Restrict to these accounts. Defaults to the toolset's accounts, then every active shared
	 * one (non-shared ones too with `includeNonShared`). `null` is the same as leaving it unset.
	 */
	accountIds?: string[] | null;
}

/**
 * Options for {@link StackOneToolSet.execute}.
 */
export interface ExecuteActionOptions {
	/**
	 * The `session_id` a {@link StackOneToolSet.search} hit carries. Passing it links this call to
	 * that search server-side. Sent only when given; `null` behaves the same as leaving it unset.
	 */
	sessionId?: string | null;
	/**
	 * The accounts the call may run on. Defaults as for {@link StackOneToolSet.search}; `null` is
	 * the same as leaving it unset. Exactly one (distinct) id is sent as `stackone_account_id`,
	 * choosing the account; the server asks for one when the action's connector is linked on
	 * several accounts in scope and none is chosen.
	 */
	accountIds?: string[] | null;
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
	/**
	 * The session to attach the feedback to — the `session_id` of a search hit. `null` behaves
	 * the same as leaving it unset.
	 */
	sessionId?: string | null;
	/** Who produced the feedback. Default: `'model'`. */
	source?: FeedbackSource;
	/** The action run the feedback is about. Sent as `action_run_id`, only when given. */
	actionRunId?: string;
	/**
	 * The feedback is sent through the lowest of these account ids. Defaults as for
	 * {@link StackOneToolSet.fetchTools}. `null` is the same as leaving it unset.
	 */
	accountIds?: string[] | null;
}

/**
 * One served tool, with the endpoint and account it was listed for. A `search_execute` tool spans
 * every account named in its endpoint, so it has no account of its own.
 */
interface CatalogEntry {
	definition: McpToolDefinition;
	accountId?: string;
	endpoint: string;
}

/** A cached catalog: each healthy account's listing, and when and why each failing one failed. */
interface CachedCatalog {
	listings: ReadonlyMap<string, readonly CatalogEntry[]>;
	/** `at` is on {@link retryTiming}'s clock. */
	failed: ReadonlyMap<string, { at: number; message: string }>;
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

/** The JSON type of a value, as the messages shared with the Python SDK name it. */
const jsonType = (value: unknown): string =>
	value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

/** Refuse an account-id list the toolset cannot use. `null`, like `undefined`, is not given. */
const assertAccountIdList = (accountIds: unknown, parameter: string): void => {
	if (accountIds == null) {
		return;
	}
	if (typeof accountIds === 'string') {
		throw new ToolSetConfigError(
			`${parameter} must be a list of account ids, not a string. Did you mean [${JSON.stringify(accountIds)}]?`,
		);
	}
	if (!Array.isArray(accountIds) || accountIds.some((id) => typeof id !== 'string')) {
		throw new ToolSetConfigError(`${parameter} must be a list of account id strings`);
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
 * A thin client over the MCP endpoint. Tools are listed from it — per account, or in
 * `search_execute` mode once for every account in scope — and executed over its `tools/call`; the only other request is `GET /accounts`, to discover accounts. Schemas and
 * arguments are passed through as served, never rewritten, filtered or invented.
 *
 * An API key is enough: with no account configured, the toolset lists every active shared
 * account linked to the key, and non-shared ones too with `includeNonShared`.
 */
export class StackOneToolSet {
	readonly #apiKey: string;
	readonly #baseUrl: string;
	readonly #headers: Record<string, string>;
	readonly #timeout: number;
	readonly #toolMode: ToolMode | undefined;
	readonly #includeNonShared: boolean;
	readonly #accountId: string | undefined;
	#accountIds: string[];

	/**
	 * The listing per account scope, not the Tools built from it. Tools are mutable
	 * (`setAccountId` rebinds one), so handing the same instances back on a cache hit let one
	 * caller silently rescope every later caller's tools.
	 */
	readonly #catalogCache = new Map<string, CachedCatalog>();
	/**
	 * Listings in flight, keyed the same as {@link #catalogCache}. Concurrent calls for the same
	 * scope share this promise instead of each listing and storing independently — two callers
	 * racing to `store()` would let whichever finished last overwrite the other's catalog, which
	 * could hide a healthy account's tools behind a partial one.
	 */
	readonly #catalogInFlight = new Map<string, Promise<CachedCatalog>>();
	/**
	 * The `search_execute` listing per account scope, and the listings in flight, keyed as
	 * {@link #catalogCache} is. One request lists the whole scope, so there is nothing to keep per
	 * account.
	 */
	readonly #sessionCache = new Map<string, readonly CatalogEntry[]>();
	readonly #sessionInFlight = new Map<string, Promise<readonly CatalogEntry[]>>();
	#discoveredAccountIds: string[] | undefined;
	#discovering: Promise<string[]> | undefined;
	/** The `GET /accounts` in flight, if any, so an end-user lookup can share it. */
	#fetchingAccounts: Promise<StackOneAccount[]> | undefined;
	/**
	 * The end user of each non-shared account, as the last recorded `GET /accounts` reported it,
	 * sent as `x-end-user-id` on every MCP request for that account: the API refuses a non-shared
	 * account's request without it. Replaced whole, with {@link #providers}, by each successful
	 * `GET /accounts`, and kept by {@link clearCatalogCache} — it describes the accounts, not the
	 * catalog.
	 */
	#endUserIds: ReadonlyMap<string, string> = new Map();
	/** The provider of each account, recorded with {@link #endUserIds}. */
	#providers: ReadonlyMap<string, string> = new Map();
	/**
	 * Bumped at the start of every {@link fetchAccounts} call. Overlapping calls (it is public, and
	 * not deduplicated the way {@link #discoverAccountIds} is) can resolve out of order, so each
	 * records only if it started after the call whose result was last recorded
	 * ({@link #accountsRecorded}): a stale response never replaces a newer one, and a newer call
	 * that fails does not stop an older one from recording.
	 */
	#accountsStarted = 0;
	#accountsRecorded = 0;

	/**
	 * Where tools and listings find an account's end user: as recorded, or by looking it up with a
	 * `GET /accounts` — the one in flight, if there is one.
	 */
	readonly #endUsers: EndUserSource = {
		recorded: (accountId) => this.#endUserIds.get(accountId),
		lookUp: async (accountId) => {
			await (this.#fetchingAccounts ?? this.fetchAccounts());
			return this.#endUserIds.get(accountId);
		},
	};
	/**
	 * Bumped by {@link clearCatalogCache}. A listing already in flight when the cache is cleared
	 * captured the generation it started under, and refuses to write back if it has moved —
	 * otherwise the stale catalog would land after the clear and be served for the life of the
	 * process, which is the one thing the clear exists to prevent.
	 */
	#cacheGeneration = 0;

	/**
	 * Falls back to `STACKONE_API_KEY` and `STACKONE_BASE_URL`, but never reads an account id from
	 * the environment: `accountId` / `accountIds` must be passed, or every active shared account is
	 * used (non-shared ones too with `includeNonShared`).
	 * When `STACKONE_ACCOUNT_ID` is set and no account is passed, that is warned about, since 2.x
	 * read it.
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
		// widen every call to every discovered account.
		if (config.accountId === '') {
			throw new ToolSetConfigError('accountId must not be an empty string');
		}
		assertAccountIdList(config.accountIds, 'accountIds');
		assertAccountIdList(config.execute?.accountIds, 'execute.accountIds');

		const apiKey = config.apiKey || process.env.STACKONE_API_KEY;
		if (!apiKey) {
			throw new ToolSetConfigError(
				'An API key must be provided, either to the toolset or in the STACKONE_API_KEY environment variable',
			);
		}

		const ignoredHeaders = Object.keys(config.headers ?? {}).filter(isSdkOwnedHeader);
		if (ignoredHeaders.length > 0) {
			warn(
				`Ignoring headers ${ignoredHeaders.map((name) => `"${name}"`).join(', ')}: the SDK sets them itself. Pass the API key and account ids through their own options instead.`,
			);
		}

		this.#apiKey = apiKey;
		this.#baseUrl = config.baseUrl || process.env.STACKONE_BASE_URL || DEFAULT_BASE_URL;
		this.#headers = { ...config.headers };
		this.#timeout = config.timeout ?? config.execute?.timeout ?? DEFAULT_TIMEOUT_MS;
		this.#toolMode = config.toolMode;
		this.#includeNonShared = config.includeNonShared ?? false;
		this.#accountId = config.accountId;
		this.#accountIds = [...(config.accountIds ?? config.execute?.accountIds ?? [])];

		// 2.x read STACKONE_ACCOUNT_ID. An upgrade that keeps relying on it would silently widen to
		// every account on the key — other end users' accounts included — so say so, once.
		if (
			process.env.STACKONE_ACCOUNT_ID &&
			this.#accountId == null &&
			this.#accountIds.length === 0
		) {
			warn(
				'STACKONE_ACCOUNT_ID is set, but the SDK does not read it: with no account id passed, every active shared account on this API key is used. Pass an account id to scope the toolset.',
			);
		}
	}

	/**
	 * Set account IDs for filtering tools
	 * @param accountIds Array of account IDs to filter tools by. `null` clears them, as `[]` does.
	 * @returns This toolset instance for chaining
	 */
	setAccounts(accountIds: string[] | null): this {
		assertAccountIdList(accountIds, 'accountIds');
		this.#accountIds = [...(accountIds ?? [])];
		this.clearCatalogCache();
		return this;
	}

	/**
	 * Invalidate the cached tool catalog and discovered accounts.
	 *
	 * Call when linked accounts change outside of {@link setAccounts} or when you need to force a
	 * fresh fetch from the StackOne MCP endpoint. A listing already in flight will not write its
	 * result back into the cache, and no later call joins it.
	 */
	clearCatalogCache(): void {
		this.#cacheGeneration += 1;
		this.#catalogCache.clear();
		this.#catalogInFlight.clear();
		this.#sessionCache.clear();
		this.#sessionInFlight.clear();
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
	async openai(options?: { accountIds?: string[] | null }): Promise<ReturnType<Tools['toOpenAI']>> {
		const tools = await this.fetchTools({ accountIds: options?.accountIds });
		return tools.toOpenAI();
	}

	/**
	 * List the accounts linked to this API key.
	 *
	 * Each entry carries at least `id`, `provider` and `status`. Only accounts with
	 * `status === 'active'` can serve tools.
	 *
	 * Also records the end user of every non-shared account (`shared: false`, with an
	 * `origin_username`), which the toolset then sends as `x-end-user-id` on that account's MCP
	 * requests, and every account's provider. Overlapping calls record in the order they started:
	 * a call's result is recorded unless one started after it has already been.
	 *
	 * @throws StackOneAPIError If the API answers with an error status, including a 429 that
	 *   outlasted its retries or timed out while being retried.
	 * @throws ToolSetLoadError If the API cannot be reached, or answers with something that is
	 *   not a JSON list (including a body that is not valid UTF-8).
	 */
	async fetchAccounts(): Promise<StackOneAccount[]> {
		const fetching = this.#requestAccounts();
		this.#fetchingAccounts = fetching;
		const settled = (): void => {
			if (this.#fetchingAccounts === fetching) {
				this.#fetchingAccounts = undefined;
			}
		};
		fetching.then(settled, settled);
		return fetching;
	}

	async #requestAccounts(): Promise<StackOneAccount[]> {
		const url = `${this.#baseUrl.replace(/\/+$/, '')}/accounts`;
		const started = ++this.#accountsStarted;
		let response: Response;
		let rateLimited = false;
		try {
			response = await fetchWithRetry(
				url,
				{
					headers: buildRequestHeaders({ apiKey: this.#apiKey, extraHeaders: this.#headers }),
					signal: AbortSignal.timeout(this.#timeout),
				},
				{
					deadline: retryTiming.now() + this.#timeout,
					onRetry: () => {
						rateLimited = true;
					},
				},
			);
		} catch (error) {
			// Timing out while a 429 is retried is still the rate limit, as it is over MCP.
			if (rateLimited && error instanceof DOMException && error.name === 'TimeoutError') {
				throw new StackOneAPIError(
					`Listing accounts at ${url} was rate limited (429) and timed out after ${this.#timeout / 1000}s while retrying`,
					429,
					null,
					undefined,
					{ cause: error },
				);
			}
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
				`${`Listing accounts at ${url} failed with ${response.status} ${response.statusText}`.trimEnd()}: ${text}`,
				response.status,
				text,
				undefined,
				response.status === 429 ? { cause: new HttpRateLimitError(url) } : undefined,
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
				`Unexpected /accounts response shape: expected a list, got ${jsonType(accounts)}`,
			);
		}
		if (started > this.#accountsRecorded) {
			this.#accountsRecorded = started;
			this.#endUserIds = endUserIdsOf(accounts);
			this.#providers = providersOf(accounts);
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
	 * Non-shared accounts are skipped, with a warning, unless `includeNonShared` is set: each
	 * belongs to a single end user, and one context should not mix every end user's accounts.
	 *
	 * @throws ToolSetConfigError If the key has no accounts, none are active, or every active one is
	 *   non-shared and `includeNonShared` is not set.
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
					'This API key has no linked accounts. Link one in the StackOne dashboard, or pass an account id explicitly.',
				);
			}
			const listed = accounts
				.map((account) => `${String(account?.provider)} (${String(account?.status)})`)
				.join(', ');
			throw new ToolSetConfigError(
				`None of this API key's ${accounts.length} linked accounts are active: ${listed}. Re-link them in the StackOne dashboard, or pass an account id explicitly.`,
			);
		}
		const nonShared = new Set(
			accounts.filter((account) => account?.shared === false).map((account) => account.id),
		);
		const usable = this.#includeNonShared ? active : active.filter((id) => !nonShared.has(id));
		// A key with nothing usable fails, as one with no active accounts does, rather than leave
		// fetchTools() empty and execute() pointing at search().
		if (usable.length === 0) {
			throw new ToolSetConfigError(
				`None of this API key's ${active.length} active account(s) are shared: each belongs to a single end user. Pass their account ids, or opt in to non-shared accounts, to use them.`,
			);
		}
		const skipped = active.filter((id) => !usable.includes(id)).sort();
		if (skipped.length > 0) {
			warn(
				`Discovery skipped ${skipped.length} non-shared account(s) (${skipped.join(', ')}): each belongs to a single end user. Pass their account ids, or opt in to non-shared accounts, to use them.`,
			);
		}
		if (generation === this.#cacheGeneration) {
			this.#discoveredAccountIds = usable;
		}
		return usable;
	}

	/**
	 * The accounts a call is scoped to, in the order they were given: the call's own, then the
	 * toolset's, then its single account, then every discovered account — active and shared, or
	 * non-shared too with `includeNonShared` — in `GET /accounts` order.
	 */
	async #accountsInOrder(accountIds: string[] | null | undefined): Promise<string[]> {
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

	async #resolveAccountScope(accountIds: string[] | null | undefined): Promise<string[]> {
		// Sorted and deduplicated: the listing order, and the cache key, must not depend on the
		// order the caller happened to name the accounts in.
		return [...new Set(await this.#accountsInOrder(accountIds))].sort();
	}

	#endpoint(mode: ToolMode | undefined): string {
		const endpoint = `${this.#baseUrl.replace(/\/+$/, '')}/mcp`;
		return mode ? `${endpoint}?tool-mode=${mode}` : endpoint;
	}

	/**
	 * The `search_execute` endpoint for an account scope: every account as a repeated
	 * `x-account-id` query parameter, then the recorded end user of each non-shared one as a
	 * repeated `x-end-user-id`. Query parameters rather than headers, since `fetch` joins repeated
	 * headers into one comma-separated value.
	 */
	#sessionEndpoint(scope: readonly string[]): string {
		const params = new URLSearchParams({ 'tool-mode': 'search_execute' });
		for (const accountId of scope) {
			params.append('x-account-id', accountId);
		}
		const endUserIds = new Set(scope.flatMap((accountId) => this.#endUserIds.get(accountId) ?? []));
		for (const endUserId of endUserIds) {
			params.append('x-end-user-id', endUserId);
		}
		return `${this.#baseUrl.replace(/\/+$/, '')}/mcp?${params}`;
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
	 * The served catalog of an account scope, from the cache where it can be: one listing for the
	 * whole scope in `search_execute` mode, one per account otherwise. A scope with no accounts has
	 * an empty catalog.
	 */
	async #catalog(
		scope: readonly string[],
		mode: ToolMode | undefined,
		generation: number,
	): Promise<readonly CatalogEntry[]> {
		if (scope.length === 0) {
			return [];
		}
		return mode === 'search_execute'
			? this.#sessionCatalog(scope, generation)
			: this.#accountCatalog(scope, mode, generation);
	}

	/**
	 * The `search_execute` listing of a scope: one request, whose tools span every account in it.
	 * There is no account to skip, so a failure fails the call. Concurrent calls share the listing
	 * in flight, as {@link #accountCatalog}'s do.
	 */
	async #sessionCatalog(
		scope: readonly string[],
		generation: number,
	): Promise<readonly CatalogEntry[]> {
		const key = this.#cacheKey(scope, 'search_execute');
		const cached = this.#sessionCache.get(key);
		if (cached) {
			return cached;
		}
		const inFlight = this.#sessionInFlight.get(key);
		if (inFlight && generation === this.#cacheGeneration) {
			return inFlight;
		}

		const listing = this.#listSession(scope).then((entries) => {
			if (generation === this.#cacheGeneration) {
				this.#sessionCache.set(key, entries);
			}
			return entries;
		});
		if (generation === this.#cacheGeneration) {
			this.#sessionInFlight.set(key, listing);
		}
		try {
			return await listing;
		} finally {
			if (this.#sessionInFlight.get(key) === listing) {
				this.#sessionInFlight.delete(key);
			}
		}
	}

	/**
	 * List a scope's `search_execute` tools. The endpoint is built per attempt, so a retry after an
	 * end-user lookup names the end user it found; its tools execute on the endpoint that listed
	 * them.
	 */
	async #listSession(scope: readonly string[]): Promise<CatalogEntry[]> {
		const { endpoint, definitions } = await withEndUsers(scope, this.#endUsers, async () => {
			const endpoint = this.#sessionEndpoint(scope);
			const definitions = await listMcpTools({
				endpoint,
				headers: buildRequestHeaders({ apiKey: this.#apiKey, extraHeaders: this.#headers }),
				timeout: this.#timeout,
			});
			return { endpoint, definitions };
		});
		return definitions.map((definition) => ({ definition, endpoint }));
	}

	/**
	 * The catalog of every scoped account, listed one account at a time.
	 *
	 * One unusable account must not cost the caller every other account's tools, so a failing
	 * account is skipped with a warning. The healthy accounts' listings are cached all the same,
	 * and the failed account is left out — silently — until {@link FAILED_ACCOUNT_RETRY_MS} has
	 * passed, when the next call lists it again. Not caching at all made every call re-list every
	 * account, and wait out the full timeout on one that hangs.
	 *
	 * A 429 that outlasted its retries is not the account's fault but the key's, so it fails the
	 * whole listing instead: skipping it would hand back a catalog missing whichever accounts
	 * happened to be throttled. When every account fails, see {@link allAccountsFailed}.
	 */
	async #accountCatalog(
		scope: readonly string[],
		mode: ToolMode | undefined,
		generation: number,
	): Promise<readonly CatalogEntry[]> {
		const inScope = ({ listings }: CachedCatalog): CatalogEntry[] =>
			scope.flatMap((accountId) => listings.get(accountId) ?? []);
		const key = this.#cacheKey(scope, mode);
		const cached = this.#catalogCache.get(key);
		const now = retryTiming.now();
		const due = cached
			? [...cached.failed]
					.filter(([, { at }]) => now - at >= FAILED_ACCOUNT_RETRY_MS)
					.map(([accountId]) => accountId)
			: scope;
		if (cached && due.length === 0) {
			return inScope(cached);
		}

		// A listing that started before a clear is not joined: it belongs to the old generation.
		const inFlight = this.#catalogInFlight.get(key);
		if (inFlight && generation === this.#cacheGeneration) {
			return inScope(await inFlight);
		}

		const listing = this.#listCatalog(key, scope, due, cached, mode, generation);
		// Only a current listing is shared, so no later call can join one from before a clear.
		if (generation === this.#cacheGeneration) {
			this.#catalogInFlight.set(key, listing);
		}
		try {
			return inScope(await listing);
		} finally {
			if (this.#catalogInFlight.get(key) === listing) {
				this.#catalogInFlight.delete(key);
			}
		}
	}

	/**
	 * Lists every due account and stores the merged result under `key`, run at most once
	 * concurrently per key — see {@link #catalogInFlight}. Returns the listings it computed
	 * regardless of whether {@link #cacheGeneration} let them be cached, so a clear mid-flight
	 * cannot make a coalesced caller read back nothing.
	 */
	async #listCatalog(
		key: string,
		scope: readonly string[],
		due: readonly string[],
		cached: CachedCatalog | undefined,
		mode: ToolMode | undefined,
		generation: number,
	): Promise<CachedCatalog> {
		const endpoint = this.#endpoint(mode);
		const listAccount = async (accountId: string): Promise<CatalogEntry[]> => {
			const definitions = await withEndUser(accountId, this.#endUsers, (endUserId) =>
				listMcpTools({
					endpoint,
					headers: buildRequestHeaders({
						apiKey: this.#apiKey,
						accountId,
						endUserId,
						extraHeaders: this.#headers,
					}),
					timeout: this.#timeout,
				}),
			);
			return definitions.map((definition) => ({ definition, accountId, endpoint }));
		};
		const store = (catalog: CachedCatalog): void => {
			if (generation === this.#cacheGeneration) {
				this.#catalogCache.set(key, catalog);
			}
		};

		if (scope.length === 1) {
			const accountId = scope[0] as string;
			const listings = new Map([[accountId, await listAccount(accountId)]]);
			const catalog = { listings, failed: new Map() };
			store(catalog);
			return catalog;
		}

		const settled = await settleWithConcurrency(
			due,
			MAX_CONCURRENCY,
			listAccount,
			isRateLimitFailure,
		);
		const listings = new Map(cached?.listings);
		const failed = new Map(cached?.failed);
		const failures: [accountId: string, reason: unknown][] = [];
		settled.forEach((outcome, index) => {
			const accountId = due[index] as string;
			if (outcome.status === 'fulfilled') {
				listings.set(accountId, outcome.value);
				failed.delete(accountId);
			} else {
				failures.push([accountId, outcome.reason]);
			}
		});
		if (listings.size === 0) {
			throw allAccountsFailed(failures);
		}
		const failedNow = retryTiming.now();
		for (const [accountId, reason] of failures) {
			const message = describeError(reason);
			warn(`Skipping account that failed to list tools — ${accountId}: ${message}`);
			failed.set(accountId, { at: failedNow, message });
		}
		const catalog = { listings, failed };
		store(catalog);
		return catalog;
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
			endUsers: this.#endUsers,
		});
	}

	/**
	 * Fetch tools with optional filtering by account IDs, providers, and actions.
	 *
	 * The listing is cached per account scope and mode; filters are applied in memory, and every
	 * call builds fresh tool instances, so mutating one caller's tools never affects another's.
	 *
	 * In `search_execute` mode one request lists `stackone_list_accounts`, `stackone_search_actions`
	 * and `stackone_execute_action` spanning every account in scope; they are bound to no account
	 * and execute on that same endpoint. `providers` narrows the scope to accounts on those
	 * providers, looking them up with `GET /accounts` if one is not yet known. In individual mode
	 * each account is listed on its own, one tool per action.
	 *
	 * `stackone_submit_feedback` is served once per listing; it is returned once.
	 *
	 * Rate limits: a request answered 429 is retried up to 3 times, after the server's
	 * `Retry-After` (capped at 30s) or a 1s/2s/4s backoff, unless that wait would outlast the
	 * `timeout`. One still rate limited after that — or that times out while waiting to retry —
	 * fails the whole call. In individual mode an account that fails any other way is skipped with
	 * a warning, and left out for the next {@link FAILED_ACCOUNT_RETRY_MS}, but a 429 never yields
	 * a partial catalog. In `search_execute` mode there is one request, so any failure fails the
	 * call.
	 *
	 * @throws ToolSetConfigError If no account is configured and none can be discovered.
	 * @throws StackOneAPIError With status 429 if any request is still rate limited after the
	 *   retries; or with the API's status when the listing fails (in individual mode: every
	 *   account fails with that same status), so a caller can tell a revoked key's 401 from a 429.
	 * @throws ToolSetLoadError If the catalog cannot be loaded. When every account fails for
	 *   differing reasons, its `cause` is an `AggregateError` of each account's error.
	 */
	async fetchTools(options: FetchToolsOptions = {}): Promise<Tools> {
		try {
			const mode = options.mode === undefined ? this.#toolMode : (options.mode ?? undefined);
			// Taken before discovery: a clear while GET /accounts is out must stop this call's
			// listing being cached, as it was scoped by accounts discovered before the clear.
			const generation = this.#cacheGeneration;
			const providers = options.providers?.length ? options.providers : undefined;
			let scope = await this.#resolveAccountScope(options.accountIds);
			if (mode === 'search_execute' && providers) {
				scope = await this.#accountsOnProviders(scope, providers);
			}
			const entries = await this.#catalog(scope, mode, generation);

			let seenFeedbackTool = false;
			let tools = entries
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

			if (mode !== 'search_execute' && providers) {
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
	 * The accounts in `scope` whose provider, as `GET /accounts` reports it, is one of `providers`
	 * (case-insensitive). Accounts are looked up — joining a lookup in flight — when one in scope
	 * has no provider recorded; one the lookup does not name is left out.
	 */
	async #accountsOnProviders(
		scope: readonly string[],
		providers: readonly string[],
	): Promise<string[]> {
		if (scope.some((accountId) => !this.#providers.has(accountId))) {
			await (this.#fetchingAccounts ?? this.fetchAccounts());
		}
		const wanted = new Set(providers.map((provider) => provider.toLowerCase()));
		return scope.filter((accountId) => {
			const provider = this.#providers.get(accountId);
			return provider !== undefined && wanted.has(provider.toLowerCase());
		});
	}

	/**
	 * A tool of the `search_execute` listing for `accountIds`, whatever this toolset's own mode.
	 *
	 * The mode is passed down rather than switched on the instance, so a concurrent `fetchTools()`
	 * can never read the switched mode and cache these tools under the wrong key.
	 *
	 * @throws ToolSetLoadError If the server did not serve it.
	 */
	async #sessionTool(name: string, accountIds: string[] | null | undefined): Promise<StackOneTool> {
		const tools = await this.fetchTools({ accountIds, mode: 'search_execute' });
		const tool = tools.getStackOneTools().find((candidate) => candidate.name === name);
		if (!tool) {
			throw new ToolSetLoadError(`The server did not serve ${name} for this account scope.`);
		}
		return tool;
	}

	/**
	 * Find actions matching a natural-language query.
	 *
	 * One `stackone_search_actions` call searches every connector linked on the accounts in scope,
	 * ranked by the server, so a catalog of hundreds of tools never has to fit in a model's context.
	 *
	 * Rate limits: a request answered 429 is retried up to 3 times, after the server's
	 * `Retry-After` (capped at 30s) or a 1s/2s/4s backoff, unless that wait would outlast the
	 * `timeout`.
	 *
	 * @param query What you want to do, e.g. "list recent comments".
	 * @returns At most `topK` actions, best first, each as the server returned it — `action_id`,
	 *   `provider`, the `available_accounts` that can run it — plus the `session_id` of the search
	 *   when the server issued one. Pass `session_id` to {@link execute} and {@link submitFeedback}
	 *   to link the calls, and one of `available_accounts` in `accountIds` to choose the account.
	 * @throws ToolSetConfigError If `topK` is not an integer between 1 and 50.
	 * @throws StackOneAPIError If the search fails, including a 429 that outlasted its retries.
	 * @throws ToolSetLoadError If the server did not serve `stackone_search_actions`.
	 */
	async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
		const topK = options.topK === undefined ? 10 : options.topK;
		// The server rejects anything outside 1..50, but only after a round trip — and that reads
		// like an outage rather than a typo. Fail here, where the caller can see why.
		if (typeof topK !== 'number' || !Number.isInteger(topK) || topK < 1 || topK > MAX_TOP_K) {
			throw new ToolSetConfigError(
				`topK must be an integer between 1 and ${MAX_TOP_K}, got ${JSON.stringify(topK) ?? String(topK)}`,
			);
		}
		if (typeof query !== 'string') {
			throw new ToolSetConfigError(`query must be a string, got ${typeof query}`);
		}

		const tool = await this.#sessionTool(SEARCH_ACTIONS_TOOL_NAME, options.accountIds);
		const found = await tool.execute({ query, top_k: topK });
		// The server returns session_id once per search, beside the actions. Each hit carries it, so
		// a caller holding one hit can still link its execute() to this search.
		const sessionId = found.session_id;
		const traced = typeof sessionId === 'string' && sessionId ? { session_id: sessionId } : {};
		// Cut to topK: the server lists a synced copy, or a prerequisite, beside the hits it ranked.
		return (Array.isArray(found.actions) ? found.actions : [])
			.slice(0, topK)
			.filter((action): action is SearchResult => isPlainObject(action))
			.map((action) => ({ ...action, ...traced }));
	}

	/**
	 * Execute an action by id, as returned by {@link search}.
	 *
	 * Always runs through `stackone_execute_action`, so `args` is the nested envelope every
	 * action's `example_request` shows — `{ query: {...}, path: {...}, body: {...} }`. A
	 * `fetchTools()` tool takes the keys its own served schema names instead; routing by whether
	 * an id happened to be in the catalog would make the argument shape depend on something the
	 * caller cannot see. `actionId` is pinned last, so a model-supplied `action_id` in `args`
	 * cannot replace it.
	 *
	 * The server routes the action to the account in scope on its connector. When several are,
	 * it answers with an error naming them: pass one in `accountIds`.
	 *
	 * `args.headers` is forwarded to the action: `stackone_execute_action` serves `headers` as an
	 * open object, so any header name is declared — except `Authorization`, `x-account-id`,
	 * `User-Agent` and `x-end-user-id`, which the SDK sets itself and drops here with a warning.
	 *
	 * @param actionId The action to run, e.g. `linear_list_issues`.
	 * @param args The action's arguments.
	 * @param options.sessionId The `session_id` a search hit carries, to link this call to it.
	 * @param options.accountIds The accounts the action may run on. Exactly one is sent as
	 *   `stackone_account_id`, choosing it.
	 * @returns The action's result as the server wrote it: `{ isError: false, result, … }`.
	 * @throws ToolSetConfigError If the arguments are malformed.
	 * @throws ToolSetLoadError If the server did not serve `stackone_execute_action`.
	 * @throws StackOneAPIError If the action fails, or the server cannot choose its account.
	 */
	async execute(
		actionId: string,
		args?: JsonObject,
		options: ExecuteActionOptions = {},
	): Promise<ActionResult> {
		if (typeof actionId !== 'string' || !actionId) {
			throw new ToolSetConfigError(
				`actionId must be a non-empty string, got ${JSON.stringify(actionId) ?? String(actionId)}`,
			);
		}
		if (args !== undefined && !isPlainObject(args)) {
			throw new ToolSetConfigError(`arguments must be a JSON object, got ${jsonType(args)}`);
		}
		const { sessionId } = options;
		if (sessionId != null && (typeof sessionId !== 'string' || !sessionId)) {
			throw new ToolSetConfigError(
				`sessionId must be a non-empty string, got ${JSON.stringify(sessionId)}`,
			);
		}

		const tool = await this.#sessionTool(EXECUTE_ACTION_TOOL_NAME, options.accountIds);
		const chosen = [...new Set(options.accountIds ?? [])];

		// Each option the caller set replaces the argument of its name, deleted first so it lands
		// after the caller's keys, and action_id last of all: spreading the arguments over it would
		// let a model-supplied "action_id" replace the action the caller pinned — the exact thing a
		// host app pins it for. Optional ones only when given: the served schema makes them optional
		// strings, so an absent key is valid and a null is not.
		const callArguments: JsonObject = { ...args };
		if (chosen.length === 1) {
			delete callArguments.stackone_account_id;
			callArguments.stackone_account_id = chosen[0] as string;
		}
		if (sessionId != null) {
			delete callArguments.session_id;
			callArguments.session_id = sessionId;
		}
		delete callArguments.action_id;
		callArguments.action_id = actionId;

		// stackone_execute_action answers with the action's result wrapper; see ActionResult.
		return (await tool.execute(callArguments)) as ActionResult;
	}

	/**
	 * Record a verdict on how well the tools served this session, through the server's
	 * `stackone_submit_feedback` tool.
	 *
	 * The tool is found in the served catalog, never built here: the server serves it only when
	 * feedback is enabled for the project, and a client-side stand-in would report success for
	 * feedback that went nowhere. Unset optional fields are omitted, never sent as null.
	 *
	 * Makes exactly one `tools/call`, on the account with the lowest id among those the call is
	 * scoped to: `accountIds` when given, otherwise the toolset's, otherwise every active shared
	 * one (non-shared ones too with `includeNonShared`).
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
	async submitFeedback(options: SubmitFeedbackOptions): Promise<ActionResult> {
		const {
			rating,
			toolNames,
			feedback,
			category,
			sessionId,
			actionRunId,
			source = 'model',
		} = options;
		if (typeof (toolNames as unknown) === 'string') {
			throw new ToolSetConfigError(
				`toolNames must be a list of tool names, not a string. Did you mean [${JSON.stringify(toolNames)}]?`,
			);
		}
		if (!Array.isArray(toolNames)) {
			throw new ToolSetConfigError('toolNames must be an array of tool names');
		}
		if (sessionId != null && (typeof sessionId !== 'string' || !sessionId)) {
			throw new ToolSetConfigError(
				`sessionId must be a non-empty string, got ${JSON.stringify(sessionId)}`,
			);
		}

		// One account, one tools/call: the tool is global, so every account's copy records the same
		// feedback, and calling each would record it once per account. The lowest id is the one a
		// caller can predict, whatever order GET /accounts lists them in. search_execute lists three
		// tools where individual mode lists every action.
		const accountIds = (await this.#resolveAccountScope(options.accountIds)).slice(0, 1);
		const tool = (await this.fetchTools({ accountIds, mode: 'search_execute' })).getTool(
			SUBMIT_FEEDBACK_TOOL_NAME,
		);
		if (!tool) {
			throw new ToolSetLoadError(
				`The server did not serve ${SUBMIT_FEEDBACK_TOOL_NAME}: feedback is not enabled for this project.`,
			);
		}

		const args: JsonObject = { rating, tool_names: [...toolNames] };
		const optional = {
			feedback,
			category,
			session_id: sessionId,
			action_run_id: actionRunId,
			source,
		};
		for (const [key, value] of Object.entries(optional)) {
			if (value !== undefined && value !== null) {
				args[key] = value;
			}
		}
		return (await tool.execute(args)) as ActionResult;
	}
}

/**
 * The end user of each non-shared account in a `GET /accounts` listing: one with `shared: false`
 * and a non-empty `origin_username`. A shared account has no single end user to send.
 */
function endUserIdsOf(accounts: readonly unknown[]): Map<string, string> {
	const endUserIds = new Map<string, string>();
	for (const account of accounts) {
		if (
			isPlainObject(account) &&
			typeof account.id === 'string' &&
			account.id &&
			account.shared === false &&
			typeof account.origin_username === 'string' &&
			account.origin_username
		) {
			endUserIds.set(account.id, account.origin_username);
		}
	}
	return endUserIds;
}

/** The provider of each account in a `GET /accounts` listing that names one. */
function providersOf(accounts: readonly unknown[]): Map<string, string> {
	const providers = new Map<string, string>();
	for (const account of accounts) {
		if (
			isPlainObject(account) &&
			typeof account.id === 'string' &&
			account.id &&
			typeof account.provider === 'string' &&
			account.provider
		) {
			providers.set(account.id, account.provider);
		}
	}
	return providers;
}

/**
 * The error for a listing in which every account failed.
 *
 * When they all failed with one HTTP status, that error is rethrown as it came, so a revoked key
 * is a 401 however many accounts it has, as it is with one. Otherwise the summary keeps every
 * account's own error as its `cause`.
 */
function allAccountsFailed(failures: readonly [accountId: string, reason: unknown][]): Error {
	const reasons = failures.map(([, reason]) => reason);
	const [first] = reasons;
	if (
		first instanceof StackOneAPIError &&
		reasons.every(
			(reason) => reason instanceof StackOneAPIError && reason.statusCode === first.statusCode,
		)
	) {
		return first;
	}
	return new ToolSetLoadError(
		`Every account failed to list tools: ${failures.map(([accountId, reason]) => `${accountId}: ${describeError(reason)}`).join('; ')}`,
		{ cause: new AggregateError(reasons, 'Every account failed to list tools') },
	);
}
