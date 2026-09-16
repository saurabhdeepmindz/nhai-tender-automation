# Database Schema Migration - January 22, 2026

## Overview
This migration adds AI processing and admin review columns to the `queries` table to support the full functionality of the NHAI Tender Automation System.

## Backup Information

### Full Database Backup
- **File**: `nhai_tender_db_backup_20260122_154038.sql`
- **Location**: `database-backups/`
- **Size**: 83.6 KB
- **Type**: Full schema + data backup
- **Format**: Plain SQL (pg_dump -F p)

### How to Restore from Backup
```powershell
# Set PostgreSQL password
$env:PGPASSWORD = "your_password"

# Drop existing database (CAUTION!)
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS nhai_tender_db;"

# Create new database
psql -h localhost -U postgres -c "CREATE DATABASE nhai_tender_db;"

# Restore from backup
psql -h localhost -U postgres -d nhai_tender_db -f database-backups\nhai_tender_db_backup_20260122_154038.sql

Write-Host "Database restored successfully!"
```

## Migration Scripts

### 1. Forward Migration (add_missing_columns_migration.sql)
Adds the following columns to the `queries` table:

| Column Name | Type | Default | Nullable | Purpose |
|------------|------|---------|----------|---------|
| `ai_processed` | boolean | false | YES | Flag if AI processed the query |
| `admin_reviewed` | boolean | false | YES | Flag if admin reviewed the query |
| `ai_response` | text | - | YES | AI-generated response |
| `past_ref_response` | text | - | YES | Response from past references |
| `past_response` | text | - | YES | Historical similar responses |
| `admin_response` | text | - | YES | Manual admin response |
| `confidence` | decimal(5,2) | - | YES | AI confidence score (0-100) |
| `source_documents` | jsonb | - | YES | Source documents array |
| `execution_id` | varchar(100) | - | YES | Processing execution ID |
| `processed_at` | timestamp | - | YES | When AI processed the query |
| `updated_at` | timestamp | NOW() | YES | Last update timestamp |

**Indexes Created:**
- `idx_queries_ai_processed` on `ai_processed`
- `idx_queries_admin_reviewed` on `admin_reviewed`
- `idx_queries_processed_at` on `processed_at`

**Data Updates:**
- Sets `ai_processed = true` for all queries where `answered_at IS NOT NULL` (3 queries updated)

### 2. Rollback Migration (rollback_migration.sql)
Removes all columns and indexes added by the forward migration.

**⚠️ WARNING**: Rollback will permanently delete all data in these columns!

### How to Apply Migration
```powershell
# Apply forward migration
$env:PGPASSWORD = "your_password"
psql -h localhost -U postgres -d nhai_tender_db -f database-backups\add_missing_columns_migration.sql
```

### How to Rollback Migration
```powershell
# Rollback (removes added columns)
$env:PGPASSWORD = "your_password"
psql -h localhost -U postgres -d nhai_tender_db -f database-backups\rollback_migration.sql
```

## Code Changes

### Updated Files
1. **backend/src/queries/entities/query.entity.ts**
   - Added all 11 new column mappings
   - Added proper TypeORM decorators with snake_case column names
   - Added indexes for performance

2. **backend/src/prebid-query/prebid-query.service.ts**
   - Re-enabled `aiProcessed` filter (was commented out)
   - Fixed `category` → `categoryId` references
   - Updated query builder to use correct property names

3. **backend/src/admin/controllers/admin-vectorization.controller.ts**
   - Updated to use `categoryId` instead of `category`
   - Updated to use `vendorId` instead of `submittedBy`

4. **backend/src/vectorization/vectorization.service.ts**
   - Updated validation and payload preparation
   - Fixed property name references

## Verification

### Check Migration Status
```sql
-- Verify columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'queries'
  AND column_name IN (
    'ai_processed', 'admin_reviewed', 'ai_response', 'past_ref_response',
    'past_response', 'admin_response', 'confidence', 'source_documents',
    'execution_id', 'processed_at', 'updated_at'
  )
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'queries'
  AND indexname LIKE 'idx_queries_%';

-- Check data
SELECT 
  query_id,
  query_number,
  ai_processed,
  admin_reviewed,
  confidence,
  processed_at
FROM queries
LIMIT 5;
```

### Test Endpoints After Migration
```powershell
# Test queries endpoint
Invoke-RestMethod "http://localhost:3000/api/prebid-queries"

# Test vectorization stats
Invoke-RestMethod "http://localhost:3000/api/admin/vectorization/stats"

# Test admin queries
Invoke-RestMethod "http://localhost:3000/api/admin/vectorization/queries"
```

## Backend Restart Required

After migration, restart the backend server to reload entity definitions:

```powershell
# Kill existing backend
taskkill /F /IM node.exe

# Start backend
cd backend
npm run start:dev
```

Or use the batch file:
```cmd
START_BACKEND.bat
```

## Impact Assessment

### Before Migration
- ❌ `/api/prebid-queries` - 500 error (missing columns)
- ❌ `/api/prebid-queries/{id}/similar` - Would fail
- ❌ `/api/prebid-queries/{id}/process` - Would fail
- ⚠️ `/api/admin/vectorization/stats` - Returns empty data

### After Migration
- ✅ `/api/prebid-queries` - Working with filters
- ✅ `/api/prebid-queries/{id}/similar` - Working
- ✅ `/api/prebid-queries/{id}/process` - Working (can save AI responses)
- ✅ `/api/admin/vectorization/stats` - Returns actual statistics

## Rollback Plan

### Option 1: Full Database Restore
1. Stop backend application
2. Restore from `nhai_tender_db_backup_20260122_154038.sql` (see above)
3. Restart backend

### Option 2: Column Removal Only
1. Execute `rollback_migration.sql`
2. Revert code changes in entity files
3. Restart backend

## Notes

- Migration uses transactions for safety (BEGIN/COMMIT)
- All columns are nullable to allow gradual data population
- Default values prevent NULL issues for boolean columns
- Indexes improve query performance for common filters
- Comments added to database for documentation

## Support

If issues occur:
1. Check backend console for TypeScript compilation errors
2. Verify PostgreSQL is running: `psql -h localhost -U postgres -l`
3. Check column names match entity definitions
4. Review migration execution logs
5. Restore from backup if necessary

---
**Created**: January 22, 2026  
**Author**: NHAI Development Team  
**Database**: nhai_tender_db (PostgreSQL)  
**Backup File**: nhai_tender_db_backup_20260122_154038.sql
