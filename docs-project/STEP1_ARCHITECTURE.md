# Architecture Overview - Step 1 Implementation

## System Architecture After Step 1

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           UPLOAD FLOW                                    │
└─────────────────────────────────────────────────────────────────────────┘

  User/Frontend
       │
       │ POST /historical-data/upload
       │ (file, rfp_number, title, document_type)
       ▼
┌──────────────────┐
│   NestJS API     │
│   Controller     │  ◄─ Multer: FileInterceptor
│                  │
│ 1. Validate DTO  │
│ 2. Save file     │
│ 3. Create DB     │
│    record        │
│ 4. Queue job     │
└──────────────────┘
       │
       │ Returns immediately
       │ { success: true,
       │   document_id: 1,
       │   status: "PENDING" }
       │
       ▼
    User
    (polling GET /historical-data/{id})


┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND PROCESSING FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

Redis (Bull Queue)
  "document-processing"
       │ Job: {
       │   documentId: 1,
       │   filePath: "./uploads/...",
       │   fileName: "sample.pdf",
       │   documentType: "RFP",
       │   rfpNumber: "RFP-2024-NH-001",
       │   title: "Test Project"
       │ }
       │
       ▼
┌──────────────────────────────┐
│ DocumentProcessingRag        │
│ Processor                    │
│ (@nestjs/bull)              │
│                              │
│ 1. Validate document exists  │
│ 2. Update status→PROCESSING  │
│ 3. Call Python service       │
│ 4. Handle response           │
│ 5. Update status→PROCESSED   │
│ 6. Log metrics               │
└──────────────────────────────┘
       │
       │ HTTP POST
       │ /api/process-document
       │ {
       │   document_id: 1,
       │   file_path: "/abs/path/...",
       │   document_type: "RFP",
       │   ...
       │ }
       │
       ▼
┌────────────────────────────────────────────┐
│  Python RAG Service (Port 8005)            │
│  ├─ DocumentProcessor                      │
│  │  ├─ Load PDF/DOCX/CSV/TXT              │
│  │  ├─ Split chunks (1000, overlap:200)   │
│  │  └─ Extract content                     │
│  │                                         │
│  ├─ EmbeddingService                       │
│  │  ├─ Try Ollama (primary)                │
│  │  │  └─ model: nomic-embed-text         │
│  │  └─ Fallback to OpenAI                 │
│  │                                         │
│  └─ VectorStoreService                     │
│     └─ Store in ChromaDB                   │
│        ├─ Collection: "historical_data"   │
│        ├─ Metadata: {document_id, ...}    │
│        └─ Vector IDs: [......]             │
│                                         │
└────────────────────────────────────────────┘
       │
       │ HTTP Response
       │ {
       │   success: true,
       │   chunks_processed: 42,
       │   vector_ids: [uuids...],
       │   embedding_provider: "ollama",
       │   processing_time: 15234
       │ }
       │
       ▼
PostgreSQL
  historical_documents table
  ├─ UPDATE status = "PROCESSED"
  ├─ SET processing_metadata = {
  │    chunks_processed: 42,
  │    vector_ids: [...],
  │    processing_time_ms: 15234,
  │    embedding_provider: "ollama",
  │    chunks_metadata: [...],
  │    completed_at: "2026-01-26T..."
  │  }
  └─ SET extracted_content = "first 5000 chars"

       AND

