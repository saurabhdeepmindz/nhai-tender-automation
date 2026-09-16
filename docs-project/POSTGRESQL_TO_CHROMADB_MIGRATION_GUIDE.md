# 📋 PostgreSQL to ChromaDB Data Migration Guide

**NHAI Tender Query Automation System**  
**Complete Step-by-Step Migration Process**

---

## 🎯 Overview

This guide explains how to migrate query data from PostgreSQL to ChromaDB using the automatic vectorization system.

### **Migration Flow:**
```
PostgreSQL (queries table)
    ↓ [QueryVectorizationJob - Every 5 minutes]
    ↓ [VectorizationService]
    ↓ [HTTP POST to Screen 8]
    ↓ [Generate Embeddings]
    ↓ [Store in ChromaDB]
    ✓ [Update PostgreSQL: vectorized=true]
```

---

## ✅ Prerequisites

Before starting migration, ensure:

1. ✅ **PostgreSQL** is running with `nhai_tender_db` database
2. ✅ **Ollama** is installed and running (port 11434)
3. ✅ **Ollama models** are downloaded:
   - `nomic-embed-text` (for embeddings)
   - `gemma3:1b` (for LLM)
4. ✅ **Node.js** and **npm** are installed
5. ✅ **Python 3.11** with `nhai-venv` virtual environment

---

## 🚀 Step 1: Start All Services

### **1.1 Start Ollama (If Not Running)**

```powershell
# Check if Ollama is running
ollama list

# If you see models listed, Ollama is running ✓
# If not, Ollama should start automatically (Windows service)

# Verify required models are downloaded
ollama list | Select-String "nomic-embed-text"
ollama list | Select-String "gemma3"

# If missing, download them:
ollama pull nomic-embed-text
ollama pull gemma3:1b
```

### **1.2 Start Screen 7 (History Retriever)**

**Terminal 1:**
```powershell
cd "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V100\bat-files-projectstructure\NHAI-Tender-Automation\python-rag\screen07-history-retriever"

# Start Screen 7
..\..\nhai-venv\Scripts\python.exe main.py
```

**Expected Output:**
```
INFO:__main__:NHAI History Retriever Agent - Screen 7
INFO:__main__:✓ Embedding generator initialized: ollama/nomic-embed-text
INFO:__main__:✓ LLM manager initialized: ollama/gemma3:1b
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### **1.3 Start Screen 8 (Chief Engineer Agent)**

**Terminal 2:**
```powershell
cd "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V100\bat-files-projectstructure\NHAI-Tender-Automation\python-rag\screen08-chief-engineer"

# Start Screen 8
..\..\nhai-venv\Scripts\python.exe main.py
```

**Expected Output:**
```
INFO:__main__:NHAI Chief Engineer Agent - Screen 8
INFO:__main__:✓ Embedding generator initialized: ollama/nomic-embed-text
INFO:__main__:✓ LLM manager initialized: ollama/gemma3:1b
INFO:__main__:✓ Chief Engineer Agent initialized
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### **1.4 Start Backend (NestJS)**

**Terminal 3:**
```powershell
cd "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V100\bat-files-projectstructure\NHAI-Tender-Automation\backend"

# Start backend in development mode
npm run start:dev
```

