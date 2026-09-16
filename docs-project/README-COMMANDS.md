# NHAI Tender Automation System - Execution Commands
**Complete Service Startup and Testing Guide**

---

## Prerequisites

✅ **Environment Setup Completed:**
- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- Python 3.11.9 installed
- Docker Desktop installed and running
- Ollama installed with `nomic-embed-text` model
- Virtual environment created at `nhai-venv/`
- All dependencies installed (`npm install`, `pip install -r requirements.txt`)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     NHAI System Components                       │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)           → Port 3000                       │
│  Backend (NestJS)             → Port 3001                       │
│  PostgreSQL                   → Port 5432                       │
│  Redis                        → Port 6379                       │
│  Ollama                       → Port 11434                      │
│  Screen 7 (History Retriever) → Port 8000                       │
│  Screen 8 (Chief Engineer)    → Port 8001                       │
│  Historical Data Service      → Port 8005                       │
└─────────────────────────────────────────────────────────────────┘
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
```
**Expected Output:** Database `nhai_tender_db` should be listed

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
**Description:** Start Ollama for AI embeddings generation  
**Directory:** N/A (System Service)  
**Command:**
```powershell
# Start Ollama (usually auto-starts)
# If not running, launch Ollama desktop app

# Verify model is available
ollama list
```
**Port:** `11434`  
**How to Test:**
```powershell
# Check Ollama is running
netstat -ano | findstr :11434

# Test embeddings generation
ollama run nomic-embed-text "test query"

# Or via API
curl http://localhost:11434/api/embeddings -d '{"model":"nomic-embed-text","prompt":"test"}'
```
**Expected Output:** Model `nomic-embed-text` listed, embeddings generated

---

### Step 4: Start Backend (NestJS)
**Description:** Start main NestJS backend API server  
**Directory:** `backend/`  
**Command:**
```powershell
cd backend
npm run start:dev
```
**Port:** `3001`  
**How to Test:**
```powershell
# Check backend is running
netstat -ano | findstr :3001

# Test health endpoint
curl http://localhost:3001/api/health

# Open Swagger UI
start http://localhost:3001/api/docs
```
**Expected Output:**
```
[Nest] Starting Nest application...
[Bootstrap] Server running on: http://localhost:3001
[Bootstrap] API documentation: http://localhost:3001/api/docs
```
**Test URLs:**
- Health: http://localhost:3001/api/health
- Swagger: http://localhost:3001/api/docs
- API Root: http://localhost:3001/api

---

### Step 5: Start Historical Data Service (Python)
**Description:** Start Python FastAPI service for document processing  
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

# Or use PowerShell
Invoke-RestMethod -Uri http://localhost:8005/api/stats
```
**Expected Output:**
```
✅ Service Ready!
Uvicorn running on http://0.0.0.0:8005
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
    "rfp_documents": 0,
    "qa_documents": 0,
    "corrigendum_documents": 0,
    "total_documents": 0
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
```
**Port:** `8000`  
**How to Test:**
```powershell
# Check service is running
netstat -ano | findstr :8000

# Test health endpoint
curl http://localhost:8000/health

# Test retrieval endpoint
curl http://localhost:8000/api/history-retriever/similar-queries -X POST -H "Content-Type: application/json" -d "{\"query_text\":\"test query\",\"top_k\":5}"
```
**Expected Output:**
```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Application startup complete
```
**Test URLs:**
- Health: http://localhost:8000/health
- Similar Queries: POST http://localhost:8000/api/history-retriever/similar-queries
- Query by ID: GET http://localhost:8000/api/history-retriever/query/{query_id}

---

### Step 7: Start Screen 8 - Chief Engineer Service (Python)
**Description:** Start query vectorization and storage service  
**Directory:** `python-rag\screen08-chief-engineer`  
**Command:**
```powershell
cd python-rag\screen08-chief-engineer

# Use virtual environment Python
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py
```
**Port:** `8001`  
**How to Test:**
```powershell
# Check service is running
netstat -ano | findstr :8001

# Test health endpoint
curl http://localhost:8001/health

# Test store query endpoint
curl http://localhost:8001/api/chief-engineer/store-query -X POST -H "Content-Type: application/json" -d "{\"query_id\":\"test-123\",\"query_text\":\"test query\",\"category\":\"general\",\"rfp_number\":\"RFP-001\",\"metadata\":{}}"
```
**Expected Output:**
```
INFO: Uvicorn running on http://0.0.0.0:8001
INFO: Application startup complete
```
**Test URLs:**
- Health: http://localhost:8001/health
- Store Query: POST http://localhost:8001/api/chief-engineer/store-query
- Get Query: GET http://localhost:8001/api/chief-engineer/query/{query_id}

