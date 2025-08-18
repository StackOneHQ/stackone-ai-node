import { describe, expect, it } from 'bun:test';
import { cosineSimilarity } from 'ai';
import { MockEmbeddingModelV1 } from 'ai/test';
import { EmbeddingManager, combineScores } from '../modules/embeddings';

describe('EmbeddingManager', () => {
  it('should be disabled without config', () => {
    const manager = new EmbeddingManager();
    expect(manager.isEnabled).toBe(false);
  });

  it('should be enabled with model config', () => {
    const mockModel = new MockEmbeddingModelV1({
      modelId: 'test-model',
      provider: 'test-provider',
    });
    const manager = new EmbeddingManager({ model: mockModel });
    expect(manager.isEnabled).toBe(true);
  });

  it('should return null for single embedding when disabled', async () => {
    const manager = new EmbeddingManager();
    const result = await manager.generateEmbedding('test');
    expect(result).toBe(null);
  });

  it('should return null array for batch embeddings when disabled', async () => {
    const manager = new EmbeddingManager();
    const result = await manager.generateEmbeddings(['test1', 'test2']);
    expect(result).toEqual([null, null]);
  });

  it('should generate single embedding when enabled', async () => {
    const mockEmbedding = [0.1, 0.2, 0.3];
    const mockModel = new MockEmbeddingModelV1({
      modelId: 'test-model',
      provider: 'test-provider',
      doEmbed: async ({ values }) => {
        expect(values).toEqual(['test text']);
        return {
          embeddings: [mockEmbedding],
          usage: { tokens: 2 },
        };
      },
    });

    const manager = new EmbeddingManager({ model: mockModel });
    const result = await manager.generateEmbedding('test text');

    expect(result).toEqual(mockEmbedding);
  });

  it('should generate batch embeddings when enabled', async () => {
    const mockEmbeddings = [
      [0.1, 0.2],
      [0.3, 0.4],
    ];
    let callCount = 0;
    const expectedValues = ['test1', 'test2'];

    const mockModel = new MockEmbeddingModelV1({
      modelId: 'test-model',
      provider: 'test-provider',
      doEmbed: async ({ values }) => {
        // MockEmbeddingModelV1 calls doEmbed for each batch, may process individually
        // Just verify we get the correct values in any order
        expect(values.length).toBeGreaterThan(0);
        expect(expectedValues).toContainEqual(values[0]);

        callCount++;
        const startIndex = callCount - 1;
        return {
          embeddings: [mockEmbeddings[startIndex]],
          usage: { tokens: 2 },
        };
      },
    });

    const manager = new EmbeddingManager({ model: mockModel });
    const result = await manager.generateEmbeddings(['test1', 'test2']);

    expect(result).toEqual(mockEmbeddings);
  });

  it('should handle empty array for batch embeddings', async () => {
    const mockModel = new MockEmbeddingModelV1({
      modelId: 'test-model',
      provider: 'test-provider',
      doEmbed: async () => {
        throw new Error('Should not be called for empty array');
      },
    });

    const manager = new EmbeddingManager({ model: mockModel });
    const result = await manager.generateEmbeddings([]);

    expect(result).toEqual([]);
  });
});

describe('combineScores', () => {
  it('should combine scores with equal weights by default', () => {
    const result = combineScores(0.8, 0.6);
    expect(result).toBe(0.7); // (0.8 * 0.5) + (0.6 * 0.5)
  });

  it('should combine scores with custom weights', () => {
    const result = combineScores(0.8, 0.6, { bm25: 0.7, embeddings: 0.3 });
    expect(result).toBe(0.74); // (0.8 * 0.7) + (0.6 * 0.3)
  });

  it('should normalize weights that do not sum to 1', () => {
    const result = combineScores(0.8, 0.6, { bm25: 2, embeddings: 1 });
    // Normalized weights: bm25 = 2/3, embeddings = 1/3
    expect(result).toBeCloseTo(0.733); // (0.8 * 2/3) + (0.6 * 1/3)
  });

  it('should handle zero weights', () => {
    const result = combineScores(0.8, 0.6, { bm25: 1, embeddings: 0 });
    expect(result).toBe(0.8); // Only BM25 score
  });
});

describe('cosineSimilarity re-export', () => {
  it('should calculate cosine similarity correctly', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];
    const vec3 = [1, 0, 0];

    // Perpendicular vectors should have similarity of 0
    expect(cosineSimilarity(vec1, vec2)).toBe(0);

    // Identical vectors should have similarity of 1
    expect(cosineSimilarity(vec1, vec3)).toBe(1);
  });
});
