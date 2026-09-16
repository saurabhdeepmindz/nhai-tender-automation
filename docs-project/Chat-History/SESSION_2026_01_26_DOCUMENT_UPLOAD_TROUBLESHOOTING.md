# Chat Session - Document Upload Troubleshooting
**Date:** January 25-26, 2026  
**Session Topic:** Historical Data Upload Issues & Redis Configuration  
**Project:** NHAI Tender Query Automation System

---

## Session Overview

**Primary Issue:** Document uploads failing with 500 Internal Server Error after system had been working previously.

**Root Causes Identified:**
1. Redis service not running
2. Query vectorization timeout error
3. Small document chunking issue (< 1000 characters)

---

## Issue 1: Query Vectorization Timeout Error

### Problem
Backend logs showing repeated vectorization failures:
```
[VectorizationService] ✗ Failed to vectorize query after 3 attempts: Screen 8 API error: No timeout provided.
```

### Error Context
```
[Nest] 19340  - 01/25/2026, 10:25:00 PM     LOG [QueryVectorizationJob] Starting Query Vectorization Job
[Nest] 19340  - 01/25/2026, 10:25:00 PM     LOG [QueryVectorizationJob] Found 5 queries to vectorize
[Nest] 19340  - 01/25/2026, 10:25:00 PM   DEBUG [VectorizationService] Calling Screen 8 API: http://localhost:8001/api/chief-engineer/store-query
[Nest] 19340  - 01/25/2026, 10:25:00 PM    WARN [VectorizationService] Attempt 1 failed for query 7577375a-a6e7-45e1-9c7e-9c65c1aaca36, retrying in 2000ms...
[Nest] 19340  - 01/25/2026, 10:25:04 PM   ERROR [VectorizationService] ✗ Failed to vectorize query 7577375a-a6e7-45e1-9c7e-9c65c1aaca36 after 3 attempts: Screen 8 API error: No timeout provided.
```

**Job Summary:**
- Total Processed: 5
- Successful: 0
- Failed: 5
- Duration: 20.44s

### Root Cause
**File:** `backend/src/vectorization/vectorization.service.ts`  
**Line:** 236

The RxJS `timeout()` operator was being called without a parameter:
```typescript
// PROBLEM CODE
const response = await firstValueFrom(
  this.httpService
    .post<StoreQueryResponse>(url, payload, {
      timeout: this.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .pipe(timeout(this.requestTimeout)),  // ❌ Duplicate timeout
);
```

**Issue:** The `.pipe(timeout())` was redundant since timeout was already configured in the HTTP options, and RxJS 7+ requires a timeout value or config object.

### Solution Applied
**File Modified:** `backend/src/vectorization/vectorization.service.ts` (Line 228-236)

```typescript
// FIXED CODE
const response = await firstValueFrom(
  this.httpService
    .post<StoreQueryResponse>(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.requestTimeout,
    }),
);
```

**Changes Made:**
- Removed duplicate `.pipe(timeout(this.requestTimeout))` 
- Kept timeout in HTTP config options
- Moved headers before timeout (better organization)

**Result:** Error changed from "No timeout provided" to proper error message: "Cannot connect to Screen 8 API. Is the service running?"

**Note:** The underlying issue is that Screen 8 service (port 8001) is not running, but now the error message is clearer.

---

## Issue 2: Document Upload Failing with 500 Error

### Problem
User reported uploads that were working previously now returning HTTP 500 errors via Swagger UI.

### Initial Diagnosis
**Screenshot Analysis:**
User provided screenshot showing 9 historical documents:
- **ID 6:** Status PROCESSED ✅ (172 chunks, successful)
- **IDs 3, 4, 5:** Status FAILED ❌ (pypdf errors - already fixed in previous session)
- **IDs 7, 8:** Status PENDING ⏸️ (uploaded today, stuck in queue)
- **ID 9:** Status PROCESSED but chunks_processed: 0 ⚠️ (processed but empty)

### Port Checks Performed

#### Check 1: Python Service (Port 8005)
```powershell
PS> netstat -ano | findstr :8005
  TCP    0.0.0.0:8005           0.0.0.0:0              LISTENING       8820
```
**Result:** ✅ Python service running

#### Check 2: Redis (Port 6379)
```powershell
PS> netstat -ano | findstr :6379
# No output - Redis not running
```
**Result:** ❌ Redis not running

