# Enterprise RAG Knowledge Assistant

A secure, multi-tenant **Retrieval-Augmented Generation (RAG)** knowledge assistant. Companies
upload internal documents (HR policies, SOPs, onboarding guides, product manuals, technical
docs) and their employees ask natural-language questions, getting accurate answers **grounded
only in the uploaded documents** — with source citations.

> Hero: **“Turn company documents into an AI knowledge assistant.”**
> Upload policies, SOPs, manuals, and internal docs. Let your team get instant source-backed answers.

---

## ✨ Features

- 🔐 **JWT auth** with HTTP-only cookies, bcrypt password hashing
- 🏢 **Multi-tenant workspaces** — every record is scoped by `companyId`; Company A can never see Company B's data
- 👥 **Role-based access** — `ADMIN` (manage docs + chat) and `MEMBER` (chat only)
- 📄 **Document upload** — drag & drop PDF, type/size validation, progress
- ⚙️ **Background processing** — Redis + BullMQ worker: extract → chunk → embed → store
- 🧠 **pgvector semantic search** — cosine similarity, company-scoped
- 💬 **RAG chat** — answers only from your docs, says so clearly when an answer isn't found
- 📚 **Source citations** — every answer links back to document + page + snippet (never invented)
- 🗂️ **Chat history**, 👍/👎 **answer feedback**, 📊 **analytics dashboard**
- 🎨 Clean SaaS UI with **shadcn/ui** + Tailwind

---

## 🧱 Tech Stack

| Layer        | Tech                                                                 |
|--------------|----------------------------------------------------------------------|
| Frontend     | Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, RHF + Zod, TanStack Query |
| Backend      | Next.js Route Handlers, modular services, Zod validation             |
| Database     | PostgreSQL + **pgvector**, Prisma ORM                                 |
| Queue/Worker | Redis + **BullMQ** (standalone worker process)                       |
| AI           | OpenAI embeddings (`text-embedding-3-small`) + chat (`gpt-4o-mini`)  |
| Storage      | Local disk (pluggable `FileStorageService` for future S3/MinIO)      |

---

## 🏗️ Architecture

```
Next.js App ──┬── /api/auth        (register/login/logout/me)
              ├── /api/documents   (upload/list/get/delete/reprocess)  ──┐
              ├── /api/chat        (sessions + RAG messages)            │
              ├── /api/messages    (feedback)                           │
              └── /api/analytics   (overview)                           │
                                                                        │ enqueue
   PostgreSQL + pgvector  ◀── Prisma ──▶  Services                      ▼
        ▲                                  ├─ EmbeddingService     Redis + BullMQ
        │ chunks + vectors                 ├─ VectorSearchService        │
        │                                  ├─ RagService                 │ consume
        └──────── document.worker ◀────────┴─ DocumentProcessingService ─┘
                  (extract → chunk → embed → store)        ▲
                                                           └── OpenAI API
```

### RAG flow (per question)
1. Validate user + that the chat session belongs to their company.
2. Save the user message.
3. Embed the question.
4. Retrieve the top-5 most similar chunks **from the same company only** (pgvector cosine).
5. If nothing relevant is found → return *“I could not find this information in the uploaded company documents.”* (no LLM call → no hallucination).
6. Otherwise build a `Source N:` context block and call the chat model with a strict system prompt.
7. Save the assistant message with citations (drawn **only** from retrieved chunks).
8. Return the answer + sources.

