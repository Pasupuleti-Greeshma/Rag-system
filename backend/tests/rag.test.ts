import { describe, it, expect } from 'vitest';
import { MockLLMProvider } from '../src/services/rag.service.js';

describe('RAG Service Unit Tests', () => {
  it('should return insufficient evidence message when no chunks are found', async () => {
    const provider = new MockLLMProvider();
    const result = await provider.generateRAGAnswer('What is the deployment procedure?', []);

    expect(result.sufficientEvidence).toBe(false);
    expect(result.answer).toContain("don't have sufficient evidence");
    expect(result.citations).toHaveLength(0);
  });

  it('should ground answers and cite actual sources when relevant content exists', async () => {
    const provider = new MockLLMProvider();
    const mockChunks = [
      {
        id: 'chunk-123',
        document_id: 'doc-999',
        document_title: 'Architecture Overview.pdf',
        page_number: 3,
        chunk_text: 'SmartDocs AI uses PostgreSQL and pgvector for high-performance cosine similarity retrieval.',
        similarity: 0.89,
      },
    ];

    const result = await provider.generateRAGAnswer('How does retrieval work?', mockChunks);

    expect(result.sufficientEvidence).toBe(true);
    expect(result.answer).toContain('Architecture Overview.pdf');
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].chunk_id).toBe('chunk-123');
    expect(result.citations[0].document_title).toBe('Architecture Overview.pdf');
    expect(result.citations[0].page_number).toBe(3);
  });
});
