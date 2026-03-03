/**
 * Local BM25 + TF-IDF hybrid keyword search for tool discovery.
 *
 * Provides offline tool search as a fallback when the semantic search API
 * is unavailable, or when explicitly requested via `search: "local"`.
 *
 * Algorithm:
 * - BM25 scoring via Orama library
 * - TF-IDF cosine similarity via custom TfidfIndex
 * - Hybrid fusion: `alpha * bm25 + (1 - alpha) * tfidf`
 * - Default alpha = 0.2 (20% BM25, 80% TF-IDF)
 */

import * as orama from '@orama/orama';
import { DEFAULT_HYBRID_ALPHA } from './consts';
import type { BaseTool } from './tool';
import type { ToolParameters } from './types';
import { TfidfIndex } from './utils/tfidf-index';

/**
 * Result from local tool search
 */
export interface ToolSearchResult {
	name: string;
	description: string;
	score: number;
}

type OramaDb = ReturnType<typeof orama.create>;

/**
 * Clamp value to [0, 1]
 */
function clamp01(x: number): number {
	return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Initialize TF-IDF index for tool search
 */
function initializeTfidfIndex(tools: BaseTool[]): TfidfIndex {
	const index = new TfidfIndex();
	const corpus = tools.map((tool) => {
		const parts = tool.name.split('_');
		const integration = parts[0];

		const actionTypes = ['create', 'update', 'delete', 'get', 'list', 'search'];
		const actions = parts.filter((p) => actionTypes.includes(p));

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
 * @see https://docs.orama.com/open-source/usage/create
 * @see https://docs.orama.com/open-source/usage/search/bm25-algorithm/
 */
async function initializeOramaDb(tools: BaseTool[]): Promise<OramaDb> {
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

	for (const tool of tools) {
		const parts = tool.name.split('_');
		const integration = parts[0];

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

/**
 * Hybrid BM25 + TF-IDF tool search index.
 *
 * Provides local tool discovery without API calls.
 * Used as a fallback when semantic search is unavailable.
 */
export class ToolIndex {
	private tools: BaseTool[];
	private hybridAlpha: number;
	private oramaDbPromise: Promise<OramaDb>;
	private tfidfIndex: TfidfIndex;

	/**
	 * Initialize tool index with hybrid search
	 *
	 * @param tools - List of tools to index
	 * @param hybridAlpha - Weight for BM25 in hybrid search (0-1). Default 0.2.
	 */
	constructor(tools: BaseTool[], hybridAlpha?: number) {
		this.tools = tools;
		const alpha = hybridAlpha ?? DEFAULT_HYBRID_ALPHA;
		this.hybridAlpha = Math.max(0, Math.min(1, alpha));
		this.oramaDbPromise = initializeOramaDb(tools);
		this.tfidfIndex = initializeTfidfIndex(tools);
	}

	/**
	 * Search for relevant tools using hybrid BM25 + TF-IDF
	 *
	 * @param query - Natural language query
	 * @param limit - Maximum number of results (default 5)
	 * @param minScore - Minimum relevance score 0-1 (default 0.0)
	 * @returns List of search results sorted by relevance
	 */
	async search(query: string, limit = 5, minScore = 0.0): Promise<ToolSearchResult[]> {
		if (this.tools.length === 0) {
			return [];
		}

		const fetchLimit = Math.max(50, limit);
		const oramaDb = await this.oramaDbPromise;

		const [bm25Results, tfidfResults] = await Promise.all([
			orama.search(oramaDb, {
				term: query,
				limit: Math.max(50, limit),
			} as Parameters<typeof orama.search>[1]),
			Promise.resolve(this.tfidfIndex.search(query, fetchLimit)),
		]);

		// Build score map for fusion
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

		// Fuse scores: hybrid_score = alpha * bm25 + (1 - alpha) * tfidf
		const fused: Array<{ name: string; score: number }> = [];
		for (const [name, scores] of scoreMap) {
			const bm25 = scores.bm25 ?? 0;
			const tfidf = scores.tfidf ?? 0;
			const score = this.hybridAlpha * bm25 + (1 - this.hybridAlpha) * tfidf;
			fused.push({ name, score });
		}

		fused.sort((a, b) => b.score - a.score);

		const results: ToolSearchResult[] = [];
		for (const r of fused) {
			if (r.score < minScore) {
				continue;
			}

			const tool = this.tools.find((t) => t.name === r.name);
			if (!tool) {
				continue;
			}

			results.push({
				name: tool.name,
				description: tool.description,
				score: r.score,
			});

			if (results.length >= limit) {
				break;
			}
		}

		return results;
	}
}
