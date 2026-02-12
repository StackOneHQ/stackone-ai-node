/**
 * Semantic search client for StackOne action search API.
 *
 * The SDK provides three ways to discover tools using semantic search:
 *
 * 1. `searchTools(query)` — Full tool discovery (recommended for agent frameworks)
 *    Fetches tools from linked accounts, queries semantic API, filters to available
 *    connectors, deduplicates, and returns matched Tool definitions sorted by relevance.
 *
 * 2. `searchActionNames(query)` — Lightweight discovery
 *    Queries the semantic API directly and returns action name metadata without
 *    fetching full tool definitions. Useful for previewing results.
 *
 * 3. `utilityTools({ semanticClient })` — Agent-loop search + execute
 *    Creates a `tool_search` utility tool that agents can call in a loop,
 *    using cloud-based semantic vectors instead of local BM25 + TF-IDF.
 */

import { DEFAULT_BASE_URL } from './consts';

/**
 * Regex to match versioned API action names and extract the MCP-format name.
 * Example: "calendly_1.0.0_calendly_create_scheduling_link_global" -> "calendly_create_scheduling_link"
 */
const VERSIONED_ACTION_RE = /^[a-z][a-z0-9]*_\d+(?:\.\d+)+_(.+)_global$/;

/**
 * Normalize a versioned API action name to MCP format.
 * Non-matching names pass through unchanged.
 */
export function normalizeActionName(actionName: string): string {
	const match = VERSIONED_ACTION_RE.exec(actionName);
	return match ? match[1] : actionName;
}

/**
 * Raised when semantic search fails
 */
export class SemanticSearchError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'SemanticSearchError';
	}
}

/**
 * Single result from semantic search API
 */
export interface SemanticSearchResult {
	actionName: string;
	connectorKey: string;
	similarityScore: number;
	label: string;
	description: string;
}

/**
 * Response from /actions/search endpoint
 */
export interface SemanticSearchResponse {
	results: SemanticSearchResult[];
	totalCount: number;
	query: string;
}

/**
 * Raw API response shape (snake_case from the backend)
 */
interface RawSemanticSearchResult {
	action_name: string;
	connector_key: string;
	similarity_score: number;
	label: string;
	description: string;
}

interface RawSemanticSearchResponse {
	results: RawSemanticSearchResult[];
	total_count: number;
	query: string;
}

/**
 * Configuration for SemanticSearchClient
 */
export interface SemanticSearchClientConfig {
	apiKey: string;
	baseUrl?: string;
	timeout?: number;
}

/**
 * Client for StackOne semantic search API.
 *
 * Uses enhanced embeddings on the backend for higher accuracy than local BM25+TF-IDF search.
 *
 * @example
 * ```typescript
 * const client = new SemanticSearchClient({ apiKey: 'sk-xxx' });
 * const response = await client.search('create employee', { connector: 'bamboohr', topK: 5 });
 * for (const result of response.results) {
 *   console.log(`${result.actionName}: ${result.similarityScore.toFixed(2)}`);
 * }
 * ```
 */
export class SemanticSearchClient {
	readonly apiKey: string;
	readonly baseUrl: string;
	readonly timeout: number;

	constructor(config: SemanticSearchClientConfig) {
		this.apiKey = config.apiKey;
		this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
		this.timeout = config.timeout ?? 30_000;
	}

	/**
	 * Build the Basic auth header
	 */
	_buildAuthHeader(): string {
		const token = Buffer.from(`${this.apiKey}:`).toString('base64');
		return `Basic ${token}`;
	}

	/**
	 * Search for relevant actions using semantic search.
	 *
	 * @param query - Natural language query describing what tools/actions you need
	 * @param options - Optional search parameters
	 * @returns SemanticSearchResponse containing matching actions with similarity scores
	 * @throws SemanticSearchError if the API call fails
	 */
	async search(
		query: string,
		options?: { connector?: string; topK?: number },
	): Promise<SemanticSearchResponse> {
		const url = `${this.baseUrl}/actions/search`;
		const headers: Record<string, string> = {
			Authorization: this._buildAuthHeader(),
			'Content-Type': 'application/json',
		};

		const payload: Record<string, unknown> = { query };
		if (options?.topK != null) {
			payload.top_k = options.topK;
		}
		if (options?.connector) {
			payload.connector = options.connector;
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.timeout);

			const response = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(payload),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const text = await response.text();
				throw new SemanticSearchError(`API error: ${response.status} - ${text}`);
			}

			const data = (await response.json()) as RawSemanticSearchResponse;
			return parseSemanticSearchResponse(data);
		} catch (error) {
			if (error instanceof SemanticSearchError) {
				throw error;
			}
			if (error instanceof DOMException && error.name === 'AbortError') {
				throw new SemanticSearchError('Request timed out', { cause: error });
			}
			throw new SemanticSearchError(
				`Request failed: ${error instanceof Error ? error.message : String(error)}`,
				{ cause: error },
			);
		}
	}

	/**
	 * Convenience method returning just action names.
	 *
	 * @param query - Natural language query
	 * @param options - Optional parameters including connector filter and min score
	 * @returns List of action names sorted by relevance
	 */
	async searchActionNames(
		query: string,
		options?: { connector?: string; topK?: number; minScore?: number },
	): Promise<string[]> {
		const response = await this.search(query, {
			connector: options?.connector,
			topK: options?.topK,
		});
		const minScore = options?.minScore ?? 0;
		return response.results.filter((r) => r.similarityScore >= minScore).map((r) => r.actionName);
	}
}

/**
 * Parse raw snake_case API response into camelCase interface
 */
function parseSemanticSearchResponse(raw: RawSemanticSearchResponse): SemanticSearchResponse {
	return {
		results: raw.results.map((r) => ({
			actionName: r.action_name,
			connectorKey: r.connector_key,
			similarityScore: r.similarity_score,
			label: r.label,
			description: r.description,
		})),
		totalCount: raw.total_count,
		query: raw.query,
	};
}
