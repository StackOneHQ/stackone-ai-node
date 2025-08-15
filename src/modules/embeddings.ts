import { type EmbeddingModel, cosineSimilarity, embed, embedMany } from 'ai';

/**
 * Configuration for embedding generation
 */
export interface EmbeddingConfig<VALUE = string> {
  model: EmbeddingModel<VALUE>;
  dimensions?: number;
}

/**
 * Manager for generating embeddings using AI SDK
 */
export class EmbeddingManager {
  private config?: EmbeddingConfig;

  constructor(config?: EmbeddingConfig) {
    this.config = config;
  }

  /**
   * Check if embeddings are enabled
   */
  get isEnabled(): boolean {
    return !!this.config?.model;
  }

  /**
   * Get configured dimensions, or undefined if not set
   */
  get dimensions(): number | undefined {
    return this.config?.dimensions;
  }

  /**
   * Generate embedding for a single text
   * @param text Text to embed
   * @returns Embedding vector or null if no config
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.config?.model) {
      return null;
    }

    const { embedding } = await embed({
      model: this.config.model,
      value: text,
    });

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts
   * @param texts Array of texts to embed
   * @returns Array of embedding vectors (null for unavailable embeddings)
   */
  async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!this.config?.model) {
      return texts.map(() => null);
    }

    if (texts.length === 0) {
      return [];
    }

    const { embeddings } = await embedMany({
      model: this.config.model,
      values: texts,
    });

    return embeddings;
  }
}

/**
 * Re-export cosineSimilarity for convenience
 */
export { cosineSimilarity };

/**
 * Combine and normalize scores from different search modes
 */
export function combineScores(
  bm25Score: number,
  embeddingScore: number,
  weights: { bm25: number; embeddings: number } = { bm25: 0.5, embeddings: 0.5 }
): number {
  // Normalize weights to sum to 1
  const totalWeight = weights.bm25 + weights.embeddings;
  const normalizedBm25Weight = weights.bm25 / totalWeight;
  const normalizedEmbeddingWeight = weights.embeddings / totalWeight;

  return bm25Score * normalizedBm25Weight + embeddingScore * normalizedEmbeddingWeight;
}
