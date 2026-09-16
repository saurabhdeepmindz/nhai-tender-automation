# Screen 8: Pre-bid Query Management - Complete Data Flow (V3)

**Document:** Screen 8 Data Flow Architecture with Numbered Sequences, RAG Flow Mapping, WKFL Steps in Main Diagram & Workflow Implementation Details  
**Date:** January 28, 2026  
**Version:** 3.0  
**Status:** ✅ Production Ready  
**Scope:** Mirrors the detail and structure of Screen 7 V3 + 6-Step Workflow (WKFL-Step1 to WKFL-Step6) visible in all diagrams

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Service Startup Commands](#service-startup-commands)
3. [Architecture Components with Commands & WKFL Steps](#architecture-components-with-commands--wkfl-steps)
4. [Enhanced Data Flow Diagram with Numbered Sequences & WKFL Steps](#enhanced-data-flow-diagram-with-numbered-sequences--wkfl-steps)
5. [API Endpoints](#api-endpoints)
6. [PostgreSQL Database Schema](#postgresql-database-schema)
7. [Vector Database (ChromaDB)](#vector-database-chromadb)
8. [Embedding Process with RAG Flow Mapping](#embedding-process-with-rag-flow-mapping)
9. [Data Flow Sequences](#data-flow-sequences)
10. [Background Vectorization Job](#background-vectorization-job)
11. [Error Handling & Retry](#error-handling--retry)
12. [6-Step Chief Engineer Workflow - Implementation Details](#6-step-chief-engineer-workflow---implementation-details)

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
| PostgreSQL | 5432 | N/A | `docker run postgres:14` | PostgreSQL 14 | Query metadata + workflow storage |
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

## Architecture Components with Commands & WKFL Steps

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
        
        subgraph "6-Step Workflow (WKFL)"
            WKFL1["WKFL-Step1: Query Analysis<br/>_step1_query_analysis()<br/>💡 Categorize & extract intent"]
            WKFL2["WKFL-Step2: Historical Search<br/>_step2_historical_search()<br/>💡 Search Screen 7 (RG6)"]
            WKFL3["WKFL-Step3: Similar Queries<br/>_step3_similar_query_search()<br/>💡 Search ChromaDB (RG6)"]
            WKFL4["WKFL-Step4: Context Aggregation<br/>_step4_context_aggregation()<br/>💡 Combine all sources"]
            WKFL5["WKFL-Step5: Response Generation<br/>_step5_response_generation()<br/>💡 LLM answer (RG7)"]
            WKFL6["WKFL-Step6: Quality Check<br/>_step6_quality_check()<br/>💡 Confidence score"]
        end
        
        Screen7["Screen 7: History Retriever<br/>📂 python-rag/screen07-history-retriever/<br/>▶️ python main.py<br/>🌐 8000<br/>💡 Purpose: Historical RAG"]
    end

    subgraph "Data Storage"
        PG[("PostgreSQL<br/>📂 Container: nhai-postgres<br/>▶️ docker run postgres:14<br/>🌐 5432<br/>💡 Purpose: queries + workflow_executions + workflow_steps")] 
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

    %% Processing path with WKFL steps
    UI -->|"9. Trigger process (admin)"| PrebidAPI
    PrebidAPI -->|"10. POST /api/prebid-queries/:id/process"| PrebidSvc
    PrebidSvc -->|"11. Call Screen 8 /process"| Screen8
    Screen8 -->|"12. Create workflow"| PG
    Screen8 --> WKFL1
    WKFL1 --> WKFL2
    WKFL2 -->|"13. Historical search (RG6)"| Screen7
    Screen7 -->|"14. Return context"| WKFL2
    WKFL2 --> WKFL3
    WKFL3 -->|"15. Similar queries (RG6)"| Chroma
    Chroma -->|"16. Return similar"| WKFL3
    WKFL3 --> WKFL4
    WKFL4 --> WKFL5
    WKFL5 -->|"17. Generate answer (RG7)"| Ollama
    Ollama -->|"18. Return answer"| WKFL5
    WKFL5 --> WKFL6
    WKFL6 -->|"19. Save workflow steps"| PG
    WKFL6 -->|"20. Response + sources"| PrebidSvc
    PrebidSvc -->|"21. Update status + answers"| PG
    PrebidSvc -->|"22. Send to UI"| UI

    style UI fill:#e1f5ff
    style PrebidAPI fill:#fff3cd
    style PrebidSvc fill:#fff3cd
    style VectorJob fill:#d4edda
    style VectorSvc fill:#d4edda
    style Queue fill:#d4edda
    style Screen8 fill:#f8d7da
    style WKFL1 fill:#ffe6e6
    style WKFL2 fill:#ffe6e6
    style WKFL3 fill:#ffe6e6
    style WKFL4 fill:#ffe6e6
    style WKFL5 fill:#ffe6e6
    style WKFL6 fill:#ffe6e6
    style Screen7 fill:#f8d7da
    style PG fill:#d1ecf1
    style Chroma fill:#d1ecf1
    style Ollama fill:#e2e3e5
```

---

## Enhanced Data Flow Diagram with Numbered Sequences & WKFL Steps

### Complete Flow (Submit → Vectorize → Process with 6-Step Workflow → Answer)

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
    Note over User,Ollama: Phase 3: AI Processing (Steps 12-27, 6-Step Workflow WKFL-Step1 to WKFL-Step6)
    User->>Frontend: 12. Admin clicks "Process with AI"
    Frontend->>Backend: 13. POST /api/prebid-queries/:id/process
    Backend->>Screen8: 14. POST /api/chief-engineer/process (invokes 6-step workflow)
    
    Screen8->>PostgreSQL: 15. INSERT workflow_executions (status='in_progress')
    PostgreSQL-->>Screen8: 15A. workflow_id
    
    Note over Screen8: WKFL-Step1: Query Analysis
    Screen8->>PostgreSQL: 16. INSERT workflow_steps (step=1, status='in_progress')
    Screen8->>Screen8: Categorize + extract intent
    Screen8->>PostgreSQL: 16A. UPDATE workflow_steps (step=1, status='completed', result={...})
    
    Note over Screen8,Screen7: WKFL-Step2: Historical Search
    Screen8->>PostgreSQL: 17. INSERT workflow_steps (step=2, status='in_progress')
    Screen8->>Screen7: 18. Historical search (RG6)
    Screen7-->>Screen8: 18A. historical chunks
    Screen8->>PostgreSQL: 17A. UPDATE workflow_steps (step=2, status='completed', result={...})
    
    Note over Screen8,Chroma: WKFL-Step3: Similar Query Search
    Screen8->>PostgreSQL: 19. INSERT workflow_steps (step=3, status='in_progress')
    Screen8->>Chroma: 20. Similar queries (RG6)
    Chroma-->>Screen8: 20A. similar query hits
    Screen8->>PostgreSQL: 19A. UPDATE workflow_steps (step=3, status='completed', result={...})
    
    Note over Screen8: WKFL-Step4: Context Aggregation
    Screen8->>PostgreSQL: 21. INSERT workflow_steps (step=4, status='in_progress')
    Screen8->>Screen8: Combine historical + similar
    Screen8->>PostgreSQL: 21A. UPDATE workflow_steps (step=4, status='completed', result={...})
    
    Note over Screen8,Ollama: WKFL-Step5: Response Generation
    Screen8->>PostgreSQL: 22. INSERT workflow_steps (step=5, status='in_progress')
    Screen8->>Ollama: 23. Generate answer (RG7)
    Ollama-->>Screen8: 23A. AI answer + sources
    Screen8->>PostgreSQL: 22A. UPDATE workflow_steps (step=5, status='completed', result={...})
    
    Note over Screen8: WKFL-Step6: Quality Check
    Screen8->>PostgreSQL: 24. INSERT workflow_steps (step=6, status='in_progress')
    Screen8->>Screen8: Calculate confidence score
    Screen8->>PostgreSQL: 24A. UPDATE workflow_steps (step=6, status='completed', result={confidence})
    
    Screen8->>PostgreSQL: 25. UPDATE workflow_executions (status='completed', total_duration_ms)
    Screen8-->>Backend: 26. {ai_response, confidence, sources, execution_id}
    Backend->>PostgreSQL: 27. UPDATE queries (status='answered', ai_processed=true, execution_id)
    Backend-->>Frontend: 28. Send answer + confidence
    Frontend-->>User: 29. 📝 Display answer & workflow trace
    end
```

**RAG Flow Mapping Legend:** RG1 Ingest → RG2 Extract → RG3 Chunk (not used) → RG4 Embed → RG5 Store → RG6 Retrieve → RG7 Generate

**Workflow Mapping Legend:** WKFL-Step1 (Analysis) → WKFL-Step2 (Historical) → WKFL-Step3 (Similar) → WKFL-Step4 (Aggregate) → WKFL-Step5 (Generate) → WKFL-Step6 (Quality)

**New in V3:** Workflow steps now persisted to PostgreSQL tables (`workflow_executions` and `workflow_steps`) for production-ready audit trail

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
3) `POST /api/chief-engineer/process` — 6-step workflow (uses Screen 7 + Chroma + PostgreSQL workflow tracking)
4) `POST /api/chief-engineer/similar-queries` — Vector search in `vendor_queries`
5) `GET /api/workflow/executions` — List executions from PostgreSQL
6) `GET /api/workflow/executions/{id}` — Execution detail from PostgreSQL
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
| execution_id | varchar(100) | Workflow execution ID (FK to workflow_executions) |
| submitted_at | timestamp | Submission time |
| processed_at | timestamp | AI processed time |
| answered_at | timestamp | Admin answered time |
| updated_at | timestamp | Last update |
| vectorized | boolean | Stored in Chroma flag |
| vectorStoredAt | timestamp | Vector storage time |

### Table: `workflow_executions` (NEW - Production Ready)
Purpose: Track 6-step workflow executions for audit trail

| Column | Type | Purpose |
|--------|------|---------|
| workflow_id (varchar 100, PK) | varchar(100) | Unique workflow identifier (UUID) |
| query_id | uuid | FK to queries.query_id |
| status | varchar(50) | pending/in_progress/completed/failed |
| current_step | int | Current step (1-6) |
| total_steps | int | Total steps (always 6) |
| processing_start | timestamp | Workflow start time |
| processing_end | timestamp | Workflow end time |
| total_duration_ms | decimal(10,2) | Total processing time (milliseconds) |
| final_result | jsonb | Final response with confidence/sources |
| error_message | text | Error message if failed |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**Indexes:**
- `query_id` (unique)
- `status`
- `created_at`

### Table: `workflow_steps` (NEW - Production Ready)
Purpose: Track individual step execution within workflows

| Column | Type | Purpose |
|--------|------|---------|
| step_id (serial, PK) | serial | Auto-increment step ID |
| workflow_id | varchar(100) | FK to workflow_executions.workflow_id |
| step_number | int | Step number (1-6) |
| step_name | varchar(100) | Step name (Query Analysis, Historical Search, etc.) |
| status | varchar(50) | pending/in_progress/completed/failed/skipped |
| start_time | timestamp | Step start time |
| end_time | timestamp | Step end time |
| duration_ms | decimal(10,2) | Step processing time (milliseconds) |
| result | jsonb | Step-specific result data |
| error_message | text | Error message if failed |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |

**Indexes:**
- `workflow_id, step_number` (composite unique)
- `workflow_id`
- `status`

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

### Sequence 2: AI Processing Workflow with 6-Step Agent (Steps 12-29, WKFL-Step1 to WKFL-Step6)
```mermaid
sequenceDiagram
    actor Admin as 👤 Admin
    participant Frontend as Frontend<br/>📂 frontend/
    participant Backend as Backend API<br/>📂 backend/
    participant Screen8 as Screen 8<br/>📂 screen08-chief-engineer/<br/>💡 ChiefEngineerAgent
    participant Screen7 as Screen 7<br/>📂 screen07-history-retriever/
    participant Chroma as ChromaDB<br/>vendor_queries
    participant Ollama as Ollama<br/>LLM
    participant PostgreSQL as PostgreSQL<br/>queries + workflow_executions + workflow_steps

    Admin->>Frontend: 12. Click "Process with AI"
    Frontend->>Backend: 13. POST /api/prebid-queries/:id/process
    Backend->>Screen8: 14. POST /api/chief-engineer/process

    Screen8->>PostgreSQL: 15. INSERT workflow_executions (workflow_id, query_id, status='in_progress')
    PostgreSQL-->>Screen8: 15A. workflow_id created

    Note over Screen8,PostgreSQL: WKFL-Step1: Query Analysis<br/>_step1_query_analysis()
    Screen8->>PostgreSQL: 16. INSERT workflow_steps (workflow_id, step=1, status='in_progress')
    Screen8->>Screen8: Extract category, intent, topics, complexity
    Screen8->>PostgreSQL: 16A. UPDATE workflow_steps (step=1, status='completed', duration_ms, result={...})
    
    Note over Screen8,Screen7: WKFL-Step2: Historical Search<br/>_step2_historical_search()
    Screen8->>PostgreSQL: 17. INSERT workflow_steps (step=2, status='in_progress')
    Screen8->>Screen7: 18. POST /api/rag/search (RG6)
    Screen7-->>Screen8: 18A. Historical context chunks
    Screen8->>PostgreSQL: 17A. UPDATE workflow_steps (step=2, status='completed', result={results_count, sources})
    
    Note over Screen8,Chroma: WKFL-Step3: Similar Query Search<br/>_step3_similar_query_search()
    Screen8->>PostgreSQL: 19. INSERT workflow_steps (step=3, status='in_progress')
    Screen8->>Chroma: 20. Query vendor_queries (RG6)
    Chroma-->>Screen8: 20A. Similar query hits (top 3)
    Screen8->>PostgreSQL: 19A. UPDATE workflow_steps (step=3, status='completed', result={similar_count, top_similarity})
    
    Note over Screen8: WKFL-Step4: Context Aggregation<br/>_step4_context_aggregation()
    Screen8->>PostgreSQL: 21. INSERT workflow_steps (step=4, status='in_progress')
    Screen8->>Screen8: Combine historical + similar + analysis
    Screen8->>PostgreSQL: 21A. UPDATE workflow_steps (step=4, status='completed', result={total_sources, context_quality})
    
    Note over Screen8,Ollama: WKFL-Step5: Response Generation<br/>_step5_response_generation()
    Screen8->>PostgreSQL: 22. INSERT workflow_steps (step=5, status='in_progress')
    Screen8->>Ollama: 23. Generate answer (RG7)
    Ollama-->>Screen8: 23A. AI answer + sources
    Screen8->>PostgreSQL: 22A. UPDATE workflow_steps (step=5, status='completed', result={response_length, sources_count})
    
    Note over Screen8: WKFL-Step6: Quality Check<br/>_step6_quality_check()
    Screen8->>PostgreSQL: 24. INSERT workflow_steps (step=6, status='in_progress')
    Screen8->>Screen8: Calculate confidence (0.0-1.0)
    Screen8->>PostgreSQL: 24A. UPDATE workflow_steps (step=6, status='completed', result={confidence_score, quality_passed})

    Screen8->>PostgreSQL: 25. UPDATE workflow_executions (status='completed', processing_end, total_duration_ms, final_result={...})
    
    Screen8-->>Backend: 26. {ai_response, confidence, sources, execution_id=workflow_id}
    Backend->>PostgreSQL: 27. UPDATE queries (status='answered', ai_processed=true, execution_id)
    Backend-->>Frontend: 28. Return answer
    Frontend-->>Admin: 29. Show answer + sources + score + workflow trace
```

### Sequence 3: Similar Query Search (Steps 30-35)
```mermaid
sequenceDiagram
    participant Admin as 👤 Admin
    participant Frontend as Frontend
    participant Screen8 as Screen 8
    participant Chroma as ChromaDB

    Admin->>Frontend: 30. Search similar queries
    Frontend->>Screen8: 31. POST /api/chief-engineer/similar-queries
    Screen8->>Chroma: 32. query() vendor_queries (RG6)
    Chroma-->>Screen8: 33. Similar query list
    Screen8-->>Frontend: 34. Return matches
    Frontend-->>Admin: 35. Display similar queries
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
- **Workflow step failure:** Step marked as failed in `workflow_steps` table, subsequent steps marked as skipped, workflow status set to 'failed'
- **Health checks:** `GET /api/health` (Screen 8) used by backend `vectorization.controller` health endpoint

---

## 6-Step Chief Engineer Workflow - Implementation Details

### ✅ Implementation Status: **COMPLETE & PRODUCTION-READY**

All 6 steps of the Chief Engineer workflow for Screen 8 are fully implemented with PostgreSQL persistence.

### Implementation Overview

| Step | Name | Implementation Status | Source Reference |
|------|------|----------------------|------------------|
| **WKFL-Step1** | Query Analysis | ✅ Implemented + DB Tracking | `_step1_query_analysis()` in [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L133-L192) |
| **WKFL-Step2** | Historical Search (Screen 7) | ✅ Implemented + DB Tracking | `_step2_historical_search()` in [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L194-L238) |
| **WKFL-Step3** | Similar Query Search (Screen 8) | ✅ Implemented + DB Tracking | `_step3_similar_query_search()` in [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L240-L297) |
| **WKFL-Step4** | Context Aggregation | ✅ Implemented + DB Tracking | `_step4_context_aggregation()` in [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L299-L354) |
| **WKFL-Step5** | Response Generation | ✅ Implemented + DB Tracking | `_step5_response_generation()` in [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L356-L467) |
| **WKFL-Step6** | Quality Check | ✅ Implemented + DB Tracking | `_step6_quality_check()` in [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L469-L540) |

### Production Database Schema (NEW in V3)

#### workflow_executions Table
```sql
CREATE TABLE workflow_executions (
    workflow_id VARCHAR(100) PRIMARY KEY,
    query_id UUID NOT NULL REFERENCES queries(query_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    current_step INT NOT NULL DEFAULT 0,
    total_steps INT NOT NULL DEFAULT 6,
    processing_start TIMESTAMP,
    processing_end TIMESTAMP,
    total_duration_ms DECIMAL(10,2),
    final_result JSONB,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_executions_query_id ON workflow_executions(query_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at);
```

#### workflow_steps Table
```sql
CREATE TABLE workflow_steps (
    step_id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(100) NOT NULL REFERENCES workflow_executions(workflow_id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_ms DECIMAL(10,2),
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workflow_id, step_number)
);

CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);
```

### V3 Production Implementation Files

**1. PostgreSQL Migration:** `backend/src/migrations/YYYYMMDDHHMMSS-create-workflow-tables.ts`
**2. Production WorkflowManager:** `python-rag/screen08-chief-engineer/workflow_manager_pg.py`
**3. Database Config:** `python-rag/screen08-chief-engineer/database.py`
**4. TypeORM Entities:** 
   - `backend/src/workflow/entities/workflow-execution.entity.ts`
   - `backend/src/workflow/entities/workflow-step.entity.ts`

See implementation files in the sections below.

---

## Summary

- **V3 Enhancement:** WKFL-Step1 through WKFL-Step6 now visible in main architecture flowchart as nested subgraph
- Full Screen 8 data flow with numbered steps (1-35) and RAG flow mapping (RG1-RG7)
- 6-step Chief Engineer workflow labeled as WKFL-Step1 through WKFL-Step6 in all diagrams
- **Production-Ready Workflow Tracking:** PostgreSQL tables `workflow_executions` and `workflow_steps` with complete audit trail
- All 6 workflow steps fully implemented with database persistence
- Complete implementation details with source code references
- Architecture + sequences show PostgreSQL INSERT/UPDATE operations for workflow tracking
- One-line purpose notes on every component/participant
- Covers submission, vectorization, AI processing (6-step workflow with DB tracking), and similar-query search
- References to concrete commands, folders, ports, and cron timings
- Database schema documented (PostgreSQL `queries` + `workflow_executions` + `workflow_steps` tables + ChromaDB `vendor_queries` collection)

---
