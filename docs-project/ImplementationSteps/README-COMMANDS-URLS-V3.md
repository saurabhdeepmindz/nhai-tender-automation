# NHAI Tender Automation System - Execution Commands (v3)
**Complete Service Startup, Testing, and Operations Guide**

> **Version 3 Updates:**
> - Fixed langchain import structure for compatibility with langchain 1.2.x
> - Updated Python environment paths to V400
> - Added bulk operations and query endpoints
> - Enhanced troubleshooting section with langchain migration fixes
> - Added RAG chain demo with RAGAS evaluation commands
> - Documented historical-data-service query endpoints
> - Added vectorization bulk operations

---

## Prerequisites

✅ **Environment Setup Completed:**
- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- Python 3.11.9 installed
- Docker Desktop installed and running
- Ollama installed with `nomic-embed-text` and `gemma:2b` models
- Virtual environment created at `nhai-venv/`
- All dependencies installed (`npm install`, `pip install -r requirements.txt`)
- **Updated Package Versions:**
  - `langchain==1.2.7`
  - `langchain-core==1.2.7`
  - `langchain-community==0.4.1`
  - `langchain-openai==1.1.7`
  - `langchain-text-splitters==1.1.0`
  - `langgraph==1.0.7`
  - `ragas==0.4.3`
  - `datasets==4.5.0`
  - `anthropic==0.76.0`
  - `numpy==1.26.3` (pinned <2 for chromadb compatibility)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     NHAI System Components                       │
├─────────────────────────────────────────────────────────────────┤
│  Backend (NestJS)             → Port 3000                       │
│  Frontend (Next.js)           → Port 3001                       │
│  PostgreSQL                   → Port 5432                       │
│  Redis                        → Port 6379                       │
│  Ollama                       → Port 11434                      │
│  Screen 7 (History Retriever) → Port 8000                       │
│  Screen 8 (Chief Engineer)    → Port 8001                       │
│  Historical Data Service      → Port 8005                       │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
PostgreSQL ←→ Backend (NestJS) ←→ Frontend (Next.js)
                ↓
          ChromaDB (Vector Store)
                ↑
    Screen 7, Screen 8, Historical Data (Python RAG Services)
```

---

## Important: Python Environment Path Update

**⚠️ Critical Change in V3:**
All Python service commands now use the **V400** environment path:

```powershell
# V2 Path (OLD - DO NOT USE):
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe

# V3 Path (NEW - USE THIS):
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe
```

**Why This Matters:**
- Using the wrong environment path will cause `ModuleNotFoundError: No module named 'langchain_core.pydantic_v1'`
- The error trace will show paths to V100 or V300, not your current V400 project
- Always use the full absolute path to ensure correct Python interpreter

---

## Complete Startup Sequence

### Step 1: Start PostgreSQL Database
**Description:** Start PostgreSQL database server  
**Directory:** N/A (System Service)  
**Command:**
```powershell
# Windows Service
services.msc
# Find "postgresql-x64-14" and start

# Or via command line
net start postgresql-x64-14
```
**Port:** `5432`  
**How to Test:**
```powershell
# Test connection
psql -U postgres -h localhost -p 5432

# Check database exists
psql -U postgres -c "\l" | findstr nhai_tender_db

# Verify tables exist
$env:PGPASSWORD = "your_password"
psql -h localhost -U postgres -d nhai_tender_db -c "\dt"
```
**Expected Output:** Database `nhai_tender_db` with tables `queries`, `historical_documents`, `vectorization_logs`, etc.

---

### Step 2: Start Redis (Docker)
**Description:** Start Redis for Bull queue job management  
**Directory:** N/A (Docker Container)  
**Command:**
```powershell
# Start existing container
docker start redis

# Or create new container if doesn't exist
docker run -d -p 6379:6379 --name redis redis:latest
```
**Port:** `6379`  
**How to Test:**
```powershell
# Check Redis is running
netstat -ano | findstr :6379

# Test Redis connection
docker exec -it redis redis-cli ping
# Expected: PONG

# Check container status
docker ps | findstr redis
```
**Expected Output:** `TCP 0.0.0.0:6379` and `PONG` response

---

### Step 3: Start Ollama Service
**Description:** Start Ollama for AI embeddings and LLM generation  
**Directory:** N/A (System Service)  
**Command:**
```powershell
# Start Ollama (usually auto-starts with desktop app)
# If not running, launch Ollama desktop app

# Verify models are available
ollama list
```
**Port:** `11434`  
**How to Test:**
```powershell
# Check Ollama is running
netstat -ano | findstr :11434

# Test embeddings generation
ollama run nomic-embed-text "test query"

# Test LLM generation
ollama run gemma:2b "Hello"

# Or via API
curl http://localhost:11434/api/embeddings -d "{\"model\":\"nomic-embed-text\",\"prompt\":\"test\"}"
```
**Expected Output:** Models `nomic-embed-text` and `gemma:2b` listed, embeddings/responses generated

---

### Step 4: Start Backend (NestJS)
**Description:** Start main NestJS backend API server  
**Directory:** `backend/`  
**Command:**
```powershell
cd backend
npm run start:dev

# Or use batch file
START_BACKEND.bat
```
**Port:** `3000`  
**How to Test:**
```powershell
# Check backend is running
netstat -ano | findstr :3000

