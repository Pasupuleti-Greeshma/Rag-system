import { pool } from '../config/database.js';
import { config } from '../config/index.js';

export async function runMigrations() {
  console.log('🔄 Checking and running database migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Enable pgvector extension if available, or fallback to real[]
    console.log('📦 Checking vector extension availability...');
    let hasVectorExtension = false;
    try {
      const extCheck = await client.query("SELECT * FROM pg_available_extensions WHERE name = 'vector'");
      if (extCheck.rows.length > 0) {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        hasVectorExtension = true;
        console.log('✅ pgvector extension enabled successfully.');
      } else {
        console.warn('⚠️ pgvector extension is not pre-installed on this PostgreSQL instance. Using high-performance array similarity fallback.');
      }
    } catch (e: any) {
      console.warn('⚠️ vector extension not enabled:', e.message);
    }

    // 2. Users table
    console.log('👤 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Documents table
    console.log('📄 Creating documents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size BIGINT NOT NULL,
        file_hash VARCHAR(64) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        error_message TEXT,
        total_pages INT NOT NULL DEFAULT 0,
        total_chunks INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add indexes on documents
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(user_id, file_hash);
    `);

    // 4. Document Chunks with VECTOR column (or REAL[] fallback)
    const embeddingDim = config.aiEmbeddingDimension;
    console.log(`🧩 Creating document_chunks table with ${hasVectorExtension ? `vector(${embeddingDim})` : 'real[]'}...`);
    
    if (hasVectorExtension) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          chunk_index INT NOT NULL,
          page_number INT,
          chunk_text TEXT NOT NULL,
          embedding vector(${embeddingDim}),
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      try {
        await client.query('SAVEPOINT hnsw_sp');
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
          ON document_chunks USING hnsw (embedding vector_cosine_ops);
        `);
        await client.query('RELEASE SAVEPOINT hnsw_sp');
      } catch (hnswErr) {
        await client.query('ROLLBACK TO SAVEPOINT hnsw_sp');
        console.warn('⚠️ HNSW index creation skipped:', (hnswErr as Error).message);
      }
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          chunk_index INT NOT NULL,
          page_number INT,
          chunk_text TEXT NOT NULL,
          embedding real[],
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
      CREATE INDEX IF NOT EXISTS idx_chunks_user_id ON document_chunks(user_id);
    `);

    // 5. Conversations table
    console.log('💬 Creating conversations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
    `);

    // 6. Messages table
    console.log('📨 Creating messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        citations JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Database migrations executed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Standalone runner if invoked directly via `npm run migrate`
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => {
      console.log('Migration completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
