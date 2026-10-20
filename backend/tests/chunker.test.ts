import { describe, it, expect } from 'vitest';
import { TextChunker } from '../src/services/text-chunker.service.js';

describe('TextChunker Unit Tests', () => {
  it('should split text into chunks adhering to maximum size', () => {
    const text = 'Sentence one. Sentence two. Sentence three. Sentence four. Sentence five. Sentence six.';
    const chunks = TextChunker.chunkText(text, 40, 10);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(50);
      expect(chunk.trim().length).toBeGreaterThan(0);
    });
  });

  it('should preserve page numbers when chunking multi-page documents', () => {
    const pages = [
      { pageNumber: 1, text: 'This is page one content explaining RAG.' },
      { pageNumber: 2, text: 'This is page two content detailing vector embeddings.' },
    ];

    const chunks = TextChunker.chunkDocument(pages, 100, 20);

    expect(chunks).toHaveLength(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[0].chunkIndex).toBe(0);
    expect(chunks[1].pageNumber).toBe(2);
    expect(chunks[1].chunkIndex).toBe(1);
  });

  it('should handle empty input cleanly', () => {
    const chunks = TextChunker.chunkText('', 800, 150);
    expect(chunks).toEqual([]);
  });
});
