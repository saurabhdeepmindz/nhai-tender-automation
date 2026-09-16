# Queries Module - Complete Implementation

## 📁 File Structure

```
queries-module/
├── dtos/
│   ├── create-query.dto.ts       # DTO for creating new queries
│   ├── update-query.dto.ts       # DTO for updating queries
│   └── query-response.dto.ts     # DTOs for API responses
├── entities/
│   └── query.entity.ts           # TypeORM entity for Query table
├── controllers/
│   └── queries.controller.ts     # REST API endpoints
├── services/
│   └── queries.service.ts        # Business logic
├── queries.module.ts             # NestJS module configuration
└── README.md                     # This file
```

---

## 🚀 Quick Start

### 1. Installation

Copy all files to your NestJS project:

```bash
# Create the queries module directory
mkdir -p src/queries/{dtos,entities,controllers,services}

# Copy files to their respective locations
cp dtos/*.ts src/queries/dtos/
cp entities/*.ts src/queries/entities/
cp controllers/*.ts src/queries/controllers/
cp services/*.ts src/queries/services/
cp queries.module.ts src/queries/
```

### 2. Import Module in App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueriesModule } from './queries/queries.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'your_username',
      password: 'your_password',
      database: 'nhai_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Set to true in development only
    }),
    QueriesModule,
  ],
})
export class AppModule {}
```

### 3. Run Database Migration

```sql
-- Create the queries table
CREATE TABLE IF NOT EXISTS queries (
    "queryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "queryNumber" VARCHAR(50) UNIQUE NOT NULL,
    "rfpId" UUID NOT NULL,
    "submittedBy" UUID NOT NULL,
    "category" VARCHAR(20) NOT NULL DEFAULT 'general',
    "queryText" TEXT NOT NULL,
    "attachments" JSONB,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "priority" VARCHAR(20) DEFAULT 'medium',
    "aiProcessed" BOOLEAN DEFAULT false,
    "adminReviewed" BOOLEAN DEFAULT false,
    "submittedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP,
    "aiResponse" TEXT,
    "pastRefResponse" TEXT,
    "pastResponse" TEXT,
    "adminResponse" TEXT,
    "confidence" DECIMAL(5,2),
    "sourceDocuments" TEXT[],
    "executionId" VARCHAR(100),
    "processedAt" TIMESTAMP,
    "answeredAt" TIMESTAMP,
    "answeredBy" UUID,
    "metadata" JSONB
);

-- Create indexes for better performance
CREATE INDEX idx_queries_rfp_status ON queries("rfpId", "status");
CREATE INDEX idx_queries_submitted_by ON queries("submittedBy");
CREATE INDEX idx_queries_submitted_at ON queries("submittedAt");
CREATE INDEX idx_queries_status ON queries("status");
CREATE INDEX idx_queries_query_number ON queries("queryNumber");
```

### 4. Start the Application

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/queries`

Swagger documentation: `http://localhost:3000/api/docs`

---

## 📡 API Endpoints

### Query Management

