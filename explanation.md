# SmartDocs AI: Complete Project Guide & Code Walkthrough

> **Note for the Reader:** Welcome to the team! This document is written specifically for you. Even if you have **zero background in coding, databases, or AI**, this guide will explain everything from the ground up using simple real-world analogies, clean diagrams, and step-by-step file explanations.

---

## 1. What is this Project About? (The Big Picture)

Imagine you work in a huge law firm, hospital, or company with thousands of pages of documents (PDFs, reports, manuals). 
When someone asks: *"What was our operating profit in Q3?"* or *"What is our policy on sick leave?"*, a human has to open dozens of files, read page by page, and search for the answer.

**SmartDocs AI** is a smart digital assistant that does this in seconds:
1. You **upload** your PDF or TXT files.
2. The system **reads and indexes** the text.
3. You **ask any question** in a chat window.
4. The system **finds the exact page**, extracts the relevant sentences, and provides a clear, truthful answer with a direct clickable citation to the exact page.

---

## 2. What is "RAG"? (Explained with a Simple Story)

**RAG** stands for **Retrieval-Augmented Generation**. 

Think of taking an exam:
- **Traditional AI (like ChatGPT without RAG):** This is like a student writing a **Closed-Book Exam**. The student answers from memory. If they forgot or don't know the exact details of your private company files, they might **guess or hallucinate** (make up plausible-sounding false information).
- **RAG (SmartDocs AI):** This is an **Open-Book Exam**. 
  - **Retrieval:** When you ask a question, the assistant first runs to your uploaded book, flips to the exact 2 or 3 pages containing the answer, and places them on the desk.
  - **Generation:** The assistant then reads *only* those open pages and writes a neat, grounded summary for you, pointing directly to: *"See Page 4, Paragraph 2"*.

---

## 3. High-Level Architecture (How the Whole App Fits Together)

The project is structured into three main blocks:

```
┌────────────────────────────────────────────────────────┐
│                   1. FRONTEND (Vite + React)           │
│   (What the user sees in the browser: buttons, chat,   │
│    upload zone, dark mode glass design)                │
└───────────────────────────┬────────────────────────────┘
                            │ Sends requests over HTTP (Internet)
                            ▼
┌────────────────────────────────────────────────────────┐
│                    2. BACKEND (Node.js + Express)      │
│   (The engine behind the scenes: verifies passwords,   │
│    splits text into chunks, talks to Gemini AI)        │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
┌──────────────────────────────┐  ┌───────────────────────┐
│     3. DATABASE              │  │     4. GOOGLE GEMINI  │
│   (PostgreSQL database       │  │   (AI service that    │
│    storing users, text,      │  │    understands text   │
│    and math vectors)         │  │    and writes answers)│
└──────────────────────────────┘  └───────────────────────┘
```

---

## 4. Complete Request Flow (Step-by-Step)

Here is what happens inside the computer when a user asks a question:

```
[ User Types: "What is the upload size limit?" ]
                      │
                      ▼
 1. FRONTEND: (src/pages/Chat.tsx) sends question to Backend API
                      │
                      ▼
 2. SECURITY CHECK: (src/middleware/auth.middleware.ts) 
    Checks: "Is this user logged in? Do they have a valid token?"
                      │
                      ▼
 3. VECTOR ENCODING: (src/services/embedding.service.ts)
    Sends the user's question to Google Gemini. 
    Gemini turns the question into a mathematical vector (a list of 3,072 numbers representing its meaning).
                      │
                      ▼
 4. DATABASE SEARCH: (src/repositories/document.repository.ts)
    PostgreSQL searches through all document chunks belonging to this user.
    It computes Cosine Similarity (angle comparison) to find the top 5 chunks closest in meaning to the question.
                      │
                      ▼
 5. ANSWER GENERATION: (src/services/rag.service.ts)
    Backend builds a strict instruction prompt for Gemini:
    "Here is excerpt from Page 1 of Document X. Answer the question ONLY from this excerpt. Do NOT make anything up."
                      │
                      ▼
 6. CITATION VERIFICATION:
    Backend checks: Did Gemini cite real pages? Attaches clickable source references.
                      │
                      ▼
 7. USER SEES ANSWER: Screen displays the answer with a blue badge: 
    "[SmartDocs_Specs.txt (p. 1)]"
```

---

## 5. Directory & File Breakdown (What Every File Does)

Let's walk through every single file in the workspace so you understand why it exists.

