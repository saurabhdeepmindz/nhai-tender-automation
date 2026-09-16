# Screen 8 Workflow Tracking - Production Implementation Guide

## Overview
This guide provides step-by-step instructions to implement production-ready PostgreSQL workflow tracking for Screen 8 (Pre-bid Query Management / Chief Engineer Agent).

## Files Created

### 1. Database Migration
**File:** `backend/src/migrations/1738052400000-CreateWorkflowTables.ts`
- Creates `workflow_executions` table with 12 columns
- Creates `workflow_steps` table with 12 columns
- Establishes foreign key relationships
- Creates indexes for performance

### 2. TypeORM Entities
**Files:** 
- `backend/src/workflow/entities/workflow-execution.entity.ts`
- `backend/src/workflow/entities/workflow-step.entity.ts`

Provides TypeScript type safety and ORM integration for backend.

### 3. Python Database Configuration
**File:** `python-rag/screen08-chief-engineer/database.py`
- Manages asyncpg connection pool
- Configuration from environment variables
- Health check functionality

### 4. Production Workflow Manager
**File:** `python-rag/screen08-chief-engineer/workflow_manager_pg.py`
- PostgreSQL-backed workflow tracking (replaces in-memory implementation)
- All 6-step workflow methods updated to persist to database
- Complete CRUD operations for workflows and steps

### 5. Documentation
**File:** `docs-project/DataflowDiagrams/SCREEN8_DATA_FLOW_DIAGRAM-v3.md`
- Updated architecture diagram showing WKFL-Step1 to WKFL-Step6 as nested subgraph
- Enhanced sequence diagram showing PostgreSQL INSERT/UPDATE operations
- Complete database schema documentation

## Installation Steps

### Step 1: Install Python Dependencies

Add to `python-rag/screen08-chief-engineer/requirements.txt`:
```
asyncpg==0.29.0
```

Then install:
```bash
cd python-rag/screen08-chief-engineer/
pip install asyncpg
```

### Step 2: Configure Environment Variables

Add to `python-rag/screen08-chief-engineer/.env`:
```env
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nhai_tender_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Connection Pool Settings (optional)
POSTGRES_MIN_POOL_SIZE=5
POSTGRES_MAX_POOL_SIZE=20
POSTGRES_POOL_TIMEOUT=30
```

### Step 3: Run Database Migration

From backend directory:
```bash
cd backend/
npm run typeorm migration:run
```

This will create the `workflow_executions` and `workflow_steps` tables.

### Step 4: Update Screen 8 Main Application

**File:** `python-rag/screen08-chief-engineer/main.py`

Update imports and initialization:

```python
# Replace old import
# from workflow_manager import WorkflowManager

# With new import
from workflow_manager_pg import WorkflowManager
from database import init_database, close_database, get_database

# In startup event
@app.on_event("startup")
async def startup_event():
    global embedding_generator, llm_manager, chief_engineer, workflow_manager
    
    logger.info("Starting Screen 8 - Chief Engineer Agent...")
    
    # Initialize database connection pool
    await init_database()
    logger.info("PostgreSQL connection pool initialized")
    
    # Set database pool for workflow manager
    db_pool = get_database()
    
    # Initialize workflow manager with database
    workflow_manager = WorkflowManager()
    workflow_manager.set_db_pool(db_pool)
    logger.info("Workflow manager initialized with PostgreSQL persistence")
    
    # ... rest of initialization

# In shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Screen 8 - Chief Engineer Agent...")
    
    # Close database connection pool
    await close_database()
    logger.info("PostgreSQL connection pool closed")
    
    # ... rest of cleanup
```

### Step 5: Update Chief Engineer Agent

**File:** `python-rag/screen08-chief-engineer/chief_engineer_agent.py`

Replace the `workflow_manager` import if needed. No other changes required - the interface remains the same.

### Step 6: Verify Installation

1. **Check Tables Created:**
```sql
\d workflow_executions
\d workflow_steps
```

2. **Test Workflow Creation:**
```bash
curl http://localhost:8001/api/health
```

3. **Process a Query:**
```bash
curl -X POST http://localhost:8001/api/chief-engineer/process \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "test-query-id",
    "query_text": "What is the minimum experience requirement?",
    "rfp_context": {"rfp_number": "NHAI/2026/001"},
    "vendor_id": "vendor-123"
  }'
```

4. **Check Workflow in Database:**
```sql
SELECT * FROM workflow_executions ORDER BY created_at DESC LIMIT 1;
SELECT * FROM workflow_steps WHERE workflow_id = 'your-workflow-id' ORDER BY step_number;
```

## API Endpoints (No Changes)

All existing API endpoints work exactly as before:
- `POST /api/chief-engineer/process` - Creates workflow in PostgreSQL
- `GET /api/workflow/executions` - Lists workflows from PostgreSQL
- `GET /api/workflow/executions/{id}` - Gets workflow details from PostgreSQL
- `GET /api/statistics` - Aggregates stats from PostgreSQL

## Rollback (If Needed)

If you need to rollback to in-memory implementation:

1. Revert imports in `main.py`:
```python
from workflow_manager import WorkflowManager  # Original
```

2. Remove database initialization from startup/shutdown events

3. Drop migration (optional):
```bash
npm run typeorm migration:revert
```

## Performance Considerations

- **Connection Pool:** Default 5-20 connections, tune based on load
- **Indexes:** Created on `query_id`, `status`, `created_at` for fast queries
- **JSON Storage:** `final_result` and `result` columns use JSONB for flexible storage
- **Cascade Deletes:** Deleting a workflow automatically deletes its steps

## Monitoring

Query performance statistics:
```sql
-- Average workflow duration
SELECT AVG(total_duration_ms) FROM workflow_executions WHERE status = 'completed';

-- Step-level performance
SELECT step_name, AVG(duration_ms) as avg_ms, COUNT(*) as count
FROM workflow_steps
WHERE status = 'completed'
GROUP BY step_name
ORDER BY avg_ms DESC;

-- Failure rate
SELECT status, COUNT(*) as count
FROM workflow_executions
GROUP BY status;
```

## Benefits of PostgreSQL Implementation

✅ **Persistence:** Workflows survive service restarts  
✅ **Audit Trail:** Complete history of all executions  
✅ **Debugging:** Step-by-step execution details with timestamps  
✅ **Analytics:** Query performance metrics and trends  
✅ **Compliance:** Full audit trail for regulatory requirements  
✅ **Scalability:** Database handles concurrent workflows efficiently  

## Next Steps

1. Create workflow visualization dashboard in frontend
2. Add workflow retry mechanism for failed executions
3. Implement workflow archival for old executions
4. Add Grafana dashboards for workflow monitoring
5. Create alerts for workflow failures

---

**Version:** 1.0  
**Date:** January 28, 2026  
**Status:** Production Ready ✅
