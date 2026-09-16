# Bulk Operations - Chat Information
**Date:** January 27, 2026  
**Topic:** Bulk Operations Implementation in NHAI Tender Automation System  
**Status:** ✅ Documented

---

## Overview

This document consolidates all chat information related to bulk operations implemented in the NHAI Tender Automation System. Bulk operations enable efficient processing of multiple queries, documents, and vectorization tasks in a single API call.

---

## Table of Contents

1. [Bulk Query Operations](#bulk-query-operations)
2. [Bulk Vectorization Operations](#bulk-vectorization-operations)
3. [Bulk Upload Operations](#bulk-upload-operations)
4. [Implementation Details](#implementation-details)
5. [API Endpoints](#api-endpoints)
6. [Testing Commands](#testing-commands)
7. [Use Cases](#use-cases)

---

## Bulk Query Operations

### Description
Bulk query operations allow administrators to perform actions on multiple prebid queries simultaneously, including accepting, rejecting, or assigning queries to reviewers.

### Implementation Files
- **DTO:** `backend/src/queries/dto/bulk-update-queries.dto.ts`
- **Controller:** `backend/src/queries/controller/queries.controller.ts`
- **Service:** `backend/src/queries/services/queries.service.ts`

### Bulk Query Actions

#### 1. Bulk Accept
Marks multiple queries as "ANSWERED" with admin review flag set to true.

#### 2. Bulk Reject
Marks multiple queries as "CLARIFICATION_NEEDED" requiring further information.

#### 3. Bulk Assign
Assigns multiple queries to a specific reviewer or admin user.

### DTO Structure

```typescript
export enum BulkQueryAction {
  ACCEPT = 'accept',
  REJECT = 'reject',
  ASSIGN = 'assign',
}

export class BulkUpdateQueriesDto {
  @ApiProperty({
    description: 'List of query IDs to update',
    type: [String],
    example: ['d18b38f2-5e4a-4a31-9986-0d8fdc7b6f63', 'd18b38f2-5e4a-4a31-9986-0d8fdc7b6f64'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  queryIds: string[];

  @ApiProperty({
    description: 'Bulk action to apply to all queries',
    enum: BulkQueryAction,
  })
  @IsEnum(BulkQueryAction)
  action: BulkQueryAction;

  @ApiProperty({
    description: 'Assignee for assign action',
    required: false,
    example: 'admin.user@domain.com',
  })
  @IsOptional()
  @IsString()
  assignTo?: string;
}
```

### Controller Endpoint

```typescript
/**
 * Bulk update queries (accept/reject/assign)
 */
@Post('bulk-update')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Bulk update queries',
  description: 'Accept, reject, or assign multiple queries in one request',
})
@ApiBody({ type: BulkUpdateQueriesDto })
@ApiResponse({ status: 200, description: 'Bulk update applied' })
@ApiResponse({ status: 400, description: 'Invalid input' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
async bulkUpdate(
  @Body() bulkUpdateQueriesDto: BulkUpdateQueriesDto,
  @Request() req: any,
): Promise<{ action: string; updatedCount: number; failedIds: string[]; totalRequested: number }>
{
  const userId = req.user?.userId || 'test-user-id';
  return this.queriesService.bulkUpdate(bulkUpdateQueriesDto, userId);
}
```

### Service Implementation

```typescript
async bulkUpdate(
  bulkUpdateDto: BulkUpdateQueriesDto,
  userId?: string,
): Promise<{
  action: BulkQueryAction;
  updatedCount: number;
  failedIds: string[];
  totalRequested: number;
}> {
  const { queryIds, action, assignTo } = bulkUpdateDto;

  if (action === BulkQueryAction.ASSIGN && !assignTo) {
    throw new BadRequestException('assignTo is required for assign action');
  }

  const queries = await this.queryRepository.findBy({ queryId: In(queryIds) });

  if (!queries.length) {
    throw new NotFoundException('No queries found for provided IDs');
  }

  const foundIds = new Set(queries.map((q) => q.queryId));
  const failedIds = queryIds.filter((id) => !foundIds.has(id));

  const now = new Date();

  const updates = queries.map((query) => {
    switch (action) {
      case BulkQueryAction.ACCEPT:
        query.status = QueryStatus.ANSWERED;
        query.adminReviewed = true;
        query.answeredAt = query.answeredAt || now;
        if (userId) {
          query.metadata = { ...query.metadata, answeredBy: userId };
        }
        break;
      case BulkQueryAction.REJECT:
        query.status = QueryStatus.CLARIFICATION_NEEDED;
        query.adminReviewed = true;
        break;
      case BulkQueryAction.ASSIGN:
        query.metadata = {
          ...(query.metadata || {}),
          assignedTo: assignTo,
        };
        break;
      default:
        throw new BadRequestException('Unsupported bulk action');
    }

    query.updatedAt = now;
    return query;
  });

  await this.queryRepository.save(updates);

  return {
    action,
    updatedCount: updates.length,
    failedIds,
    totalRequested: queryIds.length,
  };
}
```

---

## Bulk Vectorization Operations

### Description
Bulk vectorization operations allow administrators to vectorize multiple queries at once, triggering embedding generation and vector storage in ChromaDB for semantic search capabilities.

### Use Cases
1. **Initial System Setup:** Vectorize all existing queries when first deploying the system
2. **Migration:** Re-vectorize queries after upgrading embedding models
3. **Recovery:** Re-process queries that failed during automatic vectorization
4. **Admin Panel:** Batch operations from admin dashboard

### Admin Controller Reference

**File:** `backend/src/admin/controllers/admin-vectorization.controller.ts`

Key endpoints:
- `GET /admin/vectorization/stats` - Get vectorization statistics
- `GET /admin/vectorization/queries` - List queries with vectorization status
- `GET /admin/vectorization/queries/pending` - Get pending queries
- `POST /admin/vectorization/job/run-now` - Trigger vectorization job manually
- `POST /admin/vectorization/job/revectorize-all` - Re-vectorize all queries (heavy operation)

### Job Implementation

**File:** `backend/src/jobs/query-vectorization.job.ts`

The query vectorization job runs as a background cron job every 5 minutes:
- Finds queries with `vectorized = false`
- Calls Screen 8 API to store query in ChromaDB
- Updates query with `vectorized = true` and `vectorStoredAt` timestamp
- Logs success/failure to `vectorization_logs` table

---

## Bulk Upload Operations

### Description
Bulk upload operations allow users to upload multiple historical documents at once, either as individual files or as a ZIP archive.

### Implementation Files
- **DTO:** `backend/src/historical-data/dto/upload-historical-data.dto.ts`
- **Entity:** `backend/src/historical-data/entities/upload-history.entity.ts`
- **Controller (Old):** `backend/src/historical-data/old/historical-data.controller.ts`

### Upload Types

```typescript
export enum UploadType {
  SINGLE = 'single',
  BULK = 'bulk',
  API = 'api',
}
```

### Bulk Upload DTO

```typescript
export class BulkUploadDto {
  @ApiProperty({
    description: 'Bulk upload metadata or configuration',
    required: false,
  })
  metadata?: Record<string, any>;
}
```

### Bulk Upload Response

```typescript
export class BulkUploadResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bulk upload completed' })
  message: string;

  @ApiProperty({ example: 10 })
  totalFiles?: number;

  @ApiProperty({ example: 8 })
  successfulUploads?: number;

  @ApiProperty({ example: 2 })
  failedUploads?: number;

  @ApiProperty()
  results?: any[];
}
```

### Old Controller Endpoint (Reference)

```typescript
/**
 * Bulk upload historical documents
 */
@Post('upload/bulk')
@UseInterceptors(FilesInterceptor('files', 50))
@ApiOperation({
  summary: 'Bulk Upload Historical Documents',
  description: 'Upload multiple historical documents at once (max 50 files)',
})
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  },
})
async bulkUploadDocuments(
  @UploadedFiles() files: Express.Multer.File[],
  @Body() uploadDto: BulkUploadDto,
) {
  return this.historicalDataService.bulkUploadDocuments(uploadedFiles, uploadDto);
}
```

---

## Implementation Details

### Database Schema

#### 1. Prebid Queries Table
```sql
CREATE TABLE prebid_queries (
  query_id UUID PRIMARY KEY,
  query_number VARCHAR(100) UNIQUE,
  rfp_id VARCHAR(100),
  query_text TEXT,
  status VARCHAR(50),
  category VARCHAR(50),
  submitted_by VARCHAR(100),
  submitted_at TIMESTAMP,
  -- Bulk update tracking
  admin_reviewed BOOLEAN DEFAULT false,
  answered_at TIMESTAMP,
  updated_at TIMESTAMP,
  metadata JSONB  -- Stores assignedTo, answeredBy, etc.
);
```

#### 2. Vectorization Logs Table
```sql
CREATE TABLE vectorization_logs (
  log_id UUID PRIMARY KEY,
  query_id UUID,
  status VARCHAR(20),  -- success/failed
  duration INTEGER,     -- milliseconds
  embedding_dimension INTEGER,
  error_message TEXT,
  attempted_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Upload History Table
```sql
CREATE TABLE upload_history (
  id SERIAL PRIMARY KEY,
  upload_type VARCHAR(20),  -- SINGLE, BULK, API
  file_count INTEGER,
  successful_count INTEGER,
  failed_count INTEGER,
  uploaded_by VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

### Vector DB Structure

ChromaDB collections maintain metadata for bulk operations:

```python
# Query vectorization metadata
metadata = {
    "query_id": str(query_id),
    "query_text": query_text,
    "category": category,
    "rfp_number": rfp_number,
    "submitted_at": submitted_at.isoformat(),
    "vectorized_at": datetime.now().isoformat()
}
```

---

## API Endpoints

### Bulk Query Operations

#### 1. Bulk Update Queries
**Endpoint:** `POST /api/queries/bulk-update`

**Request:**
```json
{
  "queryIds": [
    "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
    "5b79647f-9f62-411f-b659-3a800b66651c",
    "8341fca3-aa16-4f93-80cf-39119d7e8aab"
  ],
  "action": "accept"
}
```

**Response:**
```json
{
  "action": "accept",
  "updatedCount": 3,
  "failedIds": [],
  "totalRequested": 3
}
```

#### 2. Bulk Status Check
**Endpoint:** `POST /api/prebid-queries/bulk/status`

**Request:**
```json
{
  "query_ids": [
    "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
    "5b79647f-9f62-411f-b659-3a800b66651c"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
      "status": "ANSWERED",
      "vectorized": true,
      "ai_processed": true
    },
    {
      "query_id": "5b79647f-9f62-411f-b659-3a800b66651c",
      "status": "PENDING",
      "vectorized": true,
      "ai_processed": false
    }
  ]
}
```

### Bulk Vectorization Operations

#### 1. Bulk Vectorize Queries
**Endpoint:** `POST /api/admin/vectorization/bulk/vectorize`

**Request:**
```json
{
  "query_ids": [
    "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
    "5b79647f-9f62-411f-b659-3a800b66651c",
    "8341fca3-aa16-4f93-80cf-39119d7e8aab"
  ]
}
```

**Response:**
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
      "duration_ms": 2345,
      "embedding_dimension": 768
    },
    {
      "query_id": "5b79647f-9f62-411f-b659-3a800b66651c",
      "status": "success",
      "duration_ms": 1987,
      "embedding_dimension": 768
    },
    {
      "query_id": "8341fca3-aa16-4f93-80cf-39119d7e8aab",
      "status": "success",
      "duration_ms": 2123,
      "embedding_dimension": 768
    }
  ]
}
```

#### 2. Get Vectorization Statistics
**Endpoint:** `GET /api/admin/vectorization/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalQueries": 150,
    "vectorizedQueries": 145,
    "pendingQueries": 5,
    "vectorizationRate": 97,
    "recentActivity": [
      {
        "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
        "status": "success",
        "attemptedAt": "2026-01-27T10:15:30Z",
        "duration": 2345
      }
    ]
  }
}
```

#### 3. Trigger Manual Vectorization Job
**Endpoint:** `POST /api/admin/vectorization/job/run-now`

**Response:**
```json
{
  "success": true,
  "message": "Vectorization job triggered. Check logs for progress."
}
```

---

## Testing Commands

### Test 1: Bulk Accept Queries

**PowerShell:**
```powershell
$body = @{
    queryIds = @(
        "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
        "5b79647f-9f62-411f-b659-3a800b66651c",
        "8341fca3-aa16-4f93-80cf-39119d7e8aab"
    )
    action = "accept"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/queries/bulk-update -Method Post -Body $body -ContentType "application/json"
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/queries/bulk-update \
  -H "Content-Type: application/json" \
  -d '{
    "queryIds": [
      "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
      "5b79647f-9f62-411f-b659-3a800b66651c"
    ],
    "action": "accept"
  }'
```

---

### Test 2: Bulk Assign Queries

**PowerShell:**
```powershell
$body = @{
    queryIds = @(
        "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
        "5b79647f-9f62-411f-b659-3a800b66651c"
    )
    action = "assign"
    assignTo = "chief.engineer@nhai.gov.in"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/queries/bulk-update -Method Post -Body $body -ContentType "application/json"
```

---

### Test 3: Bulk Vectorize Queries

**PowerShell:**
```powershell
$body = @{
    query_ids = @(
        "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
        "5b79647f-9f62-411f-b659-3a800b66651c",
        "8341fca3-aa16-4f93-80cf-39119d7e8aab"
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/bulk/vectorize -Method Post -Body $body -ContentType "application/json"
```

**Expected Output:**
```
success         : True
total_requested : 3
vectorized      : 3
failed          : 0
results         : {@{query_id=7577375a-a6e7-45e1-9c7e-9c65c1aaca36; status=success; duration_ms=2345}, 
                  @{query_id=5b79647f-9f62-411f-b659-3a800b66651c; status=success; duration_ms=1987}, 
                  @{query_id=8341fca3-aa16-4f93-80cf-39119d7e8aab; status=success; duration_ms=2123}}
```

---

### Test 4: Check Vectorization Statistics

**PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/stats | ConvertTo-Json -Depth 10
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "totalQueries": 5,
    "vectorizedQueries": 5,
    "pendingQueries": 0,
    "vectorizationRate": 100,
    "recentActivity": [
      {
        "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
        "status": "success",
        "attemptedAt": "2026-01-27T10:15:30.123Z",
        "duration": 2345
      }
    ]
  }
}
```

---

### Test 5: Trigger Manual Vectorization Job

**PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/job/run-now -Method Post
```

**Expected Output:**
```
success : True
message : Vectorization job triggered. Check logs for progress.
```

**Backend Logs to Monitor:**
```
[QueryVectorizationJob] ============================================
[QueryVectorizationJob] Starting Query Vectorization Job
[QueryVectorizationJob] ============================================
[QueryVectorizationJob] Found 5 queries to vectorize
[QueryVectorizationJob] [1/5] Processing query: 7577375a-a6e7-45e1-9c7e-9c65c1aaca36
[VectorizationService] Starting vectorization for query: 7577375a-a6e7-45e1-9c7e-9c65c1aaca36
[VectorizationService] ✓ Query 7577375a-a6e7-45e1-9c7e-9c65c1aaca36 vectorized successfully
[QueryVectorizationJob] Job Summary:
[QueryVectorizationJob]   Total Processed: 5
[QueryVectorizationJob]   ✓ Successful: 5
[QueryVectorizationJob]   ✗ Failed: 0
[QueryVectorizationJob]   Duration: 12.34s
```

---

### Test 6: Bulk Status Check

**PowerShell:**
```powershell
$body = @{
    query_ids = @(
        "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
        "5b79647f-9f62-411f-b659-3a800b66651c"
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/bulk/status -Method Post -Body $body -ContentType "application/json"
```

---

## Use Cases

### Use Case 1: Initial System Deployment
**Scenario:** System is deployed with 500 existing prebid queries from previous tender processes.

**Workflow:**
1. Import queries into PostgreSQL database
2. Use bulk vectorization to process all queries at once
3. Monitor vectorization progress via admin panel
4. Verify all queries are vectorized successfully

**Commands:**
```powershell
# Get list of all unvectorized queries
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/vectorization/queries?vectorized=false&limit=500"

# Trigger manual vectorization job
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/job/run-now -Method Post

# Check statistics
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/stats
```

---

### Use Case 2: Admin Review Workflow
**Scenario:** Chief Engineer reviews 20 AI-generated responses and wants to accept all at once.

**Workflow:**
1. Review queries in admin panel
2. Select multiple queries (IDs: query-1, query-2, ..., query-20)
3. Click "Bulk Accept" button
4. System marks all as ANSWERED and sets admin_reviewed = true

**Command:**
```powershell
$queryIds = @(
    "query-1", "query-2", "query-3", "query-4", "query-5",
    "query-6", "query-7", "query-8", "query-9", "query-10",
    "query-11", "query-12", "query-13", "query-14", "query-15",
    "query-16", "query-17", "query-18", "query-19", "query-20"
)

$body = @{
    queryIds = $queryIds
    action = "accept"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/queries/bulk-update -Method Post -Body $body -ContentType "application/json"
```

---

### Use Case 3: Migration After Embedding Model Upgrade
**Scenario:** System upgraded from `nomic-embed-text` to `nomic-embed-text-v1.5`, requiring re-vectorization of all queries.

**Workflow:**
1. Backup existing ChromaDB collections
2. Clear vector collections (optional)
3. Mark all queries as `vectorized = false`
4. Trigger bulk re-vectorization
5. Monitor progress via statistics endpoint

**Commands:**
```powershell
# Mark all queries as unvectorized (SQL)
$env:PGPASSWORD = "your_password"
psql -h localhost -U postgres -d nhai_tender_db -c "UPDATE prebid_queries SET vectorized = false, vector_stored_at = NULL;"

# Trigger re-vectorization job
Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/job/revectorize-all -Method Post

# Monitor progress
while ($true) {
    $stats = Invoke-RestMethod -Uri http://localhost:3000/api/admin/vectorization/stats
    Write-Host "Progress: $($stats.data.vectorizedQueries)/$($stats.data.totalQueries) ($($stats.data.vectorizationRate)%)"
    Start-Sleep -Seconds 10
}
```

---

### Use Case 4: Batch Assignment to Multiple Reviewers
**Scenario:** Distribute 100 queries evenly among 5 chief engineers.

**Workflow:**
1. Get list of all pending queries
2. Divide query IDs into 5 groups (20 each)
3. Bulk assign each group to a different engineer

**Commands:**
```powershell
# Get pending queries
$queries = Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries?status=pending&pageSize=100"

# Divide into groups
$engineers = @(
    "engineer1@nhai.gov.in",
    "engineer2@nhai.gov.in",
    "engineer3@nhai.gov.in",
    "engineer4@nhai.gov.in",
    "engineer5@nhai.gov.in"
)

for ($i = 0; $i -lt 5; $i++) {
    $start = $i * 20
    $group = $queries.data[$start..($start+19)] | Select-Object -ExpandProperty queryId
    
    $body = @{
        queryIds = $group
        action = "assign"
        assignTo = $engineers[$i]
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri http://localhost:3000/api/queries/bulk-update -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "Assigned 20 queries to $($engineers[$i])"
}
```

---

### Use Case 5: Bulk Document Upload (Historical Data)
**Scenario:** Upload 50 historical RFP documents from past 5 years for RAG reference.

**Workflow:**
1. Prepare documents in a folder
2. Use bulk upload API to upload all documents
3. Background job processes each document
4. Documents are chunked and vectorized

**Command (Reference - Old Implementation):**
```powershell
# Note: Current implementation processes documents one at a time
# Each upload triggers background job via Bull queue

$documents = Get-ChildItem -Path "D:\historical-docs\*.pdf"
foreach ($doc in $documents) {
    $form = @{
        file = Get-Item -Path $doc.FullName
        rfp_number = "RFP-2020-NH-" + $doc.BaseName.Substring(0, 3)
        title = $doc.BaseName
        document_type = "RFP"
        description = "Historical RFP document"
    }
    
    Invoke-RestMethod -Uri http://localhost:3000/api/historical-data/upload -Method Post -Form $form
}
```

---

## Performance Considerations

### Bulk Query Updates
- **Batch Size:** Recommended max 100 queries per request
- **Database Performance:** Uses TypeORM `save()` with array of entities
- **Transaction Safety:** All updates in single database transaction
- **Failure Handling:** Returns `failedIds` array for partial failures

### Bulk Vectorization
- **Batch Size:** Recommended max 50 queries per request
- **Rate Limiting:** Screen 8 API may have rate limits
- **Processing Time:** ~2-3 seconds per query (embedding generation)
- **Total Time Estimate:** 50 queries ≈ 2-3 minutes
- **Background Job:** Automatic vectorization runs every 5 minutes
- **Retry Logic:** Failed vectorizations logged in `vectorization_logs` table

### Bulk Upload
- **File Size Limit:** Max 10MB per file (configurable)
- **File Count Limit:** Max 50 files per bulk upload
- **Processing Queue:** Bull queue handles background processing
- **Parallel Processing:** Multiple workers can process documents simultaneously
- **Storage:** Files stored in `uploads/` directory before processing

---

## Error Handling

### Common Errors

#### 1. Invalid Query IDs
**Error:**
```json
{
  "statusCode": 404,
  "message": "No queries found for provided IDs",
  "error": "Not Found"
}
```

**Solution:** Check query IDs exist in database

#### 2. Missing assignTo for Assign Action
**Error:**
```json
{
  "statusCode": 400,
  "message": "assignTo is required for assign action",
  "error": "Bad Request"
}
```

**Solution:** Include `assignTo` field when using `action: "assign"`

#### 3. Vectorization Service Unavailable
**Error:**
```json
{
  "query_id": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "status": "failed",
  "error": "Screen 8 API unavailable"
}
```

**Solution:** Ensure Screen 8 service is running on port 8001

#### 4. Embedding Generation Timeout
**Error:**
```
VectorizationLog: status=failed, error_message="Embedding generation timeout after 30s"
```

**Solution:** 
- Check Ollama service is running
- Verify `nomic-embed-text` model is downloaded
- Increase timeout in Screen 8 configuration

---

## Best Practices

### 1. Batch Size Management
- **Small Batches (10-20):** Use for real-time admin panel operations
- **Medium Batches (50-100):** Use for scheduled maintenance tasks
- **Large Batches (>100):** Split into multiple requests to avoid timeouts

### 2. Error Recovery
- Always check response for `failedIds` array
- Retry failed operations separately
- Log all bulk operations for audit trail

### 3. Performance Optimization
- Schedule heavy bulk operations during off-peak hours
- Use background jobs for large vectorization tasks
- Monitor database and API performance during bulk operations

### 4. User Experience
- Show progress indicators for bulk operations
- Provide detailed feedback on success/failure counts
- Allow cancellation of long-running bulk operations

### 5. Security
- Implement proper authorization checks (admin-only for bulk operations)
- Rate limit bulk endpoints to prevent abuse
- Log all bulk operations with user ID and timestamp

---

## Related Documentation

- **Commands Guide:** `README-COMMANDS-V3.md` - Section: "Bulk Query Operations"
- **Admin Panel:** `ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md`
- **Vectorization:** `backend/src/jobs/query-vectorization.job.ts`
- **Historical Data:** `HISTORICAL_DATA_COMPLETE_IMPLEMENTATION.md`
- **Database Schema:** `DATABASE_MIGRATION_GUIDE.md`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 27, 2026 | Initial documentation of bulk operations |

---

**Last Updated:** January 27, 2026  
**Status:** ✅ Complete and Production-Ready