### 📁 Root Directory (`f:/RAG/`)

| File / Folder | Purpose in Plain English |
| :--- | :--- |
| `package.json` | The **master blueprint**. Lists the two main parts (`frontend` and `backend`) and provides scripts like `npm run dev` to start both simultaneously. |
| `.env.example` | A template showing what secrets and passwords the application needs (database URLs, API keys) without exposing sensitive information. |
| `docker-compose.yml` | Allows the entire application (PostgreSQL database, backend, and frontend) to be launched inside isolated containers with one command (`docker compose up`). |
| `.gitignore` | Tells Git which files NOT to share publicly (e.g., private passwords, `.env`, large `node_modules` folders). |
| `PLAN.md` | Tracks progress against milestones and requirements. |
| `README.md` | The front-page manual describing features, installation, and deployment. |
| `docs/` | Contains detailed technical documentation on architecture, database schema, REST APIs, security, and technical interview guides. |

---

### 📁 Backend Engine (`f:/RAG/backend/`)

The backend is written in **TypeScript** (modern JavaScript with type checking to prevent bugs).

#### `src/config/`
- **`src/config/index.ts`**: The Settings Loader. Reads environment variables (such as `PORT`, `DATABASE_URL`, `AI_API_KEY`) and provides safe default values.
- **`src/config/database.ts`**: The Database Connector. Sets up a "Pool" of reusable connections to PostgreSQL so the app doesn't have to reconnect every second.

#### `src/migrations/`
- **`src/migrations/migrate.ts`**: The Table Builder. When the app starts up, this script talks to PostgreSQL and creates all required tables (`users`, `documents`, `document_chunks`, `conversations`, `messages`). If the optional `pgvector` extension is not installed on Windows, it automatically enables a smart array similarity fallback so the app continues to work without crashing.

#### `src/repositories/` (Talking Directly to Database Tables)
- **`src/repositories/user.repository.ts`**: Handles finding a user by their email and creating a new user record in the `users` table.
- **`src/repositories/document.repository.ts`**: Handles saving documents, deleting documents, storing text chunks, and running the similarity search query to find relevant paragraphs.
- **`src/repositories/conversation.repository.ts`**: Saves chat history, user questions, assistant responses, and citations in the `conversations` and `messages` tables.

#### `src/services/` (The Core Brain & Business Logic)
- **`src/services/auth.service.ts`**:
  - Encrypts user passwords using `bcrypt` (scrambling it with 12 rounds of math so even developers cannot read passwords).
  - Generates a **JWT** (JSON Web Token)—a secure digital passport given to the browser upon login.
- **`src/services/text-extractor.service.ts`**:
  - Reads PDF or TXT files.
  - Extracts text while keeping track of **which page** each sentence came from.
- **`src/services/text-chunker.service.ts`**:
  - Splits a long 20-page document into bite-sized "chunks" (~800 characters each).
  - Adds a 150-character overlap between adjacent chunks so sentences cut in the middle don't lose their meaning.
- **`src/services/embedding.service.ts`**:
  - Connects to Google Gemini's embedding model (`gemini-embedding-001`).
  - Converts text chunks into mathematical vectors (lists of 3,072 numbers). Also has a Mock provider for offline testing.
- **`src/services/rag.service.ts`**:
  - Formulates the strict instruction prompt for Gemini (`gemini-3.8-flash`).
  - Enforces anti-hallucination rules: If the answer isn't in the chunks, it must respond with *"I don't have sufficient evidence"*.
  - Matches source references in the generated text back to the real database chunks.
- **`src/services/ingestion.service.ts`**:
  - The Project Manager of uploads. Calculates a SHA-256 fingerprint of the file (to reject duplicate uploads), calls the extractor, calls the chunker, calls the embedding service, and saves everything to PostgreSQL.

#### `src/controllers/` (The Traffic Police)
- **`src/controllers/auth.controller.ts`**: Handles requests coming into `/api/auth/register`, `/api/auth/login`, and `/api/auth/me`.
- **`src/controllers/document.controller.ts`**: Handles `/api/documents` (uploading, listing, deleting, dashboard stats).
- **`src/controllers/conversation.controller.ts`**: Handles creating chat threads and receiving questions sent to `/api/conversations/:id/messages`.

#### `src/middleware/`
- **`src/middleware/auth.middleware.ts`**: Checks the user's digital passport (JWT token) on every request. If invalid or missing, it rejects access with HTTP 401 Unauthorized.