# Test health endpoint
curl http://localhost:3000/api/health

# Open Swagger UI
start http://localhost:3000/api/docs
```
**Expected Output:**
```
[Nest] Starting Nest application...
[Bootstrap] Application successfully started on http://localhost:3000
[Bootstrap] Swagger documentation available at: http://localhost:3000/api/docs
```
**Test URLs:**
- Health: http://localhost:3000/api/health
- Swagger: http://localhost:3000/api/docs
- API Root: http://localhost:3000/api
- Prebid Queries: http://localhost:3000/api/prebid-queries
- Historical Data: http://localhost:3000/api/historical-data
- Admin Panel: http://localhost:3000/api/admin/vectorization/stats

---

### Step 5: Start Historical Data Service (Python)
**Description:** Start Python FastAPI service for historical document processing  
**Directory:** `python-rag\historical-data-service`  
**Command:**
```powershell
cd python-rag\historical-data-service

# V3: Use correct V400 environment path
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py
```
**Port:** `8005`  
**How to Test:**
```powershell
# Check service is running
netstat -ano | findstr :8005

# Test root endpoint
curl http://localhost:8005/

# Get statistics
curl http://localhost:8005/api/stats

# PowerShell
Invoke-RestMethod -Uri http://localhost:8005/api/stats
```
**Expected Output:**
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8005
INFO:     Application startup complete
```
**Test URLs:**
- Root: http://localhost:8005/
- Stats: http://localhost:8005/api/stats
- Process Document: POST http://localhost:8005/api/process-document
- Query Document: POST http://localhost:8005/api/query-document
- Get Document Chunks: GET http://localhost:8005/api/document/{document_id}/chunks
- Delete Document: DELETE http://localhost:8005/api/documents/{document_id}
- Debug Collections: GET http://localhost:8005/api/debug/collections

**Expected Stats Response:**
```json
{
  "success": true,
  "statistics": {
    "rfp_documents": 7,
    "qa_documents": 2,
    "corrigendum_documents": 1,
    "total_documents": 10
  }
}
```

---

### Step 6: Start Screen 7 - History Retriever (Python)
**Description:** Start historical Q&A retrieval service  
**Directory:** `python-rag\screen07-history-retriever`  
**Command:**
```powershell
cd python-rag\screen07-history-retriever

# V3: Use correct V400 environment path
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py

# Or use batch file
START_SCREEN7_FIXED.bat
```
**Port:** `8000`  
**How to Test:**
```powershell
# Check service is running
netstat -ano | findstr :8000

# Test health endpoint
curl http://localhost:8000/api/health

# Open Swagger UI
start http://localhost:8000/docs

# Test search endpoint
curl http://localhost:8000/api/rag/search -X POST -H "Content-Type: application/json" -d "{\"query\":\"test query\",\"top_k\":5}"
```
**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```
**Test URLs:**
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/api/health
- Statistics: http://localhost:8000/api/statistics
- ReDoc: http://localhost:8000/redoc
- Ingest: POST http://localhost:8000/api/rag/ingest
- Search: POST http://localhost:8000/api/rag/search
- Config: GET/PUT http://localhost:8000/api/rag/config
- Transactions: GET http://localhost:8000/api/rag/transactions
- Delete Document: DELETE http://localhost:8000/api/rag/documents/{document_id}
- Reprocess: POST http://localhost:8000/api/rag/reprocess/{document_id}

---

### Step 7: Start Screen 8 - Chief Engineer Service (Python)
**Description:** Start query vectorization and processing service  
**Directory:** `python-rag\screen08-chief-engineer`  
**Command:**
```powershell
cd python-rag\screen08-chief-engineer

# V3: Use correct V400 environment path
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py

# Or use batch file
START_SCREEN8_FIXED.bat
```
**Port:** `8001`  
**How to Test:**
```powershell
# Check service is running
netstat -ano | findstr :8001

# Test health endpoint
curl http://localhost:8001/api/health

# Open Swagger UI
start http://localhost:8001/docs

# Test store query endpoint
curl http://localhost:8001/api/chief-engineer/store-query -X POST -H "Content-Type: application/json" -d "{\"query_id\":\"test-123\",\"query_text\":\"test query\",\"category\":\"general\",\"rfp_number\":\"RFP-001\",\"metadata\":{}}"
```
**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete
```
**Test URLs:**
- Swagger: http://localhost:8001/docs
- Health: http://localhost:8001/api/health
- Statistics: http://localhost:8001/api/statistics
- Workflow Executions: http://localhost:8001/api/workflow/executions
- ReDoc: http://localhost:8001/redoc
- Store Query: POST http://localhost:8001/api/chief-engineer/store-query
- Process Query: POST http://localhost:8001/api/chief-engineer/process
- Similar Queries: POST http://localhost:8001/api/chief-engineer/similar-queries
- Get Execution: GET http://localhost:8001/api/workflow/executions/{execution_id}
- Test Endpoint: POST http://localhost:8001/api/chief-engineer/test

---

