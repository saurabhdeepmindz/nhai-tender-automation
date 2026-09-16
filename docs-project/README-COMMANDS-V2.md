# NHAI Tender Automation System - Execution Commands (v2)
**Complete Service Startup, Testing, and Operations Guide**

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

# Use virtual environment Python
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py
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

# Use virtual environment Python
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py

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

---

### Step 7: Start Screen 8 - Chief Engineer Service (Python)
**Description:** Start query vectorization and processing service  
**Directory:** `python-rag\screen08-chief-engineer`  
**Command:**
```powershell
cd python-rag\screen08-chief-engineer

# Use virtual environment Python
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py

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
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\historical-data-service; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# 4. Start Screen 7
Write-Host "[4/7] Starting Screen 7 (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\screen07-history-retriever; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# 5. Start Screen 8
Write-Host "[5/7] Starting Screen 8 (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\screen08-chief-engineer; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
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

### Test 6: Get Query Status

**Command:**
```powershell
# Get query processing status
curl http://localhost:3000/api/prebid-queries/dba1733e-6685-4664-9173-7510baccdd9a/status

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/dba1733e-6685-4664-9173-7510baccdd9a/status | ConvertTo-Json
```

**Expected Response:**
```json
{
  "query_id": "dba1733e-6685-4664-9173-7510baccdd9a",
  "status": "RESPONDED",
  "submitted_at": "2024-12-17T14:20:00Z",
  "responded_at": "2024-12-18T10:00:00Z",
  "processing_time_ms": 71880000
}
```

---

### Test 7: Get Query History

**Command:**
```powershell
# Get query history/logs
curl http://localhost:3000/api/prebid-queries/8341fca3-aa16-4f93-80cf-39119d7e8aab/history

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/8341fca3-aa16-4f93-80cf-39119d7e8aab/history | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "query_id": "8341fca3-aa16-4f93-80cf-39119d7e8aab",
  "history": [
    {
      "timestamp": "2024-12-17T14:20:00Z",
      "event": "QUERY_SUBMITTED",
      "details": "Query submitted by vendor"
    },
    {
      "timestamp": "2024-12-17T14:21:00Z",
      "event": "PROCESSING_STARTED",
      "details": "Query sent to Screen 8"
    },
    {
      "timestamp": "2024-12-18T10:00:00Z",
      "event": "RESPONSE_GENERATED",
      "details": "Admin response added"
    }
  ]
}
```

---

### Test 8: Add Admin Response

**Command:**
```powershell
# Add admin response to query
$body = @{
    response = "The implementation timeline is 24 months from contract signing."
    admin_id = "admin-001"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/5b79647f-9f62-411f-b659-3a800b66651c/admin-response -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "query_id": "5b79647f-9f62-411f-b659-3a800b66651c",
  "status": "RESPONDED",
  "response": "The implementation timeline is 24 months from contract signing."
}
```

---

## Testing Historical Data Management

### Test 9: Upload Historical Document

**Step 9.1: Prepare Test Document**
```powershell
# Navigate to docs folder
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\docs

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
$filePath = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\docs\NHAI_AI.pdf"
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
  "uploaded_at": "2026-01-26T10:10:16.613Z",
  "processed_at": "2026-01-26T10:10:40.079Z",
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
      "uploaded_at": "2026-01-26T10:10:16.613Z",
      "processed_at": "2026-01-26T10:10:40.079Z"
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

### Test 12: Get Historical Data Statistics

**Command:**
```powershell
# Backend statistics
curl http://localhost:3000/api/historical-data/stats/summary

# Python service statistics
curl http://localhost:8005/api/stats

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/historical-data/stats/summary | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8005/api/stats | ConvertTo-Json
```

**Expected Response (Backend):**
```json
{
  "total_documents": 10,
  "by_type": {
    "RFP": 7,
    "Q&A": 2,
    "CORRIGENDUM": 1
  },
  "by_status": {
    "PENDING": 0,
    "PROCESSING": 0,
    "PROCESSED": 9,
    "FAILED": 1
  },
  "total_chunks": 456,
  "total_size_bytes": 12345678
}
```