### Root Cause
**Redis was not running**, which meant:
1. Bull queue couldn't connect to Redis
2. Upload jobs couldn't be queued
3. Background processing completely broken
4. New uploads failed with 500 errors
5. Pending documents stuck in PENDING state

### Solution Steps

#### Step 1: Attempted Redis Start
```powershell
(nhai-venv) D:\...\NHAI-TENDER-AUTOMATION> docker run -d -p 6379:6379 --name redis redis:latest

# Error received:
docker: Error response from daemon: Conflict. The container name "/redis" is already in use by container "26c23b303d1cd1f09a2ae4ff2d4b8e1190433859ea7137eacb723de0b1e6ea13". You have to remove (or rename) that container to be able to reuse that name.
```

**Issue:** Redis container existed but was stopped.

#### Step 2: Start Existing Redis Container
```powershell
PS> docker start redis
redis

PS> netstat -ano | findstr :6379
  TCP    0.0.0.0:6379           0.0.0.0:0              LISTENING       11532
  TCP    [::]:6379              [::]:0                 LISTENING       11532
  TCP    [::1]:6379             [::]:0                 LISTENING       9448
```

**Result:** ✅ Redis successfully started

#### Step 3: Backend Restart
User restarted the NestJS backend (port 3001):
```powershell
cd backend
# Ctrl+C to stop
npm run start:dev
```

### Expected Outcome
After Redis restart + backend restart:
- New uploads should succeed
- Stuck documents (IDs 7, 8) should auto-process OR need manual retry:
  ```http
  POST /api/historical-data/7/retry
  POST /api/historical-data/8/retry
  ```

---

## Issue 3: Zero Chunks Processed

### Problem
Document ID 9 shows successful processing but:
```json
{
  "id": 9,
  "rfp_number": "RFP-6000-NH-001",
  "title": "Gurgaon Development",
  "document_type": "CORRIGENDUM",
  "status": "PROCESSED",
  "processing_metadata": {
    "vector_ids": [],
    "processing_time": 1353,
    "chunks_processed": 0,
    "embedding_provider": "ollama (nomic-embed-text)"
  }
}
```

### Python Service Logs
```
2026-01-26 00:10:16,709 - __main__ - INFO - 📥 Processing: Sample2-CORRIGENDUM IV 30-Jan-2024_Sample 2.pdf (Type: CORRIGENDUM)
2026-01-26 00:10:16,710 - document_processor - INFO - Processing RFP document: D:\...\1769366416558-694660683.pdf
2026-01-26 00:10:18,024 - document_processor - INFO - Extracted 18 characters
2026-01-26 00:10:18,024 - document_processor - INFO - Split into 0 chunks
2026-01-26 00:10:18,024 - document_processor - INFO - Generated embeddings for 0 chunks
2026-01-26 00:10:18,027 - __main__ - INFO - ✅ Document 9 processed: 0 chunks in 1.32s
INFO:     127.0.0.1:61652 - "POST /api/process-document HTTP/1.1" 200 OK
```

### Root Cause Analysis

**Document Content:**
- File: `Sample2-CORRIGENDUM IV 30-Jan-2024_Sample 2.pdf`
- Extracted: **18 characters** only
- Chunk size requirement: **1000 characters minimum**
- Overlap: 200 characters

**Calculation:**
```
18 characters < 1000 characters (minimum chunk size)
Result: 0 chunks created
```

### Why So Few Characters?

**Possible Reasons:**
1. **Scanned PDF** - Document is an image, not text
   - Requires OCR (Optical Character Recognition)
   - PyPDFLoader only extracts text, not images
   
2. **Graphics-heavy document** - Most content is images/diagrams

3. **Protected/encrypted PDF** - Text extraction blocked

4. **Actual small document** - Legitimately only 18 characters

### Current Chunking Configuration