### Document processing flow
`UPLOADED` → worker picks job → `PROCESSING` → extract PDF text → chunk (~3000 chars / ~500 overlap)
→ embed each chunk → store chunks + vectors → `PROCESSED` (+ `totalChunks`). On error → `FAILED` with `errorMessage`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL + Redis)
- An OpenAI API key

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# then edit .env and set OPENAI_API_KEY and JWT_SECRET (openssl rand -base64 48)
```

| Variable                  | Description                                            |
|---------------------------|--------------------------------------------------------|
| `DATABASE_URL`            | Postgres connection string (pgvector-enabled)          |
| `REDIS_URL`               | Redis connection string                                |
| `OPENAI_API_KEY`          | OpenAI key — **server-side only**, never sent to client|
| `OPENAI_EMBEDDING_MODEL`  | Default `text-embedding-3-small` (1536 dims)           |
| `OPENAI_CHAT_MODEL`       | Default `gpt-4o-mini`                                   |
| `JWT_SECRET`              | Secret used to sign JWTs (16+ chars)                   |
| `NEXT_PUBLIC_APP_URL`     | App base URL                                            |
| `UPLOAD_DIR`              | Local upload dir (default `uploads/documents`)         |
| `STORAGE_ADAPTER`         | `local` or `minio` (use `minio` for object storage)    |
| `MINIO_ENDPOINT`          | MinIO host, e.g. `localhost` or `play.min.io`          |
| `MINIO_PORT`              | MinIO port, e.g. `9000`                                |
| `MINIO_USE_SSL`           | `true` / `false` for MinIO TLS mode                    |
| `MINIO_ACCESS_KEY`        | MinIO access key                                        |
| `MINIO_SECRET_KEY`        | MinIO secret key                                        |
| `MINIO_BUCKET`            | Bucket name used for document storage                  |

### 3. Start infrastructure (Postgres + Redis)
```bash
docker compose up -d
```
Uses the `pgvector/pgvector:pg16` image so the `vector` extension is available.

### 4. Run migrations (creates tables + pgvector extension + vector index)
```bash
npm run prisma:generate
npm run prisma:migrate      # dev; or `npm run prisma:deploy` for the committed migration
```

### 5. Seed demo users
```bash
npm run seed
```

### 6. Run the app + worker (two terminals)
```bash
npm run dev      # terminal 1 — web app at http://localhost:3000
npm run worker   # terminal 2 — background document processor
```

---

## 🧪 Demo Walkthrough

**Demo accounts** (after `npm run seed`):

| Role   | Email               | Password       |
|--------|---------------------|----------------|
| Admin  | `admin@acme.com`    | `Password123!` |
| Member | `employee@acme.com` | `Password123!` |

**Get a working demo:**
1. (Optional) Generate the sample PDFs from the provided markdown:
   ```bash
   npm run demo:pdfs    # writes PDFs into ./demo-documents
   ```
2. Log in as **admin@acme.com**, open **Documents → Upload document**, and upload:
   - `HR Leave Policy.pdf`
   - `Employee Onboarding Guide.pdf`
   - `Product Support SOP.pdf`
   - `API Documentation.pdf`
3. Make sure the **worker is running** — documents move `Queued → Processing → Processed`.
4. Open **Chat** and ask:
   - *Do I need approval for 4 days leave?*
   - *What are the onboarding steps for new employees?*
   - *How should support handle failed payments?*
   - *What is the API rate limit?*

> ⚠️ Embeddings are **not** seeded — they're generated from real document text by the worker.
> That's why you upload + process documents instead of inserting fake vectors.

---

## 📜 NPM Scripts

| Script                 | Description                                  |
|------------------------|----------------------------------------------|
| `npm run dev`          | Start Next.js dev server                     |
| `npm run build`        | Generate Prisma client + production build    |
| `npm run start`        | Start production server                      |
| `npm run lint`         | ESLint                                       |
| `npm run prisma:generate` | Generate Prisma client                    |
| `npm run prisma:migrate`  | Run dev migrations                        |
| `npm run prisma:deploy`   | Apply committed migrations (prod)         |
| `npm run prisma:studio`   | Open Prisma Studio                        |
| `npm run worker`       | Start the BullMQ document worker (watch)     |
| `npm run worker:prod`  | Start the worker (no watch)                  |
| `npm run seed`         | Seed demo company + users                    |
| `npm run demo:pdfs`    | Convert demo markdown docs into PDFs         |

---

## 🔒 Security Notes

- Passwords are bcrypt-hashed; `passwordHash` is never returned to clients.
- Auth uses **HTTP-only** cookies; the JWT is verified at the edge (middleware) and server-side.
- **Every** query filters by `companyId` (and `userId` for chat) — strict tenant isolation.
- ADMIN-only routes call `requireAdmin()`.
- All request bodies are validated with **Zod**.
- Uploads are restricted to `application/pdf` and 20 MB.
- The OpenAI key is read only via the server-side `lib/openai.ts` singleton — never bundled to the client.

---

## 📁 Project Structure

```
app/                     # App Router pages + API route handlers
  api/{auth,documents,chat,messages,analytics}/
  dashboard/{documents,chat,analytics}/
components/{ui,layout,dashboard,documents,chat,common}/
hooks/                   # client hooks (useCurrentUser)
lib/                     # auth, prisma, openai, env, validations, utils, types
services/                # embedding, vector-search, rag, document-processing, file-storage, analytics
workers/                 # queue.ts + document.worker.ts (BullMQ)
prisma/                  # schema.prisma, migrations/, seed.ts
demo-documents/          # sample docs (markdown → PDF via npm run demo:pdfs)
uploads/documents/       # local file storage
docker-compose.yml       # postgres(pgvector) + redis
```

---

## 📸 Screenshots

> _Add screenshots here for your portfolio:_
> - Landing page
> - Dashboard overview
> - Documents table + upload modal
> - Chat with source citations
> - Analytics

---

## 🛣️ Future Improvements

- S3/MinIO storage adapter (interface already in place)
- Streaming chat responses (SSE)
- Support for DOCX, TXT, HTML, and Markdown ingestion
- Per-page chunk metadata for more precise citations
- Team invitations + member management UI
- Hybrid search (BM25 + vector) and re-ranking
- Usage quotas and cost tracking per workspace
- Observability (request tracing, embedding cost metrics)