### Step 8: Start Frontend (Next.js) - Optional
**Description:** Start Next.js frontend application  
**Directory:** `frontend/`  
**Command:**
```powershell
cd frontend
npm run dev

# Or use batch file
START_FRONTEND.bat
```
**Port:** `3001`  
**How to Test:**
```powershell
# Check frontend is running
netstat -ano | findstr :3001

# Open in browser
start http://localhost:3001
```
**Expected Output:**
```
ready - started server on 0.0.0.0:3001
```
**Test URLs:**
- Home: http://localhost:3001
- Admin Dashboard: http://localhost:3001/admin/vectorization-control
- Prebid Queries: http://localhost:3001/prebid-queries
- Query Details: http://localhost:3001/prebid-queries/{query-id}

---

## Quick Start Scripts

### Start All Services at Once

**Using Batch File:**
```powershell
# Double-click or run
START_ALL_SERVICES.bat
```

**Using PowerShell Script:**
Create `quick-start.ps1`:
```powershell
Write-Host "Starting NHAI Tender Automation System..." -ForegroundColor Cyan

# 1. Start Redis
Write-Host "[1/7] Starting Redis..." -ForegroundColor Yellow
docker start redis
Start-Sleep -Seconds 2

# 2. Start Backend
Write-Host "[2/7] Starting Backend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev"
Start-Sleep -Seconds 10

# 3. Start Historical Data Service
Write-Host "[3/7] Starting Historical Data Service (Port 8005)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\historical-data-service; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# 4. Start Screen 7
Write-Host "[4/7] Starting Screen 7 (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\screen07-history-retriever; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# 5. Start Screen 8
Write-Host "[5/7] Starting Screen 8 (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\screen08-chief-engineer; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# 6. Start Frontend
Write-Host "[6/7] Starting Frontend (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Start-Sleep -Seconds 5

# 7. Open Swagger UI
Write-Host "[7/7] Opening Swagger UI..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000/api/docs"

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000/api/docs" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
```

### Stop All Services

**Using Batch File:**
```powershell
STOP_ALL_SERVICES.bat
```

**Manual Commands:**
```powershell
# Kill all Node.js processes
taskkill /F /IM node.exe

# Kill all Python processes
taskkill /F /IM python.exe
```

---

## Service Verification Checklist

Run this checklist after starting all services:

```powershell
# Check all ports
netstat -ano | findstr ":5432 :6379 :3000 :3001 :8005 :8000 :8001 :11434"
```

**Expected Output:**
```
TCP    0.0.0.0:3000     LISTENING     <pid>   # Backend
TCP    0.0.0.0:3001     LISTENING     <pid>   # Frontend
TCP    0.0.0.0:5432     LISTENING     <pid>   # PostgreSQL
TCP    0.0.0.0:6379     LISTENING     <pid>   # Redis
TCP    0.0.0.0:8000     LISTENING     <pid>   # Screen 7
TCP    0.0.0.0:8001     LISTENING     <pid>   # Screen 8
TCP    0.0.0.0:8005     LISTENING     <pid>   # Historical Data
TCP    0.0.0.0:11434    LISTENING     <pid>   # Ollama
```

---

## Testing Prebid Queries

### Test 1: Get All Queries

**Command:**
```powershell
# Get all queries
curl http://localhost:3000/api/prebid-queries

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
[
  {
    "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
    "query_number": "QRY-2024-001",
    "query_text": "What is the project duration?",
    "status": "PENDING",
    "category": "Timeline",
    "submitted_at": "2024-12-15T10:30:00Z"
  },
  {
    "query_id": "5b79647f-9f62-411f-b659-3a800b66651c",
    "query_number": "QRY-2024-002",
    "query_text": "What are the safety requirements?",
    "status": "RESPONDED",
    "category": "Safety",
    "submitted_at": "2024-12-16T09:15:00Z"
  }
]
```

**Test Via Swagger:**
1. Open http://localhost:3000/api/docs
2. Find **GET /api/prebid-queries**
3. Click **"Try it out"**
4. Click **"Execute"**

---

### Test 2: Get Specific Query by ID

**Real Query IDs from Database:**
- `7577375a-a6e7-45e1-9c7e-9c65c1aaca36` (QRY-2024-001)
- `5b79647f-9f62-411f-b659-3a800b66651c` (QRY-2024-002)
- `8341fca3-aa16-4f93-80cf-39119d7e8aab` (QRY-2024-004)
- `fac137a9-4f8b-49e1-9a9a-901f855a8b85` (QRY-2024-005)
- `dba1733e-6685-4664-9173-7510baccdd9a` (QRY-2024-003)

**Command:**
```powershell
# Get query by ID
curl http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36 | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "query_number": "QRY-2024-001",
  "query_text": "What is the project duration?",
  "status": "PENDING",
  "category": "Timeline",
  "rfp_number": "RFP-2024-NH-001",
  "submitted_at": "2024-12-15T10:30:00Z",
  "vendor": {
    "vendor_id": "vendor-001",
    "vendor_name": "ABC Construction"
  }
}
```

---

### Test 3: Get Query Statistics

**Command:**
```powershell
# Get statistics
curl http://localhost:3000/api/prebid-queries/statistics

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/statistics | ConvertTo-Json
```

**Expected Response:**
```json
{
  "total_queries": 5,
  "by_status": {
    "PENDING": 3,
    "RESPONDED": 2,
    "PROCESSING": 0
  },
  "by_category": {
    "Timeline": 1,
    "Safety": 1,
    "Technical": 2,
    "General": 1
  }
}
```