**Expected Response (Python Service):**
```json
{
  "success": true,
  "statistics": {
    "rfp_documents": 7,
    "qa_documents": 2,
    "corrigendum_documents": 1,
    "total_documents": 10,
    "total_chunks": 456
  }
}
```

---

### Test 13: Retry Failed Document

**Command:**
```powershell
# Retry via Swagger UI
# POST /api/historical-data/{id}/retry

# Or via curl
curl -X POST http://localhost:3000/api/historical-data/3/retry

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/historical-data/3/retry -Method Post
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Document requeued for processing",
  "document_id": 3,
  "new_status": "PENDING"
}
```

---

## Testing Query Vectorization

### Test 14: Automatic Vectorization Job

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

### Test 15: Get Vectorization Statistics

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
  "last_job_run": "2026-01-26T10:15:00Z",
  "next_job_run": "2026-01-26T10:20:00Z"
}
```

---

### Test 16: Get Vectorization Dashboard Data

**Command:**
```powershell
# Get dashboard data
curl http://localhost:3000/api/admin/vectorization/dashboard

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/dashboard | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "statistics": {
    "total_queries": 5,
    "vectorized": 5,
    "unvectorized": 0,
    "failed": 0
  },
  "recent_logs": [
    {
      "id": 1,
      "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
      "status": "success",
      "duration_ms": 2345,
      "created_at": "2026-01-26T10:15:00Z"
    }
  ],
  "pending_queries": [],
  "job_config": {
    "enabled": true,
    "cron": "0 */5 * * * *",
    "batch_size": 10
  }
}
```

---

### Test 17: Manual Vectorization - Run Job Now

**Command:**
```powershell
# Trigger vectorization immediately
curl -X POST http://localhost:3000/api/admin/vectorization/job/run-now

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/job/run-now -Method Post
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Vectorization job triggered successfully",
  "queries_processed": 0,
  "queries_vectorized": 0,
  "queries_failed": 0
}
```

---

### Test 18: Get Pending Queries for Vectorization

**Command:**
```powershell
# Get pending queries
curl "http://localhost:3000/api/admin/vectorization/queries/pending?limit=10"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/vectorization/queries/pending?limit=10" | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "queries": [],
  "total": 0,
  "limit": 10
}
```

---

### Test 19: Get Vectorization Logs

**Command:**
```powershell
# Get vectorization logs
curl "http://localhost:3000/api/admin/vectorization/logs?limit=20"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/vectorization/logs?limit=20" | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "logs": [
    {
      "id": 5,
      "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
      "status": "success",
      "duration_ms": 2345,
      "error_message": null,
      "created_at": "2026-01-26T10:15:00Z"
    },
    {
      "id": 4,
      "query_id": "5b79647f-9f62-411f-b659-3a800b66651c",
      "status": "success",
      "duration_ms": 1987,
      "error_message": null,
      "created_at": "2026-01-26T10:10:00Z"
    }
  ],
  "total": 100,
  "limit": 20
}
```

---

### Test 20: Pause/Resume Vectorization Job

**Pause Job:**
```powershell
curl -X POST http://localhost:3000/api/admin/vectorization/job/pause

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/job/pause -Method Post
```

**Resume Job:**
```powershell
curl -X POST http://localhost:3000/api/admin/vectorization/job/resume

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/job/resume -Method Post
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Vectorization job paused/resumed",
  "job_status": "paused"
}
```

---

### Test 21: Get Job Configuration

**Command:**
```powershell
curl http://localhost:3000/api/admin/vectorization/job/config

# PowerShell
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/job/config | ConvertTo-Json
```

**Expected Response:**
```json
{
  "enabled": true,
  "cron_schedule": "0 */5 * * * *",
  "batch_size": 10,
  "max_retries": 3,
  "retry_delay_ms": 5000,
  "status": "active"
}
```

---

## Testing Screen 7 - History Retriever

### Test 22: Search Historical Data

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

### Test 23: Ingest Document to Screen 7

**Command:**
```powershell
$filePath = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\docs\NHAI_AI.pdf"
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

