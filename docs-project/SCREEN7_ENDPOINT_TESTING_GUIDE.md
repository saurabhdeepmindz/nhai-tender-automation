# Screen 7 - History Retriever Agent Endpoint Testing Guide

## 🔧 Important: HTTP Methods

Screen 7 has several endpoints that require **specific HTTP methods** (POST, PUT, DELETE) and cannot be tested by simply opening URLs in a browser.

### Common Issue: "Method Not Allowed"

**Problem:** Accessing POST/PUT/DELETE endpoints with GET requests (browser URL)

**Solution:** Use proper HTTP methods with tools like curl, Postman, or PowerShell

---

## 📋 Endpoint Overview

### GET Endpoints (Browser-friendly) ✅

These can be opened directly in your browser:

| Endpoint | URL | Description |
|----------|-----|-------------|
| Service Info | http://localhost:8000 | Service information |
| Health Check | http://localhost:8000/api/health | Health status |
| API Docs | http://localhost:8000/docs | Swagger UI |
| ReDoc | http://localhost:8000/redoc | Alternative docs |
| OpenAPI JSON | http://localhost:8000/openapi.json | API specification |
| Statistics | http://localhost:8000/api/statistics | Collection statistics |
| Get Config | http://localhost:8000/api/rag/config | Current configuration |
| Transactions | http://localhost:8000/api/rag/transactions | Processing transactions |

### POST/PUT/DELETE Endpoints (Require Tools) ⚠️

These **CANNOT** be opened in a browser - they require specific HTTP methods:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/ingest` | **POST** | Upload and ingest documents |
| `/api/rag/search` | **POST** | Search historical data |
| `/api/rag/config` | **PUT** | Update configuration |
| `/api/rag/documents/{id}` | **DELETE** | Delete document |
| `/api/rag/reprocess/{id}` | **POST** | Reprocess document |

---

## ✅ Working GET Endpoints (No Special Tools Required)

### 1. Service Info

**PowerShell:**
```powershell
curl.exe http://localhost:8000
```

**Response:**
```json
{
    "service": "NHAI History Retriever Agent",
    "version": "1.0.0",
    "status": "running",
    "port": "8000"
}
```

---

### 2. Health Check

**PowerShell:**
```powershell
curl.exe http://localhost:8000/api/health
```

**Response:**
```json
{
    "status": "healthy",
    "service": "History Retriever Agent",
    "version": "1.0.0",
    "timestamp": "2026-01-23T00:00:00.000000",
    "vector_store": "chromadb",
    "embedding_provider": "ollama",
    "llm_provider": "ollama"
}
```

---

### 3. Statistics

**PowerShell:**
```powershell
curl.exe http://localhost:8000/api/statistics
```

**Response:**
```json
{
    "total_documents": 0,
    "total_chunks": 0,
    "collections": ["nhai_historical_data"],
    "embedding_model": "nomic-embed-text",
    "llm_model": "gemma:2b"
}
```

---

### 4. Get RAG Configuration

**PowerShell:**
```powershell
curl.exe http://localhost:8000/api/rag/config
```

**Response:**
```json
{
    "chunk_size": 500,
    "chunk_overlap": 50,
    "embedding_model": "nomic-embed-text",
    "llm_model": "gemma:2b",
    "collection_name": "nhai_historical_data",
    "top_k": 5
}
```

---

### 5. Get Transactions

**PowerShell:**
```powershell
curl.exe http://localhost:8000/api/rag/transactions
```

**Response:**
```json
{
    "transactions": [],
    "total": 0
}
```

---

## 📝 POST/PUT/DELETE Endpoints (Require JSON/Form Data)

### 1. Ingest Documents (POST) - Multipart/Form-Data

**Endpoint:** `http://localhost:8000/api/rag/ingest`

**Method:** POST (Requires file upload)

