# 📦 Vectorization Service - Complete Setup Guide

**NHAI Tender Query Automation System**  
**Query Vectorization Background Job & Service**

---

## 📁 **Files Provided**

You now have **6 complete files** for the vectorization system:

### **Core Files (2):**
1. **query-vectorization.job.ts** - Background cron job (runs every 5 minutes)
2. **vectorization.service.ts** - Service with API calls and logic

### **Supporting Files (4):**
3. **vectorization-log.entity.ts** - Database entity for logging attempts
4. **vectorization.module.ts** - NestJS module configuration
5. **vectorization.controller.ts** - REST API endpoints for manual triggers
6. **1705847291000-AddVectorizationSupport.ts** - Database migration

---

## 📂 **File Placement**

Copy files to your NestJS backend project:

```
backend/
├── src/
│   ├── jobs/
│   │   └── query-vectorization.job.ts          ← Copy here
│   │
│   ├── vectorization/
│   │   ├── vectorization.service.ts            ← Copy here
│   │   ├── vectorization.controller.ts         ← Copy here
│   │   ├── vectorization.module.ts             ← Copy here
│   │   └── entities/
│   │       └── vectorization-log.entity.ts     ← Copy here
│   │
│   └── migrations/
│       └── 1705847291000-AddVectorizationSupport.ts  ← Copy here
```

---

## 🚀 **Setup Instructions**

### **Step 1: Create Folder Structure**

```bash
cd backend/src

# Create folders
mkdir -p jobs
mkdir -p vectorization/entities
mkdir -p migrations
```

### **Step 2: Copy Files**

Copy all 6 files to their respective locations as shown above.

### **Step 3: Install Dependencies**

```bash
cd backend

# Install required packages
npm install @nestjs/schedule
npm install @nestjs/axios
npm install rxjs
```

### **Step 4: Update app.module.ts**

**File:** `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // ← Add this

// Import modules
import { QueriesModule } from './queries/queries.module';
import { VectorizationModule } from './vectorization/vectorization.module'; // ← Add this

// Import jobs
import { QueryVectorizationJob } from './jobs/query-vectorization.job'; // ← Add this

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(), // ← Add this (enables cron jobs)
    TypeOrmModule.forRoot({
      // ... your database config
    }),
    QueriesModule,
    VectorizationModule, // ← Add this
    // ... other modules
  ],
  providers: [
    QueryVectorizationJob, // ← Add this
    // ... other providers
  ],
})
export class AppModule {}
```

### **Step 5: Update Environment Variables**

**File:** `backend/.env`

```bash
# Screen 8 (Python RAG Service) Configuration
SCREEN8_URL=http://localhost:8001

# Vectorization Configuration
VECTORIZATION_ENABLED=true
VECTORIZATION_BATCH_SIZE=10
VECTORIZATION_TIMEOUT=30000        # 30 seconds
VECTORIZATION_MAX_RETRIES=3
VECTORIZATION_RETRY_DELAY=2000     # 2 seconds
```

### **Step 6: Update Query Entity**

**File:** `backend/src/queries/entities/query.entity.ts`

Add these two new columns:

```typescript
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('queries')
export class Query {
  // ... existing columns

  // NEW: Vectorization columns
  @Column({ type: 'boolean', default: false })
  vectorized: boolean;

  @Column({ type: 'timestamp', nullable: true })
  vectorStoredAt: Date;

  // ... rest of entity
}
```

### **Step 7: Run Database Migration**

```bash
cd backend

# Generate migration
npm run typeorm migration:run

# Or manually run the SQL:
# The migration file contains all SQL commands
```

**Manual SQL (if needed):**

