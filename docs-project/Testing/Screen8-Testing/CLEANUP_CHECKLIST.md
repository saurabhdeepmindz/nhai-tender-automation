# Screen 8 API Testing - Cleanup Checklist

**Quick Checklist for Synthetic Data Cleanup**

---

## ✅ Pre-Cleanup Verification

- [ ] PostgreSQL is running (port 5432)
  ```cmd
  netstat -ano | findstr :5432
  ```

- [ ] Can connect to database
  ```cmd
  echo SELECT 1; | psql -h localhost -U postgres -d nhai_tender_db -t -q
  ```

- [ ] Counted synthetic records before cleanup
  ```cmd
  echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db -t -q
  ```

- [ ] No active API tests running

- [ ] No long-running database queries

- [ ] Have read appropriate section in CLEANUP_GUIDE.md

- [ ] Chose cleanup method:
  - [ ] SQL (fastest)
  - [ ] PowerShell (safest with backup)
  - [ ] Windows CMD (simple)
  - [ ] Node.js (integration)

---

## 🧹 Cleanup Execution

### If Using SQL Method
```cmd
psql -h localhost -U postgres -d nhai_tender_db -f cleanup_synthetic_data.sql
```
- [ ] Script executed without errors
- [ ] Output shows "Cleanup complete!"

### If Using PowerShell Method
```powershell
.\cleanup_synthetic_data.ps1
```
- [ ] Database connection successful
- [ ] Record count displayed
- [ ] Confirmed deletion (typed 'yes')
- [ ] Output shows cleanup complete

### If Using Windows CMD Method
```cmd
cleanup_synthetic_data.cmd
```
- [ ] Script launched
- [ ] Record count displayed
- [ ] Confirmed deletion (typed 'yes')
- [ ] Output shows cleanup complete

### If Using Node.js Method
```bash
npm install pg
node cleanup_synthetic_data.js
```
- [ ] Dependencies installed
- [ ] Database connected
- [ ] Confirmed deletion (typed 'yes')
- [ ] All tables cleaned up

---

## ✅ Post-Cleanup Verification

- [ ] Verify synthetic records deleted (should be 0)
  ```cmd
  echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db -t -q
  ```

- [ ] Verify workflow_executions cleaned (should be 0)
  ```sql
  SELECT COUNT(*) FROM workflow_executions WHERE query_id::text LIKE '11111111-%';
  ```

- [ ] Verify admin_responses cleaned (should be 0)
  ```sql
  SELECT COUNT(*) FROM admin_responses WHERE query_id::text LIKE '11111111-%';
  ```

- [ ] Verify query_history cleaned (should be 0)
  ```sql
  SELECT COUNT(*) FROM query_history WHERE query_id::text LIKE '11111111-%';
  ```

- [ ] Test API still works
  ```cmd
  curl http://localhost:3000/api/prebid-queries/statistics
  ```
  Expected: Valid JSON response with statistics

- [ ] Check database is healthy
  ```sql
  SELECT pg_size_pretty(pg_database_size('nhai_tender_db'));
  ```

---

## 📝 Cleanup Documentation

- [ ] Recorded cleanup method used: ___________________

- [ ] Recorded cleanup timestamp: ___________________

- [ ] Recorded records deleted: ___________________

- [ ] Archived cleanup logs (if applicable): ___________________

- [ ] Updated cleanup documentation: ___________________

---

## 🆘 Troubleshooting (if needed)

If cleanup failed:
- [ ] Check error message in output
- [ ] See CLEANUP_GUIDE.md → Troubleshooting section
- [ ] Verify PostgreSQL is still running
- [ ] Check database connection
- [ ] Verify correct database name
- [ ] Check user permissions
- [ ] Review cleanup script for syntax errors

If verification failed:
- [ ] Records still showing in count query (not deleted)
- [ ] API not responding (backend issue)
- [ ] Database connection lost
- [ ] See CLEANUP_GUIDE.md → Verification section

---

## 📊 Cleanup Status

| Item | Status | Notes |
|------|--------|-------|
| Pre-cleanup checks | ✅ Complete | ________ |
| Cleanup method | ✅ Selected | ________ |
| Cleanup execution | ✅ Complete | ________ |
| Verification | ✅ Passed | ________ |
| Documentation | ✅ Updated | ________ |

---

## 🎯 Quick Command Summary

```cmd
REM 1. Count before cleanup
echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db -t -q

REM 2. Run cleanup (choose one)
REM Option A: SQL
psql -h localhost -U postgres -d nhai_tender_db -f cleanup_synthetic_data.sql

REM Option B: PowerShell
.\cleanup_synthetic_data.ps1

REM Option C: Windows CMD
cleanup_synthetic_data.cmd

REM Option D: Node.js
node cleanup_synthetic_data.js

REM 3. Verify cleanup (should return 0)
echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db -t -q

REM 4. Test API
curl http://localhost:3000/api/prebid-queries/statistics
```

---

## 📞 Support

**Issue:** Can't find cleanup script  
**Solution:** Check NHAI-TENDER-AUTOMATION directory for cleanup_synthetic_data.* files

**Issue:** Cleanup failed  
**Solution:** See CLEANUP_GUIDE.md → Troubleshooting section

**Issue:** Still seeing synthetic data after cleanup  
**Solution:** Verify count query above shows 0, or rerun cleanup script

**Issue:** Need help choosing cleanup method  
**Solution:** See CLEANUP_GUIDE.md → Cleanup Methods Comparison

---

## ✨ All Done!

Once all checks are complete and verified:
- ✅ Synthetic data cleaned up
- ✅ Database verified healthy
- ✅ APIs working properly
- ✅ Ready for fresh testing cycle

**Congratulations! Your testing environment is clean and ready for the next cycle.**

---

**Cleanup Checklist Version:** 1.0  
**Date:** January 27, 2026  
**Last Updated:** January 27, 2026
