# SmartDocs AI: Enterprise-Grade Retrieval-Augmented Generation (RAG) Platform

SmartDocs AI is an intermediate-level, production-ready Retrieval-Augmented Generation (RAG) platform. It enables users to securely upload PDF and TXT documents, automatically chunk and embed their contents into PostgreSQL using `pgvector`, and ask questions through an AI chat interface that returns strictly grounded answers backed by verified source citations and page numbers.

---

## 🌟 Key Features

- **Document Processing Pipeline:** Automatic page-aware text extraction for PDFs and TXTs, cryptographic duplicate detection (SHA-256), and natural boundary chunking (800 chars / 150 overlap).
- **PostgreSQL & pgvector Vector Store:** High-performance cosine similarity retrieval (`<=>`) with HNSW index support and multi-tenant `user_id` query isolation.
- **Configurable AI Providers:** First-class support for Google Gemini (`text-embedding-004` and `gemini-1.5-flash`), with a deterministic offline mock provider for automated testing and CI.
- **Anti-Hallucination Guardrails:** System prompts enforce answering *only* from supplied evidence, treating document context as untrusted data, and validating citations against real chunk IDs.
- **Modern Glassmorphic UI:** Built with React 18, Vite, TypeScript, and Lucide icons. Features a real-time metrics dashboard, document library, and chat workspace with citation previews.
- **Enterprise Security:** Bcrypt password hashing (12 rounds), JWT tokens, rate limiting, Helmet security headers, CORS, and cascading vector deletion.
- **Automated Testing & Benchmarks:** 31 comprehensive Vitest unit, API integration, and 20-question RAG evaluation benchmark tests.
- **Docker & CI/CD Ready:** Production Dockerfiles, multi-container `docker-compose.yml`, and GitHub Actions CI workflow.

---

## 🏗️ Architecture Overview

```
[React + Vite Frontend] <─── REST API / JWT ───> [Express + TypeScript Backend]
                                                            │
                            ┌───────────────────────────────┴───────────────────────────────┐
                            ▼                                                               ▼
             [PostgreSQL 16 + pgvector]                                         [Google Gemini / Mock AI]
      - Users, Documents, Chunks, Messages                               - text-embedding-004 (768d)
      - Cosine Vector Similarity (1 - (embedding <=> q))                 - gemini-1.5-flash grounded prompts
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js LTS (v20 or v24)
- PostgreSQL with `pgvector` extension (or Docker)

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd RAG
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```
Fill in your database connection string and AI keys:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartdocs_ai
JWT_SECRET=your-secure-random-secret-at-least-32-chars
AI_PROVIDER=gemini        # Use "gemini" or "mock"
AI_API_KEY=your_gemini_key
AI_EMBEDDING_MODEL=text-embedding-004
AI_GENERATION_MODEL=gemini-1.5-flash
```

### 4. Run Database Migrations
```bash
npm run migrate --workspace=backend
```

### 5. Launch Development Servers
Run backend and frontend simultaneously from the root:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

---

## 🐳 Docker Compose Local Execution

To run the entire stack (PostgreSQL with pgvector, Backend, and Frontend) in Docker:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

---

## 🧪 Testing and Verification

Run the comprehensive test suite across the monorepo:
```bash
npm test --workspaces
```
Runs 31 tests covering:
- Text chunking & page provenance preservation
- Vector embedding math and normalization
- API endpoint validation and unauthorized route blocking
- 20-question RAG evaluation benchmark suite (direct, multi-chunk, no-evidence, and misleading questions)

---

## 📚 Project Documentation

- [System Architecture](file:///f:/RAG/docs/architecture.md)
- [Database Schema & Vector Indexing](file:///f:/RAG/docs/database-schema.md)
- [API Documentation](file:///f:/RAG/docs/api-documentation.md)
- [Security Architecture](file:///f:/RAG/docs/security.md)
- [Deployment Guide](file:///f:/RAG/docs/deployment.md)
- [Technical Interview Defense Guide](file:///f:/RAG/docs/interview-guide.md)

---

## 🛡️ License
MIT License. Built for technical portfolios and interviews.