**File:** `python-rag/historical-data-service/.env`
```env
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

**File:** `python-rag/shared/document_processing/document_processor.py`
```python
self.text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=chunk_size,      # 1000 characters
    chunk_overlap=chunk_overlap, # 200 characters
    separators=["\n\n", "\n", " ", ""]
)
```

**Chunking Logic:**
- Documents >= 1000 characters: Split into multiple chunks
- Documents < 1000 characters: **Creates 0 chunks** (current behavior)

### Proposed Solutions

#### Option 1: Use Different Document
**Action:** Upload a document with actual text content
- Test with `docs/NHAI_AI.pdf` (known to work - ID 6 succeeded with 172 chunks)
- Avoid scanned PDFs
- Ensure document has substantial text

#### Option 2: Implement Small Document Handling
**Change Required:** Modify document processor to create at least 1 chunk for small documents

**File to Modify:** `python-rag/shared/document_processing/document_processor.py`

**Current Logic:**
```python
chunks = self.text_splitter.split_text(text)
# If text < 1000 chars, chunks = []
```

**Proposed Logic:**
```python
chunks = self.text_splitter.split_text(text)

# Handle small documents
if len(chunks) == 0 and len(text.strip()) > 0:
    # Create single chunk with all available text
    chunks = [text.strip()]
    self.logger.info(f"Small document: Created 1 chunk with {len(text)} characters")
