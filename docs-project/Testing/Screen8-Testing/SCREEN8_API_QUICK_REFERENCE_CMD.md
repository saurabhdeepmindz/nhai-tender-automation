# Screen 8 API Testing - Quick Reference (CMD)

## Essential Windows CMD Commands

### Port & Service Checking
```cmd
REM Check if port is in use
netstat -ano | findstr :3000
netstat -ano | findstr :8001
netstat -ano | findstr :5432

REM Kill process on specific port
tasklist | findstr :3000
taskkill /PID <PID> /F
```

### API Testing with curl

```cmd
REM GET request
curl http://localhost:3000/api/prebid-queries/statistics

REM POST request
curl -X POST http://localhost:3000/api/prebid-queries/ID/process ^
  -H "Content-Type: application/json" ^
  -d "{}"

REM PATCH request
curl -X PATCH http://localhost:3000/api/prebid-queries/ID/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"answered\"}"

REM Save response to file
curl http://localhost:3000/api/prebid-queries > response.json

REM Pretty print with jq (if installed)
curl http://localhost:3000/api/prebid-queries | jq "."
```

### File Operations

```cmd
REM View file contents
type response.json

REM List directory
dir api_responses\

REM Create directory
mkdir api_responses

REM Search in file
findstr /I "error" logfile.log

REM View file size
dir response.json
```

---

## All 10 API Endpoints

### 1. GET /statistics
```cmd
curl http://localhost:3000/api/prebid-queries/statistics
```

### 2. GET / (All Queries)
```cmd
curl "http://localhost:3000/api/prebid-queries?status=pending&page=1&pageSize=10"
```

### 3. GET /:id (Single Query)
```cmd
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111
```

### 4. POST /:id/process (AI Processing)
```cmd
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/process ^
  -H "Content-Type: application/json" ^
  -d "{\"forceReprocess\": false}"
```

### 5. PATCH /:id/status (Update Status)
```cmd
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"answered\"}"
```

### 6. POST /:id/admin-response (Save Response)
```cmd
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/admin-response ^
  -H "Content-Type: application/json" ^
  -d "{\"response\": \"Sample response\"}"
```

### 7. GET /:id/history (Audit Trail)
```cmd
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/history
```

### 8. GET /:id/similar (Similar Queries)
```cmd
curl "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/similar?limit=5"
```

### 9. GET /workflow/executions (Execution List)
```cmd
curl "http://localhost:3000/api/prebid-queries/workflow/executions?page=1&pageSize=10"
```

### 10. GET /workflow/executions/:executionId (Execution Details)
```cmd
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260127-103500
```

---

## Testing Workflow (Complete Sequence)

### Phase 1: Preparation
```cmd
REM 1. Check backend
netstat -ano | findstr :3000

REM 2. Check database
netstat -ano | findstr :5432

REM 3. Verify data
curl http://localhost:3000/api/prebid-queries/statistics
```

### Phase 2: Read Operations
```cmd
REM 1. Statistics
curl http://localhost:3000/api/prebid-queries/statistics > stats.json

REM 2. Filtered queries
curl "http://localhost:3000/api/prebid-queries?status=pending" > pending.json

REM 3. Single query
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111 > query.json
```

### Phase 3: Write Operations
```cmd
REM 1. Update status
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"under_review\"}"

REM 2. Save admin response
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/admin-response ^
  -H "Content-Type: application/json" ^
  -d "{\"response\": \"24 months as per Section 3.2\"}"
```

### Phase 4: Integration Testing
```cmd
REM 1. Check Screen 8
netstat -ano | findstr :8001

REM 2. Process query
curl -X POST http://localhost:3000/api/prebid-queries/22222222-2222-2222-2222-222222222222/process ^
  -H "Content-Type: application/json" ^
  -d "{}" > execution.json

REM 3. View execution details
type execution.json
```

### Phase 5: Validation
```cmd
REM 1. Final statistics
curl http://localhost:3000/api/prebid-queries/statistics > final_stats.json

REM 2. Count queries
curl "http://localhost:3000/api/prebid-queries?pageSize=100" | jq ".pagination.total"

REM 3. View stats
type final_stats.json
```

---

## Troubleshooting Quick Reference

### Service Not Running
```cmd
REM Check which service isn't responding
netstat -ano | findstr :PORT

REM Kill and restart (if needed)
taskkill /PID <PID> /F

REM Check service status
sc query servicename

REM Start service
net start servicename

REM Stop service
net stop servicename
```

### Connection Errors
```cmd
REM Test connectivity
curl -v http://localhost:3000/api/prebid-queries/statistics

REM Check response headers
curl -i http://localhost:3000/api/prebid-queries/statistics

REM Detailed error info
curl -v http://localhost:3000/api/prebid-queries/invalid-uuid 2>&1
```