```sql
-- Add columns to queries table
ALTER TABLE queries 
ADD COLUMN vectorized BOOLEAN DEFAULT FALSE;

ALTER TABLE queries 
ADD COLUMN vector_stored_at TIMESTAMP NULL;

-- Create index
CREATE INDEX IDX_QUERIES_VECTORIZED ON queries(vectorized);

-- Create vectorization_logs table
CREATE TABLE vectorization_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL,
  duration INT,
  embedding_dimension INT,
  processing_time FLOAT,
  error_message TEXT,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES queries(query_id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IDX_VECTORIZATION_LOGS_QUERY_ID ON vectorization_logs(query_id);
CREATE INDEX IDX_VECTORIZATION_LOGS_STATUS ON vectorization_logs(status);
CREATE INDEX IDX_VECTORIZATION_LOGS_QUERY_ATTEMPTED ON vectorization_logs(query_id, attempted_at);
```

### **Step 8: Start Backend Server**

```bash
cd backend
npm run start:dev
```

**Expected logs:**
```
[Nest] LOG [VectorizationService] Vectorization Service initialized
[Nest] LOG [VectorizationService] Screen 8 URL: http://localhost:8001
[Nest] LOG [QueryVectorizationJob] Query Vectorization Job initialized
[Nest] LOG [QueryVectorizationJob] Batch size: 10
[Nest] LOG [QueryVectorizationJob] Schedule: Every 5 minutes
```

---

## ✅ **Verification**

### **Test 1: Check if Job is Running**

The job runs every 5 minutes. Check logs:

```
[Nest] LOG [QueryVectorizationJob] ============================================
[Nest] LOG [QueryVectorizationJob] Starting Query Vectorization Job
[Nest] LOG [QueryVectorizationJob] ============================================
[Nest] LOG [QueryVectorizationJob] No unvectorized queries found
[Nest] LOG [QueryVectorizationJob] ============================================
[Nest] LOG [QueryVectorizationJob] Query Vectorization Job Completed
[Nest] LOG [QueryVectorizationJob] ============================================
```

### **Test 2: Submit a Test Query**

1. Go to Screen 3 (Vendor Query Submission)
2. Submit a test query
3. Check database:

```sql
SELECT query_id, query_text, vectorized, vector_stored_at 
FROM queries 
ORDER BY submitted_at DESC 
LIMIT 1;
```

**Initial state:**
```
vectorized: false
vector_stored_at: null
```

4. Wait 5 minutes (or less if job runs)
5. Check again:

```sql
SELECT query_id, query_text, vectorized, vector_stored_at 
FROM queries 
ORDER BY submitted_at DESC 
LIMIT 1;
```

**After vectorization:**
```
vectorized: true
vector_stored_at: 2026-01-20 10:35:42.123
```

### **Test 3: Check Vectorization Logs**

```sql
SELECT * FROM vectorization_logs ORDER BY attempted_at DESC LIMIT 10;
```

**Expected output:**
```
log_id    | query_id  | status  | duration | attempted_at
----------|-----------|---------|----------|------------------
uuid-123  | uuid-abc  | success | 1250     | 2026-01-20 10:35:42
```

### **Test 4: Manual Trigger via API**

**Using curl:**

```bash
# Get auth token first
TOKEN="your-jwt-token"

# Manually vectorize a query
curl -X POST http://localhost:3000/api/vectorization/query/{query-id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Query {query-id} vectorized successfully",
  "queryId": "{query-id}"
}
```

### **Test 5: Check Screen 8 Connection**

```bash
curl http://localhost:3000/api/vectorization/health/screen8 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "success": true,
  "screen8": {
    "status": "healthy",
    "url": "http://localhost:8001"
  }
}
```

---

## 🔄 **How It Works**

### **Automatic Flow:**

```
1. Vendor submits query via Screen 3
   ↓
2. Query saved to PostgreSQL
   • vectorized: false
   ↓
3. Cron job runs every 5 minutes
   ↓
4. Job finds unvectorized queries
   ↓
5. For each query:
   • Call vectorization.service.ts
   • Service calls Screen 8 API
   • Screen 8 generates embedding
   • Screen 8 stores in ChromaDB
   • Service updates PostgreSQL
   • Log attempt to vectorization_logs
   ↓
6. Query now vectorized: true
```

### **Manual Flow:**

