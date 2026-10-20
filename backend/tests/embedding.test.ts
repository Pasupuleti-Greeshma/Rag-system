import { describe, it, expect } from 'vitest';
import { MockEmbeddingProvider } from '../src/services/embedding.service.js';

describe('Embedding Service Tests', () => {
  it('should generate unit vectors with requested dimensions', async () => {
    const provider = new MockEmbeddingProvider(768);
    const vector = await provider.embedText('SmartDocs AI intermediate RAG testing');

    expect(vector).toHaveLength(768);
    // Norm should be ~ 1
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    expect(norm).toBeCloseTo(1, 4);
  });

  it('should generate batch embeddings matching text count', async () => {
    const provider = new MockEmbeddingProvider(768);
    const texts = ['First chunk of document', 'Second chunk with more details', 'Third chunk with summary'];
    const vectors = await provider.embedBatch(texts);

    expect(vectors).toHaveLength(3);
    expect(vectors[0]).toHaveLength(768);
    expect(vectors[1]).toHaveLength(768);
  });
});
