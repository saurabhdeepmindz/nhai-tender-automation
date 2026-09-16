# Windows CMD Support Added to SCREEN8_API_TESTING_GUIDE.md

**Date:** January 27, 2026  
**Update:** Complete Windows Command Prompt (CMD) examples added to all API testing documentation

---

## Summary of Updates

✅ **Added Windows CMD examples to all sections:**

### 1. API Testing Methods Section
- **Method 5: Windows Command Prompt (CMD)** - New section added
  - Prerequisites for curl and jq installation
  - Basic GET/POST/PATCH commands
  - Network testing commands using `netstat`
  - File operations (saving responses, viewing files)

### 2. Endpoint-by-Endpoint Testing (All 10 Endpoints)

Each endpoint now includes **3 testing methods:**
1. **cURL Examples** (bash/command line)
2. **Windows CMD Examples** (native Windows commands)
3. **PowerShell Examples** (PowerShell specific)

**Updated Endpoints:**
- ✅ GET `/statistics`
- ✅ GET `/` (all queries)
- ✅ GET `/:id` (single query)
- ✅ POST `/:id/process` (AI processing)
- ✅ PATCH `/:id/status` (update status)
- ✅ POST `/:id/admin-response` (save response)
- ✅ GET `/:id/history` (audit trail)
- ✅ GET `/:id/similar` (similar queries)
- ✅ GET `/workflow/executions` (execution list)
- ✅ GET `/workflow/executions/:executionId` (execution details)

### 3. Testing Workflow Section

**Phase-by-phase CMD examples:**
- **Phase 1:** Preparation (data setup, verification)
- **Phase 2:** Read Operations (GET endpoints)
- **Phase 3:** Write Operations (POST/PATCH endpoints)
- **Phase 4:** Integration Testing (AI processing, workflow)
- **Phase 5:** Validation (data integrity checks)

### 4. Troubleshooting Section

**Added CMD solutions for common issues:**
1. Backend connection failures
   - Port checking with `netstat`
   - Process management with `taskkill`
   
2. Screen 8 connection issues
   - Service port verification
   - Health check testing
   
3. UUID validation problems
   - UUID format testing via API
   - Invalid UUID handling
   
4. Database issues
   - Data verification
   - Query counting
   - Statistics checking
   
5. AI Processing errors
   - Screen 8 health verification
   - Log file inspection with `findstr`
   
6. Vector search issues
   - ChromaDB directory verification
   - Vectorization log checking
   
7. PostgreSQL connection problems
   - Service status checking with `sc query`
   - Connection testing
   - Service startup commands

---

## CMD vs PowerShell Comparison

### For Basic API Testing:
| Task | CMD | PowerShell |
|------|-----|-----------|
| Simple GET | ✅ `curl URL` | ✅ `Invoke-RestMethod` |
| POST with JSON | ✅ Slightly harder (escaping) | ✅ Native JSON support |
| File operations | ✅ `type`, `dir` | ✅ `Get-Content`, `ls` |
| Port checking | ✅ `netstat -ano` | ✅ `Test-NetConnection` |
| Service management | ✅ `net start/stop` | ✅ `Start-Service` |
| JSON formatting | ⚠️ Needs `jq` | ✅ Built-in |

### Key Differences:

**Windows CMD:**
- Uses caret `^` for line continuation
- Requires escaping quotes differently: `\"`
- Can pipe to `jq` (if installed) for JSON formatting
- Uses classic Windows commands: `dir`, `type`, `netstat`
- Simpler syntax, familiar to Windows users

**PowerShell:**
- Uses backtick `` ` `` for line continuation
- Native JSON handling with ConvertTo-Json
- Advanced formatting with Format-Table, Where-Object
- Modern approach with cmdlets
- Better for complex logic and automation

---

## Usage Examples

### Simple GET Request

**CMD:**
```cmd
curl http://localhost:3000/api/prebid-queries/statistics
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/statistics"
```

---

### POST Request with JSON

**CMD:**
```cmd
curl -X POST http://localhost:3000/api/prebid-queries/ID/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"answered\"}"
```

**PowerShell:**
```powershell
$body = @{status = "answered"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/ID/status" `
    -Method Patch -Body $body -ContentType "application/json"
```

---

### Port Verification

**CMD:**
```cmd
netstat -ano | findstr :3000
```

**PowerShell:**
```powershell
Test-NetConnection -ComputerName localhost -Port 3000
```

---

## All Sections Updated

✅ **Complete coverage in:**
1. Method 5: Windows Command Prompt section
2. All 10 endpoint testing sections
3. Testing Workflow (all 5 phases)
4. Troubleshooting (7 common issues)

**Total CMD Examples Added:** 80+

---

## Notes for CMD Users

### Prerequisites:
- **curl:** Pre-installed on Windows 10+ (use `curl --version` to verify)
- **jq:** Optional, for JSON formatting
  - Download from: https://stedolan.github.io/jq/download/
  - Or install via: `choco install jq`

### Tips:
1. **Line Continuation:** Use `^` at end of line in CMD
2. **Quotes:** Use `\"` for escaped quotes in JSON strings
3. **File Paths:** Use absolute paths or relative from current directory
4. **Save Responses:** Redirect to file with `> filename.json`
5. **View Files:** Use `type filename.json` to view in CMD

### Helpful Commands:
```cmd
REM Check if service is running
netstat -ano | findstr :PORT

REM View recent log lines
type logfile.log

REM Find lines with error
type logfile.log | findstr /I "error"

REM Save curl output
curl URL > response.json

REM Check directory contents
dir folder\

REM Kill process on port
taskkill /PID <PID> /F
```

---

## File Modified

**File:** [SCREEN8_API_TESTING_GUIDE.md](SCREEN8_API_TESTING_GUIDE.md)

**Changes:**
- Added 5 major sections with CMD examples
- Updated all 10 endpoint testing sections
- Complete troubleshooting guide with CMD solutions
- Phase-by-phase testing workflow with both CMD and PowerShell
- Total additions: ~400 lines of CMD-specific documentation

---

## Quick Start with CMD

```cmd
REM 1. Check backend is running
netstat -ano | findstr :3000

REM 2. Check database is running
netstat -ano | findstr :5432

REM 3. Get statistics
curl http://localhost:3000/api/prebid-queries/statistics

REM 4. Get all queries
curl "http://localhost:3000/api/prebid-queries?status=pending"

REM 5. Save response to file
curl "http://localhost:3000/api/prebid-queries" > queries.json

REM 6. View response
type queries.json
```

---

**Last Updated:** January 27, 2026  
**Version:** 1.1 (with CMD support)  
**Status:** ✅ Ready for Testing