ChromaDB
  ├─ Collection: "historical_data"
  │  └─ Documents with source: "document_1"
  │     ├─ chunk_0 → vector_emb_1
  │     ├─ chunk_1 → vector_emb_2
  │     └─ chunk_42 → vector_emb_42
  │
  └─ Metadata per document
     ├─ document_id: 1
     ├─ rfp_number: "RFP-2024-NH-001"
     ├─ title: "Test Project"
     └─ document_type: "RFP"
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         NestJS Backend                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 HTTP Requests                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ HistoricalDataController                           │  │  │
│  │  │ ├─ POST /upload → processUpload()                │  │  │
│  │  │ ├─ GET /{id} → getDocumentStatus()               │  │  │
│  │  │ ├─ GET → getAllDocuments()                        │  │  │
│  │  │ ├─ GET /statistics → getStatistics()             │  │  │
│  │  │ └─ POST /{id}/retry → retryProcessing()          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │           │                                │             │  │
│  │           │ File + Metadata                │             │  │
│  │           ▼                                ▼             │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ HistoricalDataService                             │  │  │
│  │  │ ├─ processUpload()                               │  │  │
│  │  │ ├─ updateDocumentStatus()                        │  │  │
│  │  │ ├─ getDocumentStatus()                           │  │  │
│  │  │ ├─ getAllDocuments()                             │  │  │
│  │  │ ├─ getStatistics()                               │  │  │
│  │  │ └─ retryProcessing()                             │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │           │ Queue Job                                    │  │
│  │           ▼                                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ DocumentProcessingRagProcessor (NEW! ✨)          │  │  │
│  │  │ ├─ @Processor('document-processing')             │  │  │
│  │  │ ├─ @Process('process-historical-document')       │  │  │
│  │  │ ├─ Validate document                             │  │  │
│  │  │ ├─ Mark status: PROCESSING                       │  │  │
│  │  │ ├─ Call Python service                           │  │  │
│  │  │ ├─ Handle response                               │  │  │
│  │  │ ├─ Update status: PROCESSED                      │  │  │
│  │  │ ├─ Handle errors with retry                      │  │  │
│  │  │ └─ Detailed logging                              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ Queue (Redis)
         │ HTTP Call
         │ Database Update
         │
         ├─────────────────────────────┬──────────────────────┬─────────────────┐
         │                             │                      │                 │
         ▼                             ▼                      ▼                 ▼

┌──────────────────┐    ┌──────────────────────┐  ┌──────────────────┐  ┌───────────────┐
│  Redis (Bull)    │    │  PostgreSQL          │  │  Python Service  │  │  ChromaDB     │
│                  │    │  (historical_docs)   │  │  (Port 8005)     │  │               │
│ Queue:           │    │                      │  │                  │  │ Collections:  │
│ document-        │    │ Fields:              │  │ ├─ Load file    │  │ ├─ historical_│
│ processing       │    │ ├─ id               │  │ ├─ Split chunks  │  │ │  data       │
│                  │    │ ├─ rfp_number      │  │ ├─ Embed (Ollama)│  │ ├─ Q&A pairs  │
│ Jobs:            │    │ ├─ title           │  │ └─ Store vectors │  │ └─ Corrigenda │
│ ├─ document_id   │    │ ├─ file_path       │  │                  │  │               │
│ ├─ file_path     │    │ ├─ status          │  │ Dependencies:    │  │ Data:         │
│ ├─ document_type │    │ │ PENDING          │  │ ├─ Ollama        │  │ ├─ vectors    │
│ └─ metadata      │    │ │ PROCESSING       │  │ ├─ ChromaDB      │  │ ├─ metadata   │
│                  │    │ │ PROCESSED        │  │ └─ OpenAI (FB)   │  │ └─ source_id  │
│ Retries:         │    │ │ FAILED           │  │                  │  │               │
│ Max 3 attempts   │    │ ├─ processing_     │  │ Endpoints:       │  │ Index:        │
│ Exponential      │    │ │  metadata        │  │ POST /api/       │  │ By document_id│
│ Backoff          │    │ ├─ extracted_      │  │   process-       │  │               │
│                  │    │ │  content         │  │   document       │  │               │
│                  │    │ ├─ uploaded_at     │  │ GET /api/stats   │  │               │
│                  │    │ └─ processed_at    │  │                  │  │               │
│                  │    │                    │  │                  │  │               │
└──────────────────┘    └──────────────────────┘  └──────────────────┘  └───────────────┘
```

---

## Status Transition State Machine

```
                    ┌──────────────────┐
                    │     PENDING      │
                    └──────────────────┘
                            │
                   Job queued to Bull
                            │
                            ▼
                    ┌──────────────────┐
                    │   PROCESSING     │
                    └──────────────────┘
                     │                  │
             Success │                  │ Error
                     │                  │
                     ▼                  ▼
        ┌──────────────────┐    ┌──────────────────┐
        │   PROCESSED ✅   │    │ Check Retry Count│
        └──────────────────┘    └──────────────────┘
                                 │                │
                        Retry < 3 │                │ Retry ≥ 3
                                 │                │
                                 ▼                ▼
                        ┌──────────────────────────────┐
                        │ Reset to PENDING + Backoff   │
                        │ (Re-queue with delay)        │
                        │ Exponential: 5s, 25s, 125s   │
                        └──────────────────────────────┘
                                 │
                                 └─ Retry (Max 3 times)
                                    Then:
                                        ▼
                        ┌──────────────────────────────┐
                        │      FAILED ❌               │
                        │ (Permanent failure)          │
                        │ Error details logged         │
                        │ Manual retry available       │
                        └──────────────────────────────┘
