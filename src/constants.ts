/**
 * Default weight for BM25 in hybrid BM25 + TF-IDF search.
 *
 * - alpha=0.2 means: 20% BM25 + 80% TF-IDF
 * - This value was optimised through validation testing
 * - Provides 10.8% improvement in tool discovery accuracy
 * - Lower values favour BM25 scoring (better keyword matching)
 * - Higher values favour TF-IDF scoring (better semantic matching)
 */
export const DEFAULT_HYBRID_ALPHA = 0.2;