```
1. Admin clicks "Vectorize" button
   ↓
2. Frontend calls API:
   POST /api/vectorization/query/{id}
   ↓
3. Controller triggers vectorization
   ↓
4. Same process as automatic flow
   ↓
5. Returns success/failure immediately
```

---

## 📊 **API Endpoints**

All endpoints require authentication (`Bearer token`).

### **1. Manually Vectorize a Query**

```http
POST /api/vectorization/query/:queryId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Query {id} vectorized successfully",
  "queryId": "{id}"
}
```

---

### **2. Batch Vectorize Multiple Queries**

```http
POST /api/vectorization/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "queryIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Batch vectorization completed",
  "results": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "errors": [
      {
        "queryId": "uuid3",
        "error": "Query not found"
      }
    ]
  }
}
```

---

### **3. Get Vectorization Info**

```http
GET /api/vectorization/query/:queryId/info
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queryId": "uuid-abc",
    "vectorized": true,
    "vectorStoredAt": "2026-01-20T10:35:42.123Z",
    "lastAttempt": "2026-01-20T10:35:42.000Z",
    "attemptCount": 1,
    "lastError": null
  }
}
```

---

### **4. Get Failed Vectorizations**

```http
GET /api/vectorization/failures
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "logId": "uuid-123",
      "queryId": "uuid-abc",
      "status": "failed",
      "duration": 500,
      "errorMessage": "Connection timeout",
      "attemptedAt": "2026-01-20T10:30:00.000Z"
    }
  ]
}
```

---

### **5. Retry Failed Vectorizations**

```http
POST /api/vectorization/retry-failures
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Retry completed",
  "results": {
    "successful": 5,
    "failed": 2
  }
}
```

---

### **6. Delete from Vector Database**

```http
DELETE /api/vectorization/query/:queryId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Query {id} deleted from vector database",
  "queryId": "{id}"
}
```

---

### **7. Check Screen 8 Health**

```http
GET /api/vectorization/health/screen8
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "screen8": {
    "status": "healthy",
    "url": "http://localhost:8001"
  }
}
```

---

### **8. Get Service Configuration**

```http
GET /api/vectorization/config
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "config": {
    "screen8Url": "http://localhost:8001",
    "requestTimeout": 30000,
    "maxRetries": 3,
    "retryDelay": 2000
  }
}
```

---

## 🎛️ **Configuration Options**

### **Environment Variables:**

```bash
# Screen 8 URL
SCREEN8_URL=http://localhost:8001

# Enable/disable vectorization
VECTORIZATION_ENABLED=true

# Batch processing
VECTORIZATION_BATCH_SIZE=10          # Process 10 queries at a time

# Timeouts
VECTORIZATION_TIMEOUT=30000          # 30 seconds

# Retry logic
VECTORIZATION_MAX_RETRIES=3          # Retry up to 3 times
VECTORIZATION_RETRY_DELAY=2000       # Wait 2 seconds between retries
```

### **Cron Schedule:**

Change the schedule in `query-vectorization.job.ts`:

```typescript
// Current: Every 5 minutes
@Cron(CronExpression.EVERY_5_MINUTES)

// Options:
@Cron(CronExpression.EVERY_MINUTE)      // Every minute
@Cron(CronExpression.EVERY_10_MINUTES)  // Every 10 minutes
@Cron(CronExpression.EVERY_HOUR)        // Every hour
@Cron('*/2 * * * *')                    // Every 2 minutes (custom)
```

---

## 🐛 **Troubleshooting**

### **Issue 1: Job Not Running**

**Check:**
1. `ScheduleModule.forRoot()` is in `app.module.ts`
2. `QueryVectorizationJob` is in providers array
3. `VECTORIZATION_ENABLED=true` in .env
4. Server is running in dev mode: `npm run start:dev`

---

### **Issue 2: "Cannot connect to Screen 8"**

**Solutions:**
1. Verify Screen 8 is running:
   ```bash
   curl http://localhost:8001/api/health
   ```

