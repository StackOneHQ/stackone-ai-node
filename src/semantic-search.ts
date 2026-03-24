/**
 * Semantic search client for StackOne action search API.
 *
 * How Semantic Search Works
 * =========================
 *
 * The SDK provides three ways to discover tools using semantic search.
 * Each path trades off between speed, filtering, and completeness.
 *
 * 1. `searchTools(query)` — Full tool discovery (recommended for agent frameworks)
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * This is the primary method used when integrating with OpenAI, Anthropic, or AI SDK.
 * The internal flow is:
 *
 * 1. Fetch tools from linked accounts via MCP to discover available connectors
 * 2. Search EACH connector in parallel via the semantic search API (/actions/search)
 * 3. The search API returns results with full `inputSchema` for each action
 * 4. Build executable tools directly from search results (no match-back needed)
 * 5. Deduplicate by actionId, sort by relevance score, apply topK
 * 6. Return Tools sorted by relevance score
 *
 * Key point: only the user's own connectors are searched — no wasted results
 * from connectors the user doesn't have. The search API returns `inputSchema`
 * with each result, so tools can be built directly without a separate fetch.
 *
 * If the semantic API is unavailable, the SDK falls back to a local
 * BM25 + TF-IDF hybrid search over the fetched tools (unless
 * `search: "semantic"` is specified).
 *
 *
 * 2. `searchActionNames(query)` — Lightweight discovery
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * Queries the semantic API directly and returns action metadata
 * (actionId, connector, score, description, inputSchema) **without**
 * building full tool objects. Useful for previewing results before
 * committing to a full fetch.
 *
 * When `accountIds` are provided, each connector is searched in
 * parallel (same as `searchTools`). Without `accountIds`, results
 * come from the full StackOne catalog.
 *
 *
 * 3. `toolset.getSearchTool()` — Agent-loop callable
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * Returns a `SearchTool` instance that wraps `searchTools()`.
 * Call it with a natural language query to get a `Tools` collection
 * back. Designed for agent loops where the LLM decides what to search for.
 */

import { DEFAULT_BASE_URL } from './consts';
import { StackOneError } from './utils/error-stackone';

/**
 * Raised when semantic search fails.
 */
export class SemanticSearchError extends StackOneError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'SemanticSearchError';
	}
}

/**
 * Single result from semantic search API.
 */
export interface SemanticSearchResult {
	id: string;
	similarityScore: number;
}

/**
 * Response from /actions/search endpoint.
 */
export interface SemanticSearchResponse {
	results: SemanticSearchResult[];
	totalCount: number;
	query: string;
	connectorFilter?: string;
	projectFilter?: string;
}

/**
 * Options for semantic search
 */
export interface SemanticSearchOptions {
	connector?: string;
	topK?: number;
	projectId?: string;
	minSimilarity?: number;
}

/**
 * Client for StackOne semantic search API.
 *
 * This client provides access to the semantic search endpoint which uses
 * enhanced embeddings for higher accuracy than local BM25+TF-IDF search.
 *
 * @example
 * ```typescript
 * const client = new SemanticSearchClient({ apiKey: 'sk-xxx' });
 * const response = await client.search('create employee', { connector: 'bamboohr', topK: 5 });
 * for (const result of response.results) {
 *   console.log(`${result.actionId}: ${result.similarityScore.toFixed(2)}`);
 * }
 * ```
 */
export class SemanticSearchClient {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly timeout: number;

	constructor({
		apiKey,
		baseUrl = DEFAULT_BASE_URL,
		timeout = 30_000,
	}: {
		apiKey: string;
		baseUrl?: string;
		timeout?: number;
	}) {
		this.apiKey = apiKey;
		this.baseUrl = baseUrl.replace(/\/+$/, '');
		this.timeout = timeout;
	}

	/**
	 * Build the Basic auth header.
	 */
	private buildAuthHeader(): string {
		const token = Buffer.from(`${this.apiKey}:`).toString('base64');
		return `Basic ${token}`;
	}

	/**
	 * Search for relevant actions using semantic search.
	 *
	 * @param query - Natural language query describing what tools/actions you need
	 * @param options - Search options (connector, topK, projectId, minSimilarity)
	 * @returns SemanticSearchResponse containing matching actions with similarity scores
	 * @throws SemanticSearchError if the API call fails
	 *
	 * @example
	 * ```typescript
	 * const response = await client.search('onboard a new team member', { topK: 5 });
	 * for (const result of response.results) {
	 *   console.log(`${result.actionId}: ${result.similarityScore.toFixed(2)}`);
	 * }
	 * ```
	 */
	async search(query: string, options?: SemanticSearchOptions): Promise<SemanticSearchResponse> {
		const url = `${this.baseUrl}/actions/search`;
		const headers: Record<string, string> = {
			Authorization: this.buildAuthHeader(),
			'Content-Type': 'application/json',
		};

		const payload: Record<string, unknown> = { query };
		if (options?.topK != null) {
			payload.top_k = options.topK;
		}
		if (options?.connector) {
			payload.connector = options.connector;
		}
		if (options?.projectId) {
			payload.project_id = options.projectId;
		}
		if (options?.minSimilarity != null) {
			payload.min_similarity = options.minSimilarity;
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(payload),
				signal: controller.signal,
			});

			if (!response.ok) {
				const text = await response.text();
				throw new SemanticSearchError(`API error: ${response.status} - ${text}`);
			}

			const data = (await response.json()) as {
				results: Array<{
					id: string;
					similarity_score: number;
				}>;
				total_count: number;
				query: string;
				connector_filter?: string;
				project_filter?: string;
			};

			return {
				results: data.results.map((r) => ({
					id: r.id,
					similarityScore: r.similarity_score,
				})),
				totalCount: data.total_count,
				query: data.query,
				connectorFilter: data.connector_filter,
				projectFilter: data.project_filter,
			};
		} catch (error) {
			if (error instanceof SemanticSearchError) {
				throw error;
			}
			if (error instanceof Error && error.name === 'AbortError') {
				throw new SemanticSearchError(`Request timed out after ${this.timeout}ms`);
			}
			throw new SemanticSearchError(
				`Search failed: ${error instanceof Error ? error.message : String(error)}`,
				{ cause: error },
			);
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Convenience method returning just action names.
	 *
	 * @param query - Natural language query
	 * @param options - Search options (connector, topK, minSimilarity, projectId)
	 * @returns List of action names sorted by relevance
	 *
	 * @example
	 * ```typescript
	 * const actionNames = await client.searchActionNames('create employee', {
	 *   connector: 'bamboohr',
	 *   minSimilarity: 0.5,
	 * });
	 * ```
	 */
	async searchActionNames(query: string, options?: SemanticSearchOptions): Promise<string[]> {
		const response = await this.search(query, options);
		return response.results.map((r) => r.id);
	}
}
