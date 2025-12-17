/**
 * Package name used as User-Agent header
 */
export const USER_AGENT = 'stackone-ai-node';

/**
 * Default base URL for StackOne API
 */
export const DEFAULT_BASE_URL = 'https://api.stackone.com';

/**
 * Default weight for BM25 in hybrid BM25 + TF-IDF search.
 *
 * - alpha=0.2 means: 20% BM25 + 80% TF-IDF
 * - This value was optimized through validation testing
 * - Provides 10.8% improvement in tool discovery accuracy
 * - Lower values favor BM25 scoring (better keyword matching)
 * - Higher values favor TF-IDF scoring (better semantic matching)
 */
export const DEFAULT_HYBRID_ALPHA = 0.2;

/**
 * Prefix used by legacy Unified API tools.
 * Tools with this prefix indicate missing or incorrect account configuration.
 */
export const UNIFIED_API_PREFIX = 'unified_';