**PowerShell Example:**
```powershell
# Ingest a single document
curl.exe -X POST http://localhost:8000/api/rag/ingest `
    -F "file=@C:\path\to\document.pdf" `
    -F "title=Historical Tender Document" `
    -F "metadata={\"year\":\"2024\",\"project\":\"NH-44\"}"
```

**Curl (Windows CMD):**
```cmd
curl -X POST http://localhost:8000/api/rag/ingest ^
    -F "file=@C:\path\to\document.pdf" ^
    -F "title=Historical Tender Document" ^
    -F "metadata={\"year\":\"2024\",\"project\":\"NH-44\"}"
```

**Request Parameters:**
- `file` (required): PDF or text file
- `title` (optional): Document title
- `metadata` (optional): JSON metadata

**Expected Response:**
```json
{
    "success": true,
    "document_id": "doc-123-abc",
    "chunks_created": 45,
    "message": "Document ingested successfully",
    "processing_time": 3.24
}
```

---

### 2. Search Historical Data (POST) - JSON Body

**Endpoint:** `http://localhost:8000/api/rag/search`

**Method:** POST (Requires JSON body)

**PowerShell Example:**
```powershell
$body = @{
    query = "What is the approved rate for bituminous concrete in previous tenders?"
    top_k = 5
    min_score = 0.7
} | ConvertTo-Json

curl.exe -X POST http://localhost:8000/api/rag/search `
    -H "Content-Type: application/json" `
    -d $body
```

**Curl (Windows CMD):**
```cmd
curl -X POST http://localhost:8000/api/rag/search ^
    -H "Content-Type: application/json" ^
    -d "{\"query\":\"What is the approved rate for bituminous concrete?\",\"top_k\":5,\"min_score\":0.7}"
```

**Request Body Schema:**
```json
{
    "query": "string (required)",
    "top_k": "integer (default: 5)",
    "min_score": "float (default: 0.7)",
    "filter_metadata": "object (optional)"
}
```

**Expected Response:**
```json
{
    "success": true,
    "query": "What is the approved rate...",
    "results": [
        {
            "document_id": "doc-123",
            "title": "NH-44 Tender 2023",
            "content": "The approved rate for bituminous concrete...",
            "similarity_score": 0.92,
            "metadata": {
                "year": "2023",
                "project": "NH-44"
            }
        }
    ],
    "execution_time": 0.45
}
```

---

### 3. Update RAG Configuration (PUT) - JSON Body

**Endpoint:** `http://localhost:8000/api/rag/config`

**Method:** PUT (Requires JSON body)

**PowerShell Example:**
```powershell
$body = @{
    chunk_size = 600
    chunk_overlap = 100
    top_k = 10
} | ConvertTo-Json

curl.exe -X PUT http://localhost:8000/api/rag/config `
    -H "Content-Type: application/json" `
    -d $body
```

**Curl (Windows CMD):**
```cmd
curl -X PUT http://localhost:8000/api/rag/config ^
    -H "Content-Type: application/json" ^
    -d "{\"chunk_size\":600,\"chunk_overlap\":100,\"top_k\":10}"
```

**Request Body Schema:**
```json
{
    "chunk_size": "integer (optional)",
    "chunk_overlap": "integer (optional)",
    "embedding_model": "string (optional)",
    "llm_model": "string (optional)",
    "top_k": "integer (optional)"
}
```

**Expected Response:**
```json
{
    "chunk_size": 600,
    "chunk_overlap": 100,
    "embedding_model": "nomic-embed-text",
    "llm_model": "gemma:2b",
    "collection_name": "nhai_historical_data",
    "top_k": 10
}
```

---

### 4. Delete Document (DELETE)

**Endpoint:** `http://localhost:8000/api/rag/documents/{document_id}`

**Method:** DELETE

**PowerShell Example:**
```powershell
curl.exe -X DELETE http://localhost:8000/api/rag/documents/doc-123-abc
```

**Curl (Windows CMD):**
```cmd
curl -X DELETE http://localhost:8000/api/rag/documents/doc-123-abc
```

