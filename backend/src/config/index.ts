import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartdocs_ai',

  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-jwt-secret-smartdocs-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  uploadMaxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10),

  aiProvider: (process.env.AI_PROVIDER || 'gemini') as 'gemini' | 'mock',
  aiApiKey: process.env.AI_API_KEY || '',

  aiEmbeddingModel: process.env.AI_EMBEDDING_MODEL || 'text-embedding-004',
  aiEmbeddingDimension: parseInt(process.env.AI_EMBEDDING_DIMENSION || '768', 10),

  aiGenerationModel: process.env.AI_GENERATION_MODEL || 'gemini-1.5-flash',

  ragChunkSize: parseInt(process.env.RAG_CHUNK_SIZE || '800', 10),
  ragChunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP || '150', 10),
  ragTopK: parseInt(process.env.RAG_TOP_K || '5', 10),
  ragSimilarityThreshold: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.3'),
};
