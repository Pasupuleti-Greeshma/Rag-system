# SmartDocs AI - System Architecture

SmartDocs AI is an intermediate-level Retrieval-Augmented Generation (RAG) platform designed to let users securely upload documents (PDF, TXT), index them into vector embeddings, and converse with an AI assistant whose answers are strictly grounded in retrieved document evidence with verifiable source citations.

## High-Level Architecture Diagram

```
+-------------------------------------------------------------+
|                     React + Vite Frontend                   |
|  - Modern Dark Mode & Glassmorphic UI                       |
|  - Real-time Dashboard, Upload Workspace, RAG Chat          |
|  - Citations Drawer & Modal Previews                        |
+------------------------------+------------------------------+
                               | REST APIs / JWT Bearer
                               v
+-------------------------------------------------------------+
|                 Express.js + TypeScript Backend             |
|  - Rate Limiter, Helmet Security Headers, CORS              |
|  - Authentication & RBAC (Isolated per user_id)             |
|  - Document Ingestion Pipeline                              |
|  - Semantic Search & Vector Similarity Controller           |
+---------------+-----------------------------+---------------+
                |                             |
      Vector / Metadata Queries       AI Embeddings & LLM
                |                             |
                v                             v
+-------------------------------+ +---------------------------+
|     PostgreSQL + pgvector     | | Google Gemini AI / Mock   |
| - Users & Auth               | | - text-embedding-004      |
| - Documents Metadata          | | - gemini-1.5-flash        |
| - Document Chunks & Vector    | | - Grounded System Prompts |
|   (768d cosine distance <=>)  | +---------------------------+
| - Conversations & Citations   |
+-------------------------------+
```

---

## 1. Document Ingestion Pipeline

```
[ Upload File (PDF/TXT) ]
          │
          ▼
[ Hash Deduplication (SHA-256) ] ──── Duplicated? ──> Reject with 409 Conflict
          │ (New file)
          ▼
[ Page-Aware Text Extraction ] ──── Scanned / Empty? ──> Fail gracefully with clear error
  - pdf-parse with custom page render
  - Preserves exact page numbers for citations
          │
          ▼
[ Normalization & Window Chunking ]
  - 800 characters target chunk size
  - 150 characters overlap
  - Boundary-aware splitting (paragraphs & sentences)
          │
          ▼
[ Vector Embedding Generation ]
  - Gemini text-embedding-004 (768 dimensions)
  - Processed in parallel batches of 20 chunks
          │
          ▼
[ PostgreSQL Transactional Persistence ]
  - Chunks stored with user_id, document_id, page_number, chunk_text
  - Embedding stored in vector(768) column
  - Document status transitioned to READY
```

---

## 2. RAG Query & Answer Generation Pipeline

```
[ User Submits Question ]
          │
          ▼
[ Authenticated Request Validation ]
  - JWT verified -> Extracts user.id
  - Optional documentId scope validated against ownership
          │
          ▼
[ Query Embedding ]
  - Embed user query using text-embedding-004
          │
          ▼
[ pgvector Cosine Similarity Search ]
  - SELECT chunk_text, page_number, (1 - (embedding <=> query_vector)) AS similarity
  - WHERE user_id = :userId (Strict tenant isolation)
  - ORDER BY similarity DESC LIMIT 5 (Configurable Top-K)
          │
          ▼
[ Evidence Assessment ]
  - No chunks above threshold? ──> Return "Insufficient evidence"
          │
          ▼
[ Prompt Formulation & Guardrails ]
  - System prompt: Treat document context as UNTRUSTED DATA
  - Cite sources using [Source X] notation
  - Disallow extrapolation or hallucinations
          │
          ▼
[ LLM Generation (Gemini 1.5 Flash) ]
          │
          ▼
[ Citation Verification ]
  - Cross-check citations against real chunk IDs and page numbers
  - Discard hallucinated references
          │
          ▼
[ Persist Conversation & Render to User ]
```
