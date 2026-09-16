# Screen 8 API Testing - Synthetic Data Cleanup Guide

**Date:** January 27, 2026  
**Purpose:** Complete guide for cleaning up synthetic test data  
**Status:** ✅ Ready for Implementation

---

## Table of Contents

1. [Why Cleanup?](#why-cleanup)
2. [Safety Guidelines](#safety-guidelines)
3. [Quick Start](#quick-start)
4. [Cleanup Methods Comparison](#cleanup-methods-comparison)
5. [Detailed Instructions](#detailed-instructions)
6. [Troubleshooting](#troubleshooting)
7. [Verification](#verification)

---

## Why Cleanup?

### Key Reasons

✅ **Database Hygiene** - Remove test data that's no longer needed  
✅ **Performance** - Reduce database size and improve query speed  
✅ **Fresh Starts** - Begin new test cycle with clean state  
✅ **Data Privacy** - Ensure test data doesn't persist  
✅ **Regression Testing** - Have consistent baseline for comparisons  
✅ **Compliance** - Archive and remove temporary data  
✅ **Disk Space** - Free up storage after load testing  

### When to Clean Up

- ✅ After completing a full test cycle
- ✅ Before running regression tests
- ✅ Before moving to production testing
- ✅ When reusing test environment
- ✅ During regular maintenance

---

## Safety Guidelines

### ⚠️ CRITICAL: Before Running Cleanup

1. **Verify Database Connection**
   ```cmd
   echo SELECT 1; | psql -h localhost -U postgres -d nhai_tender_db -t -q
   ```

2. **Backup Your Data** (Recommended)
   ```sql
   -- Create backup table
   CREATE TABLE synthetic_data_backup AS
   SELECT * FROM prebid_queries 
   WHERE query_number LIKE 'QRY-SYNC-%';
   ```

3. **Verify You Have the Right Data**
   ```sql
   -- Count records to be deleted
   SELECT COUNT(*) FROM prebid_queries 
   WHERE query_number LIKE 'QRY-SYNC-%';
   ```

4. **Check for Active Processes**
   - Ensure no API tests are running
   - Ensure no long-running queries are active
   - Confirm no external applications using the data

5. **Read the Script**
   - Review cleanup script before running
   - Understand the foreign key dependencies
   - Know which tables will be affected

### ✅ After Cleanup

1. **Verify Success**
   ```sql
   SELECT COUNT(*) FROM prebid_queries 
   WHERE query_number LIKE 'QRY-SYNC-%';
   ```
   Result should be: **0**

2. **Check Related Tables**
   ```sql
   SELECT COUNT(*) FROM workflow_executions 
   WHERE query_id IN (
     SELECT query_id FROM prebid_queries 
     WHERE query_number LIKE 'QRY-SYNC-%'
   );
   ```
   Result should be: **0**

3. **Test APIs**
   ```cmd
   curl http://localhost:3000/api/prebid-queries/statistics
   ```

4. **Archive Cleanup Logs**
   - Save cleanup timestamps
   - Document what was deleted
   - Keep for audit trail

---

## Quick Start

### Fastest Method (SQL)

```cmd
REM 1. Run the cleanup script
psql -h localhost -U postgres -d nhai_tender_db -f cleanup_synthetic_data.sql

REM 2. Verify results
echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db -t -q
```

**Expected Output:** `0`

### Safest Method (PowerShell with Backup)

```powershell
# Run with backup
.\cleanup_synthetic_data.ps1

# Confirm when prompted
```

### Easiest Method (Windows CMD)

```cmd
REM Simply run the script
cleanup_synthetic_data.cmd

REM Confirm when prompted
REM Script will display progress and verify results
```

### Programmatic Method (Node.js)

```cmd
REM Install if needed
npm install pg

REM Run cleanup
node cleanup_synthetic_data.js

REM Confirm when prompted
```

---

## Cleanup Methods Comparison

### Method 1: SQL Direct (cleanup_synthetic_data.sql)

**Best For:** Direct database access, automated scripts, CI/CD pipelines

**Advantages:**
- ⚡ Fastest execution
- 📝 Easy to review
- 🔄 Repeatable and scriptable
- 🎯 Precise control

**Disadvantages:**
- ⚠️ No interactive confirmation
- 🚀 Can be dangerous if not careful
- 📊 Limited progress feedback

**Usage:**
```bash
psql -h localhost -U postgres -d nhai_tender_db -f cleanup_synthetic_data.sql
```

**Features:**
- Deletes from all related tables
- Includes verification query
- Transaction-based (can be rolled back)

---

### Method 2: PowerShell (cleanup_synthetic_data.ps1)

**Best For:** Windows automation, scheduled tasks, PowerShell workflows

**Advantages:**
- ✅ Interactive confirmation
- 📊 Progress feedback
- 🔍 Verification steps
- 📦 Optional backup creation
- 🎨 Colorized output

**Disadvantages:**
- ⏱️ Slightly slower than SQL
- 💻 Windows-only
- 🔧 Requires PowerShell execution policy

**Usage:**
```powershell
# Standard run with confirmation
.\cleanup_synthetic_data.ps1

# Force without confirmation
.\cleanup_synthetic_data.ps1 -Force

# Custom database
.\cleanup_synthetic_data.ps1 -DBHost 192.168.1.100 -DBName testdb

# Skip backup
.\cleanup_synthetic_data.ps1 -NoBackup
```

**Features:**
- Interactive prompts
- Backup creation option
- Colorized status messages
- Complete verification

---

### Method 3: Windows CMD (cleanup_synthetic_data.cmd)

**Best For:** Command prompt users, simple automation, batch files

**Advantages:**
- ✅ Simple to run
- 📊 User-friendly prompts
- 🎨 Colorized output
- 🔍 Verification included
- 🖥️ Native Windows

**Disadvantages:**
- ⏱️ Slower than SQL
- 🔤 Limited scripting features
- 📝 Less flexible parameters

**Usage:**
```cmd
REM Navigate to script directory
cd /d D:\path\to\script

REM Run the script
cleanup_synthetic_data.cmd

REM Confirm when prompted (type 'yes')
```

**Features:**
- User confirmation prompt
- Record count display
- Colorized status (blue for info, green for success, red for errors)
- Verification after cleanup

---

### Method 4: Node.js (cleanup_synthetic_data.js)

**Best For:** API integration, complex cleanup logic, application-level cleanup

**Advantages:**
- 🔌 API integration ready
- 🎯 Precise error handling
- 🔄 Scriptable and repeatable
- 🎨 Colorized output
- ⚙️ Customizable parameters

**Disadvantages:**
- ⏱️ Requires Node.js installation
- 📦 Needs npm dependencies
- 🔧 More complex setup

**Usage:**
```bash
# Install dependencies (one-time)
npm install pg

# Run cleanup
node cleanup_synthetic_data.js

# Force without confirmation
node cleanup_synthetic_data.js --force

# Custom connection
node cleanup_synthetic_data.js --host 192.168.1.100 --database testdb
```

**Features:**
- Interactive confirmation
- Progress messages
- Error handling for missing tables
- Graceful SIGINT handling
- Database parameter support

---

## Detailed Instructions

### SQL Method - Step by Step

**Step 1: Prepare**
```sql
-- Open psql client
psql -h localhost -U postgres -d nhai_tender_db

-- Or from command line:
psql -h localhost -U postgres -d nhai_tender_db
```

**Step 2: Backup (Optional)**
```sql
-- Create backup before deletion
CREATE TABLE synthetic_data_backup AS
SELECT * FROM prebid_queries 
WHERE query_number LIKE 'QRY-SYNC-%';

-- Verify backup
SELECT COUNT(*) FROM synthetic_data_backup;
```

**Step 3: Run Cleanup**
```sql
-- Start transaction (can be rolled back if needed)
BEGIN;

-- Delete workflow executions
DELETE FROM workflow_executions 
WHERE query_id IN (
  SELECT query_id FROM prebid_queries 
  WHERE query_number LIKE 'QRY-SYNC-%'
);

-- Delete query history
DELETE FROM query_history 
WHERE query_id IN (
  SELECT query_id FROM prebid_queries 
  WHERE query_number LIKE 'QRY-SYNC-%'
);

-- Delete admin responses
DELETE FROM admin_responses 
WHERE query_id IN (
  SELECT query_id FROM prebid_queries 
  WHERE query_number LIKE 'QRY-SYNC-%'
);

-- Delete main queries
DELETE FROM prebid_queries 
WHERE query_number LIKE 'QRY-SYNC-%';

-- Commit changes
COMMIT;
```

**Step 4: Verify**
```sql
-- Check remaining synthetic records
SELECT COUNT(*) as remaining FROM prebid_queries 
WHERE query_number LIKE 'QRY-SYNC-%';

-- Should return: 0
```

---

### PowerShell Method - Step by Step

**Step 1: Open PowerShell**
```powershell
# As Administrator (recommended)
# Right-click PowerShell → Run as Administrator
```

**Step 2: Navigate to Script**
```powershell
cd D:\path\to\NHAI-TENDER-AUTOMATION
```

**Step 3: Check Execution Policy (if needed)**
```powershell
# If you get "cannot be loaded" error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Step 4: Run Cleanup**
```powershell
# Standard execution with confirmation
.\cleanup_synthetic_data.ps1

# When prompted, type: yes

# Or use force flag to skip confirmation
.\cleanup_synthetic_data.ps1 -Force
```

**Step 5: Review Output**
```
✅ Database connection successful
Found 20 synthetic query records to delete
✅ Synthetic data cleanup complete!
✅ Remaining synthetic queries: 0
✨ Cleanup process complete!
```

---

### Windows CMD Method - Step by Step

**Step 1: Open Command Prompt**
```
Windows key → type "cmd" → Press Enter
```

**Step 2: Navigate to Script**
```cmd
cd /d D:\path\to\NHAI-TENDER-AUTOMATION
```

**Step 3: Verify psql is Available**
```cmd
where psql
REM Should show path to psql.exe
```

**Step 4: Run Cleanup**
```cmd
cleanup_synthetic_data.cmd
```

**Step 5: Confirm Deletion**
```
Found 20 synthetic query records

WARNING: About to DELETE 20 synthetic test data records!

Are you sure you want to DELETE all records? (Type 'yes' to confirm): yes
```

**Step 6: Review Results**
```
✅ Synthetic data cleanup complete!
✅ Remaining synthetic queries: 0
✨ Cleanup process complete!
```

---

### Node.js Method - Step by Step

**Step 1: Install Node.js (if needed)**
```cmd
# Download from https://nodejs.org/
# Or use package manager

choco install nodejs

# Verify installation
node --version
npm --version
```

**Step 2: Navigate to Script**
```cmd
cd /d D:\path\to\NHAI-TENDER-AUTOMATION
```

**Step 3: Install Dependencies**
```bash
npm install pg
```

**Step 4: Run Cleanup**
```bash
# Standard run
node cleanup_synthetic_data.js

# Force without confirmation
node cleanup_synthetic_data.js --force

# Custom database host
node cleanup_synthetic_data.js --host 192.168.1.100
```

**Step 5: Confirm (if using standard mode)**
```
Found 20 synthetic query records

⚠️  WARNING: About to DELETE all synthetic test data!

Are you sure? (Type "yes" to confirm): yes
```

**Step 6: Review Output**
```
✅ Deleted 15 workflow executions records
✅ Deleted 20 admin responses records
✅ Deleted 20 prebid queries records

🔍 Verifying cleanup...
✅ Remaining synthetic queries: 0

✨ Cleanup process complete!
```

---

## Troubleshooting

### Issue 1: "psql command not found"

**Problem:** psql is not installed or not in PATH

**Solution:**
```cmd
REM Check if PostgreSQL is installed
where psql

REM If not found, install PostgreSQL
REM Download from: https://www.postgresql.org/download/

REM Or add PostgreSQL bin directory to PATH
REM Typically: C:\Program Files\PostgreSQL\15\bin

REM Add to PATH temporarily
set PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin
```

---

### Issue 2: "Connection refused on port 5432"

**Problem:** PostgreSQL is not running

**Solution:**
```cmd
REM Check if PostgreSQL service is running
sc query postgresql-x64-15

REM Start the service
net start postgresql-x64-15

REM Or start PostgreSQL through Services:
services.msc

REM Verify connection
echo SELECT 1; | psql -h localhost -U postgres -d nhai_tender_db -t -q
```

---

### Issue 3: "Role 'postgres' does not exist"

**Problem:** Different database user or configuration

**Solution:**
```cmd
REM Find your database user
REM Check PostgreSQL configuration files
REM Or query for available users

REM Update scripts with correct user
REM Edit cleanup_synthetic_data.cmd (or .ps1/.sql)
REM Change: -U postgres
REM To: -U your_actual_user

REM Then run cleanup with correct user
cleanup_synthetic_data.cmd
```

---

### Issue 4: "Database 'nhai_tender_db' does not exist"

**Problem:** Database has different name or is not created

**Solution:**
```sql
-- List available databases
\l

-- Or from psql
SELECT datname FROM pg_database;

-- Update cleanup scripts with correct database name
-- Edit the cleanup script and change:
-- -d nhai_tender_db
-- To:
-- -d your_actual_database_name
```

---

### Issue 5: "Permission denied" Error

**Problem:** Insufficient permissions to delete data

**Solution:**
```sql
-- Check current user permissions
SELECT current_user;

-- Grant necessary permissions
GRANT DELETE ON prebid_queries TO your_user;
GRANT DELETE ON workflow_executions TO your_user;
GRANT DELETE ON query_history TO your_user;
GRANT DELETE ON admin_responses TO your_user;

-- Then retry cleanup
```

---

### Issue 6: "Foreign key constraint violation"

**Problem:** Child records still referencing parent records

**Solution:**
```sql
-- Cleanup script handles this by deleting in correct order:
-- 1. workflow_executions (references prebid_queries)
-- 2. query_history (references prebid_queries)
-- 3. admin_responses (references prebid_queries)
-- 4. Finally prebid_queries

-- If you still get error, check for other references:
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'prebid_queries' AND constraint_type = 'FOREIGN KEY';
```

---

### Issue 7: "Script is running very slowly"

**Problem:** Large amount of data to delete

**Solution:**
```sql
-- Check how many records will be deleted
SELECT COUNT(*) FROM prebid_queries 
WHERE query_number LIKE 'QRY-SYNC-%';

-- If very large (>100,000), consider:
-- 1. Running during off-peak hours
-- 2. Deleting in batches:

-- Delete in batches of 1000
DELETE FROM workflow_executions 
WHERE query_id IN (
  SELECT query_id FROM prebid_queries 
  WHERE query_number LIKE 'QRY-SYNC-%'
  LIMIT 1000
);

-- Repeat until all deleted
```

---

## Verification

### Post-Cleanup Verification

**1. Check Synthetic Data Deleted**
```sql
SELECT COUNT(*) FROM prebid_queries 
WHERE query_number LIKE 'QRY-SYNC-%';
-- Should return: 0
```

**2. Check Related Records Deleted**
```sql
SELECT COUNT(*) FROM workflow_executions 
WHERE query_id::text LIKE '11111111-%' OR query_id::text LIKE '22222222-%';
-- Should return: 0

SELECT COUNT(*) FROM admin_responses 
WHERE query_id::text LIKE '11111111-%' OR query_id::text LIKE '22222222-%';
-- Should return: 0

SELECT COUNT(*) FROM query_history 
WHERE query_id::text LIKE '11111111-%' OR query_id::text LIKE '22222222-%';
-- Should return: 0
```

**3. Test APIs**
```cmd
REM Statistics should still work
curl http://localhost:3000/api/prebid-queries/statistics

REM Should return valid response with updated counts
```

**4. Verify Database Health**
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('nhai_tender_db'));

-- Check table sizes
SELECT 
  schemaname, 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Complete Cleanup Workflow

### Option A: One-Command Cleanup

```cmd
REM Just run the script and confirm
cleanup_synthetic_data.cmd
```

### Option B: Safe Cleanup with Verification

**Step 1: Count Records**
```cmd
echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db -t -q
```

**Step 2: Create Backup**
```cmd
REM Run backup portion of SQL script
```

**Step 3: Run Cleanup**
```cmd
cleanup_synthetic_data.cmd
```

**Step 4: Verify Results**
```cmd
echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db -t -q
```

**Step 5: Test APIs**
```cmd
curl http://localhost:3000/api/prebid-queries/statistics
```

### Option C: Batch Cleanup (For Large Datasets)

```sql
-- Delete in batches of 5000 to avoid locking
DELETE FROM workflow_executions 
WHERE query_id IN (
  SELECT query_id FROM prebid_queries 
  WHERE query_number LIKE 'QRY-SYNC-%'
  LIMIT 5000
);
-- Repeat this command until no rows are deleted
```

---

## Quick Reference Summary

| Task | Command |
|------|---------|
| **Count synthetic records** | `echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; \| psql -h localhost -U postgres -d nhai_tender_db -t -q` |
| **Run SQL cleanup** | `psql -h localhost -U postgres -d nhai_tender_db -f cleanup_synthetic_data.sql` |
| **Run PowerShell cleanup** | `.\cleanup_synthetic_data.ps1` |
| **Run CMD cleanup** | `cleanup_synthetic_data.cmd` |
| **Run Node.js cleanup** | `node cleanup_synthetic_data.js` |
| **Verify cleanup** | `echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; \| psql -h localhost -U postgres -d nhai_tender_db -t -q` |
| **Test API after cleanup** | `curl http://localhost:3000/api/prebid-queries/statistics` |
| **Check database size** | `SELECT pg_size_pretty(pg_database_size('nhai_tender_db'));` |

---

## Additional Resources

- **SCREEN8_API_TESTING_GUIDE.md** - Full testing guide with cleanup section
- **SCREEN8_API_QUICK_REFERENCE_CMD.md** - Quick reference with cleanup commands
- **cleanup_synthetic_data.sql** - SQL cleanup script
- **cleanup_synthetic_data.ps1** - PowerShell cleanup script
- **cleanup_synthetic_data.cmd** - Windows CMD cleanup script
- **cleanup_synthetic_data.js** - Node.js cleanup script

---

## Support

**Common Questions:**

Q: Can I recover deleted data?
A: Only if you created a backup before cleanup. Backups are not automatic.

Q: What if cleanup fails halfway?
A: Most tables can be cleaned up independently. Check which table failed and clean it separately.

Q: How long does cleanup take?
A: SQL method: <1 second for 100 records. Depends on dataset size.

Q: Can I schedule cleanup?
A: Yes, use SQL script in cron job (Linux) or Task Scheduler (Windows).

Q: Is there a way to undo cleanup?
A: Only if you created a backup beforehand or used a transaction that was rolled back.

---

**Last Updated:** January 27, 2026  
**Cleanup Guide Version:** 1.0  
**Status:** ✅ Complete and Production Ready
