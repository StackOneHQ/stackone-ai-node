/**
 * Lightweight TF-IDF vector index for offline vector search.
 * No external dependencies; tokenizes ASCII/latin text, lowercases,
 * strips punctuation, removes a small stopword set, and builds a sparse index.
 */

interface TfidfDocument {
	id: string;
	text: string;
}

interface TfidfResult {
	id: string;
	score: number; // cosine similarity (0..1)
}

const STOPWORDS = new Set([
	'a',
	'an',
	'the',
	'and',
	'or',
	'but',
	'if',
	'then',
	'else',
	'for',
	'of',
	'in',
	'on',
	'to',
	'from',
	'by',
	'with',
	'as',
	'at',
	'is',
	'are',
	'was',
	'were',
	'be',
	'been',
	'it',
	'this',
	'that',
	'these',
	'those',
	'not',
	'no',
	'can',
	'could',
	'should',
	'would',
	'may',
	'might',
	'do',
	'does',
	'did',
	'have',
	'has',
	'had',
	'you',
	'your',
]);

const tokenize = (text: string): string[] => {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9_\s]/g, ' ')
		.split(/\s+/)
		.filter((t) => t && !STOPWORDS.has(t));
};

type SparseVec = Map<number, number>; // termId -> weight

export class TfidfIndex {
	private vocab = new Map<string, number>();
	private idf: number[] = [];
	private docs: { id: string; vec: SparseVec; norm: number }[] = [];

	/**
	 * Build index from a corpus of documents
	 */
	build(corpus: TfidfDocument[]): void {
		// vocab + df
		const df = new Map<number, number>();
		const docsTokens: string[][] = corpus.map((d) => tokenize(d.text));

		// assign term ids
		for (const tokens of docsTokens) {
			for (const t of tokens) {
				if (!this.vocab.has(t)) this.vocab.set(t, this.vocab.size);
			}
		}

		// compute df
		for (const tokens of docsTokens) {
			const seen = new Set<number>();
			for (const t of tokens) {
				const id = this.vocab.get(t);
				if (id === undefined) continue;
				if (!seen.has(id)) {
					seen.add(id);
					df.set(id, (df.get(id) || 0) + 1);
				}
			}
		}

		// compute idf
		const N = corpus.length;
		this.idf = Array.from({ length: this.vocab.size }, (_, id) => {
			const dfi = df.get(id) || 0;
			// smoothed idf
			return Math.log((N + 1) / (dfi + 1)) + 1;
		});

		// doc vectors
		this.docs = corpus.map((d, i) => {
			const docTokens = docsTokens[i] ?? [];
			const tf = new Map<number, number>();
			for (const t of docTokens) {
				const id = this.vocab.get(t);
				if (id === undefined) continue;
				tf.set(id, (tf.get(id) || 0) + 1);
			}
			// build weighted vector
			const vec: SparseVec = new Map();
			let normSq = 0;
			tf.forEach((f, id) => {
				const idf = this.idf[id];
				if (idf === undefined || docTokens.length === 0) return;
				const w = (f / docTokens.length) * idf;
				if (w > 0) {
					vec.set(id, w);
					normSq += w * w;
				}
			});
			const norm = Math.sqrt(normSq) || 1;
			return { id: d.id, vec, norm };
		});
	}

	/**
	 * Search for documents similar to the query
	 * @param query - Search query
	 * @param k - Maximum number of results to return
	 * @returns Array of results sorted by score (descending)
	 */
	search(query: string, k = 10): TfidfResult[] {
		const tokens = tokenize(query);
		if (tokens.length === 0 || this.vocab.size === 0) return [];

		const tf = new Map<number, number>();
		for (const t of tokens) {
			const id = this.vocab.get(t);
			if (id !== undefined) tf.set(id, (tf.get(id) || 0) + 1);
		}

		if (tf.size === 0) return [];

		const qVec: SparseVec = new Map();
		let qNormSq = 0;
		const total = tokens.length;
		tf.forEach((f, id) => {
			const idf = this.idf[id];
			if (idf === undefined) return;
			const w = total === 0 ? 0 : (f / total) * idf;
			if (w > 0) {
				qVec.set(id, w);
				qNormSq += w * w;
			}
		});
		const qNorm = Math.sqrt(qNormSq) || 1;

		// cosine similarity with sparse vectors
		const scores: TfidfResult[] = [];
		for (const d of this.docs) {
			let dot = 0;
			// iterate over smaller map
			const [small, big] = qVec.size <= d.vec.size ? [qVec, d.vec] : [d.vec, qVec];
			small.forEach((w, id) => {
				const v = big.get(id);
				if (v !== undefined) dot += w * v;
			});
			const sim = dot / (qNorm * d.norm);
			if (sim > 0) scores.push({ id: d.id, score: Math.min(1, Math.max(0, sim)) });
		}

		scores.sort((a, b) => b.score - a.score);
		return scores.slice(0, k);
	}
}