---

### Test 4: Process Query (via Screen 8)

**Command:**
```powershell
# Process query using Screen 8
curl -X POST http://localhost:3000/api/prebid-queries/fac137a9-4f8b-49e1-9a9a-901f855a8b85/process

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/fac137a9-4f8b-49e1-9a9a-901f855a8b85/process -Method Post
```

**Expected Response:**
```json
{
  "success": true,
  "query_id": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
  "status": "PROCESSING",
  "message": "Query sent to Chief Engineer for processing"
}
```

**Monitor Backend Logs:**
```
[PrebidQueriesController] Processing query: fac137a9-4f8b-49e1-9a9a-901f855a8b85
[Screen8Service] Calling Screen 8 API: http://localhost:8001/api/chief-engineer/process
[Screen8Service] Response received: 6-step workflow initiated
```

---

### Test 5: Find Similar Queries

**Command:**
```powershell
# Find similar queries
curl http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36/similar

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36/similar | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "similar_queries": [
    {
      "query_id": "8341fca3-aa16-4f93-80cf-39119d7e8aab",
      "query_text": "What is the implementation timeline?",
      "similarity_score": 0.89,
      "category": "Schedule"
    }
  ],
  "total_found": 1
}
```

---

### Test 6: Bulk Query Operations (NEW in V3)

**Bulk Vectorization:**
```powershell
# Vectorize multiple queries at once
$body = @{
    query_ids = @(
        "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
        "5b79647f-9f62-411f-b659-3a800b66651c",
        "8341fca3-aa16-4f93-80cf-39119d7e8aab"
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/bulk/vectorize -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "total_requested": 3,
  "vectorized": 3,
  "failed": 0,
  "results": [
    {
      "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
      "status": "success",
      "duration_ms": 2345
    },
    {
      "query_id": "5b79647f-9f62-411f-b659-3a800b66651c",
      "status": "success",
      "duration_ms": 1987
    },
    {
      "query_id": "8341fca3-aa16-4f93-80cf-39119d7e8aab",
      "status": "success",
      "duration_ms": 2123
    }
  ]
}
```

**Bulk Status Check:**
```powershell
# Check status of multiple queries
$body = @{
    query_ids = @(
        "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
        "5b79647f-9f62-411f-b659-3a800b66651c"
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/bulk/status -Method Post -Body $body -ContentType "application/json"
```

---

### Test 7: Query Document in Historical Data Service (NEW in V3)

**Command:**
```powershell
$body = @{
    document_id = 10
    query = "What are the payment terms?"
    top_k = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8005/api/query-document -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "document_id": 10,
  "query": "What are the payment terms?",
  "results": [
    {
      "chunk_id": "rfp_10_chunk_12",
      "content": "Payment terms are NET 30 days from invoice date...",
      "similarity_score": 0.92,
      "metadata": {
        "chunk_index": 12,
        "document_type": "RFP"
      }
    }
  ],
  "total_found": 5,
  "processing_time_ms": 234
}
```

---

### Test 8: Get Document Chunks (NEW in V3)

**Command:**
```powershell
# Get all chunks for a specific document
curl http://localhost:8005/api/document/10/chunks

# PowerShell
Invoke-RestMethod -Uri http://localhost:8005/api/document/10/chunks | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "success": true,
  "document_id": 10,
  "total_chunks": 45,
  "chunks": [
    {
      "chunk_id": "rfp_10_chunk_0",
      "content": "NHAI Tender Document - Section 1: Introduction...",
      "chunk_index": 0,
      "metadata": {
        "document_type": "RFP",
        "rfp_number": "RFP-2026-TEST-001"
      }
    }
  ]
}
```

---

## Testing Historical Data Management

### Test 9: Upload Historical Document

**Step 9.1: Prepare Test Document**
```powershell
# Navigate to docs folder
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\docs

# Verify test document exists
dir NHAI_AI.pdf
```

**Step 9.2: Upload via Swagger UI**
1. Open http://localhost:3000/api/docs
2. Find **POST /api/historical-data/upload**
3. Click **"Try it out"**
4. Fill form:
   - **file:** Browse to `docs/NHAI_AI.pdf`
   - **rfp_number:** `RFP-2026-TEST-001`
   - **title:** `Test NHAI AI Document`
   - **document_type:** `RFP`
   - **description:** `Test upload for historical data`
5. Click **Execute**

**Expected Response (201):**
```json
{
  "success": true,
  "document_id": 10,
  "message": "Document uploaded and queued for processing",
  "status": "PENDING"
}
```

**Step 9.3: Upload via PowerShell**
```powershell
$filePath = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\docs\NHAI_AI.pdf"
$url = "http://localhost:3000/api/historical-data/upload"

$form = @{
    file = Get-Item -Path $filePath
    rfp_number = "RFP-2026-TEST-001"
    title = "Test NHAI AI Document"
    document_type = "RFP"
    description = "Test upload for historical data"
}

$response = Invoke-RestMethod -Uri $url -Method Post -Form $form
$response | ConvertTo-Json
```

---

### Test 10: Monitor Document Processing