**Expected Output:**
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG [RouterExplorer] Mapped {/api, GET} route
[Nest] LOG [RouterExplorer] Mapped {/api/vectorization/*, POST} route
[Nest] LOG Application is running on: http://localhost:3000
```

### **1.5 Verify All Services Are Running**

Run this command to check:
```powershell
# Check Backend
Invoke-WebRequest http://localhost:3000/api/health

# Check Screen 7
Invoke-WebRequest http://localhost:8000/api/health

# Check Screen 8
Invoke-WebRequest http://localhost:8001/api/health

# Check Ollama
Invoke-WebRequest http://localhost:11434/api/version
```

---

## 🔄 Step 2: Automatic Migration (Recommended)

### **How It Works:**

The **QueryVectorizationJob** runs automatically every **5 minutes** and:

1. 🔍 **Finds** queries with `vectorized = false` in PostgreSQL
2. 📊 **Batch processes** up to 10 queries at a time
3. 🚀 **Sends** each query to Screen 8 via API
4. 🧮 **Generates** embeddings using Ollama
5. 💾 **Stores** embeddings in ChromaDB
6. ✅ **Updates** PostgreSQL: `vectorized = true`, `vector_stored_at = now()`

### **Monitor the Automatic Process:**

Watch the backend console logs:

```
[QueryVectorizationJob] Starting query vectorization job...
[QueryVectorizationJob] Found 3 queries to vectorize
[VectorizationService] Vectorizing query: abc-123-def-456...
[VectorizationService] Query abc-123-def-456 successfully vectorized
[QueryVectorizationJob] Query vectorization job completed
```

### **Configuration:**

Check your `.env` file:
```bash
# backend/.env
VECTORIZATION_ENABLED=true
VECTORIZATION_BATCH_SIZE=10
VECTORIZATION_TIMEOUT=30000
VECTORIZATION_MAX_RETRIES=3
SCREEN8_URL=http://localhost:8001
```

---

## ⚡ Step 3: Manual Migration (For Testing)

### **Option A: Use PowerShell Test Script**

We've created a comprehensive testing script:

```powershell
# Navigate to project root
cd "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V100\bat-files-projectstructure\NHAI-Tender-Automation"

# Run the test script
.\MIGRATION_TESTING_SCRIPT.ps1
```

This script will:
- ✅ Check all service statuses
- ✅ Create a test query
- ✅ Send it to Screen 8 for vectorization
- ✅ Verify it's stored in ChromaDB
- ✅ Show results and next steps

### **Option B: Manual API Test**

**Test Screen 8 directly:**

```powershell
$body = @{
    query_id = "test-query-001"
    query_text = "What is the minimum experience required for contractors?"
    category = "Technical"
    rfp_number = "RFP-2024-NH-001"
    metadata = @{
        submitted_by = "vendor@example.com"
        submitted_at = (Get-Date -Format "o")
        priority = "normal"
        rfp_title = "Highway Construction Project"
        project_name = "NH-44 Expansion"
    }
} | ConvertTo-Json -Depth 3

$response = Invoke-WebRequest `
    -Uri "http://localhost:8001/api/chief-engineer/store-query" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$response.Content | ConvertFrom-Json
```

**Expected Response:**
```json
{
  "success": true,
  "query_id": "test-query-001",
  "message": "Query stored in vector database",
  "embedding_dimension": 384,
  "processing_time": 0.523
}
```

### **Option C: Trigger Admin Endpoint**

If you want to trigger vectorization immediately for all pending queries:

```powershell
# Trigger manual vectorization (admin endpoint)
Invoke-WebRequest `
    -Uri "http://localhost:3000/api/admin/vectorization/trigger" `
    -Method POST
```

---

## 🔍 Step 4: Verify Migration

### **4.1 Check PostgreSQL**

```sql
-- Check queries table
SELECT 
    query_id,
    query_text,
    vectorized,
    vector_stored_at,
    status,
    submitted_at
FROM queries
WHERE vectorized = true
ORDER BY vector_stored_at DESC;

-- Count vectorized vs non-vectorized
SELECT 
    vectorized,
    COUNT(*) as count
FROM queries
GROUP BY vectorized;
```

### **4.2 Check ChromaDB Files**

```powershell
# Navigate to ChromaDB directory
cd "python-rag\screen08-chief-engineer"

# Check if chroma_db directory exists and has data
Get-ChildItem -Path ".\chroma_db" -Recurse | Select-Object FullName, Length
```

**Expected Structure:**
```
chroma_db/
  ├── chroma.sqlite3  (SQLite database with metadata)
  └── [UUID]/         (Collection data)
      └── data/       (Vector embeddings)
```

### **4.3 Check Backend Logs**

Watch for these log entries:

```
✅ Success Logs:
[QueryVectorizationJob] Starting query vectorization job...
[QueryVectorizationJob] Found 5 queries to vectorize
[VectorizationService] Vectorizing query: abc-123...
[VectorizationService] Query abc-123 successfully vectorized

❌ Error Logs (if any):
[VectorizationService] Failed to vectorize query abc-123: Connection refused
[VectorizationService] Retry attempt 1/3 for query abc-123
```

### **4.4 Test Query via Swagger UI**

1. Open http://localhost:8001/docs
2. Find `POST /api/chief-engineer/store-query`
3. Click "Try it out"
4. Fill in sample data
5. Execute and check response

---

## 📊 Step 5: Monitor Migration Progress

### **5.1 Real-Time Monitoring**

**Watch Backend Logs:**
```powershell
# Watch logs in the backend terminal
# Every 5 minutes you should see:
[QueryVectorizationJob] Starting query vectorization job...
```

**Check Vectorization Stats:**
```powershell
# Query PostgreSQL for stats
# Total queries: 
SELECT COUNT(*) FROM queries;

# Vectorized queries:
SELECT COUNT(*) FROM queries WHERE vectorized = true;

# Pending queries:
SELECT COUNT(*) FROM queries WHERE vectorized = false;
```

### **5.2 Performance Metrics**

**Expected Performance:**
- **Processing Time per Query:** ~0.5-2 seconds
- **Batch Size:** 10 queries per run
- **Frequency:** Every 5 minutes
- **Throughput:** ~120 queries per hour

**Logs Example:**
```
[VectorizationService] Query abc-123 successfully vectorized
  ├─ Embedding Dimension: 384
  ├─ Processing Time: 0.823s
  └─ ChromaDB Collection: nhai_queries
```

---

## 🐛 Troubleshooting

### **Issue 1: Screen 8 Connection Refused**

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:8001
```

**Solution:**
```powershell
# Check if Screen 8 is running
Test-NetConnection localhost -Port 8001

# If not running, start it:
cd python-rag\screen08-chief-engineer
..\..\nhai-venv\Scripts\python.exe main.py
```

### **Issue 2: Ollama Not Responding**

**Symptom:**
```
ERROR: Failed to generate embedding: Ollama not reachable
```

**Solution:**
```powershell
# Check Ollama
ollama list

# Restart Ollama service
ollama serve

# Verify models
ollama pull nomic-embed-text
```

### **Issue 3: No Queries Being Vectorized**

**Symptom:**
```
[QueryVectorizationJob] No unvectorized queries found
```

**Possible Causes:**
1. No queries in database with `vectorized = false`
2. All queries already vectorized
3. Queries have wrong status (`closed` instead of `pending`)

**Solution:**
```sql
-- Check query status
SELECT status, vectorized, COUNT(*)
FROM queries
GROUP BY status, vectorized;

-- Reset a query for testing
UPDATE queries
SET vectorized = false, vector_stored_at = NULL
WHERE query_id = 'your-query-id';
```

### **Issue 4: Backend Not Starting**

**Symptom:**
```
Error: Cannot find module '@nestjs/schedule'
```

**Solution:**
```powershell
cd backend
npm install
npm run start:dev
```

### **Issue 5: ChromaDB Permission Error**

**Symptom:**
```
PermissionError: [Errno 13] Permission denied: './chroma_db'
```

**Solution:**
```powershell
# Ensure directory exists and has write permissions
cd python-rag\screen08-chief-engineer
New-Item -ItemType Directory -Force -Path "chroma_db"
```

---

## ✅ Success Indicators

### **Migration is Working When:**

1. ✅ **Backend logs show:**
   ```
   [QueryVectorizationJob] Starting query vectorization job...
   [QueryVectorizationJob] Found 3 queries to vectorize
   [VectorizationService] Query abc-123 successfully vectorized
   ```

2. ✅ **Screen 8 logs show:**
   ```
   INFO:__main__:Storing query abc-123 in vector database
   INFO:__main__:✅ Query abc-123 stored successfully
   ```

3. ✅ **PostgreSQL shows:**
   ```sql
   SELECT vectorized, COUNT(*) FROM queries GROUP BY vectorized;
   -- vectorized | count
   -- true       | 45
   -- false      | 5
   ```

4. ✅ **ChromaDB directory has files:**
   ```
   chroma_db/chroma.sqlite3 (size > 0 KB)
   ```

5. ✅ **Health checks pass:**
   ```powershell
   Invoke-WebRequest http://localhost:8001/api/health
   # Returns 200 OK with provider info
   ```

---

## 📈 Next Steps

### **After Successful Migration:**

1. **Monitor Performance**
   - Watch processing times
   - Check error rates
   - Monitor ChromaDB size

2. **Adjust Configuration** (if needed)
   ```bash
   # backend/.env
   VECTORIZATION_BATCH_SIZE=20  # Increase for faster processing
   VECTORIZATION_CRON=*/2 * * * *  # Run every 2 minutes instead of 5
   ```

3. **Set Up Production**
   - Use persistent ChromaDB storage
   - Add database backups
   - Set up monitoring alerts
   - Configure retry logic

4. **Test Query Processing**
   - Use Screen 8's `/api/chief-engineer/process` endpoint
   - Verify similar query search works
   - Test AI response generation

---

## 🔗 Useful Resources

### **API Documentation:**
- Backend Swagger: http://localhost:3000/api/docs
- Screen 8 Swagger: http://localhost:8001/docs
- Screen 7 Swagger: http://localhost:8000/docs

### **Health Endpoints:**
- Backend: http://localhost:3000/api/health
- Screen 7: http://localhost:8000/api/health
- Screen 8: http://localhost:8001/api/health
- Ollama: http://localhost:11434/api/version

### **Configuration Files:**
- Backend: `backend/.env`
- Screen 7: `python-rag/screen07-history-retriever/.env`
- Screen 8: `python-rag/screen08-chief-engineer/.env`

### **Logs Location:**
- Backend: Console output
- Screen 7: Console output
- Screen 8: Console output
- Vectorization: Backend console under `[QueryVectorizationJob]`

---

## 📝 Summary

### **Migration Process:**
1. ✅ Start all 4 services (Ollama, Screen 7, Screen 8, Backend)
2. ✅ Backend automatically runs QueryVectorizationJob every 5 minutes
3. ✅ Job finds unvectorized queries and sends to Screen 8
4. ✅ Screen 8 generates embeddings and stores in ChromaDB
5. ✅ PostgreSQL updated with `vectorized = true`

### **Key Points:**
- 🔄 **Automatic**: No manual intervention needed
- ⏰ **Scheduled**: Runs every 5 minutes
- 📦 **Batch**: Processes 10 queries per run
- 🔁 **Retry**: Up to 3 retries on failure
- 📊 **Trackable**: Full logging and monitoring

### **Timeline:**
- **Initial Setup**: 10-15 minutes
- **First Migration**: Immediate (manual test) or 5 minutes (automatic)
- **Ongoing**: Continuous every 5 minutes

---

**Last Updated:** January 21, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅
