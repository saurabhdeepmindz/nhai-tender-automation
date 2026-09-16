# 🔄 Database Migration Guide - Complete Instructions

**NHAI Tender Query Automation System**  
**Where and How to Run TypeORM Migrations**

---

## ⚠️ **IMPORTANT: These Are Backend Commands!**

The migration commands you mentioned are for the **NestJS Backend**, NOT for Python services (Screen 7 or Screen 8).

```
❌ WRONG: Run in python-rag/screen07-history-retriever/
❌ WRONG: Run in python-rag/screen08-chief-engineer/

✅ CORRECT: Run in backend/
```

---

## 📂 **Correct Directory**

### **Run migrations from:**
```bash
cd backend/           ← Run from here!
```

**NOT from:**
```bash
cd python-rag/screen07-history-retriever/  ← NO!
cd python-rag/screen08-chief-engineer/     ← NO!
```

---

## 🎯 **Step-by-Step Migration Process**

### **Step 1: Navigate to Backend Directory**

```bash
# From project root
cd NHAI-Tender-Automation/backend

# Verify you're in the right place
ls package.json  # Should exist
ls src/         # Should exist
```

### **Step 2: Ensure Database is Running**

```bash
# Check PostgreSQL is running

# Windows (PowerShell):
Get-Service postgresql*

# Linux:
sudo systemctl status postgresql

# Or test connection:
psql -h localhost -U postgres -d nhai_tender_db
```

### **Step 3: Configure Database Connection**

Make sure your `.env` file has correct database credentials:

```bash
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nhai_tender_db
```

### **Step 4: Generate Migration (If Needed)**

```bash
# Generate migration file
npm run migration:generate -- AddVectorizationSupport
```

**What this does:**
- Creates a new migration file in `backend/src/migrations/`
- Compares current entities with database schema
- Generates SQL for schema changes

**When to use:**
- When you've added new entities
- When you've modified entity columns
- First time setting up vectorization

### **Step 5: Run Migration**

```bash
# Apply migrations to database
npm run migration:run
```

**What this does:**
- Adds `vectorized` column to `queries` table
- Adds `vector_stored_at` column to `queries` table
- Creates `vectorization_logs` table
- Creates indexes for performance

**Expected output:**
```
query: SELECT * FROM "migrations"
query: CREATE TABLE "vectorization_logs" ...
query: ALTER TABLE "queries" ADD "vectorized" boolean DEFAULT false
query: ALTER TABLE "queries" ADD "vector_stored_at" timestamp
query: CREATE INDEX "IDX_QUERIES_VECTORIZED" ...
Migration AddVectorizationSupport has been executed successfully.
```

---

## 🔍 **What Gets Created**

### **Changes to `queries` Table:**
```sql
-- New columns added
ALTER TABLE queries ADD COLUMN vectorized BOOLEAN DEFAULT FALSE;
ALTER TABLE queries ADD COLUMN vector_stored_at TIMESTAMP NULL;

-- Index for performance
CREATE INDEX IDX_QUERIES_VECTORIZED ON queries(vectorized);
```

### **New `vectorization_logs` Table:**
```sql
CREATE TABLE vectorization_logs (
  log_id UUID PRIMARY KEY,
  query_id UUID REFERENCES queries(query_id) ON DELETE CASCADE,
  status VARCHAR NOT NULL,  -- 'success' or 'failed'
  duration INTEGER,         -- milliseconds
  embedding_dimension INTEGER,
  processing_time FLOAT,
  error_message TEXT,
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IDX_VECTORIZATION_LOGS_QUERY_ID ON vectorization_logs(query_id);
CREATE INDEX IDX_VECTORIZATION_LOGS_STATUS ON vectorization_logs(status);
```

---

## ✅ **Verification**

### **Check Migration Status:**

```bash
# List all migrations
npm run typeorm migration:show
```

**Expected output:**
```
[X] AddVectorizationSupport  ← Should show as executed
```

### **Verify Database Changes:**

```sql
-- Check queries table
\d queries

-- Should show new columns:
-- vectorized | boolean | default false
-- vector_stored_at | timestamp without time zone |

-- Check vectorization_logs table exists
\d vectorization_logs
```

---

## 🐛 **Troubleshooting**

### **Issue 1: "command not found: npm"**

**Solution:**
```bash
# You're in the wrong directory!
cd backend/

# Or install Node.js if missing
# Windows: Download from nodejs.org
# Linux: sudo apt install nodejs npm
```

---

### **Issue 2: "Connection refused"**

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Start PostgreSQL

# Windows:
# Start PostgreSQL service from Services app

