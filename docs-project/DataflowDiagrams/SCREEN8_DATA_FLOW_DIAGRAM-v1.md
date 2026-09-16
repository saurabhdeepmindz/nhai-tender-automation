# Screen 8: Pre-bid Query Management - Complete Data Flow (V1)

**Document:** Screen 8 Data Flow Architecture with Numbered Sequences & RAG Flow Mapping  
**Date:** January 27, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready  
**Scope:** Mirrors the detail and structure of Screen 7 V3 (numbered flows, RG1-RG7, purpose notes)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Service Startup Commands](#service-startup-commands)
3. [Architecture Components with Commands](#architecture-components-with-commands)
4. [Enhanced Data Flow Diagram with Numbered Sequences](#enhanced-data-flow-diagram-with-numbered-sequences)
5. [API Endpoints](#api-endpoints)
6. [PostgreSQL Database Schema](#postgresql-database-schema)
7. [Vector Database (ChromaDB)](#vector-database-chromadb)
8. [Embedding Process with RAG Flow Mapping](#embedding-process-with-rag-flow-mapping)
9. [Data Flow Sequences](#data-flow-sequences)
10. [Background Vectorization Job](#background-vectorization-job)
11. [Error Handling & Retry](#error-handling--retry)

---

## System Overview

**Screen 8** (Pre-bid Query Management / Chief Engineer Agent) handles vendor queries with a 6-step agentic RAG workflow, integrates with Screen 7 for historical context, and stores embeddings for similar-query retrieval.

- **Query Intake:** Vendors submit queries via frontend → backend → PostgreSQL
- **Vectorization:** Scheduled job sends queries to Screen 8 to embed and store in ChromaDB
- **RAG Processing:** ChiefEngineerAgent (Python) runs 6-step workflow (analysis, historical search, similar queries, context build, response, quality check)
- **Context Sources:** Screen 7 semantic search + Screen 8 similar queries + RFP metadata
- **Outputs:** AI answer, confidence, sources, workflow execution trail

### Key Services with Startup Commands

| Service | Port | Folder | Startup Command | Technology | Purpose |
|---------|------|--------|-----------------|------------|---------|
| Backend (NestJS) | 3000 | `backend/` | `npm run start:dev` | Node.js + TypeScript | API gateway & jobs |
| Frontend (Next.js) | 3001 | `frontend/` | `npm run dev` | React + Next.js | Vendor/admin UI |
| Screen 8 (Chief Engineer) | 8001 | `python-rag/screen08-chief-engineer/` | `python main.py` | Python + FastAPI | 6-step query workflow |
| Screen 7 (History Retriever) | 8000 | `python-rag/screen07-history-retriever/` | `python main.py` | Python + FastAPI | Historical RAG search |
| PostgreSQL | 5432 | N/A | `docker run postgres:14` | PostgreSQL 14 | Query metadata storage |
| Redis (Bull/cron) | 6379 | N/A | `docker run redis` | Redis | Jobs & caching (backend) |
| Ollama | 11434 | N/A | `ollama serve` | LLM/Embeddings | Embeddings + LLM inference |
| ChromaDB | N/A | `python-rag/screen08-chief-engineer/query_db/` | Embedded | Vector DB for queries |

---

## Service Startup Commands

### 1. Start PostgreSQL
```bash
# Purpose: Store pre-bid queries and workflow status
docker run -d --name nhai-postgres -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=nhai_tender_db -p 5432:5432 postgres:14
```

### 2. Start Redis
```bash
# Purpose: Backend queues/cron state
docker run -d --name nhai-redis -p 6379:6379 redis:latest
```

### 3. Start Ollama
```bash
# Purpose: Embeddings + LLM for Screen 8
ollama serve
ollama pull nomic-embed-text   # embeddings (768d)
ollama pull gemma3:1b           # LLM (default in Screen 8)
```

### 4. Start Backend (NestJS)
```bash
cd backend/
npm run start:dev
```
Port 3000

### 5. Start Frontend (Next.js)
```bash
cd frontend/
npm run dev
```
Port 3001

### 6. Start Screen 7 (History Retriever)
```bash
cd python-rag/screen07-history-retriever/
python main.py
```
Port 8000

### 7. Start Screen 8 (Chief Engineer)
```bash
cd python-rag/screen08-chief-engineer/
python main.py
```
Port 8001 (via `START_SCREEN8_FIXED.bat` with venv activation)

---

## Architecture Components with Commands

```mermaid
flowchart TB
    subgraph "Frontend Layer"
        UI["Next.js Frontend<br/>📂 frontend/<br/>▶️ npm run dev<br/>🌐 Port 3001<br/>💡 Purpose: Vendor/Admin UI"]
    end

    subgraph "Backend Layer - NestJS"
        PrebidAPI["Pre-bid Query Controller<br/>📂 backend/src/prebid-query/<br/>▶️ npm run start:dev<br/>🌐 Port 3000<br/>💡 Purpose: Pre-bid REST API"]
        PrebidSvc["Pre-bid Query Service<br/>📂 backend/src/prebid-query/<br/>💡 Purpose: Business logic + Screen8 calls"]
        VectorJob["Query Vectorization Cron<br/>📂 backend/src/jobs/query-vectorization.job.ts<br/>💡 Purpose: Schedule vectorization"]
        VectorSvc["Vectorization Service<br/>📂 backend/src/vectorization/<br/>💡 Purpose: Call Screen 8 store-query"]
        Queue["Redis / Cron State<br/>📂 backend/<br/>▶️ docker run redis<br/>🌐 6379<br/>💡 Purpose: Job state/cache"]
    end

    subgraph "Python RAG Services"
        Screen8["Screen 8: Chief Engineer<br/>📂 python-rag/screen08-chief-engineer/<br/>▶️ python main.py<br/>🌐 8001<br/>💡 Purpose: 6-step workflow"]
        Screen7["Screen 7: History Retriever<br/>📂 python-rag/screen07-history-retriever/<br/>▶️ python main.py<br/>🌐 8000<br/>💡 Purpose: Historical RAG"]
    end

    subgraph "Data Storage"
        PG[("PostgreSQL<br/>📂 Container: nhai-postgres<br/>▶️ docker run postgres:14<br/>🌐 5432<br/>💡 Purpose: queries table")] 
        Chroma[("ChromaDB (vendor_queries)<br/>📂 python-rag/screen08-chief-engineer/query_db/<br/>💡 Purpose: Similar query vectors")] 
    end

    subgraph "AI Services"
        Ollama["Ollama LLM/Embed<br/>▶️ ollama serve<br/>🌐 11434<br/>💡 Purpose: Embeddings + LLM"]
    end

    %% Flows with numbered + RG labels
    UI -->|"1. POST /api/prebid-queries"| PrebidAPI
    PrebidAPI --> PrebidSvc
    PrebidSvc -->|"2. Save metadata"| PG
    PrebidSvc -->|"3. Enqueue for vectorization"| VectorJob

    VectorJob -->|"4. Build payload"| VectorSvc
    VectorSvc -->|"5. POST /api/chief-engineer/store-query (RG1-RG5)"| Screen8
    Screen8 -->|"6. Embed & store (RG4-RG5)"| Chroma
    Screen8 -->|"7. Ack vectorized"| VectorSvc
    VectorSvc -->|"8. Update vectorized=true"| PG

    %% Processing path
    UI -->|"9. Trigger process (admin)"| PrebidAPI
    PrebidAPI -->|"10. POST /api/prebid-queries/:id/process"| PrebidSvc
    PrebidSvc -->|"11. Call Screen 8 /process"| Screen8
    Screen8 -->|"12. Historical search (RG6 via Screen7)"| Screen7
    Screen7 -->|"13. Return context"| Screen8
    Screen8 -->|"14. Similar queries (RG6)"| Chroma
    Screen8 -->|"15. Generate answer (RG7)"| Ollama
    Screen8 -->|"16. Response + sources"| PrebidSvc
    PrebidSvc -->|"17. Update status + answers"| PG
    PrebidSvc -->|"18. Send to UI"| UI

    style UI fill:#e1f5ff
    style PrebidAPI fill:#fff3cd
    style PrebidSvc fill:#fff3cd
    style VectorJob fill:#d4edda
    style VectorSvc fill:#d4edda
    style Queue fill:#d4edda
    style Screen8 fill:#f8d7da
    style Screen7 fill:#f8d7da
    style PG fill:#d1ecf1
    style Chroma fill:#d1ecf1
    style Ollama fill:#e2e3e5
```

---

## Enhanced Data Flow Diagram with Numbered Sequences

### Complete Flow (Submit → Vectorize → Process → Answer)

```mermaid
sequenceDiagram
    participant User as 👤 User<br/>💡 Submits query
    participant Frontend as 🖥️ Frontend<br/>📂 frontend/<br/>▶️ npm run dev<br/>Port 3001
    participant Backend as 🚀 Backend (Pre-bid)<br/>📂 backend/<br/>▶️ npm run start:dev<br/>Port 3000
    participant PostgreSQL as 🗄️ PostgreSQL<br/>▶️ docker run postgres<br/>Port 5432
    participant VectorCron as ⏱️ Vectorization Cron<br/>📂 backend/src/jobs/<br/>💡 5-min schedule
    participant Screen8 as 🤖 Screen 8 API<br/>📂 python-rag/screen08-chief-engineer/<br/>▶️ python main.py<br/>Port 8001
    participant Chroma as 🔍 ChromaDB (vendor_queries)<br/>📂 python-rag/screen08-chief-engineer/query_db/
    participant Screen7 as 📚 Screen 7<br/>📂 python-rag/screen07-history-retriever/<br/>▶️ python main.py<br/>Port 8000
    participant Ollama as 🤖 Ollama<br/>▶️ ollama serve<br/>Port 11434

    rect rgb(240,248,255)
    Note over User,PostgreSQL: Phase 1: Submit Query (Steps 1-5)
    User->>Frontend: 1. Enter query + metadata
    Frontend->>Backend: 2. POST /api/prebid-queries
    Backend->>PostgreSQL: 3. INSERT into queries (status='pending')
    PostgreSQL-->>Backend: 3A. query_id = uuid
    Backend-->>Frontend: 4. {success, query_id}
    Frontend-->>User: 5. ✅ Saved, awaiting processing
    end

    rect rgb(240,255,240)
    Note over VectorCron,Chroma: Phase 2: Vectorize Query (Steps 6-11, RG1-RG5)
    VectorCron->>Backend: 6. Cron: find unvectorized queries
    Backend->>Screen8: 7. POST /api/chief-engineer/store-query (query text)
    Screen8->>Ollama: 8. Generate embedding (RG4)
    Ollama-->>Screen8: 8A. embedding [768d]
    Screen8->>Chroma: 9. Store vector (RG5)
    Chroma-->>Screen8: 9A. stored
    Screen8-->>Backend: 10. Ack vectorized
    Backend->>PostgreSQL: 11. UPDATE vectorized=true, vectorStoredAt
    end

    rect rgb(255,248,240)
    Note over User,Ollama: Phase 3: AI Processing (Steps 12-21, RG6-RG7)
    User->>Frontend: 12. Admin clicks "Process with AI"
    Frontend->>Backend: 13. POST /api/prebid-queries/:id/process
    Backend->>Screen8: 14. POST /api/chief-engineer/process
    Screen8->>Screen7: 15. Historical search (RG6)
    Screen7-->>Screen8: 15A. historical chunks
    Screen8->>Chroma: 16. Similar queries (RG6)
    Chroma-->>Screen8: 16A. similar query hits
    Screen8->>Ollama: 17. Generate answer (RG7)
    Ollama-->>Screen8: 17A. AI answer + sources
    Screen8-->>Backend: 18. {ai_response, confidence, sources, execution_id}
    Backend->>PostgreSQL: 19. UPDATE status='answered', ai_processed=true
    Backend-->>Frontend: 20. Send answer + confidence
    Frontend-->>User: 21. 📝 Display answer & workflow trace
    end
```

**RAG Flow Mapping Legend:** RG1 Ingest → RG2 Extract → RG3 Chunk (not used) → RG4 Embed → RG5 Store → RG6 Retrieve → RG7 Generate

---

## API Endpoints

### Backend (NestJS) - Pre-bid Module (Port 3000)
Folder: `backend/src/prebid-query/`

1) `GET /api/prebid-queries/statistics` — Stats (pending/answered, avg response)
2) `GET /api/prebid-queries` — List queries (filters: status, category, rfpId, aiProcessed, page/pageSize)
3) `GET /api/prebid-queries/:id` — Get query by UUID
4) `POST /api/prebid-queries/:id/process` — Trigger Screen 8 AI workflow
5) `PATCH /api/prebid-queries/:id/status` — Update status
6) `POST /api/prebid-queries/:id/admin-response` — Save admin response
7) `GET /api/prebid-queries/:id/history` — Audit trail
8) `GET /api/prebid-queries/:id/similar` — Similar queries (DB filter)
9) `GET /api/prebid-queries/workflow/executions` — List Screen 8 workflows
10) `GET /api/prebid-queries/workflow/executions/:executionId` — Workflow details

