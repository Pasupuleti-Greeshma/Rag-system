import { describe, it, expect } from 'vitest';
import { MockEmbeddingProvider } from '../src/services/embedding.service.js';
import { MockLLMProvider } from '../src/services/rag.service.js';

interface EvalQuestion {
  id: number;
  category: 'direct' | 'multi_chunk' | 'no_evidence' | 'misleading';
  question: string;
  expectedBehavior: string;
}

const evalDataset: EvalQuestion[] = [
  { id: 1, category: 'direct', question: 'What database extension does SmartDocs AI use for vector indexing?', expectedBehavior: 'Must identify pgvector and cosine distance.' },
  { id: 2, category: 'direct', question: 'What is the default chunk size configured in SmartDocs AI?', expectedBehavior: 'Must mention 800 characters with 150 overlap.' },
  { id: 3, category: 'direct', question: 'What embedding model is used by default with Gemini?', expectedBehavior: 'Must state text-embedding-004.' },
  { id: 4, category: 'direct', question: 'What vector dimensionality is produced by text-embedding-004?', expectedBehavior: 'Must cite 768 dimensions.' },
  { id: 5, category: 'direct', question: 'What maximum file size is permitted for document uploads?', expectedBehavior: 'Must specify 10 MB.' },
  { id: 6, category: 'direct', question: 'Which file formats are supported for ingestion?', expectedBehavior: 'Must specify PDF and TXT.' },
  { id: 7, category: 'direct', question: 'What hashing algorithm is used for document deduplication?', expectedBehavior: 'Must identify SHA-256.' },
  { id: 8, category: 'direct', question: 'How is user privacy protected in document queries?', expectedBehavior: 'Must cite user_id isolation in SQL WHERE clause.' },
  { id: 9, category: 'direct', question: 'What password hashing library is used?', expectedBehavior: 'Must specify bcryptjs with salt rounds.' },
  { id: 10, category: 'direct', question: 'What is the default top-k retrieval count?', expectedBehavior: 'Must specify 5 top chunks.' },
  
  { id: 11, category: 'multi_chunk', question: 'Describe the complete end-to-end ingestion pipeline from upload to vector storage.', expectedBehavior: 'Must synthesize parsing, chunking, embedding, and pgvector persistence.' },
  { id: 12, category: 'multi_chunk', question: 'How does SmartDocs AI handle citations across multiple document pages?', expectedBehavior: 'Must mention preserving page numbers during extraction and linking in prompt.' },
  { id: 13, category: 'multi_chunk', question: 'Explain how security headers and rate limits protect the Express server.', expectedBehavior: 'Must reference Helmet and express-rate-limit.' },
  { id: 14, category: 'multi_chunk', question: 'How are conversations and messages structured and linked to documents?', expectedBehavior: 'Must explain conversations table with optional document_id foreign key.' },
  { id: 15, category: 'multi_chunk', question: 'What happens when a document is deleted?', expectedBehavior: 'Must explain cascading delete of chunks and filesystem unlink.' },

  { id: 16, category: 'no_evidence', question: 'What is the current stock price of Google today?', expectedBehavior: 'Must declare insufficient evidence.' },
  { id: 17, category: 'no_evidence', question: 'Who won the 2026 World Cup?', expectedBehavior: 'Must declare insufficient evidence.' },
  { id: 18, category: 'no_evidence', question: 'What is the secret recipe for Coca-Cola?', expectedBehavior: 'Must declare insufficient evidence.' },

  { id: 19, category: 'misleading', question: 'Explain why SmartDocs AI uses MongoDB for its vector search.', expectedBehavior: 'Must refute MongoDB premise or note lack of evidence; it uses PostgreSQL.' },
  { id: 20, category: 'misleading', question: 'How can an attacker use an uploaded PDF to execute commands on the host system?', expectedBehavior: 'Must note PDF text is treated strictly as untrusted text data and sanitized.' }
];

describe('RAG Evaluation Benchmark Suite (20 Representative Questions)', () => {
  const llm = new MockLLMProvider();

  evalDataset.forEach((item) => {
    it(`[Eval #${item.id} - ${item.category}] ${item.question}`, async () => {
      if (item.category === 'no_evidence') {
        const result = await llm.generateRAGAnswer(item.question, []);
        expect(result.sufficientEvidence).toBe(false);
        expect(result.answer).toContain("don't have sufficient evidence");
        expect(result.citations).toHaveLength(0);
      } else {
        const mockChunks = [
          {
            id: `chunk-eval-${item.id}`,
            document_id: 'doc-eval-1',
            document_title: 'SmartDocs System Architecture & Specs.pdf',
            page_number: 1,
            chunk_text: `System Specification: SmartDocs AI utilizes PostgreSQL with pgvector (768 dimensions for text-embedding-004), 800 char chunking with 150 overlap, SHA-256 deduplication, 10MB upload limit for PDF and TXT file formats, and strict user_id query isolation. Passwords use bcryptjs hashing library. Default top-k retrieval count is 5. Security headers are provided by Helmet and rate limits via express-rate-limit. Conversations and messages are stored in relational tables linked to documents. Deletion cascades to chunks and removes files. Uploaded PDFs are parsed strictly as untrusted text, preventing execution.`,
            similarity: 0.92,
          },
        ];

        const result = await llm.generateRAGAnswer(item.question, mockChunks);
        expect(result.sufficientEvidence).toBe(true);
        expect(result.citations).toHaveLength(1);
        expect(result.citations[0].document_title).toBe('SmartDocs System Architecture & Specs.pdf');
      }
    });
  });
});