# Linux:
sudo systemctl start postgresql

# macOS:
brew services start postgresql
```

---

### **Issue 3: "relation 'queries' does not exist"**

**Error:**
```
QueryFailedError: relation "queries" does not exist
```

**Solution:**
```bash
# Database is empty - need to run initial migrations first
# Run ALL migrations from the beginning:
npm run migration:run

# Or recreate database:
psql -U postgres
DROP DATABASE nhai_tender_db;
CREATE DATABASE nhai_tender_db;
\q

# Then run migrations:
npm run migration:run
```

---

### **Issue 4: "Migration has already been executed"**

**Error:**
```
AddVectorizationSupport has already been executed
```

**Solution:**
```bash
# This is actually good! It means migration already ran.
# No action needed.

# If you want to revert and re-run:
npm run migration:revert
npm run migration:run
```

---

### **Issue 5: "Cannot find module 'typeorm'"**

**Solution:**
```bash
# Install dependencies
npm install

# Verify TypeORM is installed
npm list typeorm
```

---

## 🔄 **Migration Workflow**

```
┌─────────────────────────────────────────────┐
│ 1. Navigate to backend/ directory           │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. Ensure PostgreSQL is running             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. Configure .env database credentials      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. npm run migration:generate (if needed)   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. npm run migration:run                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 6. Verify with: npm run typeorm migration:show│
└─────────────────────────────────────────────┘
```

---

## 📊 **Directory Structure Clarification**

```
NHAI-Tender-Automation/
│
├── backend/                         ← RUN MIGRATIONS HERE!
│   ├── src/
│   │   ├── migrations/              ← Migration files created here
│   │   ├── app.module.ts
│   │   └── ...
│   ├── package.json                 ← Has migration scripts
│   ├── .env                         ← Database config
│   └── node_modules/
│
├── python-rag/                      ← NO MIGRATIONS HERE
│   ├── screen07-history-retriever/  ← Python service (no TypeORM)
│   ├── screen08-chief-engineer/     ← Python service (no TypeORM)
│   └── shared/
│
└── frontend/                        ← NO MIGRATIONS HERE
    └── app/
```

---

## 🎯 **Quick Reference**

### **All Migration Commands:**

```bash
# From backend/ directory:

# Generate new migration
npm run migration:generate -- MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run typeorm migration:show

# Create empty migration
npm run typeorm migration:create src/migrations/MigrationName
```

---

## ❓ **Why Backend, Not Python Services?**

**Backend (NestJS):**
- Uses TypeORM (Object-Relational Mapping)
- Manages PostgreSQL database schema
- Runs migrations to modify database structure
- Written in TypeScript

**Python Services (Screen 7 & 8):**
- Don't manage database schema
- Only use vector databases (ChromaDB)
- Don't use TypeORM or SQL migrations
- Written in Python

**Database Flow:**
```
Backend (NestJS)
  ↓ Creates/manages tables via TypeORM migrations
PostgreSQL
  ↑ Queries data
Backend (NestJS)
```

```
Python Services (Screen 7/8)
  ↓ Stores vectors
ChromaDB (Vector Database)
  ↑ Searches vectors
Python Services
```

---

## ✅ **Complete Migration Checklist**

- [ ] Navigate to `backend/` directory
- [ ] PostgreSQL is running
- [ ] `.env` has correct database credentials
- [ ] Database `nhai_tender_db` exists
- [ ] Dependencies installed (`npm install`)
- [ ] Run `npm run migration:run`
- [ ] Verify with `npm run typeorm migration:show`
- [ ] Check database has new columns/tables
- [ ] Backend starts without errors
- [ ] No migration errors in logs

---

## 🎉 **Success Indicators**

When migrations run successfully:

```
✓ Command executed from backend/ directory
✓ PostgreSQL connected successfully
✓ Migration file created/found
✓ SQL executed without errors
✓ queries.vectorized column exists
✓ queries.vector_stored_at column exists
✓ vectorization_logs table exists
✓ Indexes created
✓ Backend starts without database errors
```

---

## 📞 **Still Confused?**

**Quick Answer:**
```bash
# Just run this:
cd backend
npm run migration:run
```

**That's it!** No need to run anything in Python folders.

---

**Summary:**
- ✅ Run from: `backend/`
- ❌ NOT from: `python-rag/screen07-*` or `python-rag/screen08-*`
- 🎯 Purpose: Add vectorization columns to PostgreSQL
- 📦 Tool: TypeORM (NestJS)
- 🗄️ Database: PostgreSQL (not ChromaDB)

---

**Key Command:**
```bash
cd backend && npm run migration:run
```

Done! ✅