#### `src/routes/` & Core App
- **`src/routes/api.routes.ts`**: Connects URL paths (like `POST /api/documents/upload`) to the corresponding controller function, configuring file upload size limits (10 MB).
- **`src/app.ts`**: Configures security headers (`helmet`), cross-origin rules (`cors`), and JSON body parsers.
- **`src/server.ts`**: The main starter file. Runs database migrations and starts the HTTP server listening on Port 5000.

#### `tests/`
- **`tests/chunker.test.ts`**: Automated test verifying text chunking and page provenance.
- **`tests/embedding.test.ts`**: Automated test verifying vector math and normalization.
- **`tests/rag.test.ts`**: Automated test verifying anti-hallucination behavior.
- **`tests/api.test.ts`**: Automated test verifying endpoint access and validation.
- **`tests/rag-eval.test.ts`**: **20-Question benchmark evaluation suite** testing direct answers, multi-chunk questions, missing evidence, and prompt injection defense.

---

### 📁 Frontend UI (`f:/RAG/frontend/`)

The frontend is a single-page React app built with Vite and modern CSS (glassmorphism style with dark aesthetics).

- **`src/main.tsx`**: The entry point where React mounts itself into the HTML webpage.
- **`src/App.tsx`**: The Router. Decides which page to show depending on the URL (`/login`, `/register`, `/`, `/documents`, `/chat`).
- **`src/index.css`**: Design tokens, background gradients, card glassmorphism styles, badges, and button animations.
- **`src/services/api.ts`**: The helper library used by the frontend to talk to the backend (automatically attaches the JWT token).
- **`src/hooks/useAuth.tsx`**: State keeper that remembers who is currently logged in across all pages.
- **`src/layouts/MainLayout.tsx`**: The master screen shell: sidebar with navigation links (Dashboard, Documents, Chat Workspace), user name tag, and Sign Out button.

#### Pages (`src/pages/`):
- **`src/pages/Login.tsx`**: Beautiful login form with email & password validation.
- **`src/pages/Register.tsx`**: Account creation form for new team members.
- **`src/pages/Dashboard.tsx`**: Real-time analytics screen showing total documents, indexed count, processing count, and recent activity.
- **`src/pages/Documents.tsx`**: File upload drag-and-drop zone, processing status badges (`READY`, `PROCESSING`, `FAILED`), and file deletion buttons.
- **`src/pages/Chat.tsx`**: The main chat workspace. Allows selecting a specific document or searching across all files, displays user and AI speech bubbles, and opens a source reference drawer showing the exact excerpt and page citation.
- **`src/pages/NotFound.tsx`**: Friendly 404 page if a user navigates to an invalid URL.

---

## 6. How Vector Search Works (Without Complex Math)

When you ask: *"What is the revenue?"*
1. **Traditional Keyword Search (Ctrl+F):** Looks for the exact letters `"r-e-v-e-n-u-e"`. If the document says *"total income was $48M"*, keyword search misses it because the words don't match!
2. **Vector Semantic Search (SmartDocs AI):**
   - The AI converts words into points in space.
   - The concepts *"revenue"*, *"sales"*, *"income"*, and *"earnings"* all point in almost the exact same direction in geometric space.
   - SmartDocs AI computes the angle between your question's arrow and every chunk's arrow. Small angle = high similarity.
   - That's how it finds the right paragraph even if you use completely different words!

---

## 7. How to Run & Verify the Project

Whenever you want to run the project on your machine:

1. **Start the App:** Open your terminal in `f:\RAG` and run:
   ```bash
   npm run dev
   ```
2. **Access the Website:** Open your web browser to:
   ```
   http://localhost:5173
   ```
3. **Log in:** Use the demo credentials:
   - **Email:** `demo@smartdocs.ai`
   - **Password:** `Password123!`
4. **Run Automated Tests:** In the terminal, run:
   ```bash
   npm test --workspace=backend
   ```
   All 31 unit, integration, and RAG evaluation tests will execute and report passing status.

---

## 8. Summary Checklist for New Joiners

- [x] Backend runs Express with TypeScript on Port 5000.
- [x] Frontend runs React + Vite on Port 5173.
- [x] Database is PostgreSQL storing tables + 3,072-dimensional embeddings.
- [x] Embeddings use Google's `gemini-embedding-001`.
- [x] Grounded generation uses Google's `gemini-3.8-flash`.
- [x] Tenant isolation ensures users can never see another user's documents.
- [x] Citations link directly back to verified document page numbers.