---

### Step 8: Start Frontend (Next.js) - Optional
**Description:** Start Next.js frontend application  
**Directory:** `frontend/`  
**Command:**
```powershell
cd frontend
npm run dev
```
**Port:** `3000`  
**How to Test:**
```powershell
# Check frontend is running
netstat -ano | findstr :3000

# Open in browser
start http://localhost:3000
```
**Expected Output:**
```
ready - started server on 0.0.0.0:3000
```
**Test URLs:**
- Home: http://localhost:3000
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard

---

## Service Verification Checklist

Run this checklist after starting all services:

```powershell
# Check all ports
netstat -ano | findstr ":5432 :6379 :3001 :8005 :8000 :8001 :11434"
```

**Expected Output:**
```
TCP    0.0.0.0:3001     LISTENING     <pid>   # Backend
TCP    0.0.0.0:5432     LISTENING     <pid>   # PostgreSQL
TCP    0.0.0.0:6379     LISTENING     <pid>   # Redis
TCP    0.0.0.0:8000     LISTENING     <pid>   # Screen 7
TCP    0.0.0.0:8001     LISTENING     <pid>   # Screen 8
TCP    0.0.0.0:8005     LISTENING     <pid>   # Historical Data
TCP    0.0.0.0:11434    LISTENING     <pid>   # Ollama
```

---

## Testing Historical Data Management

### Test 1: Upload Historical Document

**Step 1.1: Prepare Test Document**
```powershell
# Navigate to docs folder
cd d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\docs

# Verify test document exists
dir NHAI_AI.pdf
```

**Step 1.2: Upload via Swagger UI**
1. Open http://localhost:3001/api/docs
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

**Step 1.3: Upload via PowerShell Script**
```powershell
# Create upload script
$filePath = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\docs\NHAI_AI.pdf"
$url = "http://localhost:3001/api/historical-data/upload"

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

**Expected Output:**
```json
{
  "success": true,
  "document_id": 10,
  "status": "PENDING"
}
```

---

### Test 2: Monitor Processing Status

**Step 2.1: Check Backend Logs**
Look for in backend terminal:
```
[HistoricalDataService] Processing upload: NHAI_AI.pdf
[HistoricalDataService] Document saved: ID=10
[HistoricalDataService] Job queued for document ID=10
[DocumentProcessingProcessor] 🔄 Processing document 10: NHAI_AI.pdf (RFP)
[DocumentProcessingProcessor] 📤 Calling Python service at http://localhost:8005
```

**Step 2.2: Check Python Service Logs**
Look for in Python terminal:
```
2026-01-26 00:10:16,709 - __main__ - INFO - 📥 Processing: NHAI_AI.pdf (Type: RFP)
2026-01-26 00:10:16,710 - document_processor - INFO - Processing RFP document: D:\...\uploads\historical\...
2026-01-26 00:10:18,024 - document_processor - INFO - Extracted 45000 characters
2026-01-26 00:10:18,024 - document_processor - INFO - Split into 45 chunks
2026-01-26 00:10:18,024 - document_processor - INFO - Generated embeddings for 45 chunks
2026-01-26 00:10:18,027 - __main__ - INFO - ✅ Document 10 processed: 45 chunks in 23.45s
```

**Step 2.3: Get Document Status via API**
```powershell
# Replace {id} with your document ID
curl http://localhost:3001/api/historical-data/10

# Or PowerShell
Invoke-RestMethod -Uri http://localhost:3001/api/historical-data/10 | ConvertTo-Json -Depth 10
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
    "vector_ids": ["rfp_10_chunk_0", "rfp_10_chunk_1", ...],
    "processing_time_ms": 23456,
    "embedding_provider": "ollama (nomic-embed-text)"
  },
  "uploaded_at": "2026-01-26T00:10:16.613Z",
  "processed_at": "2026-01-26T00:10:40.079Z",
  "ai_reference_count": 0
}
```

**Status Flow:**
- **PENDING** → Document uploaded, waiting in queue
- **PROCESSING** → Being processed by Python service
- **PROCESSED** → Successfully completed with chunks
- **FAILED** → Error occurred (check processing_metadata.error_message)

---

### Test 3: List All Documents

**Command:**
```powershell
# Get all documents with pagination
curl "http://localhost:3001/api/historical-data?page=1&limit=10"