**Step 10.1: Check Backend Logs**
Look for in backend terminal:
```
[HistoricalDataService] Processing upload: NHAI_AI.pdf
[HistoricalDataService] Document saved: ID=10
[HistoricalDataService] Job queued for document ID=10
[DocumentProcessingProcessor] 🔄 Processing document 10: NHAI_AI.pdf (RFP)
[DocumentProcessingProcessor] 📤 Calling Python service at http://localhost:8005
```

**Step 10.2: Check Python Service Logs**
Look for in Python terminal (port 8005):
```
INFO:     Processing document 10: NHAI_AI.pdf (Type: RFP)
INFO:     Extracted 45000 characters from PDF
INFO:     Split into 45 chunks (size: 1000, overlap: 200)
INFO:     Generated embeddings for 45 chunks using ollama (nomic-embed-text)
INFO:     Stored 45 vectors in ChromaDB collection: rfp_documents
INFO:     Document 10 processed successfully in 23.45s
```

**Step 10.3: Get Document Status via API**
```powershell
# Replace {id} with your document ID
curl http://localhost:3000/api/historical-data/10

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/historical-data/10 | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "id": 10,
  "rfp_number": "RFP-2026-TEST-001",
  "title": "Test NHAI AI Document",
  "document_type": "RFP",
  "file_name": "NHAI_AI.pdf",
  "file_size": 1234567,
  "status": "PROCESSED",
  "processing_metadata": {
    "chunks_processed": 45,
    "vector_ids": ["rfp_10_chunk_0", "rfp_10_chunk_1", "..."],
    "processing_time_ms": 23456,
    "embedding_provider": "ollama (nomic-embed-text)"
  },
  "uploaded_at": "2026-01-27T10:10:16.613Z",
  "processed_at": "2026-01-27T10:10:40.079Z",
  "ai_reference_count": 0
}
```

**Status Flow:**
- **PENDING** → Document uploaded, waiting in queue
- **PROCESSING** → Being processed by Python service (port 8005)
- **PROCESSED** → Successfully completed with chunks stored in ChromaDB
- **FAILED** → Error occurred (check `processing_metadata.error_message`)

---

### Test 11: List All Historical Documents

**Command:**
```powershell
# Get all documents with pagination
curl "http://localhost:3000/api/historical-data?page=1&limit=10"

# Filter by status
curl "http://localhost:3000/api/historical-data?status=PROCESSED"

# Filter by document type
curl "http://localhost:3000/api/historical-data?document_type=RFP"

# PowerShell with filters
Invoke-RestMethod -Uri "http://localhost:3000/api/historical-data?page=1&limit=10&status=PROCESSED&document_type=RFP" | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "documents": [
    {
      "id": 10,
      "rfp_number": "RFP-2026-TEST-001",
      "title": "Test NHAI AI Document",
      "document_type": "RFP",
      "status": "PROCESSED",
      "chunks_processed": 45,
      "uploaded_at": "2026-01-27T10:10:16.613Z",
      "processed_at": "2026-01-27T10:10:40.079Z"
    },
    {
      "id": 6,
      "rfp_number": "RFP-6000-NH-001",
      "title": "Gurgaon Development",
      "document_type": "RFP",
      "status": "PROCESSED",
      "chunks_processed": 172,
      "uploaded_at": "2026-01-24T14:25:00Z",
      "processed_at": "2026-01-24T14:28:15Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

## Testing RAG Chain with RAGAS Evaluation (NEW in V3)

### Test 12: Run RAG Chain Demo

**Description:** Run comprehensive RAG chain demonstration with RAGAS quality evaluation

**Command:**
```powershell
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION

# Run RAG demo with RAGAS evaluation
nhai-venv\Scripts\python.exe python-rag\shared\examples_rag_chain.py
```

**Expected Output:**
```
[OK] Ollama embeddings initialized (nomic-embed-text)
[OK] ChromaDB initialized
[OK] Document indexed successfully
[OK] Context retrieved: Clause A: Payment terms are NET 30...

Running RAGAS Evaluation...
Evaluating: 100%|████████████████████| 2/2 [00:15<00:00,  7.8s/it]

RAGAS Evaluation Results:
  Faithfulness:      0.92
  Answer Relevancy:  0.88
  Evaluation Time:   15234 ms