```

---

## Error Handling Flowchart

```
Job Processing Starts
         │
         ▼
Validate Document
         │
    ┌────┴────┐
    │          │
   NO         YES
    │          │
    │          ▼
    │  Mark PROCESSING
    │          │
    │          ▼
    │  Call Python Service
    │          │
    │    ┌─────┴──────────────────┬──────────┐
    │    │                        │          │
    │  Success          Timeout/Connection  Other
    │    │                   │             │
    │    ▼                   ▼             ▼
    │  Get Response     3-attempt    Generate
    │    │              timeout?       error
    │    │                 │           response
    │  Store Vectors       │             │
    │    │                 │             │
    │    │  ┌──────────────┘             │
    │    │  │                            │
    │    ▼  ▼                            │
    │  Update DB                         │
    │  Status=PROCESSED                  │
    │  + Metadata                        │
    │    │                               │
    └────┼───────────────────────────────┘
         │
         ▼
    ✅ SUCCESS or ❌ FAILED
```

---

## Data Flow Summary

```
1. FILE UPLOAD
   User → NestJS Controller → File saved to disk
                            → DB record created
                            → Bull job queued
                            → Response sent (status=PENDING)

2. BACKGROUND PROCESSING
   Bull Queue → Processor → Python Service → Vectorization
                                          → ChromaDB storage
                                          → Response received

3. STATUS UPDATE
   Python Response → Processor → Update PostgreSQL
                              → Store metadata
                              → Update status=PROCESSED

4. QUERY PHASE (Step 2)
   User Question → Query Endpoint → RAGChain Retriever
                                  → Filter by document_id
                                  → Query ChromaDB
                                  → Generate answer
                                  → Return with sources
```

---

## Technology Stack

```
Frontend         NestJS           Database         ML/AI
┌────────────┐   ┌──────────────┐  ┌──────────┐   ┌────────────┐
│ React/Next │───│ NestJS API   │  │PostgreSQL│   │ Ollama     │
│            │   │              │  │          │   │            │
│ Forms      │   │ Controllers  │  │ Metadata │   │ llama-2    │
│ Uploads    │   │ Services     │  │ Storage  │   │ mistral    │
│ Status     │   │              │  │          │   │            │
└────────────┘   │ Bull Queue   │  │ Auth     │   │ ChromaDB   │
                 │ Processor    │  │ Audit    │   │ Vectors    │
                 │              │  └──────────┘   │            │
                 │ HTTP Calls   │                 │ OpenAI     │
                 └──────────────┘                 │ (fallback) │
                        │                         └────────────┘
                        │
                 ┌──────┴──────┐
                 │             │
            ┌────▼──────┐  ┌───▼────┐
            │ Redis/Bull│  │ Python  │
            │ (Queue)   │  │ Service │
            └───────────┘  └─────────┘
```

---

**Architecture Diagram Created: January 26, 2026**  
**Step 1 Status: COMPLETE ✅**  
**Ready for Step 2: Query Endpoint Implementation**