### Backend Vectorization Job/Service
- **Cron:** Every 5 minutes (`query-vectorization.job.ts`)
- **Call:** `POST {SCREEN8_URL}/api/chief-engineer/store-query`
- **Updates:** `vectorized`, `vectorStoredAt` in PostgreSQL `queries`

### Screen 8 (Chief Engineer FastAPI) - Port 8001
Folder: `python-rag/screen08-chief-engineer/`

1) `GET /api/health` — Health & provider info
2) `POST /api/chief-engineer/store-query` — Embed + store query (RG1-RG5)
3) `POST /api/chief-engineer/process` — 6-step workflow (uses Screen 7 + Chroma)
4) `POST /api/chief-engineer/similar-queries` — Vector search in `vendor_queries`
5) `GET /api/workflow/executions` — List executions
6) `GET /api/workflow/executions/{id}` — Execution detail
7) `GET /api/statistics` — Service stats
8) `POST /api/chief-engineer/test` — Test workflow
9) `DELETE /api/chief-engineer/delete-query/{id}` — Remove vector entry (used by vectorization service)

### Screen 7 (History Retriever) - Port 8000
Used by Screen 8 step 2 (historical search) via `POST /api/rag/search`

---

## PostgreSQL Database Schema

### Table: `queries`
Purpose: Store pre-bid queries and AI processing results