```

**What This Tests:**
- Document ingestion and chunking
- Embedding generation (Ollama)
- Vector storage (ChromaDB)
- Semantic search
- Context retrieval
- RAGAS quality metrics (faithfulness, answer_relevancy)

**Requirements:**
- `OPENAI_API_KEY` set in `.env` file (for RAGAS evaluation)
- Ollama running with `nomic-embed-text` model
- ChromaDB accessible

---

## Testing Query Vectorization

### Test 13: Automatic Vectorization Job

**Description:** Background cron job runs every 5 minutes to vectorize unvectorized queries

**Monitor Backend Logs:**
```
[QueryVectorizationJob] ============================================
[QueryVectorizationJob] Starting Query Vectorization Job
[QueryVectorizationJob] ============================================
[QueryVectorizationJob] Found 5 queries to vectorize
[QueryVectorizationJob] [1/5] Processing query: 7577375a-a6e7-45e1-9c7e-9c65c1aaca36
[VectorizationService] Starting vectorization for query: 7577375a-a6e7-45e1-9c7e-9c65c1aaca36
[VectorizationService] Calling Screen 8 API: http://localhost:8001/api/chief-engineer/store-query
[VectorizationService] ✓ Query 7577375a-a6e7-45e1-9c7e-9c65c1aaca36 vectorized successfully
```

**Expected Job Summary:**
```
[QueryVectorizationJob] Job Summary:
[QueryVectorizationJob]   Total Processed: 5
[QueryVectorizationJob]   ✓ Successful: 5
[QueryVectorizationJob]   ✗ Failed: 0
[QueryVectorizationJob]   Duration: 12.34s
```

---

### Test 14: Get Vectorization Statistics

**Command:**
```powershell
# Get vectorization stats
curl http://localhost:3000/api/admin/vectorization/stats

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/stats | ConvertTo-Json
```

**Expected Response:**
```json
{
  "total_queries": 5,
  "vectorized": 5,
  "unvectorized": 0,
  "failed": 0,
  "vectorization_rate": 100.0,
  "last_job_run": "2026-01-27T10:15:00Z",
  "next_job_run": "2026-01-27T10:20:00Z"
}
```

---

## Testing Screen 7 - History Retriever

### Test 15: Search Historical Data

**Command:**
```powershell
$body = @{
    query = "What is the project timeline?"
    top_k = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/rag/search -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "query": "What is the project timeline?",
  "results": [
    {
      "document_id": "rfp_6_chunk_12",
      "content": "The project implementation timeline is 24 months from contract signing...",
      "similarity_score": 0.92,
      "metadata": {
        "document_type": "RFP",
        "rfp_number": "RFP-6000-NH-001",
        "chunk_index": 12
      }
    }
  ],
  "total_found": 5,
  "processing_time_ms": 234
}
```

---

### Test 16: Ingest Document to Screen 7

**Command:**
```powershell
$filePath = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\docs\NHAI_AI.pdf"
$url = "http://localhost:8000/api/rag/ingest"

$form = @{
    file = Get-Item -Path $filePath
    document_type = "RFP"
    metadata = '{"rfp_number":"RFP-2026-TEST-001","title":"Test Document"}'
}