**Expected Response:**
```json
{
    "success": true,
    "message": "Document deleted successfully",
    "document_id": "doc-123-abc"
}
```

---

### 5. Reprocess Document (POST)

**Endpoint:** `http://localhost:8000/api/rag/reprocess/{document_id}`

**Method:** POST

**PowerShell Example:**
```powershell
curl.exe -X POST http://localhost:8000/api/rag/reprocess/doc-123-abc
```

**Curl (Windows CMD):**
```cmd
curl -X POST http://localhost:8000/api/rag/reprocess/doc-123-abc
```

**Expected Response:**
```json
{
    "success": true,
    "message": "Document reprocessed successfully",
    "document_id": "doc-123-abc",
    "chunks_created": 45
}
```

---

## 🧪 Testing Scripts

### PowerShell Test Script

Save as `test-screen7-endpoints.ps1`:

```powershell
Write-Host "`n=== Screen 7 Endpoint Testing ===" -ForegroundColor Cyan

# Test 1: Service Info (GET)
Write-Host "`n1. Testing / (GET)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000" -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor Gray
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Health Check (GET)
Write-Host "`n2. Testing /api/health (GET)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host "   Vector Store: $($response.vector_store)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Statistics (GET)
Write-Host "`n3. Testing /api/statistics (GET)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/statistics" -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Total Documents: $($response.total_documents)" -ForegroundColor Gray
    Write-Host "   Total Chunks: $($response.total_chunks)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Config (GET)
Write-Host "`n4. Testing /api/rag/config (GET)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/rag/config" -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Chunk Size: $($response.chunk_size)" -ForegroundColor Gray
    Write-Host "   Embedding Model: $($response.embedding_model)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Search (POST) - Requires JSON body
Write-Host "`n5. Testing /api/rag/search (POST)..." -ForegroundColor Yellow
try {
    $body = @{
        query = "What is the standard for road construction?"
        top_k = 3
        min_score = 0.6
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/rag/search" `
        -Method Post `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json)
    
    Write-Host "✅ SUCCESS - Found $($response.results.Count) results" -ForegroundColor Green
    $response.results | ForEach-Object {
        Write-Host "   - Score: $($_.similarity_score) - $($_.title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Transactions (GET)
Write-Host "`n6. Testing /api/rag/transactions (GET)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/rag/transactions" -Method Get
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "   Total Transactions: $($response.total)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
```

**Run:** `powershell .\test-screen7-endpoints.ps1`

---

## 📚 API Documentation

For complete API documentation with interactive testing:

**Swagger UI:** http://localhost:8000/docs

**ReDoc:** http://localhost:8000/redoc

---

## 🔍 Summary

### Key Points:

1. ✅ **GET Endpoints** - Can be tested in browser:
   - `/` - Service info
   - `/api/health` - Health check
   - `/api/statistics` - Statistics
   - `/api/rag/config` - Get configuration
   - `/api/rag/transactions` - Get transactions

2. ⚠️ **POST Endpoints** - Require tools (curl, Postman, PowerShell):
   - `/api/rag/ingest` - Upload documents (multipart/form-data)
   - `/api/rag/search` - Search historical data (JSON body)
   - `/api/rag/reprocess/{id}` - Reprocess document

3. ⚠️ **PUT Endpoints** - Require tools:
   - `/api/rag/config` - Update configuration (JSON body)

4. ⚠️ **DELETE Endpoints** - Require tools:
   - `/api/rag/documents/{id}` - Delete document

### Common Mistakes:

❌ Opening POST endpoints in browser → "Method Not Allowed"
❌ Not sending JSON body for POST/PUT → 422 Validation Error
❌ Not using multipart/form-data for file upload → 400 Bad Request

✅ Use appropriate HTTP methods with proper tools
✅ Check API documentation at http://localhost:8000/docs
✅ Always include Content-Type header for JSON requests

### All Endpoints Properly Documented! 🎉