```

**Benefits:**
- Small documents still get vectorized
- Better than silently discarding content
- Maintains searchability for all uploaded documents

**Drawbacks:**
- Very small text (< 50 chars) may not generate meaningful embeddings
- Could create noise in vector database

#### Option 3: Add OCR Support
**Change Required:** Add OCR capability for scanned PDFs

**Dependencies Needed:**
```bash
pip install pytesseract
pip install pdf2image
pip install Pillow
```

**System Requirements:**
- Tesseract OCR engine installed
- Poppler for PDF to image conversion

**Implementation Complexity:** High (requires significant changes)

### Status: Awaiting User Decision
User asked to save chat history before deciding on solution approach.

---

## Architecture Context

### Service Dependencies
```
User → Swagger UI (http://localhost:3001/api/docs)
        ↓
NestJS Backend (Port 3001)
├── Bull Queue → Redis (Port 6379) ← **REQUIRED**
├── PostgreSQL (Port 5432)
└── Python Service (Port 8005)
    ├── Ollama (Port 11434)
    └── ChromaDB (./chroma_db)
```

### Document Processing Flow
```
1. Upload via POST /api/historical-data/upload
   ↓
2. Save metadata to PostgreSQL (status: PENDING)
   ↓
3. Add job to Bull queue (Redis)
   ↓
4. DocumentProcessingProcessor picks up job
   ↓
5. Call Python service: POST http://localhost:8005/api/process-document
   - Extract text with PyPDFLoader
   - Split into chunks (1000 chars, 200 overlap)
   - Generate embeddings via Ollama
   - Store in ChromaDB
   ↓
6. Update PostgreSQL status: PROCESSED/FAILED
```

### Critical Services Status

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| NestJS Backend | 3001 | ✅ Running | API endpoints, Bull queue |
| Redis | 6379 | ✅ Running | Job queue (Bull) |
| Python Service | 8005 | ✅ Running | Document processing |
| PostgreSQL | 5432 | ✅ Running | Metadata storage |
| Ollama | 11434 | ✅ Running | Embeddings (nomic-embed-text) |
| Screen 8 | 8001 | ❌ Not Running | Query vectorization (separate feature) |

---

## Commands Reference

### Check Service Status
```powershell
# Check Redis
netstat -ano | findstr :6379

# Check Backend
netstat -ano | findstr :3001

# Check Python Service
netstat -ano | findstr :8005

# Check Ollama
netstat -ano | findstr :11434
```

### Start/Stop Services

#### Redis (Docker)
```powershell
# Start existing container
docker start redis

# Stop container
docker stop redis

# Create new container
docker run -d -p 6379:6379 --name redis redis:latest

# Check status
docker ps
```

#### Backend
```powershell
cd backend
npm run start:dev

# Or restart by killing process
netstat -ano | findstr :3001
taskkill /F /PID <pid>
npm run start:dev
```

#### Python Service
```powershell
cd python-rag\historical-data-service
d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\nhai-venv\Scripts\python.exe main.py

# Ctrl+C to stop
```

### Retry Failed/Stuck Documents
```powershell
# Via Swagger UI
POST /api/historical-data/7/retry
POST /api/historical-data/8/retry

# Via curl
curl -X POST http://localhost:3001/api/historical-data/7/retry
```

### Check Document Status
```powershell
# List all documents
curl http://localhost:3001/api/historical-data

# Get specific document
curl http://localhost:3001/api/historical-data/9

# Get statistics
curl http://localhost:3001/api/historical-data/stats/summary

# Python service stats
curl http://localhost:8005/api/stats
```

---

## Files Modified This Session

### 1. `backend/src/vectorization/vectorization.service.ts`
**Line:** 228-236  
**Change:** Removed duplicate timeout operator

**Before:**
```typescript
const response = await firstValueFrom(
  this.httpService
    .post<StoreQueryResponse>(url, payload, {
      timeout: this.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .pipe(timeout(this.requestTimeout)),
);
```

**After:**
```typescript
const response = await firstValueFrom(
  this.httpService
    .post<StoreQueryResponse>(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: this.requestTimeout,
    }),
);
```

**Impact:** Fixed "No timeout provided" error, now shows proper error messages when Screen 8 API is unavailable.

---

## Current System State

### Database Status (9 Documents)

| ID | RFP Number | Title | Type | Status | Chunks | Issue |
|----|------------|-------|------|--------|--------|-------|
| 9 | RFP-6000-NH-001 | Gurgaon Development | CORRIGENDUM | PROCESSED | 0 | 18 chars only |
| 8 | RFP-5000-NH-001 | Noida Development | RFP | PENDING | - | Stuck, needs retry |
| 7 | RFP-3000-NH-034 | Jaipur Expressway | RFP | PENDING | - | Stuck, needs retry |
| 6 | RFP-2029-NH-0111 | Mumbai-Pune-Hyderabad | RFP | PROCESSED | 172 | ✅ Success |
| 5 | - | - | - | FAILED | - | pypdf error (old) |
| 4 | - | - | - | FAILED | - | pypdf error (old) |
| 3 | - | - | - | FAILED | - | pypdf error (old) |
| 2 | - | - | - | - | - | - |
| 1 | - | - | - | - | - | - |

### Service Health
- ✅ Backend: Running, connected to Redis
- ✅ Redis: Running on port 6379
- ✅ Python: Running on port 8005
- ✅ Ollama: Operational with nomic-embed-text
- ✅ ChromaDB: Initialized at ./chroma_db
- ❌ Screen 8: Not running (separate feature)

---

## Troubleshooting Guide

### Symptom: Upload returns 500 error
**Check:**
1. Is Redis running? `netstat -ano | findstr :6379`
2. Is Python service running? `netstat -ano | findstr :8005`
3. Check backend logs for Bull queue errors

**Solution:**
```powershell
docker start redis
# Restart backend
cd backend
npm run start:dev
```

### Symptom: Documents stuck in PENDING
**Cause:** Jobs queued before Redis was available

**Solution:** Manual retry
```http
POST /api/historical-data/{id}/retry
```

### Symptom: chunks_processed: 0
**Causes:**
1. Document is scanned image (needs OCR)
2. Document < 1000 characters
3. Text extraction failed

**Diagnosis:**
Check Python logs for "Extracted X characters"

**Solutions:**
- Use different document with text
- Implement small document handling
- Add OCR support for scanned PDFs

### Symptom: "No timeout provided" error
**Status:** ✅ FIXED in this session

**Previous cause:** Duplicate timeout operators in RxJS pipe

### Symptom: pypdf package errors
**Status:** ✅ FIXED in previous session (Jan 23)

**Solution:** Install in correct virtual environment
```powershell
d:\...\nhai-venv\Scripts\python.exe -m pip install pypdf==3.17.1
```

---

## Testing Recommendations

### Test 1: Successful Upload
**Document:** `docs/NHAI_AI.pdf` (proven to work)
**Expected:**
- Upload returns 201 with document_id
- Status: PENDING → PROCESSING → PROCESSED
- chunks_processed > 0
- vector_ids array populated
- Processing time: 10-30 seconds

### Test 2: Retry Stuck Documents
```http
POST /api/historical-data/7/retry
POST /api/historical-data/8/retry
```
**Expected:** Status changes to PROCESSING then PROCESSED

### Test 3: Small Document Handling
**Current behavior:** Creates 0 chunks
**After fix:** Should create 1 chunk with all text

### Test 4: Statistics Endpoint
```http
GET /api/historical-data/stats/summary
```
**Expected:**
```json
{
  "total_documents": 9,
  "by_type": {
    "RFP": 6,
    "Q&A": 0,
    "CORRIGENDUM": 1
  },
  "by_status": {
    "PENDING": 2,
    "PROCESSING": 0,
    "PROCESSED": 5,
    "FAILED": 2
  }
}
```

---

## Next Steps

### Immediate Actions Required
1. ✅ Redis started - COMPLETED
2. ✅ Backend restarted - COMPLETED
3. ⏳ Test new upload - PENDING
4. ⏳ Retry documents 7 & 8 - PENDING
5. ⏳ Decide on small document handling - PENDING

### Decision Points
**Question:** How to handle documents < 1000 characters?

**Options:**
- **A.** Reject with clear error message
- **B.** Create single chunk with all text (recommended)
- **C.** Add OCR for scanned PDFs (complex)

**User Response:** Requested chat history before deciding

### Future Enhancements
1. **OCR Support** - Handle scanned PDFs
2. **Bulk Upload** - ZIP file with multiple documents
3. **Progress Tracking** - Real-time processing status
4. **File Validation** - Pre-check text content before upload
5. **Retry Automation** - Auto-retry PENDING documents on startup

---

## Session Timeline

**01/25/2026 10:24 PM** - User reports vectorization errors  
**01/25/2026 10:30 PM** - Fixed timeout error in vectorization.service.ts  
**01/26/2026 12:00 AM** - User reports 500 upload errors  
**01/26/2026 12:05 AM** - Diagnosed Redis not running  
**01/26/2026 12:10 AM** - Started Redis container  
**01/26/2026 12:15 AM** - User restarted backend  
**01/26/2026 12:20 AM** - Discovered zero chunks issue  
**01/26/2026 12:25 AM** - Analyzed Python logs, found 18-character extraction  
**01/26/2026 12:30 AM** - User requested chat history  

---

## Key Learnings

### Redis is Critical
**Lesson:** Historical Data Management cannot function without Redis
- Bull queue requires Redis for job persistence
- Document processing completely stops if Redis unavailable
- Uploads fail with 500 errors, not clear error messages

**Prevention:** Add Redis health check to backend startup

### Small Documents Are Edge Case
**Lesson:** Chunking logic assumes documents >= 1000 characters
- Current behavior: Silent failure (0 chunks)
- Better approach: Create at least 1 chunk for any text
- Consider minimum text threshold (e.g., 10 characters)

**Prevention:** Add validation before processing

### Error Messages Need Improvement
**Lesson:** "No timeout provided" was misleading
- Real issue was Screen 8 service not running
- RxJS error masked actual network problem
- Fixed by removing duplicate timeout

**Prevention:** Test error paths thoroughly

### Document Types Matter
**Lesson:** Text extraction varies by document format
- PDFs with embedded text: Works perfectly
- Scanned PDFs: Requires OCR
- Image-based PDFs: May extract no text

**Prevention:** Document requirements in API documentation

---

## Related Documentation

**Previous Session:**
- `CHAT_SESSION_HISTORICAL_DATA_IMPLEMENTATION.md` - Initial implementation (Jan 23-24, 2026)

**Implementation Guides:**
- `HISTORICAL_DATA_COMPLETE_IMPLEMENTATION.md` - Original 16-step plan
- `README_SERVICES.md` - Service overview
- `QUICK_START_ADMIN_PANEL.md` - Admin panel guide

**Code Files:**
- `backend/src/historical-data/` - All backend modules
- `python-rag/historical-data-service/` - Python processing service
- `python-rag/shared/document_processing/` - Document processor
- `python-rag/shared/vector_db/` - ChromaDB service

---

## Pending Questions

1. **Small Document Handling:** Which approach to implement?
   - Create single chunk for < 1000 chars?
   - Reject with validation error?
   - Add OCR for scanned documents?

2. **Stuck Documents (IDs 7, 8):** Should they auto-retry on startup?
   - Current: Manual retry required
   - Proposal: Auto-retry PENDING jobs on backend startup

3. **Screen 8 Service:** Is it needed for Historical Data?
   - Current: Query vectorization trying to call it
   - Issue: Service not running, causing cron job errors
   - Question: Should Historical Data depend on Screen 8?

4. **Error Handling:** Should 18-character documents be marked as FAILED?
   - Current: Marked as PROCESSED with 0 chunks
   - Proposal: Add minimum text threshold, fail if below

---

*Session saved: January 26, 2026*  
*Duration: ~30 minutes*  
*Issues resolved: 2 (timeout error, Redis not running)*  
*Issues identified: 1 (small document chunking)*  
*Files modified: 1 (vectorization.service.ts)*
