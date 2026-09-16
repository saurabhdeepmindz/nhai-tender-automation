# Screen 7: Historical Data Upload System - Complete Data Flow (V2)

**Document:** Screen 7 Data Flow Architecture with Commands & Folders  
**Date:** January 27, 2026  
**Version:** 2.0  
**Status:** ✅ Production Ready  
**Updates:** Added startup commands and folder paths to all diagrams

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Service Startup Commands](#service-startup-commands)
3. [Architecture Components with Commands](#architecture-components-with-commands)
4. [Enhanced Data Flow Diagram](#enhanced-data-flow-diagram)
5. [API Endpoints](#api-endpoints)
6. [PostgreSQL Database Schema](#postgresql-database-schema)
7. [Vector Database (ChromaDB)](#vector-database-chromadb)
8. [Embedding Process](#embedding-process)
9. [Data Flow Sequences](#data-flow-sequences)
10. [Background Processing](#background-processing)
11. [Error Handling & Retry](#error-handling--retry)

---

## System Overview

**Screen 7** (Historical Data Upload & Retrieval) manages the complete lifecycle of historical RFP documents, Q&A pairs, and corrigendums. The system provides:

- **Document Upload:** Multi-format file upload (PDF, DOCX, CSV, XLSX)
- **Metadata Storage:** PostgreSQL for structured data
- **Vector Storage:** ChromaDB for semantic search
- **Background Processing:** Bull queue for async document processing
- **RAG Integration:** Python services for document chunking and embedding
- **Query Interface:** Semantic search across historical documents

### Key Services with Startup Commands

| Service | Port | Folder | Startup Command | Technology |
|---------|------|--------|-----------------|------------|
| Backend (NestJS) | 3000 | `backend/` | `npm run start:dev` | Node.js + TypeScript |
| Frontend (Next.js) | 3001 | `frontend/` | `npm run dev` | React + Next.js |
| Screen 7 (History Retriever) | 8000 | `python-rag/screen07-history-retriever/` | `python main.py` | Python + FastAPI |
| Historical Data Service | 8005 | `python-rag/historical-data-service/` | `python main.py` | Python + FastAPI |
| PostgreSQL | 5432 | N/A | Docker container | PostgreSQL 14 |
| Redis (Bull Queue) | 6379 | N/A | `docker run redis` | Redis |
| Ollama | 11434 | N/A | `ollama serve` | LLM Service |
| ChromaDB | N/A | `python-rag/*/chroma_db/` | Embedded in services | Vector DB |

---

## Service Startup Commands

### 1. Start PostgreSQL Database
```bash
# Using Docker
docker run -d \
  --name nhai-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=nhai_tender_db \
  -p 5432:5432 \
  postgres:14
```

### 2. Start Redis (for Bull Queue)
```bash
# Using Docker
docker run -d \
  --name nhai-redis \
  -p 6379:6379 \
  redis:latest
```
**Folder:** Backend manages connection  
**Used by:** `backend/` for Bull Queue

### 3. Start Ollama Service
```bash
# Start Ollama
ollama serve
```
**Port:** 11434  
**Models Required:**
```bash
ollama pull nomic-embed-text  # For embeddings (768 dimensions)
ollama pull gemma:2b           # For text generation
```

### 4. Start Backend (NestJS)
```bash
cd backend/
npm run start:dev
```
**Port:** 3000  
**Folder:** `backend/`  
**Script:** Defined in `package.json`

### 5. Start Frontend (Next.js)
```bash
cd frontend/
npm run dev
```
**Port:** 3001  
**Folder:** `frontend/`  
**Script:** Defined in `package.json`

### 6. Start Historical Data Service
```bash
cd python-rag/historical-data-service/
python main.py
```
**Port:** 8005  
**Folder:** `python-rag/historical-data-service/`  
**Virtual Env:** `nhai-venv/`

### 7. Start Screen 7 - History Retriever
```bash
cd python-rag/screen07-history-retriever/
python main.py
```
**Port:** 8000  
**Folder:** `python-rag/screen07-history-retriever/`  
**Virtual Env:** `nhai-venv/`

---

## Architecture Components with Commands

```mermaid
flowchart TB
    subgraph "Frontend Layer"
        UI["Next.js Frontend<br/>📂 Folder: frontend/<br/>▶️ Command: npm run dev<br/>🌐 Port 3001"]
    end
    
    subgraph "Backend Layer - NestJS"
        API["Historical Data Controller<br/>📂 Folder: backend/src/historical-data/<br/>▶️ Command: npm run start:dev<br/>🌐 Port 3000"]
        Service["Historical Data Service<br/>📂 Folder: backend/src/historical-data/<br/>TypeORM + Bull Queue"]
        Queue["Bull Queue (Redis)<br/>📂 Folder: backend/<br/>▶️ Command: docker run redis<br/>🌐 Port 6379"]
        Processor["Document Processor<br/>📂 Folder: backend/src/historical-data/processors/"]
    end
    
    subgraph "Python RAG Services"
        Screen7["Screen 7: History Retriever<br/>📂 Folder: python-rag/screen07-history-retriever/<br/>▶️ Command: python main.py<br/>🌐 Port 8000"]
        HistData["Historical Data Service<br/>📂 Folder: python-rag/historical-data-service/<br/>▶️ Command: python main.py<br/>🌐 Port 8005"]
    end
    
    subgraph "Data Storage"
        PG[("PostgreSQL Database<br/>📂 Container: nhai-postgres<br/>▶️ Command: docker run postgres:14<br/>🌐 Port 5432<br/><br/>Table: historical_documents")]
        Chroma[("ChromaDB (Vector Store)<br/>📂 Folder: python-rag/*/chroma_db/<br/>🔍 Embedded in Python services<br/><br/>Collections:<br/>• rfp_documents<br/>• qa_documents<br/>• corrigendum_documents")]
    end
    
    subgraph "AI Services"
        Ollama["Ollama LLM Service<br/>▶️ Command: ollama serve<br/>🌐 Port 11434<br/><br/>Models:<br/>• nomic-embed-text (768d)<br/>• gemma:2b"]
    end
    
    subgraph "File System"
        Uploads[("File Storage<br/>📂 Folder: uploads/historical/<br/>Storage: Local disk")]
    end
    
    %% Flow connections
    UI -->|"POST /api/historical-data/upload"| API
    API --> Service
    Service -->|"1. Save metadata"| PG
    Service -->|"2. Save file"| Uploads
    Service -->|"3. Queue job"| Queue
    
    Queue -->|"Background job"| Processor
    Processor -->|"POST /api/process-document"| HistData
    
    HistData -->|"Extract & chunk"| Uploads
    HistData -->|"Generate embeddings"| Ollama
    HistData -->|"Store vectors"| Chroma
    HistData -->|"Update status"| PG
    
    UI -->|"POST /api/rag/search"| Screen7
    Screen7 -->|"Semantic search"| Chroma
    Screen7 -->|"Generate response"| Ollama
    
    style UI fill:#e1f5ff
    style API fill:#fff3cd
    style Service fill:#fff3cd
    style Queue fill:#d4edda
    style Processor fill:#d4edda
    style Screen7 fill:#f8d7da
    style HistData fill:#f8d7da
    style PG fill:#d1ecf1
    style Chroma fill:#d1ecf1
    style Ollama fill:#e2e3e5
    style Uploads fill:#e2e3e5
```

---

## Enhanced Data Flow Diagram

### Complete Upload to Query Flow with Folders & Commands

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🖥️ Frontend<br/>📂 frontend/<br/>▶️ npm run dev<br/>Port 3001
    participant Backend as 🚀 Backend API<br/>📂 backend/<br/>▶️ npm run start:dev<br/>Port 3000
    participant PostgreSQL as 🗄️ PostgreSQL<br/>▶️ docker run postgres:14<br/>Port 5432
    participant Queue as 📬 Bull Queue<br/>▶️ docker run redis<br/>Port 6379
    participant Processor as ⚙️ Background Processor<br/>📂 backend/src/historical-data/processors/
    participant HistData as 🐍 Historical Data Service<br/>📂 python-rag/historical-data-service/<br/>▶️ python main.py<br/>Port 8005
    participant Ollama as 🤖 Ollama<br/>▶️ ollama serve<br/>Port 11434
    participant ChromaDB as 🔍 ChromaDB<br/>📂 python-rag/*/chroma_db/<br/>Embedded in Python
    participant Screen7 as 📚 Screen 7 RAG<br/>📂 python-rag/screen07-history-retriever/<br/>▶️ python main.py<br/>Port 8000
    
    rect rgb(240, 248, 255)
    Note over User,ChromaDB: Phase 1: Document Upload
    User->>Frontend: Select file + metadata
    Frontend->>Backend: POST /api/historical-data/upload
    
    Backend->>Backend: Validate file (PDF/DOCX/CSV/XLSX)
    Backend->>PostgreSQL: INSERT INTO historical_documents
    PostgreSQL-->>Backend: document_id = 123
    
    Backend->>Backend: Save file to ./uploads/historical/
    Backend->>Queue: Add job 'process-historical-document'
    Queue-->>Backend: Job queued (ID: job_456)
    
    Backend-->>Frontend: {success: true, document_id: 123, status: 'pending'}
    Frontend-->>User: ✅ Upload successful, processing...
    end
    
    rect rgb(240, 255, 240)
    Note over Queue,ChromaDB: Phase 2: Background Processing
    Queue->>Processor: Trigger job execution
    Processor->>PostgreSQL: UPDATE status = 'processing'
    
    Processor->>HistData: POST /api/process-document<br/>{document_id, file_path, type, rfp_number}
    
    HistData->>HistData: Load document (PyPDF/Docx2txt)
    HistData->>HistData: Extract text content
    HistData->>HistData: Split into chunks<br/>(1000 chars, 200 overlap)
    
    loop For each chunk
        HistData->>Ollama: Generate embeddings<br/>POST /api/embeddings<br/>{model: 'nomic-embed-text', prompt: chunk}
        Ollama-->>HistData: embedding vector [768 dimensions]
        
        alt Document Type = RFP
            HistData->>ChromaDB: collection: rfp_documents<br/>add({id, embedding, metadata: {rfp_number, chunk_index}})
        else Document Type = Q&A
            HistData->>ChromaDB: collection: qa_documents<br/>add({id, embedding, metadata: {rfp_number}})
        else Document Type = CORRIGENDUM
            HistData->>ChromaDB: collection: corrigendum_documents<br/>add({id, embedding, metadata: {rfp_number}})
        end
    end
    
    ChromaDB-->>HistData: ✅ All chunks stored
    HistData-->>Processor: {success: true, chunks_processed: 45, vector_ids: [...]}
    
    Processor->>PostgreSQL: UPDATE status = 'completed'<br/>processed_at = NOW()<br/>chunks_processed = 45
    end
    
    rect rgb(255, 248, 240)
    Note over User,Screen7: Phase 3: Query Historical Data
    User->>Frontend: Enter query<br/>"What is project duration?"
    Frontend->>Screen7: POST /api/rag/search<br/>{query, rfp_number, top_k: 5}
    
    Screen7->>Ollama: Generate query embedding<br/>POST /api/embeddings
    Ollama-->>Screen7: query_embedding [768d]
    
    Screen7->>ChromaDB: query({query_embeddings, n_results: 5,<br/>where: {rfp_number: 'RFP-2024-NH-001'}})
    ChromaDB-->>Screen7: Top 5 similar chunks with scores
    
    Screen7->>Screen7: Assemble context from chunks
    Screen7->>Ollama: Generate response<br/>POST /api/generate<br/>{model: 'gemma:2b', prompt: context+query}
    Ollama-->>Screen7: AI-generated answer
    
    Screen7-->>Frontend: {answer, sources: [{chunk, score}], confidence: 0.92}
    Frontend-->>User: 📝 Display answer with sources
    end
```

---

## Service Folder Structure

```
NHAI-TENDER-AUTOMATION/
│
├── backend/                                    # Backend Service
│   ├── src/
│   │   ├── historical-data/                   # Historical data module
│   │   │   ├── historical-data.controller.ts  # API endpoints
│   │   │   ├── historical-data.service.ts     # Business logic
│   │   │   ├── historical-data.module.ts      # Module definition
│   │   │   ├── entities/
│   │   │   │   └── historical-document.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── upload-historical-data.dto.ts
│   │   │   │   └── query-document.dto.ts
│   │   │   └── processors/
│   │   │       └── document-processing-rag.processor.ts
│   │   └── main.ts
│   ├── package.json                           # Dependencies
│   └── .env                                   # Environment config
│   Command: npm run start:dev                 # Starts on port 3000
│
├── frontend/                                  # Frontend Service
│   ├── app/                                   # Next.js 13+ app directory
│   ├── components/                            # React components
│   ├── services/
│   │   └── historical-data.service.ts         # API client
│   ├── package.json
│   └── .env.local
│   Command: npm run dev                       # Starts on port 3001
│
├── python-rag/                                # Python RAG Services
│   │
│   ├── historical-data-service/               # Port 8005
│   │   ├── main.py                            # FastAPI server
│   │   ├── chroma_db/                         # ChromaDB storage
│   │   ├── requirements.txt
│   │   └── .env
│   │   Command: python main.py
│   │
│   ├── screen07-history-retriever/            # Port 8000
│   │   ├── main.py                            # FastAPI server
│   │   ├── history_retriever_agent.py         # RAG logic
│   │   ├── vector_store_manager.py            # ChromaDB manager
│   │   ├── chroma_db/                         # ChromaDB storage
│   │   ├── requirements.txt
│   │   └── .env
│   │   Command: python main.py
│   │
│   └── shared/                                # Shared utilities
│       ├── embeddings.py
│       ├── llm_utils.py
│       └── document_processing/
│
├── nhai-venv/                                 # Python virtual environment
│   └── Scripts/
│       ├── activate.bat                       # Windows activation
│       └── python.exe
│
├── uploads/                                   # File storage
│   └── historical/                            # Historical documents
│
├── START_BACKEND.bat                          # Backend startup script
├── START_FRONTEND.bat                         # Frontend startup script
├── START_SCREEN7_FIXED.bat                    # Screen 7 startup script
└── START_ALL_SERVICES.bat                     # Start all services
```

---

## API Endpoints

### Backend (NestJS) - Port 3000

**Folder:** `backend/src/historical-data/`  
**Startup:** `cd backend/ && npm run start:dev`

#### 1. Upload Historical Document

**Endpoint:** `POST /api/historical-data/upload`  
**Content-Type:** `multipart/form-data`

**Request Body:**
```typescript
{
  file: File;                    // Binary file (PDF, DOCX, CSV, XLSX)
  rfp_number: string;            // e.g., "RFP-2024-NH-001"
  title: string;                 // e.g., "Mumbai-Pune Expressway"
  document_type: "RFP" | "Q&A" | "CORRIGENDUM";
  description?: string;          // Optional description
}
```

**Response:**
```json
{
  "success": true,
  "document_id": 123,
  "status": "pending",
  "message": "Document uploaded. Processing in background..."
}
```

**Database Operations:**
- `INSERT INTO historical_documents` - Save metadata
- Queue job: `process-historical-document`

---

#### 2. Get All Documents (with Pagination)

**Endpoint:** `GET /api/historical-data`

**Query Parameters:**
```typescript
{
  page?: number;               // Default: 1
  pageSize?: number;          // Default: 20
  status?: string;            // Filter: 'pending', 'processing', 'completed', 'failed'
  document_type?: string;     // Filter: 'RFP', 'Q&A', 'CORRIGENDUM'
  rfp_number?: string;        // Filter by RFP
  sortBy?: string;            // Sort field
  sortOrder?: 'ASC' | 'DESC';
}
```

**Response:**
```json
{
  "data": [
    {
      "id": 123,
      "rfp_number": "RFP-2024-NH-001",
      "title": "Mumbai-Pune Expressway Development",
      "document_type": "RFP",
      "status": "completed",
      "file_name": "rfp_document.pdf",
      "file_size": 2458624,
      "chunks_processed": 45,
      "uploaded_at": "2026-01-20T10:30:00Z",
      "processed_at": "2026-01-20T10:35:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

---

#### 3. Get Document by ID

**Endpoint:** `GET /api/historical-data/:id`

**Response:**
```json
{
  "id": 123,
  "rfp_number": "RFP-2024-NH-001",
  "title": "Mumbai-Pune Expressway Development",
  "document_type": "RFP",
  "status": "completed",
  "file_name": "rfp_document.pdf",
  "file_path": "./uploads/historical/1737372000000-rfp_document.pdf",
  "file_size": 2458624,
  "file_type": "application/pdf",
  "chunks_processed": 45,
  "processing_metadata": {
    "total_pages": 156,
    "total_words": 45620,
    "embedding_model": "nomic-embed-text",
    "processing_duration": 32.5
  },
  "uploaded_at": "2026-01-20T10:30:00Z",
  "processed_at": "2026-01-20T10:35:00Z",
  "ai_reference_count": 12
}
```

---

#### 4. Get Statistics

**Endpoint:** `GET /api/historical-data/stats/summary`

**Response:**
```json
{
  "total_documents": 150,
  "by_status": {
    "pending": 5,
    "processing": 2,
    "completed": 138,
    "failed": 5
  },
  "by_type": {
    "RFP": 45,
    "Q&A": 80,
    "CORRIGENDUM": 25
  },
  "total_chunks": 6750,
  "total_size_mb": 1250.5,
  "avg_processing_time": 28.3,
  "recent_uploads": [
    {
      "id": 150,
      "title": "Latest RFP",
      "uploaded_at": "2026-01-27T09:00:00Z"
    }
  ]
}
```

---

#### 5. Retry Failed Document

**Endpoint:** `POST /api/historical-data/:id/retry`

**Response:**
```json
{
  "success": true,
  "document_id": 123,
  "message": "Document requeued for processing"
}
```

**Actions:**
- Reset status to `pending`
- Clear error messages
- Re-queue job in Bull

---

#### 6. Query Document

**Endpoint:** `POST /api/historical-data/:id/query`

**Request Body:**
```json
{
  "question": "What is the project duration?"
}
```

**Response:**
```json
{
  "success": true,
  "document_id": 123,
  "question": "What is the project duration?",
  "answer": "The project duration is 24 months from the date of contract signing, as specified in Section 3.2 of the RFP document.",
  "sources": [
    {
      "content": "Project Timeline: The successful bidder shall complete the project within 24 months...",
      "metadata": {
        "chunk_index": 12,
        "page_number": 15,
        "section": "3.2"
      },
      "similarity": 0.92
    }
  ],
  "embedding_provider": "ollama",
  "processing_time": 2.3
}
```

---

#### 7. Delete Document

**Endpoint:** `DELETE /api/historical-data/:id`

**Response:**
```json
{
  "success": true,
  "document_id": 123,
  "message": "Document and all associated data deleted",
  "details": {
    "vectors_deleted": 45,
    "file_deleted": true,
    "database_record_deleted": true
  }
}
```

**Actions:**
- Delete from `historical_documents` table
- Delete vectors from ChromaDB
- Delete file from file system

---

### Historical Data Service (Python) - Port 8005

**Folder:** `python-rag/historical-data-service/`  
**Startup:** `cd python-rag/historical-data-service/ && python main.py`

#### 1. Process Document

**Endpoint:** `POST /api/process-document`

**Request Body:**
```json
{
  "document_id": 123,
  "file_path": "./uploads/historical/1737372000000-rfp_document.pdf",
  "file_name": "rfp_document.pdf",
  "document_type": "RFP",
  "rfp_number": "RFP-2024-NH-001",
  "title": "Mumbai-Pune Expressway Development"
}
```

**Response:**
```json
{
  "success": true,
  "document_id": 123,
  "chunks_processed": 45,
  "vector_ids": [
    "doc_123_chunk_0",
    "doc_123_chunk_1",
    "..."
  ],
  "extracted_content": "Full extracted text...",
  "processing_time": 32.5,
  "embedding_provider": "ollama",
  "message": "Document processed successfully"
}
```

**Processing Steps:**
1. Load document (PyPDFLoader, Docx2txtLoader, etc.)
2. Extract text content
3. Split into chunks (RecursiveCharacterTextSplitter)
4. Generate embeddings (Ollama `nomic-embed-text`)
5. Store in ChromaDB with metadata

---

#### 2. Query Document

**Endpoint:** `POST /api/query-document`

**Request Body:**
```json
{
  "document_id": 123,
  "question": "What is the project duration?",
  "document_type": "RFP",
  "rfp_number": "RFP-2024-NH-001"
}
```

**Response:**
```json
{
  "success": true,
  "document_id": 123,
  "question": "What is the project duration?",
  "answer": "The project duration is 24 months from contract signing.",
  "sources": [
    {
      "content": "Project Timeline: 24 months...",
      "metadata": {"chunk_index": 12},
      "similarity": 0.92
    }
  ],
  "embedding_provider": "ollama",
  "processing_time": 2.3
}
```

---

#### 3. Delete Document Vectors

**Endpoint:** `DELETE /api/delete-document/:id`

**Response:**
```json
{
  "success": true,
  "document_id": 123,
  "vectors_deleted": 45,
  "message": "All vectors deleted from ChromaDB"
}
```

---

### Screen 7 (History Retriever) - Port 8000

**Folder:** `python-rag/screen07-history-retriever/`  
**Startup:** `cd python-rag/screen07-history-retriever/ && python main.py`

#### 1. Health Check

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "service": "NHAI History Retriever Agent",
  "version": "1.0.0",
  "timestamp": "2026-01-27T10:00:00Z",
  "vector_store": "chromadb",
  "embedding_provider": "ollama",
  "llm_provider": "ollama"
}
```

---

#### 2. Ingest Document

**Endpoint:** `POST /api/ingest`

**Request Body:**
```json
{
  "document_id": "doc_123",
  "document_type": "rfp",
  "file_path": "./uploads/historical/document.pdf",
  "file_name": "document.pdf",
  "rfp_number": "RFP-2024-NH-001",
  "title": "Mumbai-Pune Expressway",
  "metadata": {
    "description": "Historical RFP for reference"
  }
}
```

**Response:**
```json
{
  "success": true,
  "document_id": "doc_123",
  "chunks_processed": 45,
  "vector_store_id": "nhai_historical_data",
  "processing_time": 28.5,
  "message": "Document ingested and vectorized successfully"
}
```

---

#### 3. Semantic Search

**Endpoint:** `POST /api/rag/search`

**Request Body:**
```json
{
  "query": "What is the project duration?",
  "top_k": 5,
  "document_type": "rfp",
  "rfp_number": "RFP-2024-NH-001",
  "filter": {
    "document_type": "rfp"
  }
}
```

**Response:**
```json
{
  "success": true,
  "query": "What is the project duration?",
  "results": [
    {
      "document_id": "doc_123",
      "chunk_id": "doc_123_chunk_12",
      "content": "Project Timeline: The successful bidder shall complete the project within 24 months from the date of contract signing...",
      "score": 0.92,
      "metadata": {
        "rfp_number": "RFP-2024-NH-001",
        "document_type": "rfp",
        "chunk_index": 12,
        "title": "Mumbai-Pune Expressway"
      }
    },
    {
      "document_id": "doc_123",
      "chunk_id": "doc_123_chunk_15",
      "content": "Section 3.2 - Project Duration and Milestones: Phase 1 (Months 1-12)...",
      "score": 0.87,
      "metadata": {
        "rfp_number": "RFP-2024-NH-001",
        "chunk_index": 15
      }
    }
  ],
  "execution_time": 0.85,
  "total_results": 5
}
```

---

#### 4. Get Configuration

**Endpoint:** `GET /api/config`

**Response:**
```json
{
  "embedding_provider": "ollama",
  "embedding_model": "nomic-embed-text",
  "llm_provider": "ollama",
  "llm_model": "gemma:2b",
  "chunk_size": 1000,
  "chunk_overlap": 200,
  "top_k": 5,
  "vector_store_type": "chromadb",
  "enable_cache": true,
  "ollama_base_url": "http://localhost:11434"
}
```

---

#### 5. Get Statistics

**Endpoint:** `GET /api/statistics`

**Response:**
```json
{
  "total_documents": 150,
  "total_chunks": 6750,
  "total_searches": 1250,
  "total_transactions": 2500,
  "vector_store_size_mb": 450.5,
  "uptime_seconds": 86400
}
```

---

## PostgreSQL Database Schema

### Table: historical_documents

**Location:** PostgreSQL container (Port 5432)  
**Startup:** `docker run -d -p 5432:5432 postgres:14`

```sql
CREATE TABLE historical_documents (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Document Metadata
    rfp_number VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('RFP', 'Q&A', 'CORRIGENDUM')),
    description TEXT,
    
    -- File Information
    file_path VARCHAR(1000) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    
    -- Processing Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Processing Metadata
    chunks_processed INTEGER DEFAULT 0,
    processing_metadata JSONB,
    
    -- Timestamps
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- AI References
    ai_reference_count INTEGER DEFAULT 0,
    last_referenced_at TIMESTAMP,
    
    -- Soft Delete
    deleted_at TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_historical_documents_rfp_number ON historical_documents(rfp_number);
CREATE INDEX idx_historical_documents_document_type ON historical_documents(document_type);
CREATE INDEX idx_historical_documents_status ON historical_documents(status);
CREATE INDEX idx_historical_documents_uploaded_at ON historical_documents(uploaded_at);
CREATE INDEX idx_historical_documents_deleted_at ON historical_documents(deleted_at) WHERE deleted_at IS NULL;
```

### TypeORM Entity

**File:** `backend/src/historical-data/entities/historical-document.entity.ts`

```typescript
@Entity('historical_documents')
export class HistoricalDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  rfp_number: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({
    type: 'enum',
    enum: ['RFP', 'Q&A', 'CORRIGENDUM'],
  })
  @Index()
  document_type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 1000 })
  file_path: string;

  @Column({ type: 'varchar', length: 500 })
  file_name: string;

  @Column({ type: 'bigint' })
  file_size: number;

  @Column({ type: 'varchar', length: 100 })
  file_type: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  @Index()
  status: string;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'int', default: 0 })
  chunks_processed: number;

  @Column({ type: 'jsonb', nullable: true })
  processing_metadata: Record<string, any>;

  @CreateDateColumn()
  @Index()
  uploaded_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  @Column({ type: 'int', default: 0 })
  ai_reference_count: number;

  @Column({ type: 'timestamp', nullable: true })
  last_referenced_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  deleted_at: Date;
}
```

---

## Vector Database (ChromaDB)

### Collections Structure

**Location:** `python-rag/*/chroma_db/`  
**Type:** Embedded (no separate startup command)

ChromaDB stores document embeddings in three separate collections:

#### 1. Collection: rfp_documents

**Purpose:** Store RFP document chunks with embeddings

**Schema:**
```python
{
    "id": str,                    # Unique chunk ID: "doc_{document_id}_chunk_{index}"
    "embedding": List[float],     # 768-dimensional vector from nomic-embed-text
    "document": str,              # Chunk text content
    "metadata": {
        "document_id": int,       # PostgreSQL document ID
        "rfp_number": str,        # e.g., "RFP-2024-NH-001"
        "title": str,             # Document title
        "document_type": "RFP",
        "chunk_index": int,       # Chunk sequence number
        "file_name": str,
        "uploaded_at": str,       # ISO timestamp
        "page_number": int,       # Optional: page reference
        "section": str,           # Optional: section reference
    }
}
```

**Embedding Model:** Ollama `nomic-embed-text` (768 dimensions)  
**Distance Metric:** Cosine similarity

---

#### 2. Collection: qa_documents

**Purpose:** Store Q&A document chunks

**Schema:**
```python
{
    "id": str,
    "embedding": List[float],
    "document": str,
    "metadata": {
        "document_id": int,
        "rfp_number": str,
        "title": str,
        "document_type": "Q&A",
        "chunk_index": int,
        "question": str,          # Original question
        "answer": str,            # Original answer
        "category": str,          # Question category
        "file_name": str,
        "uploaded_at": str,
    }
}
```

---

#### 3. Collection: corrigendum_documents

**Purpose:** Store corrigendum document chunks

**Schema:**
```python
{
    "id": str,
    "embedding": List[float],
    "document": str,
    "metadata": {
        "document_id": int,
        "rfp_number": str,
        "title": str,
        "document_type": "CORRIGENDUM",
        "chunk_index": int,
        "corrigendum_number": str,  # e.g., "CORR-01"
        "date_issued": str,
        "changes": List[str],        # List of changes
        "file_name": str,
        "uploaded_at": str,
    }
}
```

---

### ChromaDB Operations

#### Add Document Chunk
```python
collection.add(
    ids=["doc_123_chunk_0"],
    embeddings=[[0.023, -0.145, ...]],  # 768-dim vector
    documents=["Project Timeline: The successful bidder shall complete..."],
    metadatas=[{
        "document_id": 123,
        "rfp_number": "RFP-2024-NH-001",
        "chunk_index": 0,
        "document_type": "RFP"
    }]
)
```

#### Query Similar Chunks
```python
results = collection.query(
    query_embeddings=[[0.015, -0.132, ...]],  # Query embedding
    n_results=5,
    where={"rfp_number": "RFP-2024-NH-001"},  # Filter by RFP
    include=["documents", "metadatas", "distances"]
)
```

#### Delete Document Vectors
```python
collection.delete(
    where={"document_id": 123}
)
```

---

## Embedding Process

### Document to Embeddings Pipeline

```mermaid
flowchart LR
    subgraph "1. Document Loading"
        Doc["PDF/DOCX<br/>Document<br/>📂 uploads/historical/"]
        Loader["Loader<br/>(PyPDF/Docx2txt)<br/>📂 python-rag/historical-data-service/"]
        Text["Raw Text<br/>Content"]
    end
    
    subgraph "2. Text Chunking"
        Splitter["RecursiveCharacterTextSplitter<br/>chunk_size=1000<br/>overlap=200"]
        Chunks["Text Chunks<br/>[Chunk0, Chunk1, ...]"]
    end
    
    subgraph "3. Embedding Generation"
        OllamaEmbed["Ollama API<br/>POST /api/embeddings<br/>model: nomic-embed-text<br/>▶️ ollama serve<br/>Port 11434"]
        Vectors["Embedding Vectors<br/>768 dimensions"]
    end
    
    subgraph "4. Vector Storage"
        Metadata["Add Metadata<br/>{doc_id, rfp_number, chunk_index}"]
        ChromaStore["ChromaDB<br/>collection.add()<br/>📂 python-rag/*/chroma_db/"]
    end
    
    Doc --> Loader
    Loader --> Text
    Text --> Splitter
    Splitter --> Chunks
    
    Chunks --> OllamaEmbed
    OllamaEmbed --> Vectors
    
    Vectors --> Metadata
    Metadata --> ChromaStore
    
    style Doc fill:#e1f5ff
    style Loader fill:#fff3cd
    style Text fill:#d4edda
    style Splitter fill:#fff3cd
    style Chunks fill:#d4edda
    style OllamaEmbed fill:#f8d7da
    style Vectors fill:#d1ecf1
    style Metadata fill:#fff3cd
    style ChromaStore fill:#d1ecf1
```

### Embedding Configuration

**Model:** Ollama `nomic-embed-text`  
**Startup:** `ollama serve` (Port 11434)  
**Pull Model:** `ollama pull nomic-embed-text`

**Dimensions:** 768  
**Context Window:** 8192 tokens  
**Average Processing Time:** 0.05s per chunk

**Text Splitting:**
- **Chunk Size:** 1000 characters
- **Chunk Overlap:** 200 characters
- **Separators:** `["\n\n", "\n", ". ", " ", ""]`
- **Length Function:** `len()` (character-based)

**Metadata Attached:**
- `document_id`: PostgreSQL ID
- `rfp_number`: RFP reference
- `chunk_index`: Sequence number
- `document_type`: RFP/Q&A/CORRIGENDUM
- `title`: Document title
- `uploaded_at`: Timestamp

---

## Data Flow Sequences

### Sequence 1: Document Upload Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend<br/>📂 frontend/<br/>▶️ npm run dev
    participant Backend as Backend<br/>📂 backend/<br/>▶️ npm run start:dev
    participant PostgreSQL as PostgreSQL<br/>▶️ docker run postgres
    participant FileSystem as File System<br/>📂 uploads/historical/
    participant Queue as Queue<br/>▶️ docker run redis
    
    User->>Frontend: Select file + fill metadata
    Frontend->>Backend: POST /api/historical-data/upload<br/>(multipart/form-data)
    
    Backend->>Backend: Validate file type
    Backend->>Backend: Generate unique filename
    
    Backend->>FileSystem: Save file to ./uploads/historical/
    FileSystem-->>Backend: File saved successfully
    
    Backend->>PostgreSQL: INSERT INTO historical_documents<br/>status='pending'
    PostgreSQL-->>Backend: document_id = 123
    
    Backend->>Queue: Add job 'process-historical-document'<br/>{documentId: 123, filePath, ...}
    Queue-->>Backend: Job ID: job_456
    
    Backend-->>Frontend: {success: true, document_id: 123, status: 'pending'}
    Frontend-->>User: ✅ Upload successful
```

---

### Sequence 2: Background Processing Flow

```mermaid
sequenceDiagram
    participant Queue as Queue<br/>▶️ docker run redis
    participant Processor as Processor<br/>📂 backend/src/historical-data/processors/
    participant PostgreSQL as PostgreSQL<br/>▶️ docker run postgres
    participant HistData as Historical Data Service<br/>📂 python-rag/historical-data-service/<br/>▶️ python main.py
    participant Ollama as Ollama<br/>▶️ ollama serve
    participant ChromaDB as ChromaDB<br/>📂 python-rag/*/chroma_db/
    
    Queue->>Processor: Trigger job (documentId: 123)
    
    Processor->>PostgreSQL: UPDATE status='processing'
    
    Processor->>HistData: POST /api/process-document<br/>{document_id, file_path, type, rfp_number}
    
    HistData->>HistData: Load document (PyPDF/Docx2txt)
    HistData->>HistData: Extract text
    HistData->>HistData: Split into chunks (1000 chars)
    
    loop For each chunk (45 total)
        HistData->>Ollama: POST /api/embeddings<br/>{model: 'nomic-embed-text', prompt: chunk}
        Ollama-->>HistData: embedding [768 dims]
        
        HistData->>ChromaDB: collection.add()<br/>{id, embedding, document, metadata}
        ChromaDB-->>HistData: Chunk stored
    end
    
    HistData-->>Processor: {success: true, chunks_processed: 45}
    
    Processor->>PostgreSQL: UPDATE status='completed'<br/>chunks_processed=45<br/>processed_at=NOW()
    
    Processor-->>Queue: Job completed
```

---

### Sequence 3: Query/Search Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend<br/>📂 frontend/<br/>▶️ npm run dev
    participant Screen7 as Screen 7<br/>📂 python-rag/screen07-history-retriever/<br/>▶️ python main.py
    participant Ollama as Ollama<br/>▶️ ollama serve
    participant ChromaDB as ChromaDB<br/>📂 python-rag/screen07-history-retriever/chroma_db/
    
    User->>Frontend: Enter query: "What is project duration?"
    Frontend->>Screen7: POST /api/rag/search<br/>{query, rfp_number, top_k: 5}
    
    Screen7->>Ollama: POST /api/embeddings<br/>{model: 'nomic-embed-text', prompt: query}
    Ollama-->>Screen7: query_embedding [768 dims]
    
    Screen7->>ChromaDB: collection.query()<br/>{query_embeddings, n_results: 5,<br/>where: {rfp_number: 'RFP-2024-NH-001'}}
    ChromaDB-->>Screen7: Top 5 similar chunks with scores
    
    Screen7->>Screen7: Assemble context from chunks
    
    Screen7->>Ollama: POST /api/generate<br/>{model: 'gemma:2b',<br/>prompt: context + query}
    Ollama-->>Screen7: Generated answer
    
    Screen7-->>Frontend: {answer, sources, confidence: 0.92}
    Frontend-->>User: Display answer with source references
```

---

## Background Processing

### Bull Queue Configuration

**Queue Name:** `document-processing`  
**Job Name:** `process-historical-document`  
**Storage:** Redis  
**Startup:** `docker run redis` (Port 6379)

**Job Options:**
```typescript
{
  attempts: 3,                    // Retry up to 3 times
  backoff: {
    type: 'exponential',         // Exponential backoff
    delay: 5000                  // Start with 5 second delay
  },
  removeOnComplete: false,       // Keep completed jobs for auditing
  removeOnFail: false            // Keep failed jobs for debugging
}
```

**Job Data:**
```typescript
{
  documentId: number;
  filePath: string;
  fileName: string;
  fileType: string;
  documentType: 'RFP' | 'Q&A' | 'CORRIGENDUM';
  rfpNumber: string;
  title: string;
}
```

### Processor Implementation

**File:** `backend/src/historical-data/processors/document-processing-rag.processor.ts`  
**Folder:** `backend/src/historical-data/processors/`

**Processing Steps:**

1. **Update Status → 'processing'**
   ```typescript
   await this.updateDocumentStatus(documentId, 'processing');
   ```

2. **Call Historical Data Service**
   ```typescript
   const response = await axios.post('http://localhost:8005/api/process-document', {
     document_id: documentId,
     file_path: filePath,
     file_name: fileName,
     document_type: documentType,
     rfp_number: rfpNumber,
     title: title
   });
   ```

3. **Update Status → 'completed'**
   ```typescript
   await this.updateDocumentStatus(documentId, 'completed', {
     chunks_processed: response.chunks_processed,
     processing_metadata: response.metadata
   });
   ```

4. **Error Handling**
   ```typescript
   catch (error) {
     await this.updateDocumentStatus(documentId, 'failed', {
       error_message: error.message
     });
     throw error;  // Triggers retry
   }
   ```

---

## Error Handling & Retry

### Retry Strategy

**Automatic Retries:**
- Max attempts: 3
- Backoff: Exponential (5s, 10s, 20s)
- Status transitions: `failed` → `pending` → `processing`

**Manual Retry:**
- Endpoint: `POST /api/historical-data/:id/retry`
- Clears error message
- Resets status to `pending`
- Re-queues job

### Common Failure Scenarios

| Error | Cause | Resolution |
|-------|-------|------------|
| File not found | File deleted before processing | Re-upload document |
| Ollama connection failed | Ollama service down | Start Ollama: `ollama serve`, retry |
| ChromaDB error | Database connection issue | Check ChromaDB service, retry |
| Invalid file format | Corrupted file | Re-upload valid file |
| Out of memory | Large document | Reduce chunk size, retry |
| Redis connection failed | Redis down | Start Redis: `docker run redis`, retry |

### Error Response Format

```json
{
  "success": false,
  "document_id": 123,
  "status": "failed",
  "error_message": "Failed to connect to Ollama service: Connection refused",
  "error_code": "OLLAMA_CONNECTION_ERROR",
  "retry_available": true,
  "timestamp": "2026-01-27T10:00:00Z"
}
```

---

## Quick Start Commands

### Start All Services (Windows)

```bat
REM Start all services in separate windows
START_ALL_SERVICES.bat
```

This script will start:
1. Backend (Port 3000) - `cd backend/ && npm run start:dev`
2. Frontend (Port 3001) - `cd frontend/ && npm run dev`
3. Screen 7 (Port 8000) - `cd python-rag/screen07-history-retriever/ && python main.py`
4. Screen 8 (Port 8001) - `cd python-rag/screen08-chief-engineer/ && python main.py`

### Manual Startup Sequence

```bash
# 1. Start PostgreSQL
docker run -d --name nhai-postgres -e POSTGRES_PASSWORD=your_password -p 5432:5432 postgres:14

# 2. Start Redis
docker run -d --name nhai-redis -p 6379:6379 redis

# 3. Start Ollama
ollama serve
# In another terminal:
ollama pull nomic-embed-text
ollama pull gemma:2b

# 4. Start Backend
cd backend/
npm run start:dev

# 5. Start Frontend
cd frontend/
npm run dev

# 6. Start Historical Data Service
cd python-rag/historical-data-service/
python main.py

# 7. Start Screen 7
cd python-rag/screen07-history-retriever/
python main.py
```

---

## Testing Commands

### Upload Document

**PowerShell:**
```powershell
$file = "C:\Documents\rfp_document.pdf"
$form = @{
    file = Get-Item -Path $file
    rfp_number = "RFP-2024-NH-001"
    title = "Mumbai-Pune Expressway Development"
    document_type = "RFP"
    description = "Historical RFP for reference"
}

Invoke-RestMethod -Uri http://localhost:3000/api/historical-data/upload `
    -Method Post -Form $form | ConvertTo-Json
```

### Get All Documents

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/historical-data?page=1&pageSize=10" | ConvertTo-Json -Depth 10
```

### Get Document by ID

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/historical-data/123 | ConvertTo-Json
```

### Query Document

```powershell
$body = @{
    question = "What is the project duration?"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/historical-data/123/query `
    -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json
```

### Screen 7 Search

```powershell
$body = @{
    query = "What is the project duration?"
    top_k = 5
    rfp_number = "RFP-2024-NH-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/rag/search `
    -Method Post -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
```

---

## Related Documentation

- **Bulk Operations:** `BULK-Chat-Information.md`
- **Screen 7 Export:** `SESSION_SCREEN7_BULK_UPDATE_EXPORT.md`
- **Screen 8 (Prebid Queries):** `SCREEN8-PREBID-QUERY-MANAGEMENT.md`
- **Commands Guide:** `README-COMMANDS-V3.md`
- **Vectorization Guide:** `vectorization-rag-steps-manual/VECTORIZATION_SETUP_GUIDE.md`

---

**Last Updated:** January 27, 2026  
**Version:** 2.0  
**Status:** ✅ Production Ready  
**Enhancements:** Added startup commands, folder paths, and Docker commands to all diagrams