# Filter by status
curl "http://localhost:3001/api/historical-data?status=PROCESSED"

# Filter by document type
curl "http://localhost:3001/api/historical-data?document_type=RFP"

# PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/api/historical-data?page=1&limit=10" | ConvertTo-Json -Depth 10
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
      "uploaded_at": "2026-01-26T00:10:16.613Z",
      "processed_at": "2026-01-26T00:10:40.079Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### Test 4: Get Statistics

**Command:**
```powershell
# Backend statistics
curl http://localhost:3001/api/historical-data/stats/summary

# Python service statistics
curl http://localhost:8005/api/stats

# PowerShell
Invoke-RestMethod -Uri http://localhost:3001/api/historical-data/stats/summary | ConvertTo-Json
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
  }
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
    "total_documents": 10
  }
}
```

---

### Test 5: Retry Failed Document

**Command:**
```powershell
# Retry via Swagger UI
# POST /api/historical-data/{id}/retry

# Or via curl
curl -X POST http://localhost:3001/api/historical-data/3/retry

# PowerShell
Invoke-RestMethod -Uri http://localhost:3001/api/historical-data/3/retry -Method Post
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Document requeued for processing",
  "document_id": 3
}
```

---

## Testing Query Vectorization

### Test 6: Automatic Vectorization Job

**Description:** Cron job runs every 5 minutes to vectorize unvectorized queries

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

### Test 7: Manual Query Vectorization

**Command:**
```powershell
# Vectorize specific query
curl -X POST http://localhost:3001/api/vectorization/query/{queryId}

# Vectorize batch of queries
curl -X POST http://localhost:3001/api/vectorization/batch -H "Content-Type: application/json" -d "{\"query_ids\":[\"id1\",\"id2\",\"id3\"]}"

# Get vectorization info
curl http://localhost:3001/api/vectorization/query/{queryId}/info
```

**Expected Response:**
```json
{
  "success": true,
  "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "message": "Query vectorized successfully",
  "processing_time_ms": 2345
}
```

---

## Testing Screen 7 - History Retriever

### Test 8: Search Similar Queries

**Command:**
```powershell
# Search for similar queries
$body = @{
    query_text = "What is the project timeline?"
    top_k = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/history-retriever/similar-queries -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "query_id": "generated-id",
  "similar_queries": [
    {
      "query_id": "existing-id-1",
      "query_text": "What is the project duration?",
      "similarity_score": 0.92,
      "category": "Timeline",
      "rfp_number": "RFP-2024-NH-001",
      "response": "Project duration is 24 months..."
    },
    {
      "query_id": "existing-id-2",
      "query_text": "What is the implementation timeline?",
      "similarity_score": 0.88,
      "category": "Schedule",
      "rfp_number": "RFP-2024-NH-002",
      "response": "Implementation will be completed in phases..."
    }
  ],
  "total_found": 2
}
```

---

### Test 9: Get Query by ID

**Command:**
```powershell
# Get specific query
curl http://localhost:8000/api/history-retriever/query/existing-id-1

# PowerShell
Invoke-RestMethod -Uri http://localhost:8000/api/history-retriever/query/existing-id-1
```

**Expected Response:**
```json
{
  "success": true,
  "query": {
    "query_id": "existing-id-1",
    "query_text": "What is the project duration?",
    "category": "Timeline",
    "rfp_number": "RFP-2024-NH-001",
    "response": "Project duration is 24 months...",
    "submitted_at": "2024-12-15T10:30:00Z",
    "metadata": {
      "vendor_name": "ABC Construction",
      "priority": "high"
    }
  }
}
```

---

## Testing Screen 8 - Chief Engineer Service

### Test 10: Store New Query

**Command:**
```powershell
$body = @{
    query_id = "test-query-123"
    query_text = "What are the safety requirements?"
    category = "Safety"
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
  "processing_time": 1.234
}
```

---

### Test 11: Retrieve Stored Query

**Command:**
```powershell
# Get query from ChromaDB
curl http://localhost:8001/api/chief-engineer/query/test-query-123

# PowerShell
Invoke-RestMethod -Uri http://localhost:8001/api/chief-engineer/query/test-query-123
```