### Test 24: Get Screen 7 Statistics

**Command:**
```powershell
curl http://localhost:8000/api/statistics

# PowerShell
Invoke-RestMethod -Uri http://localhost:8000/api/statistics | ConvertTo-Json
```

**Expected Response:**
```json
{
  "total_documents": 10,
  "total_chunks": 456,
  "collection_size_mb": 12.5,
  "embedding_dimension": 768,
  "last_ingestion": "2026-01-26T10:10:40Z"
}
```

---

### Test 25: Get Processing Transactions

**Command:**
```powershell
curl http://localhost:8000/api/rag/transactions

# PowerShell
Invoke-RestMethod -Uri http://localhost:8000/api/rag/transactions | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "txn-001",
      "document_id": "rfp_10",
      "operation": "INGEST",
      "status": "COMPLETED",
      "timestamp": "2026-01-26T10:10:40Z"
    }
  ],
  "total": 10
}
```

---

## Testing Screen 8 - Chief Engineer Service

### Test 26: Process Query (6-Step Workflow)

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
    },
    {
      "step": 3,
      "name": "Context Generation",
      "status": "PENDING"
    },
    {
      "step": 4,
      "name": "LLM Response Generation",
      "status": "PENDING"
    },
    {
      "step": 5,
      "name": "Response Validation",
      "status": "PENDING"
    },
    {
      "step": 6,
      "name": "Final Response",
      "status": "PENDING"
    }
  ]
}
```

---

### Test 27: Store Query in Vector DB

**Command:**
```powershell
$body = @{
    query_id = "test-query-123"
    query_text = "What are the project milestones?"
    category = "Timeline"
    rfp_number = "RFP-2026-TEST-001"
    metadata = @{
        submitted_by = "vendor-123"
        submitted_at = "2026-01-26T10:00:00Z"
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

### Test 28: Find Similar Queries in Screen 8

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

### Test 29: Get Workflow Executions

**Command:**
```powershell
# Get all workflow executions
curl http://localhost:8001/api/workflow/executions

# Get with filters
curl "http://localhost:8001/api/workflow/executions?status=COMPLETED&limit=10"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:8001/api/workflow/executions?limit=10" | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "executions": [
    {
      "workflow_execution_id": "wf-exec-12345",
      "query_id": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
      "status": "COMPLETED",
      "started_at": "2026-01-26T10:00:00Z",
      "completed_at": "2026-01-26T10:05:23Z",
      "total_duration_ms": 323000,
      "steps_completed": 6
    }
  ],
  "total": 15,
  "limit": 10
}
```

---

### Test 30: Get Workflow Execution Details

**Command:**
```powershell
# Get specific workflow execution
curl http://localhost:8001/api/workflow/executions/wf-exec-12345

# PowerShell
Invoke-RestMethod -Uri http://localhost:8001/api/workflow/executions/wf-exec-12345 | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "workflow_execution_id": "wf-exec-12345",
  "query_id": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
  "status": "COMPLETED",
  "started_at": "2026-01-26T10:00:00Z",
  "completed_at": "2026-01-26T10:05:23Z",
  "total_duration_ms": 323000,
  "steps": [
    {
      "step_number": 1,
      "name": "Query Vectorization",
      "status": "COMPLETED",
      "started_at": "2026-01-26T10:00:00Z",
      "completed_at": "2026-01-26T10:00:02Z",
      "duration_ms": 2000,
      "output": {
        "embedding_dimension": 768,
        "vector_id": "query_fac137a9"
      }
    },
    {
      "step_number": 2,
      "name": "Historical Data Retrieval",
      "status": "COMPLETED",
      "started_at": "2026-01-26T10:00:02Z",
      "completed_at": "2026-01-26T10:00:15Z",
      "duration_ms": 13000,
      "output": {
        "documents_found": 5,
        "top_similarity": 0.92
      }
    },
    {
      "step_number": 3,
      "name": "Context Generation",
      "status": "COMPLETED",
      "started_at": "2026-01-26T10:00:15Z",
      "completed_at": "2026-01-26T10:00:18Z",
      "duration_ms": 3000,
      "output": {
        "context_length": 4500
      }
    },
    {
      "step_number": 4,
      "name": "LLM Response Generation",
      "status": "COMPLETED",
      "started_at": "2026-01-26T10:00:18Z",
      "completed_at": "2026-01-26T10:05:00Z",
      "duration_ms": 282000,
      "output": {
        "response_length": 1200,
        "model_used": "gemma:2b"
      }
    },
    {
      "step_number": 5,
      "name": "Response Validation",
      "status": "COMPLETED",
      "started_at": "2026-01-26T10:05:00Z",
      "completed_at": "2026-01-26T10:05:20Z",
      "duration_ms": 20000,
      "output": {
        "validation_score": 0.95,
        "issues_found": 0
      }
    },
    {
      "step_number": 6,
      "name": "Final Response",
      "status": "COMPLETED",
      "started_at": "2026-01-26T10:05:20Z",
      "completed_at": "2026-01-26T10:05:23Z",
      "duration_ms": 3000,
      "output": {
        "response_sent": true
      }
    }
  ]
}
```

---

### Test 31: Get Screen 8 Statistics

**Command:**
```powershell
curl http://localhost:8001/api/statistics

# PowerShell
Invoke-RestMethod -Uri http://localhost:8001/api/statistics | ConvertTo-Json
```

**Expected Response:**
```json
{
  "total_queries_processed": 15,
  "total_workflows_executed": 15,
  "workflows_completed": 13,
  "workflows_failed": 2,
  "average_processing_time_ms": 305000,
  "total_vectors_stored": 15,
  "collection_size_mb": 3.2
}
```

---

## Troubleshooting Commands

### Issue 1: Service Won't Start - Port Already in Use

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

### Issue 2: Redis Not Running

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

### Issue 3: Database Connection Failed

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

### Issue 4: `/api/prebid-queries` returns 500 Error

**Check Backend Logs:**
Look for error stack trace in backend terminal. Common errors:
```
[Nest] ERROR [ExceptionsHandler] Cannot read properties of null
at QueryController.findAll (query.controller.ts:45)
```

**Check Database Directly:**
```powershell
$env:PGPASSWORD = "your_password"

# Get all queries
psql -h localhost -U postgres -d nhai_tender_db -c "SELECT query_id, query_number, status, query_text FROM queries;"

# Get specific query
psql -h localhost -U postgres -d nhai_tender_db -c "SELECT * FROM queries WHERE query_id = '7577375a-a6e7-45e1-9c7e-9c65c1aaca36';"
```

---

### Issue 5: Document Upload Fails with 500 Error

**Diagnostic Steps:**
```powershell
# 1. Check Redis is running
netstat -ano | findstr :6379
# If not running: docker start redis

# 2. Check Python service is running
netstat -ano | findstr :8005

# 3. Test Python service directly
curl http://localhost:8005/api/stats

# 4. Check backend logs for Bull queue errors
# Look for "MaxRetriesPerRequestError" or "Redis connection failed"

# 5. Check Python logs for processing errors
# Look for "pypdf package not found" or "File path ... is not a valid file"

# 6. Verify uploads directory exists
Test-Path "backend\uploads\historical"
# If not: mkdir backend\uploads\historical
```

---

### Issue 6: Zero Chunks Processed

**Check Python Logs:**
```
# Look for:
Extracted X characters
Split into 0 chunks
```

**Causes:**
- Document has < 1000 characters (minimum chunk size)
- Document is scanned image (needs OCR)
- Text extraction failed

**Solution:**
Upload a larger test document (e.g., `docs/NHAI_AI.pdf` which is known to work)

---

### Issue 7: Vectorization Job Fails

**Check Screen 8 Service:**
```powershell
# Check if Screen 8 is running
netstat -ano | findstr :8001

# Test Screen 8 health
curl http://localhost:8001/api/health

# Check backend logs for error messages
# Look for "Cannot connect to Screen 8 API"

# Verify Screen 8 can receive requests
curl -X POST http://localhost:8001/api/chief-engineer/store-query -H "Content-Type: application/json" -d "{\"query_id\":\"test\",\"query_text\":\"test\",\"category\":\"test\",\"rfp_number\":\"test\",\"metadata\":{}}"
```

---

### Issue 8: Ollama Not Available

**Check Ollama:**
```powershell
# Check if Ollama is running
netstat -ano | findstr :11434

# Test Ollama API
curl http://localhost:11434/api/version

# List installed models
ollama list

# Pull required models if missing
ollama pull nomic-embed-text
ollama pull gemma:2b
```

---

### Issue 9: ChromaDB Schema Error

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

### Issue 10: Frontend Shows "API Connection Failed"

**Check:**
```powershell
# 1. Backend is running
curl http://localhost:3000/api/health

# 2. Check frontend .env.local
Get-Content frontend\.env.local
# Should contain: NEXT_PUBLIC_API_URL=http://localhost:3000

# 3. Clear browser cache and reload

# 4. Check browser console for CORS errors
```

---

## Complete System Health Check Script

**Save as:** `system-health-check.ps1`

```powershell
# NHAI System Comprehensive Health Check

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "NHAI System Health Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Test 1: Check all ports
Write-Host "[1/11] Checking Ports..." -ForegroundColor Yellow
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

# Test 2: Backend Health
Write-Host "[2/11] Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 5
    Write-Host "  ✓ Backend Health: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend Health: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 3: Prebid Queries API
Write-Host "[3/11] Testing Prebid Queries API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/statistics" -TimeoutSec 5
    Write-Host "  ✓ Prebid Queries API: OK" -ForegroundColor Green
    Write-Host "    Total Queries: $($response.total_queries)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Prebid Queries API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 4: Historical Data Service
Write-Host "[4/11] Testing Historical Data Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8005/api/stats" -TimeoutSec 5
    Write-Host "  ✓ Historical Data Service: OK" -ForegroundColor Green
    Write-Host "    Total Documents: $($response.statistics.total_documents)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Historical Data Service: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 5: Screen 7
Write-Host "[5/11] Testing Screen 7 (History Retriever)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -TimeoutSec 5
    Write-Host "  ✓ Screen 7: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Screen 7: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 6: Screen 8
Write-Host "[6/11] Testing Screen 8 (Chief Engineer)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/health" -TimeoutSec 5
    Write-Host "  ✓ Screen 8: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Screen 8: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Test 7: Redis
Write-Host "[7/11] Testing Redis..." -ForegroundColor Yellow
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

# Test 8: Ollama
Write-Host "[8/11] Testing Ollama..." -ForegroundColor Yellow
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

# Test 9: PostgreSQL
Write-Host "[9/11] Testing PostgreSQL..." -ForegroundColor Yellow
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

# Test 10: Vectorization Status
Write-Host "[10/11] Testing Vectorization..." -ForegroundColor Yellow
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

# Test 11: Frontend
Write-Host "[11/11] Testing Frontend..." -ForegroundColor Yellow
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
powershell -ExecutionPolicy Bypass -File system-health-check.ps1
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

**Common Issues:**
- Port conflicts → Use `netstat` and `taskkill`
- Redis not running → `docker start redis`
- Database not found → Check PostgreSQL service
- Upload fails → Check Redis connection
- Zero chunks → Document too small or scanned image
- 500 errors → Check backend logs for detailed error stack trace

**Real Query IDs for Testing:**
- `7577375a-a6e7-45e1-9c7e-9c65c1aaca36` (QRY-2024-001)
- `5b79647f-9f62-411f-b659-3a800b66651c` (QRY-2024-002)
- `dba1733e-6685-4664-9173-7510baccdd9a` (QRY-2024-003)
- `8341fca3-aa16-4f93-80cf-39119d7e8aab` (QRY-2024-004)
- `fac137a9-4f8b-49e1-9a9a-901f855a8b85` (QRY-2024-005)

---

*Last Updated: January 26, 2026*  
*Version: 2.0*  
*Includes: Prebid Queries, Historical Data, Screen 7, Screen 8, Vectorization, Workflow Execution*