2. Check Screen 8 logs for errors

3. Verify `SCREEN8_URL` in .env is correct

4. Test connection:
   ```bash
   curl http://localhost:3000/api/vectorization/health/screen8
   ```

---

### **Issue 3: Queries Not Being Vectorized**

**Debug steps:**

1. **Check database:**
   ```sql
   SELECT COUNT(*) FROM queries WHERE vectorized = false;
   ```

2. **Check logs:**
   ```
   Look for: "Starting Query Vectorization Job"
   ```

3. **Check vectorization_logs:**
   ```sql
   SELECT * FROM vectorization_logs 
   WHERE status = 'failed' 
   ORDER BY attempted_at DESC 
   LIMIT 10;
   ```

4. **Manual trigger:**
   ```bash
   curl -X POST http://localhost:3000/api/vectorization/query/{id}
   ```

---

### **Issue 4: High Failure Rate**

**Common causes:**
1. Screen 8 not running
2. Screen 8 taking too long (timeout)
3. Invalid query data

**Solutions:**
1. Increase timeout:
   ```bash
   VECTORIZATION_TIMEOUT=60000  # 60 seconds
   ```

2. Check Screen 8 performance

3. Review failed logs:
   ```bash
   curl http://localhost:3000/api/vectorization/failures
   ```

---

## 📊 **Monitoring**

### **Database Queries:**

**Vectorization statistics:**
```sql
SELECT 
  COUNT(*) AS total_queries,
  SUM(CASE WHEN vectorized = true THEN 1 ELSE 0 END) AS vectorized,
  SUM(CASE WHEN vectorized = false THEN 1 ELSE 0 END) AS pending,
  ROUND(100.0 * SUM(CASE WHEN vectorized = true THEN 1 ELSE 0 END) / COUNT(*), 2) AS percentage
FROM queries;
```

**Failed attempts:**
```sql
SELECT 
  query_id,
  COUNT(*) AS attempt_count,
  MAX(attempted_at) AS last_attempt,
  MAX(error_message) AS last_error
FROM vectorization_logs
WHERE status = 'failed'
GROUP BY query_id
ORDER BY last_attempt DESC
LIMIT 10;
```

**Performance metrics:**
```sql
SELECT 
  AVG(duration) AS avg_duration_ms,
  MIN(duration) AS min_duration_ms,
  MAX(duration) AS max_duration_ms,
  COUNT(*) AS total_attempts
FROM vectorization_logs
WHERE status = 'success'
  AND attempted_at > NOW() - INTERVAL '24 hours';
```

---

## ✅ **Complete Checklist**

Setup:
- [ ] All 6 files copied to correct locations
- [ ] `@nestjs/schedule` package installed
- [ ] `@nestjs/axios` package installed
- [ ] `ScheduleModule.forRoot()` added to app.module.ts
- [ ] `VectorizationModule` imported in app.module.ts
- [ ] `QueryVectorizationJob` added to providers
- [ ] Environment variables configured
- [ ] Database migration run
- [ ] `vectorized` and `vector_stored_at` columns added to queries table
- [ ] `vectorization_logs` table created

Testing:
- [ ] Backend server starts without errors
- [ ] Job logs show initialization
- [ ] Test query submitted
- [ ] Query vectorized after 5 minutes
- [ ] Manual trigger works via API
- [ ] Screen 8 health check passes
- [ ] Vectorization logs being created

---

## 🎉 **Success!**

If all checks pass, your vectorization system is now:
- ✅ Running automatically every 5 minutes
- ✅ Vectorizing new queries from Screen 3
- ✅ Storing embeddings in ChromaDB (via Screen 8)
- ✅ Logging all attempts for monitoring
- ✅ Providing manual triggers for admin panel
- ✅ Ready for production use

---

**Status:** Production Ready ✅  
**Files:** 6 complete files  
**Dependencies:** @nestjs/schedule, @nestjs/axios  
**Database:** 2 new columns + 1 new table  
**Integration:** Screen 8 Python API