| Column | Type | Purpose |
|--------|------|---------|
| query_id (uuid, PK) | uuid | Unique query identifier |
| query_number | varchar(50), unique | Human-friendly query number |
| rfp_id | uuid | RFP linkage |
| vendor_id | uuid | Vendor reference |
| category_id | int | Category reference |
| query_text | text | Query content |
| status | varchar(50) | pending/under_review/answered |
| priority | varchar(20) | low/medium/high |
| ai_processed | boolean | AI processed flag |
| admin_reviewed | boolean | Admin review flag |
| ai_response / past_ref_response / past_response | text | AI + reference answers |
| confidence | decimal(5,2) | Confidence score |
| source_documents | jsonb | Sources from Screen 8 |
| execution_id | varchar(100) | Workflow execution ID |
| submitted_at | timestamp | Submission time |
| processed_at | timestamp | AI processed time |
| answered_at | timestamp | Admin answered time |
| updated_at | timestamp | Last update |
| vectorized | boolean | Stored in Chroma flag |
| vectorStoredAt | timestamp | Vector storage time |

### Indexes
- `(rfp_id, status)`
- `vendor_id`
- `submitted_at`
- `status`
- `ai_processed`
- `vectorized`

---

## Vector Database (ChromaDB)

- **Collection:** `vendor_queries`
- **Folder:** `python-rag/screen08-chief-engineer/query_db/`
- **Dimensions:** 768 (Ollama `nomic-embed-text` by default)
- **Metadata:** `query_id`, `category`, `rfp_number`, `submitted_by`, `priority`, `submitted_at`, `rfp_title`, `project_name`
- **Usage:**
  - Store via `POST /api/chief-engineer/store-query` (Vectorization Job)
  - Search via `POST /api/chief-engineer/similar-queries` (RG6)

