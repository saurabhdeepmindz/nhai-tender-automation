# 🚀 NHAI Tender Automation System - Quick Start Guide

**Complete guide to start all services and manage the application**

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Quick Start (Windows)](#quick-start-windows)
3. [Individual Service Commands](#individual-service-commands)
4. [Service URLs](#service-urls)
5. [Database Operations](#database-operations)
6. [Troubleshooting](#troubleshooting)
7. [Daily Operations](#daily-operations)

---

## 🏗️ System Architecture

The NHAI Tender Automation System consists of **4 main services**:

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **Backend API** | NestJS (Node.js) | 3000 | REST API, Database, Vectorization |
| **Frontend UI** | Next.js (React) | 3001 | Web Interface, Admin Panel |
| **Screen 7** | Python + FastAPI | 8000 | History Retriever (RAG) |
| **Screen 8** | Python + FastAPI | 8001 | Chief Engineer Agent (RAG) |

**Data Flow:**
```
PostgreSQL Database ←→ Backend (NestJS) ←→ Frontend (Next.js)
                            ↓
                      ChromaDB (Vector Store)
                            ↑
                    Screen 7 & Screen 8 (Python RAG)
```

---

## 🚀 Quick Start (Windows)

### Option 1: Start All Services at Once

**Double-click to run:**
```
START_ALL_SERVICES.bat
```

This will open **4 separate command windows**, one for each service.

**Wait time:** ~20-30 seconds for all services to start

---

### Option 2: Start Services Individually

If you need to start services one by one:

**1. Start Backend (Required First)**
```
START_BACKEND.bat
```
Wait until you see: `Application successfully started on http://localhost:3000`

**2. Start Frontend**
```
START_FRONTEND.bat
```
Wait until you see: `ready - started server on 0.0.0.0:3001`

**3. Start Screen 7**
```
START_SCREEN7_FIXED.bat
```
Wait until you see: `Uvicorn running on http://0.0.0.0:8000`

**4. Start Screen 8**
```
START_SCREEN8_FIXED.bat
```
Wait until you see: `Uvicorn running on http://0.0.0.0:8001`

---

## 🛑 Stop All Services

**Double-click to run:**
```
STOP_ALL_SERVICES.bat
```

This will terminate all Node.js and Python processes.

**Alternative (PowerShell):**
```powershell
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

---

## 🌐 Service URLs

### 🎯 **Complete URL Reference**

---

### **Backend API (NestJS)** - Port 3000

| Type | Endpoint | URL | Description |
|------|----------|-----|-------------|
| 📚 **API Docs** | `/api/docs` | **http://localhost:3000/api/docs** | **Swagger UI - Interactive API Documentation** |
| 🔌 Base API | `/api` | http://localhost:3000/api | REST API base endpoint |
| ❤️ Health | `/api/health` | http://localhost:3000/api/health | Service health check |
| 📝 **Prebid Queries** | `/api/prebid-queries` | **http://localhost:3000/api/prebid-queries** | **Query CRUD operations** |
| 🔍 Query by ID | `/api/prebid-queries/{id}` | http://localhost:3000/api/prebid-queries/fac137a9-4f8b-49e1-9a9a-901f855a8b85 | Get specific query (QRY-2024-005) |
| 📊 Query Statistics | `/api/prebid-queries/statistics` | http://localhost:3000/api/prebid-queries/statistics | Query statistics |
| 🤖 Process Query | `/api/prebid-queries/{id}/process` | http://localhost:3000/api/prebid-queries/fac137a9-4f8b-49e1-9a9a-901f855a8b85/process | Process query via Screen 8 |
| 🔎 Similar Queries | `/api/prebid-queries/{id}/similar` | http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36/similar | Find similar queries |
| 📝 Query History | `/api/prebid-queries/{id}/history` | http://localhost:3000/api/prebid-queries/8341fca3-aa16-4f93-80cf-39119d7e8aab/history | Query history (QRY-2024-004) |
| 📊 Query Status | `/api/prebid-queries/{id}/status` | http://localhost:3000/api/prebid-queries/dba1733e-6685-4664-9173-7510baccdd9a/status | Query processing status |
| 💬 Admin Response | `/api/prebid-queries/{id}/admin-response` | http://localhost:3000/api/prebid-queries/5b79647f-9f62-411f-b659-3a800b66651c/admin-response | Add admin response (QRY-2024-002) |
| 🎛️ **Admin Vectorization** | `/api/admin/vectorization/*` | **See endpoints below** | **Admin vectorization API** |
| 📈 Vectorization Stats | `/api/admin/vectorization/stats` | http://localhost:3000/api/admin/vectorization/stats | Vectorization statistics |
| 📊 Vectorization Metrics | `/api/admin/vectorization/metrics` | http://localhost:3000/api/admin/vectorization/metrics | Performance metrics |
| 📋 Vectorization Dashboard | `/api/admin/vectorization/dashboard` | http://localhost:3000/api/admin/vectorization/dashboard | Dashboard data |
| 📝 Vectorization Queries | `/api/admin/vectorization/queries` | http://localhost:3000/api/admin/vectorization/queries | All queries with vectorization status |
| ⏳ Pending Queries | `/api/admin/vectorization/queries/pending` | http://localhost:3000/api/admin/vectorization/queries/pending | Pending queries |
| 📜 Vectorization Logs | `/api/admin/vectorization/logs` | http://localhost:3000/api/admin/vectorization/logs | Vectorization logs |
| ⏸️ Pause Job | `/api/admin/vectorization/job/pause` | http://localhost:3000/api/admin/vectorization/job/pause | Pause background job |
| ▶️ Resume Job | `/api/admin/vectorization/job/resume` | http://localhost:3000/api/admin/vectorization/job/resume | Resume background job |
| 🔄 Run Job Now | `/api/admin/vectorization/job/run-now` | http://localhost:3000/api/admin/vectorization/job/run-now | Trigger job immediately |
| 🔁 Revectorize All | `/api/admin/vectorization/job/revectorize-all` | http://localhost:3000/api/admin/vectorization/job/revectorize-all | Revectorize all queries |
| ⚙️ Job Config | `/api/admin/vectorization/job/config` | http://localhost:3000/api/admin/vectorization/job/config | Get job configuration |
| 🔧 Vectorization Config | `/api/vectorization/config` | http://localhost:3000/api/vectorization/config | Vectorization settings |
| 🔄 Batch Vectorize | `/api/vectorization/batch` | http://localhost:3000/api/vectorization/batch | Batch vectorize queries |
| ❌ Failed Vectorizations | `/api/vectorization/failures` | http://localhost:3000/api/vectorization/failures | Get failed vectorizations |
| 🔁 Retry Failures | `/api/vectorization/retry-failures` | http://localhost:3000/api/vectorization/retry-failures | Retry failed vectorizations |
| 📋 Query Info | `/api/vectorization/query/{id}` | http://localhost:3000/api/vectorization/query/1 | Get query vectorization info |
| 🔍 Query Details | `/api/vectorization/query/{id}/info` | http://localhost:3000/api/vectorization/query/1/info | Detailed vectorization info |
| 🏥 Screen8 Health | `/api/vectorization/health/screen8` | http://localhost:3000/api/vectorization/health/screen8 | Check Screen 8 connectivity |

---

### **Frontend UI (Next.js)** - Port 3001

| Type | Page | URL | Description |
|------|------|-----|-------------|
| 🏠 Home | `/` | http://localhost:3001 | Main application dashboard |
| 🎛️ **Admin Panel** | `/admin/vectorization-control` | **http://localhost:3001/admin/vectorization-control** | **Vectorization Control Dashboard** |
| 📝 **Prebid Queries** | `/prebid-queries` | **http://localhost:3001/prebid-queries** | **Query management interface** |
| 🔍 Query Details | `/prebid-queries/{id}` | http://localhost:3001/prebid-queries/fac137a9-4f8b-49e1-9a9a-901f855a8b85 | View specific query (QRY-2024-005) |
| 📈 Analytics | `/analytics` | http://localhost:3001/analytics | System analytics |
| 📊 Dashboard | `/dashboard` | http://localhost:3001/dashboard | Main dashboard |

---

### **Screen 7 - History Retriever (Python FastAPI)** - Port 8000

| Type | Endpoint | URL | Description |
|------|----------|-----|-------------|
| 📚 **API Docs** | `/docs` | **http://localhost:8000/docs** | **FastAPI Swagger UI** |
| 🔌 Service Info | `/` | http://localhost:8000 | Service information & version |
| ❤️ Health Check | `/api/health` | http://localhost:8000/api/health | Health status & configuration |
| 📖 OpenAPI JSON | `/openapi.json` | http://localhost:8000/openapi.json | OpenAPI specification |
| 📖 ReDoc | `/redoc` | http://localhost:8000/redoc | Alternative API documentation |
| 📥 Ingest Documents | `/api/rag/ingest` **(POST)** | http://localhost:8000/api/rag/ingest | Upload and ingest documents - **Requires POST with multipart/form-data** |
| 🔍 Search | `/api/rag/search` **(POST)** | http://localhost:8000/api/rag/search | Semantic search in historical data - **Requires POST with JSON body** |
| 📊 Statistics | `/api/statistics` | http://localhost:8000/api/statistics | Collection statistics |
| 🗑️ Delete Document | `/api/rag/documents/{id}` **(DELETE)** | http://localhost:8000/api/rag/documents/{id} | Delete document from vector store - **Requires DELETE method** |
| 🔄 Reprocess Document | `/api/rag/reprocess/{id}` **(POST)** | http://localhost:8000/api/rag/reprocess/{id} | Reprocess a document - **Requires POST method** |
| ⚙️ Get Config | `/api/rag/config` | http://localhost:8000/api/rag/config | Get RAG configuration |
| ⚙️ Update Config | `/api/rag/config` **(PUT)** | http://localhost:8000/api/rag/config | Update RAG configuration - **Requires PUT with JSON body** |
| 📜 Transactions | `/api/rag/transactions` | http://localhost:8000/api/rag/transactions | Get processing transactions |

**Note:** Screen 7 is a **backend service only** - it provides APIs consumed by the main frontend/backend.

---

### **Screen 8 - Chief Engineer Agent (Python FastAPI)** - Port 8001

| Type | Endpoint | URL | Description |
|------|----------|-----|-------------|
| 📚 **API Docs** | `/docs` | **http://localhost:8001/docs** | **FastAPI Swagger UI** |
| 🔌 Service Info | `/` | http://localhost:8001 | Service information & version |
| ❤️ Health Check | `/api/health` | http://localhost:8001/api/health | Health status & configuration |
| 📖 OpenAPI JSON | `/openapi.json` | http://localhost:8001/openapi.json | OpenAPI specification |
| 📖 ReDoc | `/redoc` | http://localhost:8001/redoc | Alternative API documentation |
| 🤖 Process Query | `/api/chief-engineer/process` **(POST)** | http://localhost:8001/api/chief-engineer/process | Process vendor query (6-step workflow) - **Requires POST with JSON body** |
| 💾 Store Query | `/api/chief-engineer/store-query` **(POST)** | http://localhost:8001/api/chief-engineer/store-query | Store query in vector DB - **Requires POST with JSON body** |
| 🔍 Find Similar | `/api/chief-engineer/similar-queries` **(POST)** | http://localhost:8001/api/chief-engineer/similar-queries | Find similar queries - **Requires POST with JSON body** |
| 📊 Workflow Executions | `/api/workflow/executions` | http://localhost:8001/api/workflow/executions | List workflow executions |
| 🔍 Workflow Details | `/api/workflow/executions/{id}` | http://localhost:8001/api/workflow/executions/{id} | Get workflow execution details |
| 📈 Statistics | `/api/statistics` | http://localhost:8001/api/statistics | Service statistics |
| 🧪 Test Endpoint | `/api/chief-engineer/test` **(POST)** | http://localhost:8001/api/chief-engineer/test | Test service connectivity - **Requires POST with JSON body** |

**Note:** Screen 8 is a **backend service only** - it provides APIs consumed by the main frontend/backend.

---

### **🔄 Background Job: PostgreSQL → ChromaDB Vectorization**

| Type | Description | URL/Command |
|------|-------------|-------------|
| 📊 **Monitor Status** | View vectorization job statistics | http://localhost:3000/api/admin/vectorization/stats |
| 📈 **Metrics Dashboard** | View performance metrics | http://localhost:3000/api/admin/vectorization/dashboard |
| 🎛️ **Control Panel** | Web UI to manage vectorization | http://localhost:3001/admin/vectorization-control |
| ⏸️ Pause Job | API to pause background job | `POST http://localhost:3000/api/admin/vectorization/job/pause` |
| ▶️ Resume Job | API to resume background job | `POST http://localhost:3000/api/admin/vectorization/job/resume` |
| 🔄 Run Job Now | Manually trigger vectorization immediately | `POST http://localhost:3000/api/admin/vectorization/job/run-now` |
| 🔁 Revectorize All | Re-vectorize all queries | `POST http://localhost:3000/api/admin/vectorization/job/revectorize-all` |
| 📜 View Logs | View vectorization logs | http://localhost:3000/api/admin/vectorization/logs |
| ⚙️ Job Config | View job configuration | http://localhost:3000/api/admin/vectorization/job/config |

**Configuration** (in `backend/.env`):
```env
VECTORIZATION_ENABLED=true
VECTORIZATION_BATCH_SIZE=10
VECTORIZATION_CRON=0 */5 * * * *  # Every 5 minutes
```

**How it works:**
1. **Automatic Mode**: Background job runs every 5 minutes
2. Queries from PostgreSQL are fetched
3. Embeddings are generated using Ollama/OpenAI
4. Vectors are stored in ChromaDB
5. Status is tracked in PostgreSQL `vectorization_logs` table

---

### **📋 Quick Access - Most Used URLs**

| Service | URL | Description |
|---------|-----|-------------|
| ⭐ **Backend API Docs** | http://localhost:3000/api/docs | Full backend API documentation |
| ⭐ **Admin Dashboard** | http://localhost:3001/admin/vectorization-control | Vectorization control panel |
| ⭐ **Prebid Queries** | http://localhost:3000/api/prebid-queries | Query management API |
| ⭐ **Query Statistics** | http://localhost:3000/api/prebid-queries/statistics | Query statistics |
| ⭐ **Vectorization Stats** | http://localhost:3000/api/admin/vectorization/stats | Vectorization statistics |
| ⭐ **Vectorization Dashboard** | http://localhost:3000/api/admin/vectorization/dashboard | Vectorization dashboard data |
| ⭐ **Screen 7 Docs** | http://localhost:8000/docs | History Retriever API docs |
| ⭐ **Screen 8 Docs** | http://localhost:8001/docs | Chief Engineer API docs |
| ⭐ **Frontend Home** | http://localhost:3001 | Main application |
| ⭐ **Run Vectorization Now** | POST http://localhost:3000/api/admin/vectorization/job/run-now | Trigger vectorization immediately |

---

## 💾 Database Operations

### PostgreSQL to ChromaDB Vectorization

The system automatically syncs data from PostgreSQL to ChromaDB (vector database).

#### Automatic Background Job

The backend runs a **background job** that:
- Polls PostgreSQL every 5 minutes for new queries
- Vectorizes queries using embeddings
- Stores vectors in ChromaDB
- Tracks vectorization status

**Configuration** (in `backend/.env`):
```env
VECTORIZATION_ENABLED=true
VECTORIZATION_BATCH_SIZE=10
VECTORIZATION_CRON=0 */5 * * * *  # Every 5 minutes
```

#### Manual Vectorization (via Admin Panel)

**Access:** http://localhost:3001/admin/vectorization-control

**Features:**
- ✅ Manually trigger vectorization for single query
- ✅ Batch vectorize multiple queries
- ✅ Retry failed vectorizations
- ✅ View vectorization logs and status
- ✅ Pause/Resume background job

#### Manual Vectorization (via API)

**Vectorize all pending queries:**
```bash
curl -X POST http://localhost:3000/api/admin/vectorization/job/run-now
```

**Batch vectorize specific queries:**
```bash
curl -X POST http://localhost:3000/api/vectorization/batch \
  -H "Content-Type: application/json" \
  -d '{"queryIds": [1, 2, 3]}'
```

**Retry failed vectorizations:**
```bash
curl -X POST http://localhost:3000/api/vectorization/retry-failures
```

**Revectorize all queries (force re-vectorization):**
```bash
curl -X POST http://localhost:3000/api/admin/vectorization/job/revectorize-all
```

**Get vectorization info for specific query:**
```bash
curl http://localhost:3000/api/vectorization/query/123/info
```

#### Manual Vectorization (via Script)

Create a PowerShell script `vectorize-all.ps1`:
```powershell
# Get vectorization statistics
$stats = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/admin/vectorization/stats" `
    -Method Get

Write-Host "Pending queries: $($stats.pending)"
Write-Host "Vectorized queries: $($stats.vectorized)"
Write-Host "Failed queries: $($stats.failed)"

# Trigger immediate vectorization
Write-Host "`nTriggering vectorization job..."
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/admin/vectorization/job/run-now" `
    -Method Post

Write-Host "Vectorization job triggered successfully!"
```

Run: `powershell .\vectorize-all.ps1`

---

## 🔧 Individual Service Commands

### Backend (NestJS)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm run start:dev

# Start production server
npm run start:prod

# Build for production
npm run build

# Run migrations
npm run typeorm migration:run

# Create migration
npm run typeorm migration:create -- -n MigrationName
```

### Frontend (Next.js)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server (port 3001)
npm run dev -- -p 3001

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check
```

### Screen 7 (Python)

```bash
# Navigate to Screen 7
cd python-rag\screen07-history-retriever

# Activate virtual environment
..\..\nhai-venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
python main.py

# Check Ollama is running (required)
curl http://localhost:11434/api/version
```

### Screen 8 (Python)

```bash
# Navigate to Screen 8
cd python-rag\screen08-chief-engineer

# Activate virtual environment
..\..\nhai-venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
python main.py

# Check Ollama is running (required)
curl http://localhost:11434/api/version
```

---

## 🐛 Troubleshooting

### Issue: `/api/prebid-queries` returns 500 Internal Server Error

**Error Response:**
```json
{"message":"Failed to fetch queries","error":"Internal Server Error","statusCode":500}
```

**Diagnosis:**
- ✅ PostgreSQL is running on port 5432
- ✅ Database `nhai_tender_db` exists
- ✅ Table `queries` exists with data (5 queries)
- ❌ Backend endpoint is throwing a 500 error

**Root Cause:**
The backend code has a bug in the query retrieval logic. Common causes:
1. **Missing JOIN** on related tables (RFP, Users, Categories)
2. **Null reference** when accessing relationships
3. **TypeORM query error** in the service/repository

**Solution Steps:**

**1. Check Backend Console Logs:**
Look at the terminal/console window where you started the backend (`START_BACKEND.bat`). You should see a detailed error stack trace like:
```
[Nest] ERROR [ExceptionsHandler] Cannot read properties of null
at QueryController.findAll (query.controller.ts:45)
...
```

**2. Common Fixes:**

**Fix A: Missing Left Joins**
The query might need left joins for optional relationships:
```typescript
// In backend/src/queries/queries.service.ts
findAll() {
  return this.queryRepository.find({
    relations: {
      rfp: true,           // ← might be null
      vendor: true,        // ← might be null
      category: true,      // ← might be null  
    },
  });
}
```

**Fix B: Handle Null RFP/Vendor**
If some queries don't have associated RFPs or vendors:
```typescript
findAll() {
  return this.queryRepository
    .createQueryBuilder('query')
    .leftJoinAndSelect('query.rfp', 'rfp')
    .leftJoinAndSelect('query.vendor', 'vendor')
    .leftJoinAndSelect('query.category', 'category')
    .getMany();
}
```

**Fix C: Add Eager Loading**
Modify the entity to automatically load relationships:
```typescript
// In backend/src/queries/query.entity.ts
@ManyToOne(() => RFP, { eager: true, nullable: true })
rfp: RFP;

@ManyToOne(() => User, { eager: true, nullable: true })
vendor: User;
```

**3. Temporary Workaround:**

Until the backend is fixed, you can query the database directly:
```powershell
# Set password
$env:PGPASSWORD = "your_password"

# Get all queries
psql -h localhost -U postgres -d nhai_tender_db -c "SELECT query_id, query_number, status, query_text FROM queries;"

# Get specific query
psql -h localhost -U postgres -d nhai_tender_db -c "SELECT * FROM queries WHERE query_id = '7577375a-a6e7-45e1-9c7e-9c65c1aaca36';"
```

**4. Check Backend Entity Relationships:**
```bash
# Look at the Query entity
code backend/src/queries/entities/query.entity.ts

# Look at the controller
code backend/src/queries/queries.controller.ts

# Look at the service
code backend/src/queries/queries.service.ts
```

**5. Restart Backend:**
After making code changes:
```
STOP_ALL_SERVICES.bat
START_BACKEND.bat
```

---

### Issue: Services don't start

**Solution:**
1. Stop all services: `STOP_ALL_SERVICES.bat`
2. Check if ports are in use:
   ```powershell
   netstat -ano | findstr "3000 3001 8000 8001"
   ```
3. Kill any remaining processes
4. Restart: `START_ALL_SERVICES.bat`

---

### Issue: "Port already in use"

**Find process using port:**
```powershell
netstat -ano | findstr ":<port>"
```

**Kill specific process:**
```powershell
taskkill /F /PID <process_id>
```

---

### Issue: PostgreSQL connection error

**Check:**
1. PostgreSQL is running
2. Database credentials in `backend/.env`
3. Database `nhai_tender_db` exists

**Fix:**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE nhai_tender_db;
```

---

### Issue: ChromaDB schema error

**Error:** `sqlite3.OperationalError: no such column: collections.topic`

**Solution:**
```bash
# Delete old ChromaDB data
cd python-rag\screen07-history-retriever
rmdir /s /q chroma_db

cd ..\screen08-chief-engineer
rmdir /s /q query_db

# Restart services - ChromaDB will be recreated
```

---

### Issue: Ollama not available

**Check Ollama:**
```bash
curl http://localhost:11434/api/version
```

**Install Ollama:**
1. Download: https://ollama.ai
2. Install and start Ollama
3. Pull required models:
   ```bash
   ollama pull nomic-embed-text
   ollama pull gemma:2b
   ```

---

### Issue: Frontend shows "API connection failed"

**Check:**
1. Backend is running: http://localhost:3000/api/health
2. Frontend `.env.local` has correct API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```
3. Clear browser cache and reload

---

## 📅 Daily Operations

### Starting Work

1. **Start all services:**
   ```
   START_ALL_SERVICES.bat
   ```

2. **Verify services are running:**
   - Backend API: http://localhost:3000/api/docs
   - Frontend: http://localhost:3001
   - Screen 7: http://localhost:8000/docs
   - Screen 8: http://localhost:8001/docs

3. **Check vectorization status:**
   - Open: http://localhost:3001/admin/vectorization-control
   - Review pending queries
   - Trigger manual vectorization if needed

---

### Ending Work

1. **Stop all services:**
   ```
   STOP_ALL_SERVICES.bat
   ```

2. **Optional - Commit changes:**
   ```bash
   git add .
   git commit -m "Daily work - [description]"
   git push
   ```

---

## 📊 Monitoring

### Check Service Status

**PowerShell script** `check-services.ps1`:
```powershell
Write-Host "`n=== NHAI Service Status ===" -ForegroundColor Cyan

# Check ports
$ports = @(3000, 3001, 8000, 8001)
foreach ($port in $ports) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
    if ($connection) {
        Write-Host "✓ Port $port - RUNNING" -ForegroundColor Green
    } else {
        Write-Host "✗ Port $port - STOPPED" -ForegroundColor Red
    }
}

# Check URLs
$urls = @(
    "http://localhost:3000/api/health",
    "http://localhost:3001",
    "http://localhost:8000/health",
    "http://localhost:8001/health"
)

Write-Host "`n=== API Health Checks ===" -ForegroundColor Cyan
foreach ($url in $urls) {
    try {
        $response = Invoke-RestMethod -Uri $url -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✓ $url - OK" -ForegroundColor Green
    } catch {
        Write-Host "✗ $url - FAILED" -ForegroundColor Red
    }
}
```

Run: `powershell .\check-services.ps1`

---

## 🔐 Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nhai_tender_db
SCREEN7_URL=http://localhost:8000
SCREEN8_URL=http://localhost:8001
VECTORIZATION_ENABLED=true
VECTORIZATION_BATCH_SIZE=10
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_REFRESH_INTERVAL=30000
```

### Screen 7 (.env)
```env
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=gemma:2b
PORT=8000
```

### Screen 8 (.env)
```env
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=gemma:2b
PORT=8001
```

---

## 📦 Installation & Setup (First Time)

### 1. Install Prerequisites

- **Node.js** (v18+): https://nodejs.org
- **Python** (v3.11+): https://python.org
- **PostgreSQL** (v14+): https://www.postgresql.org
- **Ollama**: https://ollama.ai

### 2. Clone Repository
```bash
git clone <repository-url>
cd NHAI-Tender-Automation
```

### 3. Setup Backend
```bash
cd backend
npm install
# Create .env file and configure database
npm run typeorm migration:run
```

### 4. Setup Frontend
```bash
cd frontend
npm install
# Create .env.local file
```

### 5. Setup Python Environment
```bash
python -m venv nhai-venv
nhai-venv\Scripts\activate
pip install -r requirements.txt
```

### 6. Setup Ollama Models
```bash
ollama pull nomic-embed-text
ollama pull gemma:2b
```

### 7. Start Services
```
START_ALL_SERVICES.bat
```

---

## 🆘 Support

For issues or questions:
1. Check this README first
2. Check service logs in command windows
3. Check [Troubleshooting](#troubleshooting) section
4. Contact: NHAI Development Team

---

## 📝 Change Log

- **2026-01-22**: Complete system documentation and batch files created
- Services running on ports: 3000 (Backend), 3001 (Frontend), 8000 (Screen7), 8001 (Screen8)

---

**Happy Development! 🚀**