#### 1. Create Query
```http
POST /queries
Content-Type: application/json
Authorization: Bearer <token>

{
  "rfpId": "123e4567-e89b-12d3-a456-426614174000",
  "category": "technical",
  "queryText": "What is the minimum experience required?",
  "priority": "medium",
  "attachments": [
    {
      "fileName": "doc.pdf",
      "fileSize": 1048576,
      "mimeType": "application/pdf",
      "filePath": "/uploads/queries/doc.pdf"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "queryId": "456e1234-e89b-12d3-a456-426614174001",
  "queryNumber": "QRY-2024-0001",
  "rfpId": "123e4567-e89b-12d3-a456-426614174000",
  "submittedBy": "vendor-user-id",
  "category": "technical",
  "queryText": "What is the minimum experience required?",
  "status": "pending",
  "aiProcessed": false,
  "submittedAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Get All Queries (with filters)
```http
GET /queries?page=1&pageSize=20&status=pending&rfpId=123e4567-e89b-12d3-a456-426614174000
```

**Response (200 OK):**
```json
{
  "queries": [...],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

#### 3. Get Query by ID
```http
GET /queries/:id
```

#### 4. Get Query Statistics
```http
GET /queries/statistics?rfpId=123e4567-e89b-12d3-a456-426614174000
```

**Response (200 OK):**
```json
{
  "total": 150,
  "pending": 45,
  "underReview": 30,
  "answered": 70,
  "clarificationNeeded": 5,
  "aiProcessed": 100,
  "avgResponseTime": 24,
  "avgConfidence": 82.5
}
```

#### 5. Get Queries by Vendor
```http
GET /queries/vendor/:vendorId?page=1&pageSize=20
```

#### 6. Get Queries by RFP
```http
GET /queries/rfp/:rfpId?page=1&pageSize=20
```

#### 7. Update Query
```http
PUT /queries/:id
Content-Type: application/json

{
  "status": "answered",
  "adminResponse": "The minimum experience required is 5 years."
}
```

#### 8. Mark for AI Processing
```http
POST /queries/:id/process
```

#### 9. Update with AI Response
```http
POST /queries/:id/ai-response
Content-Type: application/json

{
  "aiResponse": "Based on the RFP, minimum 5 years experience is required.",
  "pastRefResponse": "Similar query from RFP-2023-145",
  "confidence": 85.5,
  "sourceDocuments": ["rfp_doc_1.pdf", "past_qa_23.json"],
  "executionId": "exec-12345"
}
```

#### 10. Delete Query
```http
DELETE /queries/:id
```

---

## 🔍 Query Parameters & Filters

### Available Filters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=2` |
| `pageSize` | number | Items per page (default: 20) | `?pageSize=50` |
| `status` | enum | Filter by status | `?status=pending` |
| `category` | string | Filter by category | `?category=technical` |
| `rfpId` | UUID | Filter by RFP | `?rfpId=123e4567...` |
| `submittedBy` | UUID | Filter by vendor | `?submittedBy=456e1234...` |
| `aiProcessed` | boolean | AI processing status | `?aiProcessed=true` |
| `adminReviewed` | boolean | Admin review status | `?adminReviewed=false` |
| `search` | string | Search in query text | `?search=experience` |
| `sortBy` | string | Sort field | `?sortBy=submittedAt` |
| `sortOrder` | ASC/DESC | Sort direction | `?sortOrder=DESC` |

### Status Values
- `pending` - Query submitted, awaiting review
- `under_review` - Query being processed
- `answered` - Query has been answered
- `clarification_needed` - More information required

### Category Values
- `technical` - Technical specifications
- `commercial` - Pricing and commercial terms
- `eligibility` - Eligibility criteria
- `contractual` - Contract terms
- `general` - General inquiries

---

## 💾 Database Schema

### Query Entity Fields

| Field | Type | Description |
|-------|------|-------------|
| queryId | UUID | Primary key |
| queryNumber | VARCHAR(50) | Human-readable unique ID |
| rfpId | UUID | Reference to RFP |
| submittedBy | UUID | Vendor who submitted |
| category | ENUM | Query category |
| queryText | TEXT | Actual query content |
| attachments | JSONB | File attachments |
| status | ENUM | Current status |
| priority | VARCHAR(20) | Priority level |
| aiProcessed | BOOLEAN | AI processing flag |
| adminReviewed | BOOLEAN | Admin review flag |
| submittedAt | TIMESTAMP | Submission time |
| updatedAt | TIMESTAMP | Last update time |
| respondedAt | TIMESTAMP | Response time |
| aiResponse | TEXT | AI-generated response |
| pastRefResponse | TEXT | Similar past query reference |
| pastResponse | TEXT | Historical response |
| adminResponse | TEXT | Admin's final response |
| confidence | DECIMAL(5,2) | AI confidence score |
| sourceDocuments | TEXT[] | Referenced documents |
| executionId | VARCHAR(100) | RAG execution ID |
| processedAt | TIMESTAMP | AI processing time |
| answeredAt | TIMESTAMP | Answer time |
| answeredBy | UUID | User who answered |
| metadata | JSONB | Additional data |

---

## 🔐 Authentication & Authorization

### JWT Authentication (to be implemented)

```typescript
// Uncomment the @UseGuards decorator in queries.controller.ts
@UseGuards(JwtAuthGuard)
export class QueriesController { ... }
```

### Example Auth Guard

```typescript
// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

### Role-Based Access

```typescript
// Add role checks in controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'vendor')
```

---

## 🧪 Testing

### Unit Tests Example

```typescript
// queries.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueriesService } from './queries.service';
import { Query } from '../entities/query.entity';

describe('QueriesService', () => {
  let service: QueriesService;
  let mockRepository;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueriesService,
        {
          provide: getRepositoryToken(Query),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<QueriesService>(QueriesService);
  });

  it('should create a query', async () => {
    const createDto = {
      rfpId: 'test-rfp-id',
      category: 'technical',
      queryText: 'Test query',
    };

    mockRepository.create.mockReturnValue(createDto);
    mockRepository.save.mockResolvedValue({
      ...createDto,
      queryId: 'test-id',
      queryNumber: 'QRY-2024-0001',
    });

    const result = await service.create(createDto, 'user-id');
    expect(result.queryId).toBe('test-id');
  });
});
```

### Integration Tests

```bash
npm run test:e2e
```

---

## 🔄 Integration with RAG Service

### Flow Diagram

```
Vendor submits query (POST /queries)
        ↓