---

## Embedding Process with RAG Flow Mapping

### Query Vectorization Pipeline (RG1-RG5)
```mermaid
flowchart LR
    subgraph "RG1: Ingest"
        Q["📝 Query Text<br/>from PostgreSQL (queries)"]
        Prep["Normalize text<br/>trim, lower, strip"]
    end

    subgraph "RG2: Extract"
        Meta["Attach metadata<br/>{query_id, rfp_number, category, submitted_at}"]
    end

    subgraph "RG4: Embedding"
        Embed["Ollama Embeddings<br/>model: nomic-embed-text<br/>▶️ ollama serve<br/>🌐 11434"]
        Vec["Embedding Vector<br/>768 dims"]
    end

    subgraph "RG5: Vector Storage"
        Store["ChromaDB vendor_queries<br/>collection.add()<br/>📂 query_db/"]
    end

    Q -->|"1 (RG1)"| Prep
    Prep -->|"2 (RG2)"| Meta
    Meta -->|"3 (RG4)"| Embed
    Embed -->|"4 (RG4)"| Vec
    Vec -->|"5 (RG5)"| Store

    style Q fill:#e1f5ff
    style Prep fill:#fff3cd
    style Meta fill:#d4edda
    style Embed fill:#f8d7da
    style Vec fill:#d1ecf1
    style Store fill:#d1ecf1
```

