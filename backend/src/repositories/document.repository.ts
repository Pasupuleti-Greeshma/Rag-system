import { query, pool } from '../config/database.js';
import { Document, DocumentChunk } from '../types/index.js';
import pgvector from 'pgvector/pg';

export class DocumentRepository {
  static async create(doc: {
    userId: string;
    title: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    fileHash: string;
    filePath: string;
    totalPages: number;
  }): Promise<Document> {
    const res = await query(
      `INSERT INTO documents (
        user_id, title, original_name, mime_type, file_size, file_hash, file_path, total_pages, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PROCESSING')
       RETURNING *`,
      [
        doc.userId,
        doc.title,
        doc.originalName,
        doc.mimeType,
        doc.fileSize,
        doc.fileHash,
        doc.filePath,
        doc.totalPages,
      ]
    );
    return res.rows[0];
  }

  static async findById(id: string, userId: string): Promise<Document | null> {
    const res = await query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return res.rows[0] || null;
  }

  static async findByHash(fileHash: string, userId: string): Promise<Document | null> {
    const res = await query(
      'SELECT * FROM documents WHERE file_hash = $1 AND user_id = $2',
      [fileHash, userId]
    );
    return res.rows[0] || null;
  }

  static async findAllByUser(userId: string): Promise<Document[]> {
    const res = await query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows;
  }

  static async updateStatus(
    id: string,
    status: Document['status'],
    totalChunks = 0,
    errorMessage: string | null = null
  ): Promise<Document> {
    const res = await query(
      `UPDATE documents 
       SET status = $2, total_chunks = $3, error_message = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, status, totalChunks, errorMessage]
    );
    return res.rows[0];
  }

  static async delete(id: string, userId: string): Promise<Document | null> {
    const res = await query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return res.rows[0] || null;
  }

  static async saveChunks(
    chunks: {
      documentId: string;
      userId: string;
      chunkIndex: number;
      pageNumber: number | null;
      chunkText: string;
      embedding: number[];
    }[]
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check column data type for embedding (USER-DEFINED 'vector' or 'ARRAY')
      const colCheck = await client.query(`
        SELECT data_type, udt_name FROM information_schema.columns 
        WHERE table_name = 'document_chunks' AND column_name = 'embedding'
      `);
      const isVectorType = colCheck.rows[0]?.udt_name === 'vector';

      const insertSql = `
        INSERT INTO document_chunks (
          document_id, user_id, chunk_index, page_number, chunk_text, embedding
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      for (const chunk of chunks) {
        const embeddingVal = isVectorType 
          ? pgvector.toSql(chunk.embedding) 
          : chunk.embedding; // pg natively serializes JS number[] to PostgreSQL real[]

        await client.query(insertSql, [
          chunk.documentId,
          chunk.userId,
          chunk.chunkIndex,
          chunk.pageNumber,
          chunk.chunkText,
          embeddingVal,
        ]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async searchSimilarChunks(
    queryEmbedding: number[],
    userId: string,
    documentId?: string | null,
    limit = 5,
    similarityThreshold = 0.3
  ): Promise<
    (DocumentChunk & {
      similarity: number;
      document_title: string;
    })[]
  > {
    const colCheck = await query(`
      SELECT data_type, udt_name FROM information_schema.columns 
      WHERE table_name = 'document_chunks' AND column_name = 'embedding'
    `);
    const isVectorType = colCheck.rows[0]?.udt_name === 'vector';

    if (isVectorType) {
      const vectorSql = pgvector.toSql(queryEmbedding);
      let sql = `
        SELECT 
          c.id, c.document_id, c.user_id, c.chunk_index, c.page_number, c.chunk_text,
          d.title as document_title,
          (1 - (c.embedding <=> $1::vector)) as similarity
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.user_id = $2
      `;

      const params: any[] = [vectorSql, userId];
      if (documentId) {
        params.push(documentId);
        sql += ` AND c.document_id = $${params.length}`;
      }

      params.push(similarityThreshold);
      sql += ` AND (1 - (c.embedding <=> $1::vector)) >= $${params.length}`;

      params.push(limit);
      sql += ` ORDER BY similarity DESC LIMIT $${params.length}`;

      const res = await query(sql, params);
      return res.rows;
    } else {
      // In-memory or array similarity calculation when pgvector isn't compiled in Windows local Postgres
      let sql = `
        SELECT 
          c.id, c.document_id, c.user_id, c.chunk_index, c.page_number, c.chunk_text,
          c.embedding,
          d.title as document_title
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.user_id = $1
      `;
      const params: any[] = [userId];
      if (documentId) {
        params.push(documentId);
        sql += ` AND c.document_id = $${params.length}`;
      }

      const res = await query(sql, params);

      // Compute cosine similarity: (A . B) / (|A| * |B|)
      const normB = Math.sqrt(queryEmbedding.reduce((acc, v) => acc + v * v, 0)) || 1;

      const scored = res.rows.map((row: any) => {
        const emb: number[] = Array.isArray(row.embedding)
          ? row.embedding
          : (typeof row.embedding === 'string'
              ? row.embedding.replace(/[{}]/g, '').split(',').map(Number)
              : []);
        
        let dot = 0;
        let normA = 0;
        for (let i = 0; i < emb.length; i++) {
          dot += (emb[i] || 0) * (queryEmbedding[i] || 0);
          normA += (emb[i] || 0) * (emb[i] || 0);
        }
        normA = Math.sqrt(normA) || 1;
        const similarity = dot / (normA * normB);

        return {
          id: row.id,
          document_id: row.document_id,
          user_id: row.user_id,
          chunk_index: row.chunk_index,
          page_number: row.page_number,
          chunk_text: row.chunk_text,
          document_title: row.document_title,
          created_at: row.created_at,
          similarity,
        };
      });

      return scored
        .filter((r) => r.similarity >= similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    }
  }

  static async getStatsByUser(userId: string): Promise<{
    totalDocuments: number;
    readyDocuments: number;
    processingDocuments: number;
    failedDocuments: number;
  }> {
    const res = await query(
      `SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'READY' THEN 1 END)::int as ready,
        COUNT(CASE WHEN status = 'PROCESSING' OR status = 'PENDING' THEN 1 END)::int as processing,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END)::int as failed
       FROM documents WHERE user_id = $1`,
      [userId]
    );

    return {
      totalDocuments: res.rows[0]?.total || 0,
      readyDocuments: res.rows[0]?.ready || 0,
      processingDocuments: res.rows[0]?.processing || 0,
      failedDocuments: res.rows[0]?.failed || 0,
    };
  }
}