Query saved to PostgreSQL (status: pending)
        ↓
Admin triggers AI processing (POST /queries/:id/process)
        ↓
Status updated to: under_review
        ↓
RAG Service processes query
        ↓
RAG Service calls back (POST /queries/:id/ai-response)
        ↓
Query updated with AI response
        ↓
Admin reviews and finalizes (PUT /queries/:id)
        ↓
Status updated to: answered
```

### RAG Service Integration Example

```typescript
// In your RAG service (Python FastAPI)
import httpx

async def update_query_with_ai_response(
    query_id: str,
    ai_response: str,
    confidence: float,
    source_docs: List[str]
):
    """Update NestJS backend with AI response"""
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"http://nestjs-backend:3000/queries/{query_id}/ai-response",
            json={
                "aiResponse": ai_response,
                "confidence": confidence,
                "sourceDocuments": source_docs,
                "executionId": "exec-12345"
            },
            headers={"Authorization": f"Bearer {api_token}"}
        )
    
    return response.json()
```

---

## 📊 Performance Considerations

### Database Indexes

Already implemented in the migration:
- Composite index on (rfpId, status)
- Index on submittedBy
- Index on submittedAt
- Index on status
- Unique index on queryNumber

### Query Optimization Tips

1. **Use pagination**: Always paginate large result sets
2. **Filter early**: Apply filters to reduce dataset
3. **Limit fields**: Select only needed columns
4. **Cache statistics**: Cache frequently accessed stats

### Example: Optimized Query

```typescript
// Get only essential fields
const queries = await this.queryRepository.find({
  where: { status: QueryStatus.PENDING },
  select: ['queryId', 'queryNumber', 'queryText', 'submittedAt'],
  order: { submittedAt: 'DESC' },
  take: 20,
});
```

---

## 🛠️ Customization

### Adding New Query Categories

```typescript
// In create-query.dto.ts
export enum QueryCategory {
  TECHNICAL = 'technical',
  COMMERCIAL = 'commercial',
  ELIGIBILITY = 'eligibility',
  CONTRACTUAL = 'contractual',
  GENERAL = 'general',
  LEGAL = 'legal', // New category
  ENVIRONMENTAL = 'environmental', // New category
}
```

### Adding Custom Filters

```typescript
// In queries.service.ts
export interface QueryFilters {
  // ... existing filters
  priority?: string; // New filter
  dateRange?: { start: Date; end: Date }; // New filter
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Column does not exist" error
**Solution**: Run the database migration script

#### 2. Validation errors
**Solution**: Ensure DTOs match the schema and client sends correct data

#### 3. 401 Unauthorized
**Solution**: Implement JWT authentication or temporarily disable auth guard

#### 4. Slow queries
**Solution**: Check indexes, add pagination, optimize filters

---

## 📝 TODO / Future Enhancements

- [ ] Add file upload handling for attachments
- [ ] Implement real-time notifications (WebSocket)
- [ ] Add query history/audit trail
- [ ] Implement query templates
- [ ] Add bulk operations (create/update multiple queries)
- [ ] Implement caching (Redis) for statistics
- [ ] Add export functionality (CSV, PDF)
- [ ] Implement advanced search (full-text)

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [class-validator Documentation](https://github.com/typestack/class-validator)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review Swagger documentation
3. Check NestJS logs
4. Contact development team

---

**Generated on**: 2024-01-15  
**Version**: 1.0.0  
**Module**: Queries Module  
**Project**: NHAI Tender Query Automation System