### RAG Standard Flow Mapping (Screen 8)
- **RG1:** Query ingestion (text from PostgreSQL)
- **RG2:** Text normalization + metadata assembly
- **RG3:** Chunking (N/A for short queries; treated as single chunk)
- **RG4:** Embedding via Ollama/OpenAI (configurable)
- **RG5:** Vector storage in `vendor_queries`
- **RG6:** Retriever (similar queries + Screen 7 historical search)
- **RG7:** LLM generation (compose historical + similar-query context)

---

## Data Flow Sequences

### Sequence 1: Submit & Vectorize Query (Steps 1-11)
```mermaid
sequenceDiagram
    actor User as 👤 User
    participant Frontend as Frontend<br/>📂 frontend/
    participant Backend as Backend API<br/>📂 backend/
    participant PostgreSQL as PostgreSQL
    participant VectorCron as Vector Cron
    participant Screen8 as Screen 8<br/>📂 screen08-chief-engineer/
    participant Chroma as ChromaDB
    participant Ollama as Ollama

    User->>Frontend: 1. Fill query form
    Frontend->>Backend: 2. POST /api/prebid-queries
    Backend->>PostgreSQL: 3. Insert query (pending)
    PostgreSQL-->>Backend: 3A. query_id
    Backend-->>Frontend: 4. {success, query_id}

    VectorCron->>Backend: 5. Cron picks unvectorized queries
    Backend->>Screen8: 6. POST /store-query (query text)
    Screen8->>Ollama: 7. Embed text (RG4)
    Ollama-->>Screen8: 7A. embedding
    Screen8->>Chroma: 8. Store vector (RG5)
    Chroma-->>Screen8: 8A. stored
    Screen8-->>Backend: 9. Ack stored
    Backend->>PostgreSQL: 10. UPDATE vectorized=true
    Backend-->>VectorCron: 11. Job complete
```