### Data Verification
```cmd
REM Get total query count
curl http://localhost:3000/api/prebid-queries/statistics | jq ".total_queries"

REM Get pending queries count
curl http://localhost:3000/api/prebid-queries/statistics | jq ".by_status.pending"

REM Verify synthetic data
curl "http://localhost:3000/api/prebid-queries?pageSize=100" | jq ".data[] | select(.queryNumber | startswith(\"QRY-SYNC\"))"
```

### Log Checking
```cmd
REM View recent errors in log
type backend.log | findstr /I "error"

REM View last 50 lines
powershell -Command "Get-Content backend.log -Tail 50"

REM Search for specific text
type backend.log | findstr "API_PROCESSING_STARTED"
```

---

## JSON Pretty Printing

### With jq (Recommended)
```cmd
REM Pretty print
curl http://localhost:3000/api/prebid-queries | jq "."

REM Select specific field
curl http://localhost:3000/api/prebid-queries | jq ".data[0]"

REM Filter results
curl "http://localhost:3000/api/prebid-queries?status=pending" | jq ".data[] | {queryNumber, status}"
```

### Without jq
```cmd
REM Save to file and open in editor
curl http://localhost:3000/api/prebid-queries > response.json
notepad response.json

REM Use PowerShell for formatting
curl http://localhost:3000/api/prebid-queries | powershell -Command "ConvertFrom-Json | ConvertTo-Json -Depth 10"
```

---

## Common Test Scenarios

### Test 1: Basic API Health
```cmd
REM Quick health check of all services
echo Checking Backend...
curl http://localhost:3000/api/prebid-queries/statistics

echo.
echo Checking Screen 8...
curl http://localhost:8001/api/health

echo.
echo Checking Database...
netstat -ano | findstr :5432
```

### Test 2: Data Loading
```cmd
REM Verify synthetic data is loaded
echo Total queries in system:
curl http://localhost:3000/api/prebid-queries/statistics | jq ".total_queries"

echo Pending queries:
curl http://localhost:3000/api/prebid-queries/statistics | jq ".by_status.pending"

echo Answered queries:
curl http://localhost:3000/api/prebid-queries/statistics | jq ".by_status.answered"
```

### Test 3: Full Workflow
```cmd
REM Create a batch test script
@echo off
echo Testing Screen 8 API...

REM Test 1: Statistics
echo Test 1: GET /statistics
curl http://localhost:3000/api/prebid-queries/statistics > test1.json

REM Test 2: Get all queries
echo Test 2: GET /queries
curl "http://localhost:3000/api/prebid-queries?page=1&pageSize=5" > test2.json

REM Test 3: Get single query
echo Test 3: GET /queries/ID
curl "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111" > test3.json

echo All tests complete. Results saved to test1.json, test2.json, test3.json
```

---

## Installation Prerequisites

### curl
```cmd
REM Check if curl is installed
curl --version

REM If not installed (Windows 10+), it should be pre-installed
REM Download from: https://curl.se/download.html
```

### jq (Optional, for JSON formatting)
```cmd
REM Using Chocolatey
choco install jq

REM Or download from
REM https://stedolan.github.io/jq/download/
```

---

## Cleanup Synthetic Data

### SQL Cleanup
```cmd
REM Direct database cleanup
psql -h localhost -U postgres -d nhai_tender_db -f cleanup_synthetic_data.sql

REM Or run it directly
echo DELETE FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db
```

### PowerShell Cleanup
```powershell
# Simple cleanup
.\cleanup_synthetic_data.ps1

# Force delete without confirmation
.\cleanup_synthetic_data.ps1 -Force

# Custom database
.\cleanup_synthetic_data.ps1 -DBHost 192.168.1.100 -DBName testdb
```

### Windows CMD Cleanup
```cmd
REM Run the cleanup script
cleanup_synthetic_data.cmd

REM Confirm when prompted
```

### Node.js Cleanup
```cmd
REM Install dependencies first
npm install pg

REM Run cleanup
node cleanup_synthetic_data.js

REM Force delete
node cleanup_synthetic_data.js --force
```

### Quick Cleanup Verification
```cmd
REM Count remaining synthetic records
echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; | psql -h localhost -U postgres -d nhai_tender_db -t -q
```

---

## Quick Tips

✅ **Use line continuation (`^`) at end of line in CMD**
```cmd
curl -X POST http://localhost:3000/api/prebid-queries/ID/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"answered\"}"
```

✅ **Escape quotes properly**
```cmd
REM Use \" for quotes inside JSON strings
-d "{\"status\": \"answered\", \"notes\": \"Test\"}"
```

✅ **Redirect output to file**
```cmd
REM Save response
curl http://localhost:3000/api/prebid-queries > queries.json

REM Append to file
curl http://localhost:3000/api/prebid-queries >> all_responses.json
```

✅ **Use pipes for processing**
```cmd
REM Pipe to findstr for searching
curl http://localhost:3000/api/prebid-queries | findstr "pending"

REM Pipe to jq for JSON filtering
curl http://localhost:3000/api/prebid-queries | jq ".data[] | .status"
```

---

**Last Updated:** January 27, 2026  
**Quick Reference Version:** 1.0