**Expected Response:**
```json
{
  "success": true,
  "query": {
    "query_id": "test-query-123",
    "query_text": "What are the safety requirements?",
    "category": "Safety",
    "rfp_number": "RFP-2026-TEST-001",
    "embedding_vector": [0.123, 0.456, ...],
    "metadata": {
      "submitted_by": "vendor-123",
      "submitted_at": "2026-01-26T10:00:00Z",
      "priority": "high"
    }
  }
}
```

---

## Admin Panel Testing

### Test 12: Vectorization Admin Dashboard

**Access Dashboard:**
```powershell
# Open Swagger UI
start http://localhost:3001/api/docs

# Navigate to "Admin - Vectorization" section
```

**Test Endpoints:**

**1. Get Statistics**
```powershell
GET http://localhost:3001/api/admin/vectorization/stats
```
**Response:**
```json
{
  "total_queries": 100,
  "vectorized": 85,
  "unvectorized": 15,
  "failed": 0,
  "vectorization_rate": 85.0
}
```

**2. Get Pending Queries**
```powershell
GET http://localhost:3001/api/admin/vectorization/queries/pending?limit=10
```
**Response:**
```json
{
  "queries": [
    {
      "query_id": "pending-id-1",
      "query_text": "Sample query text",
      "vectorized": false,
      "submitted_at": "2026-01-25T10:00:00Z"
    }
  ],
  "total": 15
}
```

**3. Get Vectorization Logs**
```powershell
GET http://localhost:3001/api/admin/vectorization/logs?limit=20
```
**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "query_id": "query-id-1",
      "status": "success",
      "duration_ms": 2345,
      "created_at": "2026-01-26T00:15:00Z"
    }
  ],
  "total": 100
}
```

**4. Pause Vectorization Job**
```powershell
POST http://localhost:3001/api/admin/vectorization/job/pause
```
**Response:**
```json
{
  "success": true,
  "message": "Vectorization job paused"
}
```

**5. Resume Vectorization Job**
```powershell
POST http://localhost:3001/api/admin/vectorization/job/resume
```
**Response:**
```json
{
  "success": true,
  "message": "Vectorization job resumed"
}
```

**6. Run Job Immediately**
```powershell
POST http://localhost:3001/api/admin/vectorization/job/run-now
```
**Response:**
```json
{
  "success": true,
  "message": "Vectorization job triggered",
  "queries_processed": 15
}
```

---

## Troubleshooting Commands

### Issue 1: Service Won't Start - Port Already in Use

**Check Port Usage:**
```powershell
# Check specific port
netstat -ano | findstr :3001

# Check all NHAI ports
netstat -ano | findstr ":3000 :3001 :5432 :6379 :8000 :8001 :8005 :11434"
```

**Kill Process on Port:**
```powershell
# Get PID from netstat output
netstat -ano | findstr :3001
# Output: TCP 0.0.0.0:3001  LISTENING  12345

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
psql -U postgres -c "\l" | findstr nhai_tender_db
```

---

### Issue 4: Document Upload Fails with 500 Error

**Diagnostic Steps:**
```powershell
# 1. Check Redis is running
netstat -ano | findstr :6379

# 2. Check Python service is running
netstat -ano | findstr :8005

# 3. Test Python service directly
curl http://localhost:8005/api/stats

# 4. Check backend logs for Bull queue errors
# Look for "MaxRetriesPerRequestError"

# 5. Check Python logs for processing errors
# Look for "pypdf package not found" or "File path ... is not a valid file"
```

---

### Issue 5: Zero Chunks Processed

**Check Python Logs:**
```
# Look for these lines in Python terminal:
Extracted X characters
Split into 0 chunks
```

**Causes:**
- Document has < 1000 characters (minimum chunk size)
- Document is scanned image (needs OCR)
- Text extraction failed

**Test Document:**
```powershell
# Use known working document
# Upload docs/NHAI_AI.pdf which has been tested and works
```

---

### Issue 6: Vectorization Job Fails

**Check Screen 8 Service:**
```powershell
# Check if Screen 8 is running
netstat -ano | findstr :8001

# Test Screen 8 health
curl http://localhost:8001/health

# Check backend logs for error messages
# Look for "Cannot connect to Screen 8 API"
```

---

## Complete System Test Script

**Save as:** `test-all-services.ps1`

```powershell
# NHAI System Health Check Script

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "NHAI System Health Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check all ports
Write-Host "[1/8] Checking Ports..." -ForegroundColor Yellow
$ports = @{
    "PostgreSQL" = 5432
    "Redis" = 6379
    "Backend" = 3001
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
    }
}

Write-Host ""

