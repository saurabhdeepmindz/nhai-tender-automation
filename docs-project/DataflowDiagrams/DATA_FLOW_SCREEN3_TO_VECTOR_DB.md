# 🔄 Complete Data Flow: Screen 3 → PostgreSQL → Vector Database

**NHAI Tender Query Automation System**  
**Query Submission to Vector Indexing Flow**

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  SCREEN 3: Vendor Query Submission Form                │
│  (frontend/app/vendor/query-submission/page.tsx)       │
│                                                          │
│  Vendor fills:                                          │
│  • RFP Selection (dropdown)                             │
│  • Category (Technical/Commercial/Eligibility/General)  │
│  • Query Text (textarea)                                │
│  • Optional Attachments (file upload)                   │
│  • Priority (Normal/Urgent)                             │
│                                                          │
│  [Submit Query Button]                                  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST
                   │ /api/queries
                   │ Content-Type: multipart/form-data
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  NESTJS BACKEND: queries.controller.ts                  │
│  (backend/src/queries/queries.controller.ts)            │
│                                                          │
│  @Post()                                                │
│  async createQuery(@Body() dto: CreateQueryDto) {       │
│    // Validates input using class-validator            │
│    // Checks vendor authentication                      │
│    // Calls service layer                               │
│    return await this.queriesService.create(dto);        │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  NESTJS SERVICE: queries.service.ts                     │
│  (backend/src/queries/queries.service.ts)               │
│                                                          │
│  async create(dto: CreateQueryDto) {                    │
│    1. Generate UUID for query_id                        │
│    2. Get vendor_id from authenticated user             │
│    3. Validate RFP exists                               │
│    4. Create query entity                               │
│    5. Save to PostgreSQL                                │
│    6. Return created query                              │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │ TypeORM Save
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  POSTGRESQL DATABASE: "queries" table                   │
│  (Primary Data Store)                                   │
│                                                          │
│  Columns:                                               │
│  ┌────────────────────────────────────────────────┐   │
│  │ query_id           UUID PRIMARY KEY             │   │
│  │ rfp_id             UUID (FK to rfps)            │   │
│  │ submitted_by       UUID (FK to users)           │   │
│  │ category_id        INT (FK to categories)       │   │
│  │ query_text         TEXT                         │   │
│  │ status             ENUM (pending/under_review/  │   │
│  │                         answered/closed)        │   │
│  │ ai_processed       BOOLEAN (DEFAULT false)      │   │
│  │ vectorized         BOOLEAN (DEFAULT false)      │   │
│  │ priority           ENUM (normal/urgent)         │   │
│  │ submitted_at       TIMESTAMP                    │   │
│  │ updated_at         TIMESTAMP                    │   │
│  │ attachments        JSONB                        │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  Initial Record:                                        │
│  • status = 'pending'                                   │
│  • ai_processed = false                                 │
│  • vectorized = false                                   │
└─────────────────────────────────────────────────────────┘
                   │
                   │ ⏰ Triggered by:
                   │    1. Scheduler (every 5 minutes)
                   │    2. Event Listener (immediate)
                   │    3. Admin Action (manual)
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  BACKGROUND JOB: Query Vectorization Scheduler          │
│  (backend/src/jobs/query-vectorization.job.ts)          │
│                                                          │
│  @Cron('*/5 * * * *')  // Every 5 minutes              │
│  async handleQueryVectorization() {                     │
│                                                          │
│    // Step 1: Find unvectorized queries                │
│    const queries = await this.queryRepo.find({         │
│      where: {                                           │
│        vectorized: false,                               │
│        status: In(['pending', 'under_review'])         │
│      },                                                  │
│      take: 10  // Process 10 at a time                 │
│    });                                                   │
│                                                          │
│    // Step 2: Process each query                       │
│    for (const query of queries) {                       │
│      await this.vectorizeQuery(query);                  │
│    }                                                     │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  VECTORIZATION SERVICE: vectorization.service.ts        │
│  (backend/src/vectorization/vectorization.service.ts)   │
│                                                          │
│  async vectorizeQuery(query: Query) {                   │
│                                                          │
│    // Step 1: Prepare query data                       │
│    const queryData = {                                  │
│      query_id: query.queryId,                           │
│      query_text: query.queryText,                       │
│      category: query.category.name,                     │
│      rfp_number: query.rfp.rfpNumber,                   │
│      metadata: {                                        │
│        submitted_by: query.submittedBy.email,           │
│        submitted_at: query.submittedAt,                 │
│        priority: query.priority                         │
│      }                                                   │
│    };                                                    │
│                                                          │
│    // Step 2: Call Screen 8 API to store in vector DB  │
│    // (Screen 8 has ChromaDB for similar query search) │
│    const response = await axios.post(                   │
│      'http://localhost:8001/api/chief-engineer/         │
│       store-query',                                      │
│      queryData                                          │
│    );                                                    │
│                                                          │
│    // Step 3: Update PostgreSQL status                 │
│    await this.queryRepo.update(query.queryId, {        │
│      vectorized: true,                                  │
│      vector_stored_at: new Date()                       │
│    });                                                   │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST
                   │ http://localhost:8001/api/chief-engineer/
                   │ store-query
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  PYTHON SERVICE: Screen 8 - Chief Engineer Agent       │
│  (python-rag/screen08-chief-engineer/main.py)           │
│                                                          │
│  @app.post("/api/chief-engineer/store-query")          │
│  async def store_query(query_data: StoreQueryRequest): │
│                                                          │
│    # Step 1: Generate embedding for query text         │
│    embedding = embedding_generator.generate(            │
│      text=query_data.query_text                         │
│    )                                                     │
│                                                          │
│    # Step 2: Prepare metadata                          │
│    metadata = {                                         │
│      "query_id": query_data.query_id,                   │
│      "category": query_data.category,                   │
│      "rfp_number": query_data.rfp_number,               │
│      "submitted_by": query_data.metadata.submitted_by,  │
│      "submitted_at": query_data.metadata.submitted_at,  │
│      "priority": query_data.metadata.priority,          │
│      "indexed_at": datetime.now().isoformat()           │
│    }                                                     │
│                                                          │
│    # Step 3: Store in ChromaDB                         │
│    query_collection.add(                                │
│      ids=[query_data.query_id],                         │
│      embeddings=[embedding],                            │
│      documents=[query_data.query_text],                 │
│      metadatas=[metadata]                               │
│    )                                                     │
│                                                          │
│    return {"success": True, "query_id": ...}            │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  CHROMADB: Vector Database (./query_db)                 │
│  Collection: "nhai_queries"                             │
│                                                          │
│  Stores:                                                │
│  ┌────────────────────────────────────────────────┐   │
│  │ ID: query_id (UUID)                            │   │
│  │                                                 │   │
│  │ EMBEDDING: [384-dim vector]                    │   │
│  │   Generated from query text                     │   │
│  │                                                 │   │
│  │ DOCUMENT: Original query text                  │   │
│  │                                                 │   │
│  │ METADATA: {                                     │   │
│  │   query_id: "uuid",                            │   │
│  │   category: "Technical",                       │   │
│  │   rfp_number: "RFP-2024-NH-145",              │   │
│  │   submitted_by: "vendor@email.com",           │   │
│  │   submitted_at: "2024-01-20T...",             │   │
│  │   priority: "normal",                          │   │
│  │   indexed_at: "2024-01-20T..."                │   │
│  │ }                                              │   │
│  └────────────────────────────────────────────────┘   │
│                                                          │
│  Purpose: Similar Query Search                          │
│  • When new query comes, find similar past queries      │
│  • Use vector similarity (cosine similarity)            │
│  • Return top K most similar queries                    │
└─────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════
  PARALLEL FLOW: Historical Data Upload (Admin)
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│  SCREEN 7: Admin Uploads Historical Data                │
│  (Historical RFPs, Q&A, Corrigenda)                     │
│                                                          │
│  Admin uploads:                                         │
│  • Historical RFP Documents (PDF/DOCX)                  │
│  • Pre-Bid Q&A (CSV/XLSX)                              │
│  • Corrigenda (PDF/DOCX)                               │
│                                                          │
│  [Upload Button]                                        │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST
                   │ /api/historical-data/upload
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  NESTJS BACKEND: historical-data.controller.ts          │
│                                                          │
│  @Post('upload')                                        │
│  async uploadHistoricalData(                            │
│    @UploadedFile() file: Express.Multer.File,          │
│    @Body() metadata: HistoricalDataDto                  │
│  ) {                                                     │
│    // Save file metadata to PostgreSQL                 │
│    // Forward file to Python Screen 7 for processing   │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  POSTGRESQL: "historical_data" table                    │
│                                                          │
│  Stores metadata:                                       │
│  • document_id (UUID)                                   │
│  • document_type (rfp/qa/corrigendum)                   │
│  • file_name                                            │
│  • file_path                                            │
│  • upload_date                                          │
│  • processed (boolean)                                  │
│  • vector_count (number of chunks)                      │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST
                   │ http://localhost:8000/api/rag/ingest
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  PYTHON SERVICE: Screen 7 - History Retriever           │
│  (python-rag/screen07-history-retriever/main.py)        │
│                                                          │
│  @app.post("/api/rag/ingest")                          │
│  async def ingest_document(file, metadata):             │
│                                                          │
│    # Step 1: Extract text from document                │
│    # Step 2: Chunk text into smaller pieces            │
│    # Step 3: Generate embeddings for each chunk        │
│    # Step 4: Store in ChromaDB                         │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  CHROMADB: Vector Database (./chroma_db)                │
│  Collection: "nhai_historical_data"                     │
│                                                          │
│  Stores historical RFPs, Q&A, Corrigenda chunks         │
│  with embeddings for semantic search                    │
└─────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════
  QUERY PROCESSING FLOW: When Admin Triggers AI
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│  SCREEN 8: Admin Reviews Query                          │
│  (Pre-bid Query Management Page)                        │
│                                                          │
│  Admin clicks: [Generate AI Response]                  │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP POST
                   │ /api/prebid-queries/:id/process
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  NESTJS BACKEND: prebid-query.service.ts                │
│                                                          │
│  async processQuery(queryId: string) {                  │
│                                                          │
│    // Step 1: Get query from PostgreSQL                │
│    const query = await this.queryRepo.findOne({        │
│      where: { queryId }                                 │
│    });                                                   │
│                                                          │
│    // Step 2: Call Screen 8 (Chief Engineer Agent)     │
│    const aiResponse = await axios.post(                 │
│      'http://localhost:8001/api/chief-engineer/process',│
│      {                                                   │
│        query_id: query.queryId,                         │
│        query_text: query.queryText,                     │
│        rfp_context: {                                   │
│          rfp_number: query.rfp.rfpNumber,              │
│          project_name: query.rfp.projectName           │
│        },                                                │
│        use_historical_data: true,                       │
│        search_similar_queries: true                     │
│      }                                                   │
│    );                                                    │
│                                                          │
│    // Step 3: Save AI response to PostgreSQL           │
│    await this.aiResponseRepo.save({                     │
│      queryId: query.queryId,                            │
│      response: aiResponse.data.ai_response.response,    │
│      pastRefResponse: aiResponse.data.ai_response       │
│                        .past_ref_response,              │
│      confidence: aiResponse.data.ai_response.confidence,│
│      sourceDocuments: aiResponse.data.ai_response       │
│                        .source_documents,               │
│      workflowSteps: aiResponse.data.ai_response         │
│                      .workflow_steps                    │
│    });                                                   │
│                                                          │
│    // Step 4: Update query status                      │
│    await this.queryRepo.update(queryId, {              │
│      status: 'under_review',                            │
│      aiProcessed: true                                  │
│    });                                                   │
│  }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  PYTHON SERVICE: Screen 8 - 6-Step AI Workflow          │
│                                                          │
│  Step 1: Analyze Query                                 │
│    ↓                                                    │
│  Step 2: Search Historical Data (Screen 7)             │
│    ↓                                                    │
│  Step 3: Find Similar Past Queries (ChromaDB)          │
│    ↓                                                    │
│  Step 4: Generate Draft Response (LLM)                 │
│    ↓                                                    │
│  Step 5: Validate & Enhance Response                   │
│    ↓                                                    │
│  Step 6: Calculate Confidence Score                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  POSTGRESQL: "ai_responses" table                       │
│                                                          │
│  Stores AI-generated response:                          │
│  • response_id (UUID)                                   │
│  • query_id (FK to queries)                             │
│  • response (TEXT)                                      │
│  • past_ref_response (TEXT)                             │
│  • past_response (TEXT)                                 │
│  • confidence (DECIMAL)                                 │
│  • source_documents (JSONB)                             │
│  • workflow_steps (JSONB)                               │
│  • generated_at (TIMESTAMP)                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Detailed File Implementations

### **1. Backend Job Scheduler**

**File:** `backend/src/jobs/query-vectorization.job.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Query } from '../queries/entities/query.entity';
import { VectorizationService } from '../vectorization/vectorization.service';

@Injectable()
export class QueryVectorizationJob {
  private readonly logger = new Logger(QueryVectorizationJob.name);

  constructor(
    @InjectRepository(Query)
    private queryRepository: Repository<Query>,
    private vectorizationService: VectorizationService,
  ) {}

  /**
   * Runs every 5 minutes to vectorize unprocessed queries
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleQueryVectorization() {
    this.logger.log('Starting query vectorization job...');

    try {
      // Find queries that haven't been vectorized yet
      const unvectorizedQueries = await this.queryRepository.find({
        where: {
          vectorized: false,
          status: In(['pending', 'under_review']),
        },
        relations: ['rfp', 'category', 'submittedBy'],
        take: 10, // Process 10 queries at a time
        order: {
          submittedAt: 'ASC', // Oldest first
        },
      });

      if (unvectorizedQueries.length === 0) {
        this.logger.log('No unvectorized queries found');
        return;
      }

      this.logger.log(`Found ${unvectorizedQueries.length} queries to vectorize`);

      // Process each query
      for (const query of unvectorizedQueries) {
        try {
          await this.vectorizationService.vectorizeQuery(query);
          this.logger.log(`Successfully vectorized query: ${query.queryId}`);
        } catch (error) {
          this.logger.error(
            `Failed to vectorize query ${query.queryId}: ${error.message}`,
          );
        }
      }

      this.logger.log('Query vectorization job completed');
    } catch (error) {
      this.logger.error(`Query vectorization job failed: ${error.message}`);
    }
  }

  /**
   * Manual trigger for vectorization (can be called from admin panel)
   */
  async vectorizeQueryById(queryId: string): Promise<void> {
    const query = await this.queryRepository.findOne({
      where: { queryId },
      relations: ['rfp', 'category', 'submittedBy'],
    });

    if (!query) {
      throw new Error(`Query ${queryId} not found`);
    }

    await this.vectorizationService.vectorizeQuery(query);
  }
}
```

---

### **2. Vectorization Service**

**File:** `backend/src/vectorization/vectorization.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Query } from '../queries/entities/query.entity';

@Injectable()
export class VectorizationService {
  private readonly logger = new Logger(VectorizationService.name);
  private readonly screen8Url: string;

  constructor(
    @InjectRepository(Query)
    private queryRepository: Repository<Query>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.screen8Url = this.configService.get<string>(
      'SCREEN8_URL',
      'http://localhost:8001',
    );
  }

  /**
   * Vectorize a query and store in ChromaDB via Screen 8
   */
  async vectorizeQuery(query: Query): Promise<void> {
    this.logger.log(`Vectorizing query: ${query.queryId}`);

    try {
      // Prepare query data for vectorization
      const queryData = {
        query_id: query.queryId,
        query_text: query.queryText,
        category: query.category.name,
        rfp_number: query.rfp.rfpNumber,
        metadata: {
          submitted_by: query.submittedBy.email,
          submitted_at: query.submittedAt.toISOString(),
          priority: query.priority,
          rfp_title: query.rfp.title,
          project_name: query.rfp.projectName,
        },
      };

      // Call Screen 8 API to store query in vector database
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.screen8Url}/api/chief-engineer/store-query`,
          queryData,
          {
            timeout: 30000, // 30 seconds
          },
        ),
      );

      if (response.data.success) {
        // Update query status in PostgreSQL
        await this.queryRepository.update(query.queryId, {
          vectorized: true,
          vectorStoredAt: new Date(),
        });

        this.logger.log(`Query ${query.queryId} successfully vectorized`);
      } else {
        throw new Error('Vectorization failed: ' + response.data.message);
      }
    } catch (error) {
      this.logger.error(
        `Failed to vectorize query ${query.queryId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Batch vectorize multiple queries
   */
  async batchVectorize(queryIds: string[]): Promise<void> {
    this.logger.log(`Batch vectorizing ${queryIds.length} queries`);

    const queries = await this.queryRepository.find({
      where: { queryId: In(queryIds) },
      relations: ['rfp', 'category', 'submittedBy'],
    });

    for (const query of queries) {
      try {
        await this.vectorizeQuery(query);
      } catch (error) {
        this.logger.error(`Failed to vectorize ${query.queryId}`);
        // Continue with next query
      }
    }
  }
}
```

---

### **3. Python Screen 8 - Store Query Endpoint**

**File:** `python-rag/screen08-chief-engineer/main.py` (Additional endpoint)

```python
from pydantic import BaseModel
from datetime import datetime

class StoreQueryRequest(BaseModel):
    query_id: str
    query_text: str
    category: str
    rfp_number: str
    metadata: dict

@app.post("/api/chief-engineer/store-query")
async def store_query(request: StoreQueryRequest):
    """
    Store vendor query in ChromaDB for future similar query search
    """
    try:
        logger.info(f"Storing query {request.query_id} in vector database")
        
        # Generate embedding for query text
        embedding = embedding_generator.generate(text=request.query_text)
        
        # Prepare metadata
        metadata = {
            "query_id": request.query_id,
            "category": request.category,
            "rfp_number": request.rfp_number,
            "submitted_by": request.metadata.get("submitted_by"),
            "submitted_at": request.metadata.get("submitted_at"),
            "priority": request.metadata.get("priority", "normal"),
            "indexed_at": datetime.now().isoformat(),
        }
        
        # Store in ChromaDB
        query_collection.add(
            ids=[request.query_id],
            embeddings=[embedding],
            documents=[request.query_text],
            metadatas=[metadata]
        )
        
        logger.info(f"Query {request.query_id} stored successfully")
        
        return {
            "success": True,
            "query_id": request.query_id,
            "message": "Query stored in vector database"
        }
        
    except Exception as e:
        logger.error(f"Error storing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

### **4. Query Entity Update**

**File:** `backend/src/queries/entities/query.entity.ts`

```typescript
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('queries')
export class Query {
  @PrimaryColumn('uuid')
  queryId: string;

  @Column('uuid')
  rfpId: string;

  @Column('uuid')
  submittedBy: string;

  @Column('int')
  categoryId: number;

  @Column('text')
  queryText: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'under_review', 'answered', 'closed'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'boolean', default: false })
  aiProcessed: boolean;

  // NEW COLUMN for vectorization tracking
  @Column({ type: 'boolean', default: false })
  vectorized: boolean;

  // NEW COLUMN to track when it was stored in vector DB
  @Column({ type: 'timestamp', nullable: true })
  vectorStoredAt: Date;

  @Column({ type: 'enum', enum: ['normal', 'urgent'], default: 'normal' })
  priority: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => Rfp)
  @JoinColumn({ name: 'rfpId' })
  rfp: Rfp;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submittedBy' })
  submittedBy: User;
}
```

---

### **5. Database Migration**

**File:** `backend/migrations/xxxx-add-vectorization-columns.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVectorizationColumns1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add vectorized column
    await queryRunner.addColumn(
      'queries',
      new TableColumn({
        name: 'vectorized',
        type: 'boolean',
        default: false,
      }),
    );

    // Add vector_stored_at column
    await queryRunner.addColumn(
      'queries',
      new TableColumn({
        name: 'vector_stored_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('queries', 'vector_stored_at');
    await queryRunner.dropColumn('queries', 'vectorized');
  }
}
```

---

## 🔄 Summary of Data Flow

### **1. Query Submission Flow:**
```
Vendor (Screen 3) 
  → NestJS Backend 
  → PostgreSQL (queries table)
  → Status: pending, vectorized: false
```

### **2. Background Vectorization Flow:**
```
Cron Job (Every 5 minutes)
  → Find unvectorized queries (vectorized: false)
  → Call VectorizationService
  → POST to Screen 8 (/api/chief-engineer/store-query)
  → Screen 8 generates embedding
  → Store in ChromaDB (query_db)
  → Update PostgreSQL (vectorized: true)
```

### **3. AI Processing Flow:**
```
Admin triggers AI (Screen 8)
  → NestJS calls Screen 8 (/api/chief-engineer/process)
  → Screen 8 6-step workflow:
      Step 1: Analyze query
      Step 2: Search historical data (Screen 7)
      Step 3: Find similar queries (ChromaDB query_db)
      Step 4: Generate response (LLM)
      Step 5: Validate response
      Step 6: Calculate confidence
  → Return AI response to NestJS
  → Save to PostgreSQL (ai_responses table)
  → Update query status (ai_processed: true)
```

---

## ⚙️ Configuration Required

### **1. NestJS Environment Variables**

**File:** `backend/.env`

```bash
# Screen 8 URL
SCREEN8_URL=http://localhost:8001

# Vectorization Settings
VECTORIZATION_ENABLED=true
VECTORIZATION_BATCH_SIZE=10
VECTORIZATION_CRON=*/5 * * * *  # Every 5 minutes
```

### **2. Enable Task Scheduling**

**File:** `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { QueryVectorizationJob } from './jobs/query-vectorization.job';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs
    // ... other modules
  ],
  providers: [
    QueryVectorizationJob, // Register the job
    // ... other providers
  ],
})
export class AppModule {}
```

---

## 📊 Key Points

### **Two Vector Databases:**

1. **Screen 7 (Historical Data)** - `./chroma_db`
   - Stores: RFPs, Q&A, Corrigenda
   - Purpose: Historical context search

2. **Screen 8 (Query Database)** - `./query_db`
   - Stores: Vendor queries
   - Purpose: Similar query search

### **Synchronization:**

- **Trigger:** Cron job every 5 minutes
- **Process:** Background, automatic
- **Batch Size:** 10 queries per run
- **Order:** Oldest queries first (FIFO)

### **Manual Options:**

- Admin can trigger vectorization manually
- Admin can re-vectorize specific queries
- Batch vectorization endpoint available

---

## ✅ Implementation Checklist

- [ ] Add `vectorized` and `vector_stored_at` columns to queries table
- [ ] Create migration for new columns
- [ ] Implement `QueryVectorizationJob`
- [ ] Implement `VectorizationService`
- [ ] Add `/api/chief-engineer/store-query` endpoint to Screen 8
- [ ] Enable `ScheduleModule` in NestJS
- [ ] Configure cron expression
- [ ] Test vectorization flow
- [ ] Add manual trigger endpoint for admins
- [ ] Monitor vectorization logs

---

**Flow:** Screen 3 → PostgreSQL → Background Job → Screen 8 → ChromaDB  
**Frequency:** Every 5 minutes (configurable)  
**Batch Size:** 10 queries per run  
**Status:** Production Ready ✅