Invoke-RestMethod -Uri $url -Method Post -Form $form
```

**Expected Response:**
```json
{
  "success": true,
  "document_id": "rfp_11",
  "chunks_processed": 45,
  "processing_time_ms": 12345
}
```

---

## Testing Screen 8 - Chief Engineer Service

### Test 17: Process Query (6-Step Workflow)

**Command:**
```powershell
$body = @{
    query_id = "fac137a9-4f8b-49e1-9a9a-901f855a8b85"
    query_text = "What are the safety requirements?"
    category = "Safety"
    rfp_number = "RFP-2026-TEST-001"
    vendor_id = "vendor-001"
    metadata = @{
        priority = "high"
        submitted_by = "ABC Construction"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8001/api/chief-engineer/process -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "query_id": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
  "workflow_execution_id": "wf-exec-12345",
  "status": "PROCESSING",
  "message": "Query processing initiated via 6-step workflow",
  "steps": [
    {
      "step": 1,
      "name": "Query Vectorization",
      "status": "COMPLETED"
    },
    {
      "step": 2,
      "name": "Historical Data Retrieval",
      "status": "IN_PROGRESS"
    }
  ]
}
```

---

### Test 18: Store Query in Vector DB

**Command:**
```powershell
$body = @{
    query_id = "test-query-123"
    query_text = "What are the project milestones?"
    category = "Timeline"
    rfp_number = "RFP-2026-TEST-001"
    metadata = @{
        submitted_by = "vendor-123"
        submitted_at = "2026-01-27T10:00:00Z"
        priority = "high"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8001/api/chief-engineer/store-query -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "query_id": "test-query-123",
  "message": "Query stored successfully in ChromaDB",
  "embedding_dimension": 768,
  "processing_time_ms": 1234
}
```

---

### Test 19: Find Similar Queries in Screen 8

**Command:**
```powershell
$body = @{
    query_text = "What is the project duration?"
    top_k = 5
    rfp_number = "RFP-2026-TEST-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8001/api/chief-engineer/similar-queries -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "query_text": "What is the project duration?",
  "similar_queries": [
    {
      "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
      "query_text": "What is the project timeline?",
      "similarity_score": 0.94,
      "category": "Timeline",
      "rfp_number": "RFP-2024-NH-001"
    },
    {
      "query_id": "8341fca3-aa16-4f93-80cf-39119d7e8aab",
      "query_text": "What is the implementation timeline?",
      "similarity_score": 0.88,
      "category": "Schedule",
      "rfp_number": "RFP-2024-NH-002"
    }
  ],
  "total_found": 2
}
```

---

## Troubleshooting Commands

### Issue 1: Langchain Import Errors (NEW in V3)

**Error Symptoms:**
```
ModuleNotFoundError: No module named 'langchain.text_splitter'
ModuleNotFoundError: No module named 'langchain.prompts'
ModuleNotFoundError: No module named 'langchain_core.pydantic_v1'
```

**Root Causes:**
1. Using old langchain 0.x import paths
2. Using wrong Python environment (V100/V300 instead of V400)
3. Incompatible langchain package versions

**Solution 1: Verify Environment**
```powershell
# Check which Python you're using
where python

# Should output:
# d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe

# If wrong environment, use full path:
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py
```

**Solution 2: Verify Package Versions**
```powershell
# Check installed packages
nhai-venv\Scripts\python.exe -m pip list | findstr langchain

# Should show:
# langchain                  1.2.7
# langchain-community        0.4.1
# langchain-core             1.2.7
# langchain-openai           1.1.7
# langchain-text-splitters   1.1.0
# langgraph                  1.0.7
```

**Solution 3: Upgrade Packages if Needed**
```powershell
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION

# Upgrade all langchain packages together
nhai-venv\Scripts\python.exe -m pip install --upgrade langchain langchain-community langchain-openai langchain-text-splitters langgraph
```

**Solution 4: Import Path Migration**
If you see old imports in your code, update them:
```python
# OLD (langchain 0.x):
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.embeddings import OpenAIEmbeddings

# NEW (langchain 1.2.x):
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAIEmbeddings
```

---

### Issue 2: Service Won't Start - Port Already in Use

**Check Port Usage:**
```powershell
# Check specific port
netstat -ano | findstr :3000

# Check all NHAI ports
netstat -ano | findstr ":3000 :3001 :5432 :6379 :8000 :8001 :8005 :11434"
```

**Kill Process on Port:**
```powershell
# Get PID from netstat output
netstat -ano | findstr :3000
# Output: TCP 0.0.0.0:3000  LISTENING  12345

# Kill process
taskkill /F /PID 12345
```

---

### Issue 3: Redis Not Running

**Check Redis:**
```powershell
# Check if Redis container exists
docker ps -a | findstr redis

# Check if Redis is running
docker ps | findstr redis

# Start Redis
docker start redis

# Verify Redis is accessible
docker exec -it redis redis-cli ping
# Expected: PONG

# Check Redis logs
docker logs redis
```

---

### Issue 4: Database Connection Failed

**Check PostgreSQL:**
```powershell
# Check if PostgreSQL service is running
Get-Service | findstr postgres

# Test connection
psql -U postgres -h localhost -p 5432 -c "SELECT version();"

# Check database exists
$env:PGPASSWORD = "your_password"
psql -h localhost -U postgres -c "\l" | findstr nhai_tender_db

# Check tables
psql -h localhost -U postgres -d nhai_tender_db -c "\dt"
```

---

### Issue 5: ChromaDB Schema Error

**Error:** `sqlite3.OperationalError: no such column: collections.topic`

**Solution:**
```powershell
# Delete old ChromaDB data
cd python-rag\screen07-history-retriever
Remove-Item -Recurse -Force chroma_db

cd ..\screen08-chief-engineer
Remove-Item -Recurse -Force query_db

cd ..\historical-data-service
Remove-Item -Recurse -Force chroma_db

# Restart services - ChromaDB will be recreated
```

---

### Issue 6: RAGAS Evaluation Fails

**Error:** `OpenAIError: API key not found`

**Solution:**
```powershell
# Check .env file
Get-Content .env | findstr OPENAI_API_KEY

# Should contain:
# OPENAI_API_KEY=sk-proj-...

# If missing, add it:
echo "OPENAI_API_KEY=your-key-here" >> .env
```

---

## Complete System Health Check Script

**Save as:** `system-health-check-v3.ps1`

```powershell
# NHAI System Comprehensive Health Check v3

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "NHAI System Health Check v3" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Test 1: Check all ports
Write-Host "[1/12] Checking Ports..." -ForegroundColor Yellow
$ports = @{
    "PostgreSQL" = 5432
    "Redis" = 6379
    "Backend" = 3000
    "Frontend" = 3001
    "Screen 7" = 8000
    "Screen 8" = 8001
    "Historical Data" = 8005
    "Ollama" = 11434
}

foreach ($service in $ports.GetEnumerator()) {
    $port = $service.Value
    $result = netstat -ano | Select-String ":$port.*LISTENING"
    if ($result) {
        Write-Host "  ✓ $($service.Key) (Port $port)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $($service.Key) (Port $port) - NOT RUNNING" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# Test 2: Verify Python Environment
Write-Host "[2/12] Verifying Python Environment..." -ForegroundColor Yellow
$pythonPath = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe"
if (Test-Path $pythonPath) {
    Write-Host "  ✓ Python Environment: OK (V400)" -ForegroundColor Green
    
    # Check langchain version
    $version = & $pythonPath -m pip show langchain | Select-String "Version:"
    Write-Host "    $version" -ForegroundColor Gray
} else {
    Write-Host "  ✗ Python Environment: NOT FOUND" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 3: Backend Health
Write-Host "[3/12] Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 5
    Write-Host "  ✓ Backend Health: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend Health: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 4: Prebid Queries API
Write-Host "[4/12] Testing Prebid Queries API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/statistics" -TimeoutSec 5
    Write-Host "  ✓ Prebid Queries API: OK" -ForegroundColor Green
    Write-Host "    Total Queries: $($response.total_queries)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Prebid Queries API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 5: Historical Data Service
Write-Host "[5/12] Testing Historical Data Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8005/api/stats" -TimeoutSec 5
    Write-Host "  ✓ Historical Data Service: OK" -ForegroundColor Green
    Write-Host "    Total Documents: $($response.statistics.total_documents)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Historical Data Service: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 6: Screen 7
Write-Host "[6/12] Testing Screen 7 (History Retriever)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -TimeoutSec 5
    Write-Host "  ✓ Screen 7: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Screen 7: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 7: Screen 8
Write-Host "[7/12] Testing Screen 8 (Chief Engineer)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/health" -TimeoutSec 5
    Write-Host "  ✓ Screen 8: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Screen 8: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 8: Redis
Write-Host "[8/12] Testing Redis..." -ForegroundColor Yellow
try {
    $result = docker exec redis redis-cli ping
    if ($result -eq "PONG") {
        Write-Host "  ✓ Redis: OK" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Redis: FAILED - Unexpected response: $result" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ✗ Redis: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 9: Ollama
Write-Host "[9/12] Testing Ollama..." -ForegroundColor Yellow
try {
    $models = ollama list
    if ($models -match "nomic-embed-text") {
        Write-Host "  ✓ Ollama: OK (nomic-embed-text available)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Ollama: Model nomic-embed-text NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ✗ Ollama: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 10: PostgreSQL
Write-Host "[10/12] Testing PostgreSQL..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "your_password"
    $result = psql -U postgres -h localhost -p 5432 -c "\l" 2>&1 | Select-String "nhai_tender_db"
    if ($result) {
        Write-Host "  ✓ PostgreSQL: OK (nhai_tender_db exists)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ PostgreSQL: Database nhai_tender_db NOT FOUND" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ✗ PostgreSQL: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 11: Vectorization Status
Write-Host "[11/12] Testing Vectorization..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/vectorization/stats" -TimeoutSec 5
    Write-Host "  ✓ Vectorization Service: OK" -ForegroundColor Green
    Write-Host "    Total Queries: $($response.total_queries)" -ForegroundColor Gray
    Write-Host "    Vectorized: $($response.vectorized)" -ForegroundColor Gray
    Write-Host "    Unvectorized: $($response.unvectorized)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Vectorization Service: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 12: Frontend
Write-Host "[12/12] Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Frontend: OK" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Frontend: HTTP $($response.StatusCode)" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ✗ Frontend: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✓ All Systems Operational" -ForegroundColor Green
} else {
    Write-Host "✗ Some Systems Have Issues" -ForegroundColor Red
}
Write-Host "=====================================" -ForegroundColor Cyan
```

**Run Health Check:**
```powershell
powershell -ExecutionPolicy Bypass -File system-health-check-v3.ps1
```

---

## Summary

**Service URLs - Quick Reference:**

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Backend API | 3000 | http://localhost:3000/api/docs | Main API with Swagger |
| Frontend | 3001 | http://localhost:3001 | Web UI & Admin Panel |
| Screen 7 | 8000 | http://localhost:8000/docs | History Retriever RAG |
| Screen 8 | 8001 | http://localhost:8001/docs | Chief Engineer RAG |
| Historical Data | 8005 | http://localhost:8005/api/stats | Document Processing |
| PostgreSQL | 5432 | N/A | Database |
| Redis | 6379 | N/A | Queue Management |
| Ollama | 11434 | http://localhost:11434/api/version | AI Embeddings & LLM |

**Critical Dependencies:**
1. PostgreSQL must be running first
2. Redis must be running before backend (for Bull queue)
3. Ollama must be running for embeddings (`nomic-embed-text`) and LLM (`gemma:2b`)
4. Backend must start before Python services (for database access)
5. Screen 8 must be running for query vectorization job
6. **V3: Always use correct V400 Python environment path**

**V3 Key Updates:**
- ✅ Fixed langchain import paths for 1.2.x compatibility
- ✅ Updated all Python commands to use V400 environment
- ✅ Added bulk query operations endpoints
- ✅ Added query-document endpoint for historical data service
- ✅ Added RAG chain demo with RAGAS evaluation
- ✅ Enhanced troubleshooting with langchain migration fixes
- ✅ Added document chunks retrieval endpoint
- ✅ Updated health check script to verify Python environment

**Common Issues:**
- Wrong Python environment → Use full V400 path
- Langchain import errors → Update to new import structure
- Port conflicts → Use `netstat` and `taskkill`
- Redis not running → `docker start redis`
- Database not found → Check PostgreSQL service
- ChromaDB schema error → Delete chroma_db folders and restart

**Real Query IDs for Testing:**
- `7577375a-a6e7-45e1-9c7e-9c65c1aaca36` (QRY-2024-001)
- `5b79647f-9f62-411f-b659-3a800b66651c` (QRY-2024-002)
- `dba1733e-6685-4664-9173-7510baccdd9a` (QRY-2024-003)
- `8341fca3-aa16-4f93-80cf-39119d7e8aab` (QRY-2024-004)
- `fac137a9-4f8b-49e1-9a9a-901f855a8b85` (QRY-2024-005)

---

**Package Version Reference (V3):**
```
langchain==1.2.7
langchain-core==1.2.7
langchain-community==0.4.1
langchain-openai==1.1.7
langchain-text-splitters==1.1.0
langgraph==1.0.7
ragas==0.4.3
datasets==4.5.0
anthropic==0.76.0
numpy==1.26.3
```

---

*Last Updated: January 27, 2026*  
*Version: 3.0*  
*Includes: Langchain 1.2.x migration, Bulk operations, Query endpoints, RAGAS evaluation, Enhanced troubleshooting*
