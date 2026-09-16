# Screen 8: Pre-bid Query Management System
**Date:** January 27, 2026  
**Topic:** Complete documentation of Pre-bid Query Management (Screen 8) system  
**Status:** ✅ Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [API Endpoints](#api-endpoints)
6. [Testing Commands](#testing-commands)
7. [Integration with Chief Engineer Agent](#integration-with-chief-engineer-agent)
8. [Vector Database Integration](#vector-database-integration)
9. [Workflow Execution](#workflow-execution)
10. [Related Systems](#related-systems)

---

## System Overview

**Screen 8: Pre-bid Query Management** is a comprehensive system for managing pre-bid queries submitted by vendors during the RFP process. It integrates with the Chief Engineer Agent (Python RAG service on port 8001) to provide AI-powered query processing, similarity search, and automated response generation.

### Key Features

✅ **Query Management:**
- Create, read, update, delete (CRUD) operations
- Status tracking (pending, under_review, answered, clarification_needed)
- Priority management (low, medium, high)
- Category classification (technical, commercial, eligibility, contractual, general)

✅ **AI Integration:**
- Automated query processing via Chief Engineer Agent
- Historical data retrieval for similar past queries
- Confidence scoring for AI-generated responses
- Multiple response types (AI, past reference, past, admin)

✅ **Vector Database:**
- Query vectorization for semantic search
- Similar query detection using embeddings
- ChromaDB integration via Screen 8 Python service
- Automatic background vectorization job

✅ **Admin Features:**
- Admin review and approval workflow
- Bulk operations (accept, reject, assign)
- Export functionality (CSV, XLSX)
- Audit trail and query history

✅ **Workflow Execution:**
- 6-step Chief Engineer workflow
- Execution tracking and monitoring
- Step-by-step progress updates
- Execution history and details

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                 Pre-bid Query Management System                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │   │
│  │   (Next.js)  │     │   (NestJS)   │     │   Database   │   │
│  │  Port 3001   │     │  Port 3000   │     │  Port 5432   │   │
│  └──────────────┘     └──────┬───────┘     └──────────────┘   │
│                              │                                   │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │   Screen 8 API   │                         │
│                    │  Chief Engineer  │                         │
│                    │     (Python)     │                         │
│                    │   Port 8001      │                         │
│                    └─────────┬────────┘                         │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │    ChromaDB      │                         │
│                    │  Vector Storage  │                         │
│                    │  query_db/       │                         │
│                    └──────────────────┘                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Query Submission:**
   - Vendor submits query via frontend
   - Backend creates entry in `prebid_queries` table
   - Query assigned unique UUID and query number

2. **AI Processing:**
   - Backend calls Screen 8 API `/api/chief-engineer/process`
   - Chief Engineer Agent executes 6-step workflow
   - Workflow retrieves historical data, generates response
   - Response saved to database with confidence score

3. **Vectorization:**
   - Background cron job identifies unvectorized queries
   - Calls Screen 8 API `/api/chief-engineer/store-query`
   - Query text converted to embeddings (Ollama nomic-embed-text)
   - Embeddings stored in ChromaDB for similarity search

4. **Admin Review:**
   - Admin views AI-generated response
   - Can accept, reject, or modify response
   - Bulk operations for batch processing
   - Final response published to vendor

---

## Database Schema

### Table: prebid_queries

**Purpose:** Store all pre-bid queries with AI responses and workflow execution data

**Schema:**
```sql
CREATE TABLE prebid_queries (
  -- Primary Keys
  query_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_number VARCHAR(100) UNIQUE NOT NULL,
  
  -- References
  rfp_id VARCHAR(100) NOT NULL,
  submitted_by VARCHAR(100) NOT NULL,
  answered_by VARCHAR(100),
  execution_id VARCHAR(255),
  
  -- Query Data
  query_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'technical', 'commercial', 'eligibility', 'contractual', 'general'
  )),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN (
    'low', 'medium', 'high'
  )),
  attachments JSONB,
  
  -- Status Tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'answered', 'clarification_needed'
  )),
  ai_processed BOOLEAN DEFAULT false,
  admin_reviewed BOOLEAN DEFAULT false,
  
  -- Responses
  ai_response TEXT,
  past_ref_response TEXT,
  past_response TEXT,
  admin_response TEXT,
  
  -- Confidence & Sources
  confidence DECIMAL(5,2),
  source_documents TEXT[],
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  responded_at TIMESTAMP,
  answered_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_prebid_queries_rfp_status ON prebid_queries(rfp_id, status);
CREATE INDEX idx_prebid_queries_submitted_by ON prebid_queries(submitted_by);
CREATE INDEX idx_prebid_queries_submitted_at ON prebid_queries(submitted_at);
CREATE INDEX idx_prebid_queries_category ON prebid_queries(category);
CREATE INDEX idx_prebid_queries_ai_processed ON prebid_queries(ai_processed);
CREATE INDEX idx_prebid_queries_query_number ON prebid_queries(query_number);
```

### TypeORM Entity

**File:** `backend/src/prebid-query/entities/prebid-query.entity.ts`

```typescript
@Entity('prebid_queries')
@Index(['rfpId', 'status'])
@Index(['submittedBy'])
@Index(['submittedAt'])
@Index(['category'])
export class PrebidQuery {
  @PrimaryGeneratedColumn('uuid')
  queryId: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  queryNumber: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  rfpId: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  submittedBy: string;

  @Column({
    type: 'enum',
    enum: ['technical', 'commercial', 'eligibility', 'contractual', 'general'],
  })
  @Index()
  category: string;

  @Column({ type: 'text' })
  queryText: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Record<string, any>[];

  @Column({
    type: 'enum',
    enum: ['pending', 'under_review', 'answered', 'clarification_needed'],
    default: 'pending',
  })
  @Index()
  status: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  aiProcessed: boolean;

  @Column({ type: 'boolean', default: false })
  adminReviewed: boolean;

  @CreateDateColumn()
  @Index()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  answeredAt: Date;

  @Column({ type: 'text', nullable: true })
  aiResponse: string;

  @Column({ type: 'text', nullable: true })
  pastRefResponse: string;

  @Column({ type: 'text', nullable: true })
  pastResponse: string;

  @Column({ type: 'text', nullable: true })
  adminResponse: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence: number;

  @Column({ type: 'text', array: true, nullable: true })
  sourceDocuments: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  executionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  answeredBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
```

---

## Backend Implementation

### Controller: prebid-query.controller.ts

**File:** `backend/src/prebid-query/prebid-query.controller.ts`

**API Tag:** `Pre-bid Query Management`  
**Base Path:** `/api/prebid-queries`

#### Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/statistics` | Get query statistics (total, by status, by category) |
| GET | `/` | Get all queries with filtering and pagination |
| GET | `/:id` | Get single query by UUID |
| POST | `/:id/process` | Trigger AI processing via Chief Engineer Agent |
| PATCH | `/:id/status` | Update query status |
| POST | `/:id/admin-response` | Save admin response |
| GET | `/:id/history` | Get query audit trail |
| GET | `/:id/similar` | Find similar queries using vector search |
| GET | `/workflow/executions` | Get workflow execution history |
| GET | `/workflow/executions/:executionId` | Get specific execution details |

#### Key Controller Methods

**1. Get All Queries**
```typescript
@Get()
@ApiOperation({
  summary: 'Get All Pre-bid Queries',
  description: 'Retrieve list of all pre-bid queries with optional filters',
})
@ApiQuery({ name: 'status', required: false, enum: ['pending', 'under_review', 'answered', 'clarification_needed'] })
@ApiQuery({ name: 'category', required: false })
@ApiQuery({ name: 'rfpId', required: false })
@ApiQuery({ name: 'aiProcessed', required: false, type: Boolean })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'pageSize', required: false, type: Number })
async getQueries(
  @Query('status') status?: string,
  @Query('category') category?: string,
  @Query('rfpId') rfpId?: string,
  @Query('aiProcessed') aiProcessed?: string,
  @Query('page') page?: string,
  @Query('pageSize') pageSize?: string,
) {
  const pageNum = page ? parseInt(page, 10) : 1;
  const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
  
  return this.prebidQueryService.getQueries({
    status,
    category,
    rfpId,
    aiProcessed: aiProcessed === 'true' ? true : aiProcessed === 'false' ? false : undefined,
    page: isNaN(pageNum) ? 1 : pageNum,
    pageSize: isNaN(pageSizeNum) ? 20 : pageSizeNum,
  });
}
```

**2. Process Query (AI)**
```typescript
@Post(':id/process')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Process Query with AI',
  description: 'Trigger Chief Engineer Agent to process the query',
})
@ApiParam({ name: 'id', type: String, description: 'Query UUID' })
async processQuery(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() processDto: ProcessQueryDto,
) {
  return this.prebidQueryService.processQuery(id, processDto);
}
```

**3. Get Similar Queries**
```typescript
@Get(':id/similar')
@ApiOperation({
  summary: 'Get Similar Queries',
  description: 'Find similar past queries for reference',
})
@ApiParam({ name: 'id', type: String, description: 'Query UUID' })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
async getSimilarQueries(
  @Param('id', ParseUUIDPipe) id: string,
  @Query('limit') limit: number = 5,
) {
  return this.prebidQueryService.getSimilarQueries(id, Number(limit));
}
```

### DTOs

#### ProcessQueryDto
**File:** `backend/src/prebid-query/dto/process-query.dto.ts`

```typescript
export class ProcessQueryDto {
  @ApiProperty({
    description: 'Force reprocessing even if already processed',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceReprocess?: boolean;

  @ApiProperty({
    description: 'Additional metadata for processing',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
```

#### AIResponseDto
**File:** `backend/src/prebid-query/dto/ai-response.dto.ts`

```typescript
export class AIResponseDto {
  @ApiProperty({
    description: 'Admin response text',
    example: 'The project duration is 24 months as specified in Section 3.2',
  })
  @IsString()
  @IsNotEmpty()
  response: string;

  @ApiProperty({
    description: 'Additional notes or comments',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Source documents referenced',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourceDocuments?: string[];
}
```

---

## API Endpoints

### Complete API Reference

#### 1. GET /api/prebid-queries/statistics

**Description:** Get comprehensive statistics for pre-bid queries

**Request:**
```bash
curl http://localhost:3000/api/prebid-queries/statistics
```

**Response:**
```json
{
  "total_queries": 150,
  "by_status": {
    "pending": 45,
    "under_review": 30,
    "answered": 70,
    "clarification_needed": 5
  },
  "by_category": {
    "technical": 60,
    "commercial": 40,
    "eligibility": 20,
    "contractual": 15,
    "general": 15
  },
  "ai_processed": 120,
  "admin_reviewed": 75,
  "avg_confidence": 0.87
}
```

---

#### 2. GET /api/prebid-queries

**Description:** Get all queries with filtering and pagination

**Query Parameters:**
- `status` (optional): Filter by status
- `category` (optional): Filter by category
- `rfpId` (optional): Filter by RFP ID
- `aiProcessed` (optional): Filter by AI processing status
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

**Request:**
```bash
curl "http://localhost:3000/api/prebid-queries?status=pending&page=1&pageSize=10"
```

**Response:**
```json
{
  "data": [
    {
      "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
      "queryNumber": "QRY-2024-001",
      "rfpId": "RFP-2024-NH-001",
      "queryText": "What is the project duration?",
      "category": "technical",
      "status": "pending",
      "priority": "medium",
      "submittedBy": "vendor-001",
      "submittedAt": "2026-01-15T10:30:00Z",
      "aiProcessed": false,
      "adminReviewed": false
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pageSize": 10,
    "totalPages": 15
  }
}
```

---

#### 3. GET /api/prebid-queries/:id

**Description:** Get single query by UUID

**Request:**
```bash
curl http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36
```

**Response:**
```json
{
  "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "queryNumber": "QRY-2024-001",
  "rfpId": "RFP-2024-NH-001",
  "queryText": "What is the project duration?",
  "category": "technical",
  "status": "answered",
  "priority": "high",
  "submittedBy": "vendor-001",
  "submittedAt": "2026-01-15T10:30:00Z",
  "aiProcessed": true,
  "adminReviewed": true,
  "processedAt": "2026-01-15T10:35:00Z",
  "answeredAt": "2026-01-15T11:00:00Z",
  "aiResponse": "Based on the RFP document, the project duration is 24 months from the date of contract signing.",
  "pastRefResponse": "Similar past projects (RFP-2023-NH-045) had 24-month timelines.",
  "confidence": 0.92,
  "sourceDocuments": [
    "RFP-2024-NH-001-Section-3.2.pdf",
    "RFP-2023-NH-045-Timeline.pdf"
  ],
  "executionId": "exec-20260115-103500",
  "answeredBy": "admin-001"
}
```

---

#### 4. POST /api/prebid-queries/:id/process

**Description:** Trigger AI processing via Chief Engineer Agent

**Request:**
```bash
curl -X POST http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36/process \
  -H "Content-Type: application/json" \
  -d '{
    "forceReprocess": false,
    "metadata": {
      "priority": "high"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "executionId": "exec-20260115-103500",
  "status": "PROCESSING",
  "message": "Query sent to Chief Engineer Agent for processing",
  "workflowSteps": [
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
      "name": "Similar Query Detection",
      "status": "PENDING"
    },
    {
      "step": 4,
      "name": "Context Assembly",
      "status": "PENDING"
    },
    {
      "step": 5,
      "name": "Response Generation",
      "status": "PENDING"
    },
    {
      "step": 6,
      "name": "Quality Validation",
      "status": "PENDING"
    }
  ]
}
```

**Backend Logs:**
```
[PrebidQueryService] Processing query: 7577375a-a6e7-45e1-9c7e-9c65c1aaca36
[Screen8Service] Calling Screen 8 API: http://localhost:8001/api/chief-engineer/process
[Screen8Service] Response received: Workflow initiated (execution_id: exec-20260115-103500)
[PrebidQueryService] Query marked as ai_processed=true
```

---

#### 5. PATCH /api/prebid-queries/:id/status

**Description:** Update query status

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "answered"
  }'
```

**Response:**
```json
{
  "success": true,
  "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "previousStatus": "under_review",
  "newStatus": "answered",
  "updatedAt": "2026-01-15T11:00:00Z"
}
```

---

#### 6. POST /api/prebid-queries/:id/admin-response

**Description:** Save admin response for a query

**Request:**
```bash
curl -X POST http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36/admin-response \
  -H "Content-Type: application/json" \
  -d '{
    "response": "The project duration is 24 months as specified in Section 3.2 of the RFP document.",
    "notes": "Verified with project management team.",
    "sourceDocuments": ["RFP-2024-NH-001-Section-3.2.pdf"]
  }'
```

**Response:**
```json
{
  "success": true,
  "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "adminResponse": "The project duration is 24 months as specified in Section 3.2 of the RFP document.",
  "adminReviewed": true,
  "respondedAt": "2026-01-15T11:00:00Z"
}
```

---

#### 7. GET /api/prebid-queries/:id/history

**Description:** Get query audit trail

**Request:**
```bash
curl http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36/history
```

**Response:**
```json
{
  "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "history": [
    {
      "timestamp": "2026-01-15T10:30:00Z",
      "action": "CREATED",
      "actor": "vendor-001",
      "details": "Query submitted"
    },
    {
      "timestamp": "2026-01-15T10:35:00Z",
      "action": "AI_PROCESSING_STARTED",
      "actor": "system",
      "details": "Sent to Chief Engineer Agent"
    },
    {
      "timestamp": "2026-01-15T10:40:00Z",
      "action": "AI_RESPONSE_GENERATED",
      "actor": "system",
      "details": "Confidence: 0.92"
    },
    {
      "timestamp": "2026-01-15T11:00:00Z",
      "action": "ADMIN_REVIEWED",
      "actor": "admin-001",
      "details": "Response approved and published"
    }
  ]
}
```

---

#### 8. GET /api/prebid-queries/:id/similar

**Description:** Find similar queries using vector search

**Query Parameters:**
- `limit` (optional): Number of similar queries to return (default: 5)

**Request:**
```bash
curl "http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36/similar?limit=5"
```

**Response:**
```json
{
  "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "queryText": "What is the project duration?",
  "similarQueries": [
    {
      "queryId": "8341fca3-aa16-4f93-80cf-39119d7e8aab",
      "queryNumber": "QRY-2023-089",
      "queryText": "What is the implementation timeline?",
      "similarityScore": 0.89,
      "category": "technical",
      "rfpId": "RFP-2023-NH-045",
      "aiResponse": "The implementation timeline is 24 months.",
      "confidence": 0.91
    },
    {
      "queryId": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
      "queryNumber": "QRY-2023-112",
      "queryText": "How long does the project take?",
      "similarityScore": 0.85,
      "category": "general",
      "rfpId": "RFP-2023-NH-056",
      "aiResponse": "The project duration is 18-24 months depending on scope.",
      "confidence": 0.88
    }
  ],
  "totalFound": 2
}
```

**Backend Process:**
1. Backend calls Screen 8 API: `POST /api/chief-engineer/similar-queries`
2. Screen 8 uses query embeddings to find similar vectors in ChromaDB
3. Returns ranked results with similarity scores
4. Backend enriches results with additional query metadata

---

#### 9. GET /api/prebid-queries/workflow/executions

**Description:** Get workflow execution history

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)

**Request:**
```bash
curl "http://localhost:3000/api/prebid-queries/workflow/executions?page=1&pageSize=10"
```

**Response:**
```json
{
  "data": [
    {
      "executionId": "exec-20260115-103500",
      "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
      "queryNumber": "QRY-2024-001",
      "startedAt": "2026-01-15T10:35:00Z",
      "completedAt": "2026-01-15T10:40:00Z",
      "status": "COMPLETED",
      "duration": 300000,
      "stepsCompleted": 6,
      "totalSteps": 6
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

---

#### 10. GET /api/prebid-queries/workflow/executions/:executionId

**Description:** Get specific workflow execution details

**Request:**
```bash
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260115-103500
```

**Response:**
```json
{
  "executionId": "exec-20260115-103500",
  "queryId": "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
  "queryText": "What is the project duration?",
  "startedAt": "2026-01-15T10:35:00Z",
  "completedAt": "2026-01-15T10:40:00Z",
  "status": "COMPLETED",
  "duration": 300000,
  "steps": [
    {
      "step": 1,
      "name": "Query Vectorization",
      "status": "COMPLETED",
      "startedAt": "2026-01-15T10:35:00Z",
      "completedAt": "2026-01-15T10:35:02Z",
      "duration": 2000,
      "output": {
        "embeddingDimension": 768,
        "vectorId": "query_7577375a_vec"
      }
    },
    {
      "step": 2,
      "name": "Historical Data Retrieval",
      "status": "COMPLETED",
      "startedAt": "2026-01-15T10:35:02Z",
      "completedAt": "2026-01-15T10:35:10Z",
      "duration": 8000,
      "output": {
        "documentsFound": 15,
        "relevantChunks": 8
      }
    },
    {
      "step": 3,
      "name": "Similar Query Detection",
      "status": "COMPLETED",
      "startedAt": "2026-01-15T10:35:10Z",
      "completedAt": "2026-01-15T10:35:15Z",
      "duration": 5000,
      "output": {
        "similarQueriesFound": 2,
        "avgSimilarity": 0.87
      }
    },
    {
      "step": 4,
      "name": "Context Assembly",
      "status": "COMPLETED",
      "startedAt": "2026-01-15T10:35:15Z",
      "completedAt": "2026-01-15T10:35:18Z",
      "duration": 3000,
      "output": {
        "contextLength": 4096,
        "sourcesIncluded": 5
      }
    },
    {
      "step": 5,
      "name": "Response Generation",
      "status": "COMPLETED",
      "startedAt": "2026-01-15T10:35:18Z",
      "completedAt": "2026-01-15T10:35:38Z",
      "duration": 20000,
      "output": {
        "model": "gemma:2b",
        "responseLength": 342,
        "tokensGenerated": 85
      }
    },
    {
      "step": 6,
      "name": "Quality Validation",
      "status": "COMPLETED",
      "startedAt": "2026-01-15T10:35:38Z",
      "completedAt": "2026-01-15T10:40:00Z",
      "duration": 2000,
      "output": {
        "confidenceScore": 0.92,
        "validationPassed": true
      }
    }
  ],
  "result": {
    "aiResponse": "Based on the RFP document, the project duration is 24 months from the date of contract signing.",
    "confidence": 0.92,
    "sourceDocuments": [
      "RFP-2024-NH-001-Section-3.2.pdf",
      "RFP-2023-NH-045-Timeline.pdf"
    ]
  }
}
```

---

## Testing Commands

### Test 1: Get All Queries

**PowerShell:**
```powershell
# Get all queries
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries | ConvertTo-Json -Depth 10

# Get with filters
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries?status=pending&page=1&pageSize=10" | ConvertTo-Json -Depth 10
```

**cURL:**
```bash
curl http://localhost:3000/api/prebid-queries
curl "http://localhost:3000/api/prebid-queries?status=pending&page=1&pageSize=10"
```

---

### Test 2: Get Query by ID

**PowerShell:**
```powershell
$queryId = "7577375a-a6e7-45e1-9c7e-9c65c1aaca36"
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/$queryId" | ConvertTo-Json -Depth 10
```

**cURL:**
```bash
curl http://localhost:3000/api/prebid-queries/7577375a-a6e7-45e1-9c7e-9c65c1aaca36
```

---

### Test 3: Process Query (AI)

**PowerShell:**
```powershell
$queryId = "fac137a9-4f8b-49e1-9a9a-901f855a8b85"
$body = @{
    forceReprocess = $false
    metadata = @{
        priority = "high"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/$queryId/process" -Method Post -Body $body -ContentType "application/json"
```

**Expected Response:**
```
success         : True
queryId         : fac137a9-4f8b-49e1-9a9a-901f855a8b85
executionId     : exec-20260115-103500
status          : PROCESSING
message         : Query sent to Chief Engineer Agent for processing
```

---

### Test 4: Get Similar Queries

**PowerShell:**
```powershell
$queryId = "7577375a-a6e7-45e1-9c7e-9c65c1aaca36"
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/$queryId/similar?limit=5" | ConvertTo-Json -Depth 10
```

---

### Test 5: Get Statistics

**PowerShell:**
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries/statistics | ConvertTo-Json
```

---

### Test 6: Update Query Status

**PowerShell:**
```powershell
$queryId = "7577375a-a6e7-45e1-9c7e-9c65c1aaca36"
$body = @{
    status = "answered"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/$queryId/status" -Method Patch -Body $body -ContentType "application/json"
```

---

### Test 7: Save Admin Response

**PowerShell:**
```powershell
$queryId = "7577375a-a6e7-45e1-9c7e-9c65c1aaca36"
$body = @{
    response = "The project duration is 24 months as specified in Section 3.2."
    notes = "Verified with project management team."
    sourceDocuments = @("RFP-2024-NH-001-Section-3.2.pdf")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/$queryId/admin-response" -Method Post -Body $body -ContentType "application/json"
```

---

## Integration with Chief Engineer Agent

### Screen 8 Python Service

**Location:** `python-rag/screen08-chief-engineer/`  
**Port:** `8001`  
**Purpose:** Chief Engineer Agent for AI-powered query processing

#### Screen 8 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/statistics` | GET | Service statistics |
| `/api/chief-engineer/store-query` | POST | Store query embeddings in ChromaDB |
| `/api/chief-engineer/process` | POST | Process query via 6-step workflow |
| `/api/chief-engineer/similar-queries` | POST | Find similar queries |
| `/api/workflow/executions` | GET | Get workflow execution history |
| `/api/workflow/executions/{id}` | GET | Get execution details |

#### Backend → Screen 8 Integration

**VectorizationService**

**File:** `backend/src/vectorization/vectorization.service.ts`

```typescript
async vectorizeQuery(queryId: string): Promise<void> {
  const query = await this.prebidQueryRepository.findOne({ where: { queryId } });
  
  if (!query) {
    throw new NotFoundException(`Query ${queryId} not found`);
  }

  // Call Screen 8 API
  const screen8Url = 'http://localhost:8001/api/chief-engineer/store-query';
  
  try {
    const response = await axios.post(screen8Url, {
      query_id: query.queryId,
      query_text: query.queryText,
      category: query.category,
      rfp_number: query.rfpId,
      metadata: {
        submitted_by: query.submittedBy,
        submitted_at: query.submittedAt,
        priority: query.priority,
      },
    }, {
      timeout: 30000, // 30 second timeout
    });

    if (response.data.success) {
      // Update query as vectorized
      query.metadata = {
        ...query.metadata,
        vectorized: true,
        vectorized_at: new Date(),
        embedding_dimension: response.data.embedding_dimension,
      };
      
      await this.prebidQueryRepository.save(query);
      
      // Log success
      await this.logVectorization(queryId, 'success', response.data.duration);
    }
  } catch (error) {
    this.logger.error(`Failed to vectorize query ${queryId}:`, error.message);
    await this.logVectorization(queryId, 'failed', 0, error.message);
    throw error;
  }
}
```

**Query Processing Service**

**File:** `backend/src/prebid-query/prebid-query.service.ts`

```typescript
async processQuery(queryId: string, dto: ProcessQueryDto): Promise<any> {
  const query = await this.prebidQueryRepository.findOne({ where: { queryId } });
  
  if (!query) {
    throw new NotFoundException(`Query ${queryId} not found`);
  }

  // Check if already processed
  if (query.aiProcessed && !dto.forceReprocess) {
    throw new BadRequestException('Query already processed. Use forceReprocess=true to reprocess.');
  }

  // Call Screen 8 API
  const screen8Url = 'http://localhost:8001/api/chief-engineer/process';
  
  try {
    const response = await axios.post(screen8Url, {
      query_id: query.queryId,
      query_text: query.queryText,
      category: query.category,
      rfp_number: query.rfpId,
      vendor_id: query.submittedBy,
      metadata: dto.metadata || {},
    }, {
      timeout: 60000, // 60 second timeout for full workflow
    });

    if (response.data.success) {
      // Update query with AI response
      query.aiResponse = response.data.response;
      query.pastRefResponse = response.data.past_ref_response;
      query.confidence = response.data.confidence;
      query.sourceDocuments = response.data.source_documents;
      query.executionId = response.data.execution_id;
      query.aiProcessed = true;
      query.processedAt = new Date();
      query.status = 'under_review';
      
      await this.prebidQueryRepository.save(query);
      
      return {
        success: true,
        queryId: query.queryId,
        executionId: query.executionId,
        status: 'PROCESSING',
        message: 'Query sent to Chief Engineer Agent for processing',
      };
    }
  } catch (error) {
    this.logger.error(`Failed to process query ${queryId}:`, error.message);
    throw new HttpException(
      `Failed to process query: ${error.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
```

---

## Vector Database Integration

### ChromaDB Collections

**Collection Name:** `query_embeddings`  
**Location:** `python-rag/screen08-chief-engineer/query_db/`

**Metadata Structure:**
```python
{
    "query_id": str,           # UUID from PostgreSQL
    "query_text": str,         # Original query text
    "category": str,           # technical/commercial/eligibility/contractual/general
    "rfp_number": str,         # RFP ID
    "submitted_by": str,       # Vendor ID
    "submitted_at": str,       # ISO timestamp
    "priority": str,           # low/medium/high
    "vectorized_at": str,      # ISO timestamp
}
```

**Embedding Model:** Ollama `nomic-embed-text`  
**Embedding Dimension:** 768

### Vectorization Workflow

```python
# python-rag/screen08-chief-engineer/vectorization.py

def store_query_embedding(
    query_id: str,
    query_text: str,
    category: str,
    rfp_number: str,
    metadata: dict
) -> dict:
    """
    Store query embedding in ChromaDB
    """
    # Generate embedding
    embeddings = ollama.embeddings(
        model="nomic-embed-text",
        prompt=query_text
    )
    
    embedding_vector = embeddings["embedding"]
    
    # Store in ChromaDB
    collection.add(
        ids=[query_id],
        embeddings=[embedding_vector],
        documents=[query_text],
        metadatas=[{
            "query_id": query_id,
            "query_text": query_text,
            "category": category,
            "rfp_number": rfp_number,
            "submitted_by": metadata.get("submitted_by"),
            "submitted_at": metadata.get("submitted_at"),
            "priority": metadata.get("priority", "medium"),
            "vectorized_at": datetime.now().isoformat(),
        }]
    )
    
    return {
        "success": True,
        "query_id": query_id,
        "embedding_dimension": len(embedding_vector),
        "duration": processing_time_ms,
    }
```

### Similarity Search

```python
def find_similar_queries(
    query_text: str,
    rfp_number: Optional[str] = None,
    top_k: int = 5
) -> List[Dict]:
    """
    Find similar queries using vector similarity
    """
    # Generate embedding for search query
    embeddings = ollama.embeddings(
        model="nomic-embed-text",
        prompt=query_text
    )
    
    query_embedding = embeddings["embedding"]
    
    # Build where filter
    where_filter = {}
    if rfp_number:
        where_filter["rfp_number"] = rfp_number
    
    # Search in ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where_filter if where_filter else None
    )
    
    # Format results
    similar_queries = []
    for i, query_id in enumerate(results["ids"][0]):
        similar_queries.append({
            "query_id": query_id,
            "query_text": results["documents"][0][i],
            "similarity_score": 1 - results["distances"][0][i],  # Convert distance to similarity
            "metadata": results["metadatas"][0][i],
        })
    
    return similar_queries
```

---

## Workflow Execution

### 6-Step Chief Engineer Workflow

**File:** `python-rag/screen08-chief-engineer/chief_engineer_agent.py`

#### Step 1: Query Vectorization
**Duration:** ~2 seconds  
**Purpose:** Convert query text to embeddings
```python
def step1_vectorize_query(query_text: str) -> dict:
    embeddings = ollama.embeddings(
        model="nomic-embed-text",
        prompt=query_text
    )
    return {
        "embedding": embeddings["embedding"],
        "dimension": len(embeddings["embedding"]),
    }
```

#### Step 2: Historical Data Retrieval
**Duration:** ~8 seconds  
**Purpose:** Search historical RFP documents for relevant context
```python
def step2_retrieve_historical_data(
    query_embedding: List[float],
    rfp_number: str
) -> List[Dict]:
    # Search RFP documents collection
    results = rfp_collection.query(
        query_embeddings=[query_embedding],
        n_results=10,
        where={"rfp_number": rfp_number}
    )
    return results
```

#### Step 3: Similar Query Detection
**Duration:** ~5 seconds  
**Purpose:** Find similar past queries and their responses
```python
def step3_detect_similar_queries(
    query_embedding: List[float],
    rfp_number: Optional[str] = None
) -> List[Dict]:
    where_filter = {"rfp_number": rfp_number} if rfp_number else None
    
    results = query_collection.query(
        query_embeddings=[query_embedding],
        n_results=5,
        where=where_filter
    )
    return results
```

#### Step 4: Context Assembly
**Duration:** ~3 seconds  
**Purpose:** Assemble context from historical data and similar queries
```python
def step4_assemble_context(
    historical_data: List[Dict],
    similar_queries: List[Dict],
    query_text: str
) -> str:
    context = f"Query: {query_text}\n\n"
    context += "Historical Context:\n"
    for doc in historical_data:
        context += f"- {doc['document']}\n"
    
    context += "\nSimilar Past Queries:\n"
    for query in similar_queries:
        context += f"- Q: {query['query_text']}\n"
        context += f"  A: {query['response']}\n"
    
    return context
```

#### Step 5: Response Generation
**Duration:** ~20 seconds  
**Purpose:** Generate AI response using LLM
```python
def step5_generate_response(
    context: str,
    query_text: str
) -> str:
    prompt = f"""You are a Chief Engineer answering pre-bid queries.
    
Context:
{context}

Query: {query_text}

Provide a clear, accurate response based on the context provided."""

    response = ollama.generate(
        model="gemma:2b",
        prompt=prompt
    )
    
    return response["response"]
```

#### Step 6: Quality Validation
**Duration:** ~2 seconds  
**Purpose:** Validate response quality and calculate confidence
```python
def step6_validate_quality(
    response: str,
    query_text: str,
    source_documents: List[str]
) -> Dict:
    # Calculate confidence based on:
    # - Response length
    # - Source document count
    # - Keyword matching
    # - Sentiment analysis
    
    confidence = calculate_confidence(
        response,
        query_text,
        source_documents
    )
    
    return {
        "confidence": confidence,
        "validation_passed": confidence >= 0.7,
        "response_length": len(response),
        "sources_count": len(source_documents),
    }
```

### Complete Workflow Execution

```python
def execute_workflow(
    query_id: str,
    query_text: str,
    rfp_number: str,
    category: str,
    metadata: dict
) -> Dict:
    execution_id = f"exec-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    workflow_state = {
        "execution_id": execution_id,
        "query_id": query_id,
        "status": "RUNNING",
        "steps": [],
    }
    
    try:
        # Step 1: Vectorize
        step1_result = step1_vectorize_query(query_text)
        workflow_state["steps"].append({
            "step": 1,
            "name": "Query Vectorization",
            "status": "COMPLETED",
            "duration": step1_result["duration"],
        })
        
        # Step 2: Retrieve Historical Data
        step2_result = step2_retrieve_historical_data(
            step1_result["embedding"],
            rfp_number
        )
        workflow_state["steps"].append({
            "step": 2,
            "name": "Historical Data Retrieval",
            "status": "COMPLETED",
            "duration": step2_result["duration"],
        })
        
        # Step 3: Detect Similar Queries
        step3_result = step3_detect_similar_queries(
            step1_result["embedding"],
            rfp_number
        )
        workflow_state["steps"].append({
            "step": 3,
            "name": "Similar Query Detection",
            "status": "COMPLETED",
            "duration": step3_result["duration"],
        })
        
        # Step 4: Assemble Context
        step4_result = step4_assemble_context(
            step2_result["documents"],
            step3_result["queries"],
            query_text
        )
        workflow_state["steps"].append({
            "step": 4,
            "name": "Context Assembly",
            "status": "COMPLETED",
            "duration": step4_result["duration"],
        })
        
        # Step 5: Generate Response
        step5_result = step5_generate_response(
            step4_result["context"],
            query_text
        )
        workflow_state["steps"].append({
            "step": 5,
            "name": "Response Generation",
            "status": "COMPLETED",
            "duration": step5_result["duration"],
        })
        
        # Step 6: Validate Quality
        step6_result = step6_validate_quality(
            step5_result["response"],
            query_text,
            step2_result["source_documents"]
        )
        workflow_state["steps"].append({
            "step": 6,
            "name": "Quality Validation",
            "status": "COMPLETED",
            "duration": step6_result["duration"],
        })
        
        workflow_state["status"] = "COMPLETED"
        workflow_state["result"] = {
            "response": step5_result["response"],
            "confidence": step6_result["confidence"],
            "source_documents": step2_result["source_documents"],
            "past_ref_response": step3_result["top_similar"]["response"] if step3_result["queries"] else None,
        }
        
    except Exception as e:
        workflow_state["status"] = "FAILED"
        workflow_state["error"] = str(e)
    
    return workflow_state
```

---

## Related Systems

### Integration Points

**1. Historical Data Service (Port 8005)**
- Provides historical RFP documents for context
- Used in Step 2 of Chief Engineer workflow
- Endpoint: `POST /api/query-document`

**2. Screen 7 - History Retriever (Port 8000)**
- Retrieves historical Q&A pairs
- Provides similar past questions and answers
- Endpoint: `POST /api/rag/search`

**3. Query Vectorization Job**
- Background cron job (every 5 minutes)
- Automatically vectorizes new queries
- File: `backend/src/jobs/query-vectorization.job.ts`

**4. Admin Vectorization Panel**
- Manual vectorization controls
- Statistics and monitoring
- Endpoint: `/api/admin/vectorization/*`

---

## Configuration

### Environment Variables

```env
# Screen 8 Configuration
SCREEN8_API_URL=http://localhost:8001
SCREEN8_TIMEOUT=60000

# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
LLM_MODEL=gemma:2b

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=nhai_tender_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# ChromaDB Configuration
CHROMA_DB_PATH=./query_db
CHROMA_COLLECTION_NAME=query_embeddings
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| Backend (NestJS) | 3000 | http://localhost:3000 |
| Frontend (Next.js) | 3001 | http://localhost:3001 |
| Screen 8 (Python) | 8001 | http://localhost:8001 |
| PostgreSQL | 5432 | postgresql://localhost:5432 |
| Ollama | 11434 | http://localhost:11434 |

---

## Real Query IDs for Testing

From actual database:
- `7577375a-a6e7-45e1-9c7e-9c65c1aaca36` (QRY-2024-001)
- `5b79647f-9f62-411f-b659-3a800b66651c` (QRY-2024-002)
- `dba1733e-6685-4664-9173-7510baccdd9a` (QRY-2024-003)
- `8341fca3-aa16-4f93-80cf-39119d7e8aab` (QRY-2024-004)
- `fac137a9-4f8b-49e1-9a9a-901f855a8b85` (QRY-2024-005)

---

## Related Documentation

- **Commands Guide:** `README-COMMANDS-V3.md`
- **Bulk Operations:** `BULK-Chat-Information.md`
- **Screen 7 Features:** `SESSION_SCREEN7_BULK_UPDATE_EXPORT.md`
- **Database Migration:** `DATABASE_MIGRATION_GUIDE.md`
- **Vectorization Setup:** `vectorization-rag-steps-manual/VECTORIZATION_SETUP_GUIDE.md`

---

**Last Updated:** January 27, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