# Test 2: Backend Health
Write-Host "[2/8] Testing Backend..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 5
    Write-Host "  ✓ Backend Health: OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend Health: FAILED" -ForegroundColor Red
}

Write-Host ""

# Test 3: Historical Data Service
Write-Host "[3/8] Testing Historical Data Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8005/api/stats" -TimeoutSec 5
    Write-Host "  ✓ Historical Data Service: OK" -ForegroundColor Green
    Write-Host "    Total Documents: $($response.statistics.total_documents)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ Historical Data Service: FAILED" -ForegroundColor Red
}

Write-Host ""

# Test 4: Screen 7
Write-Host "[4/8] Testing Screen 7..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 5
    Write-Host "  ✓ Screen 7 (History Retriever): OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Screen 7 (History Retriever): FAILED" -ForegroundColor Red
}

Write-Host ""

# Test 5: Screen 8
Write-Host "[5/8] Testing Screen 8..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 5
    Write-Host "  ✓ Screen 8 (Chief Engineer): OK" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Screen 8 (Chief Engineer): FAILED" -ForegroundColor Red
}

Write-Host ""

# Test 6: Redis
Write-Host "[6/8] Testing Redis..." -ForegroundColor Yellow
try {
    $result = docker exec redis redis-cli ping
    if ($result -eq "PONG") {
        Write-Host "  ✓ Redis: OK" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Redis: FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Redis: FAILED (Docker or Redis not running)" -ForegroundColor Red
}

Write-Host ""

# Test 7: Ollama
Write-Host "[7/8] Testing Ollama..." -ForegroundColor Yellow
try {
    $models = ollama list
    if ($models -match "nomic-embed-text") {
        Write-Host "  ✓ Ollama: OK (nomic-embed-text available)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Ollama: Model nomic-embed-text NOT FOUND" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Ollama: FAILED" -ForegroundColor Red
}

Write-Host ""

# Test 8: PostgreSQL
Write-Host "[8/8] Testing PostgreSQL..." -ForegroundColor Yellow
try {
    $result = psql -U postgres -h localhost -p 5432 -c "\l" 2>&1 | Select-String "nhai_tender_db"
    if ($result) {
        Write-Host "  ✓ PostgreSQL: OK (nhai_tender_db exists)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ PostgreSQL: Database nhai_tender_db NOT FOUND" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ PostgreSQL: FAILED (Cannot connect)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Health Check Complete" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
```

**Run Health Check:**
```powershell
powershell -ExecutionPolicy Bypass -File test-all-services.ps1
```

---

## Quick Start Script

**Save as:** `start-all-services.ps1`

```powershell
# NHAI System - Start All Services

Write-Host "Starting NHAI Tender Automation System..." -ForegroundColor Cyan

# 1. Start Redis
Write-Host "[1/6] Starting Redis..." -ForegroundColor Yellow
docker start redis
Start-Sleep -Seconds 2

# 2. Start Backend
Write-Host "[2/6] Starting Backend (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev"
Start-Sleep -Seconds 10

# 3. Start Historical Data Service
Write-Host "[3/6] Starting Historical Data Service (Port 8005)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\historical-data-service; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# 4. Start Screen 7
Write-Host "[4/6] Starting Screen 7 (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\screen07-history-retriever; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# 5. Start Screen 8
Write-Host "[5/6] Starting Screen 8 (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python-rag\screen08-chief-engineer; d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py"
Start-Sleep -Seconds 5

# 6. Open Swagger UI
Write-Host "[6/6] Opening Swagger UI..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3001/api/docs"

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host "Swagger UI: http://localhost:3001/api/docs" -ForegroundColor Cyan
```

**Run Start Script:**
```powershell
powershell -ExecutionPolicy Bypass -File start-all-services.ps1
```

---

## Summary

**Service URLs:**
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api/docs
- Historical Data: http://localhost:8005
- Screen 7: http://localhost:8000
- Screen 8: http://localhost:8001
- Frontend: http://localhost:3000

**Critical Dependencies:**
1. PostgreSQL must be running first
2. Redis must be running before backend
3. Ollama must be running for embeddings
4. Backend must start before Python services (for database access)

**Common Issues:**
- Port conflicts → Use `netstat` and `taskkill`
- Redis not running → `docker start redis`
- Database not found → Check PostgreSQL service
- Upload fails → Check Redis connection
- Zero chunks → Document too small or scanned image

---

*Last Updated: January 26, 2026*  
*Version: 2.0*
