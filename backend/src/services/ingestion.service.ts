import fs from 'fs';
import crypto from 'crypto';
import { DocumentRepository } from '../repositories/document.repository.js';
import { TextExtractor } from './text-extractor.service.js';
import { TextChunker } from './text-chunker.service.js';
import { getEmbeddingProvider } from './embedding.service.js';
import { config } from '../config/index.js';
import { Document } from '../types/index.js';

export class IngestionService {
  /**
   * Computes a cryptographic SHA-256 hash of a file for duplicate detection.
   */
  static async computeFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.promises.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Ingests, extracts, chunks, embeds, and persists a document.
   */
  static async processDocument(documentId: string, userId: string): Promise<void> {
    const doc = await DocumentRepository.findById(documentId, userId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }

    try {
      console.log(`🚀 Starting ingestion for document "${doc.title}" (ID: ${documentId})`);

      // 1. Text extraction
      const extracted = await TextExtractor.extract(doc.file_path, doc.mime_type);
      console.log(`📄 Extracted ${extracted.pages.length} pages for document ${documentId}`);

      // 2. Text chunking
      const chunks = TextChunker.chunkDocument(
        extracted.pages,
        config.ragChunkSize,
        config.ragChunkOverlap
      );

      if (chunks.length === 0) {
        throw new Error('Document produced 0 readable text chunks.');
      }
      console.log(`🧩 Generated ${chunks.length} chunks for document ${documentId}`);

      // 3. Embedding generation
      const embeddingProvider = getEmbeddingProvider();
      const chunkTexts = chunks.map((c) => c.text);
      console.log(`🔮 Generating embeddings for ${chunks.length} chunks...`);
      const embeddings = await embeddingProvider.embedBatch(chunkTexts);

      // 4. Persistence into PostgreSQL with pgvector
      const chunksToSave = chunks.map((chunk, idx) => ({
        documentId: doc.id,
        userId: doc.user_id,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        chunkText: chunk.text,
        embedding: embeddings[idx],
      }));

      await DocumentRepository.saveChunks(chunksToSave);

      // 5. Update document status to READY
      await DocumentRepository.updateStatus(doc.id, 'READY', chunks.length, null);
      console.log(`✅ Document ${documentId} successfully processed and indexed.`);
    } catch (error: any) {
      console.error(`❌ Ingestion failed for document ${documentId}:`, error);
      await DocumentRepository.updateStatus(doc.id, 'FAILED', 0, error.message || 'Processing error');
      throw error;
    }
  }
}
