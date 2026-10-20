# Production Deployment Guide

SmartDocs AI is designed to deploy cleanly into cloud container environments (Render, Railway, Fly.io, AWS ECS, or DigitalOcean) with a managed PostgreSQL instance supporting `pgvector`.

---

## 1. Prerequisites for Cloud Deployment
1. **Managed PostgreSQL Database with pgvector**:
   - Supported hosts: Neon.tech, Supabase, AWS RDS PostgreSQL (version 15+), or Railway PostgreSQL.
   - Run once: `CREATE EXTENSION IF NOT EXISTS vector;` (handled automatically by the application migration runner).
2. **AI Provider Credentials**:
   - Google AI Studio API key (`AI_API_KEY`) for Gemini embeddings and generation.
3. **Container Registry or Git Provider** (e.g. GitHub repository connected to Render/Railway).

---

## 2. Environment Variables Checklist
Configure these variables in your production hosting platform:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
JWT_SECRET=generate-a-secure-random-64-character-hex-string
JWT_EXPIRES_IN=7d
UPLOAD_DIR=/app/uploads
UPLOAD_MAX_SIZE_MB=10

AI_PROVIDER=gemini
AI_API_KEY=AIzaSy...
AI_EMBEDDING_MODEL=text-embedding-004
AI_EMBEDDING_DIMENSION=768
AI_GENERATION_MODEL=gemini-1.5-flash

RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=150
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.3
```

---

## 3. Step-by-Step Deployment Example (e.g. Render / Railway)

### Step A: Deploy PostgreSQL Database
1. Create a PostgreSQL service on Neon or Railway.
2. Copy the connection string (`postgresql://...`).

### Step B: Deploy Backend Service
1. Connect your repository and set the Root Directory to `backend`.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm start`
4. Set the environment variables listed above.
5. Verify the health check at `https://your-backend-domain.com/api/health`.

### Step C: Deploy Frontend SPA
1. Connect repository and set Root Directory to `frontend`.
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Set rewrite rules so all traffic points to `index.html` (for client-side routing).