### Sequence 2: AI Processing Workflow (Steps 12-21, 6-Step Agent)
```mermaid
sequenceDiagram
    actor Admin as 👤 Admin
    participant Frontend as Frontend<br/>📂 frontend/
    participant Backend as Backend API<br/>📂 backend/
    participant Screen8 as Screen 8<br/>📂 screen08-chief-engineer/
    participant Screen7 as Screen 7<br/>📂 screen07-history-retriever/
    participant Chroma as ChromaDB
    participant Ollama as Ollama
    participant PostgreSQL as PostgreSQL

    Admin->>Frontend: 12. Click "Process with AI"
    Frontend->>Backend: 13. POST /api/prebid-queries/:id/process
    Backend->>Screen8: 14. POST /api/chief-engineer/process

    Screen8->>Screen8: Step1 Analyze (intent/category)
    Screen8->>Screen7: Step2 Historical search (RG6)
    Screen7-->>Screen8: 14A. Historical context
    Screen8->>Chroma: Step3 Similar queries (RG6)
    Chroma-->>Screen8: 14B. Similar query hits
    Screen8->>Screen8: Step4 Context aggregation
    Screen8->>Ollama: Step5 Generate answer (RG7)
    Ollama-->>Screen8: 14C. AI answer + sources
    Screen8->>Screen8: Step6 Quality check + score

    Screen8-->>Backend: 15. {ai_response, confidence, sources, execution_id}
    Backend->>PostgreSQL: 16. UPDATE status='answered', ai_processed=true
    Backend-->>Frontend: 17. Return answer
    Frontend-->>Admin: 18. Show answer + sources + score
```

### Sequence 3: Similar Query Search (Steps 22-27)
```mermaid
sequenceDiagram
    participant Admin as 👤 Admin
    participant Frontend as Frontend
    participant Screen8 as Screen 8
    participant Chroma as ChromaDB

    Admin->>Frontend: 22. Search similar queries
    Frontend->>Screen8: 23. POST /api/chief-engineer/similar-queries
    Screen8->>Chroma: 24. query() vendor_queries (RG6)
    Chroma-->>Screen8: 25. Similar query list
    Screen8-->>Frontend: 26. Return matches
    Frontend-->>Admin: 27. Display similar queries
```

---

## Background Vectorization Job

- **File:** `backend/src/jobs/query-vectorization.job.ts`
- **Schedule:** Every 5 minutes (Cron)
- **Batch size:** `VECTORIZATION_BATCH_SIZE` (default 10)
- **Flow:** Find `vectorized=false` queries → call Screen 8 `/store-query` → update `vectorized=true` & `vectorStoredAt`
- **Retry:** Next cron run will pick any failures; errors logged

---

## Error Handling & Retry

- **Screen 8 unreachable:** `ECONNREFUSED` from `/store-query` → job logs failure; retried on next cron
- **Ollama down:** Embedding call fails (Step 7) → HTTP 500; query remains `vectorized=false`
- **Chroma error:** Storage failure (Step 8) → HTTP 500; retried next run
- **Process endpoint failure:** Backend returns 500; status remains `under_review`; admin can retry
- **Health checks:** `GET /api/health` (Screen 8) used by backend `vectorization.controller` health endpoint

---

## Summary

- Full Screen 8 data flow with numbered steps and RG1-RG7 mapping
- Architecture + sequences mirror Screen 7 V3 style
- One-line purpose notes on every component/participant
- Covers submission, vectorization, AI processing, and similar-query search
- References to concrete commands, folders, ports, and cron timings
