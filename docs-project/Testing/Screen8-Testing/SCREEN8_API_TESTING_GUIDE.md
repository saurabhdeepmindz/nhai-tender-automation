# Screen 8 API Testing Guide
**Date:** January 27, 2026  
**Purpose:** Comprehensive testing guide for Pre-bid Query Management APIs  
**Status:** ✅ Ready for Implementation

**📌 Note:** This guide includes examples for both **PowerShell** and **Windows Command Prompt (CMD)** - choose whichever you're comfortable with!

---

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Synthetic Data Generation](#synthetic-data-generation)
3. [Cleanup & Data Removal](#cleanup--data-removal)
4. [API Testing Methods](#api-testing-methods)
5. [Endpoint-by-Endpoint Testing](#endpoint-by-endpoint-testing)
6. [Testing Workflow](#testing-workflow)
7. [Validation Checklist](#validation-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Testing Overview

### Why Synthetic Data?

✅ **Advantages:**
- **No Production Data Concerns:** Test without risking real RFP information
- **Repeatability:** Run identical tests multiple times
- **Scalability:** Generate 100s or 1000s of test queries easily
- **Isolation:** Test independently without external dependencies
- **Performance Testing:** Load test with controlled data volume
- **Edge Case Testing:** Create specific scenarios (expired RFPs, multiple categories, etc.)

✅ **Best Practices:**
- Generate synthetic data before running API tests
- Use consistent UUIDs for predictable test scenarios
- Create data with specific characteristics (status, category, priority)
- Archive test data for regression testing

### Testing Strategy

**Phase 1: Setup**
- Generate synthetic queries in database
- Verify data is present

**Phase 2: Read Operations**
- Test GET endpoints
- Validate filtering and pagination

**Phase 3: Write Operations**
- Test POST and PATCH endpoints
- Verify data modifications

**Phase 4: Integration**
- Test AI processing (Screen 8 integration)
- Test vector search functionality

**Phase 5: Validation**
- Verify database consistency
- Check response times
- Validate error handling

---

## Synthetic Data Generation

### Method 1: Direct Database Insert (SQL)

**File:** `synthetic_data_setup.sql`

```sql
-- Generate 20 synthetic queries with various statuses and categories
INSERT INTO prebid_queries (
  query_id, query_number, rfp_id, submitted_by, query_text, category, 
  priority, status, ai_processed, admin_reviewed, submitted_at, updated_at
) VALUES
-- Pending Technical Queries
(
  '11111111-1111-1111-1111-111111111111',
  'QRY-SYNC-001',
  'RFP-2024-NHAI-001',
  'vendor-tech-001',
  'What is the project duration and key milestones?',
  'technical',
  'high',
  'pending',
  false,
  false,
  NOW(),
  NOW()
),
-- Pending Commercial Queries
(
  '22222222-2222-2222-2222-222222222222',
  'QRY-SYNC-002',
  'RFP-2024-NHAI-001',
  'vendor-comm-001',
  'What is the payment schedule and terms?',
  'commercial',
  'high',
  'pending',
  false,
  false,
  NOW(),
  NOW()
),
-- Under Review Queries
(
  '33333333-3333-3333-3333-333333333333',
  'QRY-SYNC-003',
  'RFP-2024-NHAI-002',
  'vendor-elig-001',
  'What are the eligibility criteria for subcontractors?',
  'eligibility',
  'medium',
  'under_review',
  true,
  false,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day'
),
-- Answered Queries (with AI responses)
(
  '44444444-4444-4444-4444-444444444444',
  'QRY-SYNC-004',
  'RFP-2024-NHAI-001',
  'vendor-tech-002',
  'Are there any changes to the original technical specifications?',
  'technical',
  'medium',
  'answered',
  true,
  true,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day',
  'No changes have been made to the technical specifications. All original requirements remain valid as per Section 4.1 of the RFP document.',
  NULL,
  'Similar query RFP-2023-NHAI-045 had no specification changes',
  'Confirmed - No spec changes. Updated by Chief Engineer on 2026-01-25.',
  0.94,
  ARRAY['RFP-2024-NHAI-001-Section-4.1.pdf', 'RFP-2023-NHAI-045-Technical.pdf'],
  NULL,
  'admin-001',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
-- Clarification Needed Queries
(
  '55555555-5555-5555-5555-555555555555',
  'QRY-SYNC-005',
  'RFP-2024-NHAI-002',
  'vendor-gen-001',
  'Can clarify the procurement timeline once more?',
  'general',
  'low',
  'clarification_needed',
  true,
  true,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 day',
  'The procurement timeline is as follows: Pre-bid queries close on 2026-02-15, RFP submission on 2026-03-01, evaluation period 2026-03-01 to 2026-04-15, contract award by 2026-05-01.',
  NULL,
  NULL,
  'Needs additional clarification on submission format.',
  0.88,
  ARRAY['RFP-2024-NHAI-002-Timeline.pdf'],
  NULL,
  'admin-002',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  NULL
);

-- Generate additional test data for pagination testing (10 more queries)
INSERT INTO prebid_queries (
  query_id, query_number, rfp_id, submitted_by, query_text, category, 
  priority, status, ai_processed, admin_reviewed, submitted_at, updated_at
) VALUES
(
  '66666666-6666-6666-6666-666666666666',
  'QRY-SYNC-006',
  'RFP-2024-NHAI-003',
  'vendor-001',
  'What are the environmental compliance requirements?',
  'technical',
  'high',
  'pending',
  false,
  false,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
),
(
  '77777777-7777-7777-7777-777777777777',
  'QRY-SYNC-007',
  'RFP-2024-NHAI-001',
  'vendor-002',
  'Are there any budget contingencies mentioned?',
  'commercial',
  'medium',
  'pending',
  false,
  false,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
(
  '88888888-8888-8888-8888-888888888888',
  'QRY-SYNC-008',
  'RFP-2024-NHAI-002',
  'vendor-003',
  'Can foreign companies participate in bidding?',
  'eligibility',
  'high',
  'under_review',
  true,
  false,
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '2 hours'
),
(
  '99999999-9999-9999-9999-999999999999',
  'QRY-SYNC-009',
  'RFP-2024-NHAI-003',
  'vendor-004',
  'What are the warranty obligations post-completion?',
  'contractual',
  'medium',
  'answered',
  true,
  true,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '1 day'
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'QRY-SYNC-010',
  'RFP-2024-NHAI-001',
  'vendor-005',
  'Is there a preference for local vendors?',
  'general',
  'low',
  'pending',
  false,
  false,
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours'
);

-- Create indexes for better query performance
CREATE INDEX idx_test_queries ON prebid_queries(rfp_id, status) WHERE query_number LIKE 'QRY-SYNC-%';
```

### Method 2: PowerShell Script for Synthetic Data

**File:** `Generate-SyntheticQueryData.ps1`

```powershell
<#
.SYNOPSIS
Generate synthetic pre-bid query data for testing

.DESCRIPTION
Creates synthetic queries with various statuses, categories, and priorities
for comprehensive API testing

.PARAMETER Count
Number of synthetic queries to generate (default: 20)

.PARAMETER OutputFile
Path to save SQL script
#>

param(
    [int]$Count = 20,
    [string]$OutputFile = "synthetic_queries.sql"
)

$queries = @()
$categories = @('technical', 'commercial', 'eligibility', 'contractual', 'general')
$statuses = @('pending', 'under_review', 'answered', 'clarification_needed')
$priorities = @('low', 'medium', 'high')
$rfpIds = @('RFP-2024-NHAI-001', 'RFP-2024-NHAI-002', 'RFP-2024-NHAI-003', 'RFP-2024-NHAI-004')

$sampleQuestions = @(
    'What is the project duration?',
    'What are the payment terms?',
    'Are foreign companies eligible?',
    'What are the warranty obligations?',
    'Is there a penalty clause for delays?',
    'What are the technical specifications?',
    'Who are the key stakeholders?',
    'What is the submission deadline?',
    'Are there any environmental requirements?',
    'Can we use subcontractors?',
    'What is the budget allocation?',
    'Are there any specific certifications required?',
    'What is the evaluation criteria?',
    'Are there any special conditions?',
    'What is the contract duration?'
)

Write-Host "Generating $Count synthetic queries..." -ForegroundColor Green

$sqlScript = "-- Synthetic Query Data for Testing`n"
$sqlScript += "-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
$sqlScript += "BEGIN TRANSACTION;`n`n"

for ($i = 0; $i -lt $Count; $i++) {
    $queryId = [guid]::NewGuid().ToString()
    $queryNumber = "QRY-SYN-{0:D3}" -f ($i + 1)
    $rfpId = $rfpIds[$i % $rfpIds.Count]
    $category = $categories[$i % $categories.Count]
    $status = $statuses[$i % $statuses.Count]
    $priority = $priorities[$i % $priorities.Count]
    $vendorId = "vendor-syn-{0:D3}" -f ($i + 1)
    $question = $sampleQuestions[$i % $sampleQuestions.Count]
    
    $daysAgo = $i % 10
    $submittedAt = "(NOW() - INTERVAL '$daysAgo days')"
    
    # Generate AI response if status is 'answered' or 'under_review'
    if ($status -eq 'answered' -or $status -eq 'under_review') {
        $aiResponse = "Sample AI response to: $question This is a synthetic response for testing purposes."
        $confidence = 0.85 + ($i % 15) / 100
        $processed = 'true'
    } else {
        $aiResponse = 'NULL'
        $confidence = 'NULL'
        $processed = 'false'
    }
    
    $sqlScript += @"
INSERT INTO prebid_queries (
  query_id, query_number, rfp_id, submitted_by, query_text, category, 
  priority, status, ai_processed, admin_reviewed, submitted_at, updated_at,
  ai_response, confidence
) VALUES (
  '$queryId',
  '$queryNumber',
  '$rfpId',
  '$vendorId',
  '$question',
  '$category',
  '$priority',
  '$status',
  $processed,
  false,
  $submittedAt,
  NOW(),
  $aiResponse,
  $confidence
);
"@
}

$sqlScript += "`nCOMMIT;`n"

# Save to file
$sqlScript | Out-File -FilePath $OutputFile -Encoding UTF8
Write-Host "Script saved to: $OutputFile" -ForegroundColor Green
Write-Host "Total queries to be created: $Count" -ForegroundColor Green
```

### Method 3: Node.js Script Using API

**File:** `generate-synthetic-data.js`

```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3000/api/prebid-queries';

// Sample data templates
const CATEGORIES = ['technical', 'commercial', 'eligibility', 'contractual', 'general'];
const STATUSES = ['pending', 'under_review', 'answered', 'clarification_needed'];
const PRIORITIES = ['low', 'medium', 'high'];
const RFP_IDS = ['RFP-2024-NHAI-001', 'RFP-2024-NHAI-002', 'RFP-2024-NHAI-003'];

const SAMPLE_QUESTIONS = [
  'What is the project duration and key milestones?',
  'What are the payment terms and schedule?',
  'Are foreign companies eligible to participate?',
  'What are the warranty obligations?',
  'Is there a penalty clause for delays?',
  'What are the technical specifications?',
  'Can we use subcontractors?',
  'What is the submission deadline?',
  'Are there environmental compliance requirements?',
  'What is the budget allocation?',
  'Are specific certifications required?',
  'How will proposals be evaluated?',
  'What is the contract duration?',
  'Are there change order provisions?',
  'What insurance coverage is required?'
];

async function generateSyntheticQueries(count = 20) {
  console.log(`\n🔄 Generating ${count} synthetic queries...\n`);
  
  const createdQueries = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const query = {
        queryId: uuidv4(),
        queryNumber: `QRY-SYN-${String(i + 1).padStart(3, '0')}`,
        rfpId: RFP_IDS[i % RFP_IDS.length],
        submittedBy: `vendor-syn-${String(i + 1).padStart(3, '0')}`,
        queryText: SAMPLE_QUESTIONS[i % SAMPLE_QUESTIONS.length],
        category: CATEGORIES[i % CATEGORIES.length],
        priority: PRIORITIES[i % PRIORITIES.length],
        status: STATUSES[i % STATUSES.length],
        aiProcessed: i % 3 !== 0, // 2/3 processed
        adminReviewed: i % 4 === 0, // 1/4 reviewed
      };
      
      // Make API call to create query
      const response = await axios.post(API_URL, query);
      createdQueries.push(response.data);
      
      console.log(`✅ Created query ${i + 1}/${count}: ${query.queryNumber}`);
      
    } catch (error) {
      console.error(`❌ Error creating query ${i + 1}:`, error.message);
    }
    
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✨ Generated ${createdQueries.length}/${count} synthetic queries\n`);
  return createdQueries;
}

// Run if called directly
if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 20;
  generateSyntheticQueries(count)
    .then(() => console.log('✅ Synthetic data generation complete'))
    .catch(err => console.error('❌ Failed:', err.message));
}

module.exports = { generateSyntheticQueries };
```

---

## Cleanup & Data Removal

### Why Clean Up?

✅ **Reset Test Environment** - Start fresh with new test runs  
✅ **Database Hygiene** - Remove test data that's no longer needed  
✅ **Performance** - Reduce database size after load testing  
✅ **Data Privacy** - Ensure test data doesn't persist  
✅ **Regression Testing** - Begin new test cycle with clean state  

### Method 1: SQL Cleanup Script

**File:** `cleanup_synthetic_data.sql`

```sql
-- ============================================================================
-- Synthetic Data Cleanup Script for Screen 8 API Testing
-- ============================================================================
-- WARNING: This script will DELETE all test data created with synthetic IDs!
-- Only run this after you've finished testing and backed up important data.
-- ============================================================================

-- Delete from child tables first (due to foreign keys)
-- Delete workflow executions
DELETE FROM workflow_executions 
WHERE query_id IN (
  SELECT query_id FROM prebid_queries 
  WHERE query_number LIKE 'QRY-SYNC-%'
);

-- Delete query history/audit logs
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

-- Delete vector embeddings (if stored in database)
DELETE FROM vector_embeddings 
WHERE query_id IN (
  SELECT query_id FROM prebid_queries 
  WHERE query_number LIKE 'QRY-SYNC-%'
);

-- Finally, delete the main prebid_queries records
DELETE FROM prebid_queries 
WHERE query_number LIKE 'QRY-SYNC-%';

-- Verify cleanup
SELECT COUNT(*) as remaining_synthetic_queries FROM prebid_queries 
WHERE query_number LIKE 'QRY-SYNC-%';

SELECT 'Cleanup complete!' as status;
```

**How to Run:**
```bash
# Using psql command line
psql -h localhost -U postgres -d nhai_tender_db -f cleanup_synthetic_data.sql

# Or connect and paste the script
psql -h localhost -U postgres -d nhai_tender_db
# Then paste the SQL and execute
```

### Method 2: PowerShell Cleanup Script

**File:** `cleanup_synthetic_data.ps1`

```powershell
# ============================================================================
# Synthetic Data Cleanup Script for Screen 8 API Testing (PowerShell)
# ============================================================================

param(
    [string]$DBHost = "localhost",
    [string]$DBUser = "postgres",
    [string]$DBName = "nhai_tender_db",
    [string]$DBPort = "5432",
    [switch]$Force = $false
)

function Remove-SyntheticData {
    param([string]$DBHost, [string]$DBUser, [string]$DBName, [string]$DBPort)
    
    Write-Host "`nWARNING: About to DELETE all synthetic test data!" -ForegroundColor Yellow
    
    $CleanupQuery = @"
DELETE FROM workflow_executions 
WHERE query_id IN (SELECT query_id FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%');

DELETE FROM query_history 
WHERE query_id IN (SELECT query_id FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%');

DELETE FROM admin_responses 
WHERE query_id IN (SELECT query_id FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%');

DELETE FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%';
"@
    
    if (-not $Force) {
        $confirmation = Read-Host "Are you sure? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Host "Cleanup cancelled" -ForegroundColor Red
            return $false
        }
    }
    
    Write-Host "Cleaning up synthetic data..." -ForegroundColor Cyan
    
    try {
        $CleanupQuery | psql -h $DBHost -U $DBUser -d $DBName -p $DBPort
        Write-Host "Cleanup complete!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Cleanup failed: $_" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Synthetic Data Cleanup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Remove-SyntheticData -DBHost $DBHost -DBUser $DBUser -DBName $DBName -DBPort $DBPort
```

**How to Run:**
```powershell
# Run with defaults
.\cleanup_synthetic_data.ps1

# Run with force flag (no confirmation)
.\cleanup_synthetic_data.ps1 -Force

# Run with custom parameters
.\cleanup_synthetic_data.ps1 -DBHost 192.168.1.100 -DBName testdb
```

### Method 3: Windows Command Prompt (CMD) Cleanup

**File:** `cleanup_synthetic_data.cmd`

```batch
@echo off
REM Synthetic Data Cleanup Script for Screen 8 API Testing (CMD)
REM WARNING: This will DELETE all synthetic test data!

setlocal enabledelayedexpansion

set DB_HOST=localhost
set DB_USER=postgres
set DB_NAME=nhai_tender_db
set DB_PORT=5432

echo.
echo Synthetic Data Cleanup
echo ========================================
echo.

REM Check psql availability
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: psql not found. Please install PostgreSQL.
    pause
    exit /b 1
)

REM Count records to delete
echo Counting synthetic data...
for /f "tokens=*" %%A in ('echo SELECT COUNT(*) FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'; ^| psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -p %DB_PORT% -t -q') do set COUNT=%%A

if "%COUNT%"=="" set COUNT=0

echo Found %COUNT% synthetic query records
echo.

REM Confirm deletion
echo WARNING: About to DELETE %COUNT% records!
set /p confirm="Continue? (Type 'yes' to confirm): "

if /i not "%confirm%"=="yes" (
    echo Cleanup cancelled
    pause
    exit /b 1
)

echo.
echo Cleaning up...

REM Create temp SQL file
set CLEANUP_SQL=%TEMP%\cleanup_%RANDOM%.sql
(
    echo DELETE FROM workflow_executions WHERE query_id IN ^(SELECT query_id FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'^);
    echo DELETE FROM query_history WHERE query_id IN ^(SELECT query_id FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'^);
    echo DELETE FROM admin_responses WHERE query_id IN ^(SELECT query_id FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%'^);
    echo DELETE FROM prebid_queries WHERE query_number LIKE 'QRY-SYNC-%%';
) > "%CLEANUP_SQL%"

REM Execute cleanup
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -p %DB_PORT% -f "%CLEANUP_SQL%"

if %ERRORLEVEL% EQU 0 (
    echo Cleanup complete!
) else (
    echo Cleanup failed!
)

REM Cleanup temp file
del "%CLEANUP_SQL%"

echo.
pause
```

**How to Run:**
```cmd
REM Navigate to script directory
cd /d C:\path\to\script

REM Run the cleanup
cleanup_synthetic_data.cmd

REM Confirm when prompted
```

### Method 4: cURL-based Cleanup (API Endpoint)

**Concept:** Delete individual records via the API

```bash
# Delete a specific query by ID
curl -X DELETE http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111 \
  -H "Content-Type: application/json"

# Delete in batch (if bulk delete endpoint exists)
curl -X DELETE http://localhost:3000/api/prebid-queries/batch \
  -H "Content-Type: application/json" \
  -d '{"queryNumbers": ["QRY-SYNC-001", "QRY-SYNC-002"]}'
```

**Windows CMD equivalent:**
```cmd
REM Delete single query
curl -X DELETE http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111 ^
  -H "Content-Type: application/json"

REM Check response
curl http://localhost:3000/api/prebid-queries/statistics
```

---

### Cleanup Comparison Table

| Method | Best For | Speed | Safety | Ease |
|--------|----------|-------|--------|------|
| **SQL** | Direct DB | ⚡⚡⚡ | High | Medium |
| **PowerShell** | Windows automation | ⚡⚡ | High | Medium |
| **CMD** | Simple Windows | ⚡⚡ | High | Medium |
| **cURL/API** | Remote servers | ⚡ | Low (no foreign key checks) | Easy |

---

### Safety Guidelines

✅ **Before Running Cleanup:**
1. Verify database connection parameters
2. Confirm you have database backups
3. Check that you're deleting correct data (QRY-SYNC- prefix)
4. Ensure no active API processes using the data
5. Run verification query first to see count

✅ **After Running Cleanup:**
1. Verify cleanup success (check remaining count)
2. Test with GET /statistics endpoint
3. Confirm audit logs reflect deletions
4. Archive cleanup logs for compliance

---

## API Testing Methods

### Method 1: cURL (Command Line)

**Best For:** Quick testing, CI/CD pipelines, shell scripts

```bash
# Simple GET request
curl http://localhost:3000/api/prebid-queries

# With headers and formatting
curl -s http://localhost:3000/api/prebid-queries | jq '.'

# With authentication (if needed)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/prebid-queries

# POST request with data
curl -X POST http://localhost:3000/api/prebid-queries \
  -H "Content-Type: application/json" \
  -d '{"queryText":"Sample question","category":"technical"}'

# With response headers
curl -i http://localhost:3000/api/prebid-queries/statistics

# Verbose output for debugging
curl -v http://localhost:3000/api/prebid-queries
```

### Method 2: PowerShell

**Best For:** Windows users, integration with PowerShell workflows

```powershell
# Simple GET request
$response = Invoke-RestMethod -Uri http://localhost:3000/api/prebid-queries
$response | ConvertTo-Json -Depth 10

# With error handling
try {
    $response = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/prebid-queries" `
        -Method Get `
        -ContentType "application/json"
    Write-Host "✅ Success" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# POST request
$body = @{
    queryText = "Sample question"
    category = "technical"
    priority = "high"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

# With authentication headers
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "Content-Type" = "application/json"
}

Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries" `
    -Headers $headers `
    -Method Get
```

### Method 3: Postman Collection

**Best For:** Interactive testing, team collaboration, documentation

Create a file: `Screen8-API-Testing.postman_collection.json`

```json
{
  "info": {
    "name": "Screen 8 - Pre-bid Query Management API",
    "description": "Complete API testing collection for pre-bid queries",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Get All Queries",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/api/prebid-queries?status=pending&page=1&pageSize=10",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "prebid-queries"],
          "query": [
            {"key": "status", "value": "pending"},
            {"key": "page", "value": "1"},
            {"key": "pageSize", "value": "10"}
          ]
        }
      },
      "response": []
    },
    {
      "name": "Get Single Query",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/prebid-queries/{{query_id}}"
      }
    },
    {
      "name": "Process Query (AI)",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/prebid-queries/{{query_id}}/process",
        "body": {
          "mode": "raw",
          "raw": "{\"forceReprocess\": false}"
        }
      }
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://localhost:3000"},
    {"key": "query_id", "value": "11111111-1111-1111-1111-111111111111"}
  ]
}
```

### Method 4: JavaScript/Node.js

**Best For:** Automated testing, integration tests

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/prebid-queries';

// Helper function to make API calls
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Usage examples
async function runTests() {
  // Test 1: Get all queries
  console.log('📋 Test 1: Get All Queries');
  const allQueries = await makeRequest('GET', '');
  console.log(allQueries);
  
  // Test 2: Get with filters
  console.log('\n📋 Test 2: Get Pending Queries');
  const pending = await makeRequest('GET', '?status=pending&page=1&pageSize=10');
  console.log(pending);
  
  // Test 3: Get statistics
  console.log('\n📊 Test 3: Get Statistics');
  const stats = await makeRequest('GET', '/statistics');
  console.log(stats);
}

runTests();
```

### Method 5: Windows Command Prompt (CMD)

**Best For:** Windows users without PowerShell, simple batch testing

**Prerequisites:**
```cmd
REM Install curl (Windows 10+) - usually pre-installed
REM Install jq for JSON formatting (optional)
REM Download from: https://stedolan.github.io/jq/download/
REM Or use: choco install jq
```

**Basic Commands:**

```cmd
REM Simple GET request
curl http://localhost:3000/api/prebid-queries

REM Pretty print with jq (if installed)
curl http://localhost:3000/api/prebid-queries | jq "."

REM Save response to file
curl http://localhost:3000/api/prebid-queries > response.json

REM POST request with JSON data
curl -X POST http://localhost:3000/api/prebid-queries ^
  -H "Content-Type: application/json" ^
  -d "{\"queryText\":\"Sample question\",\"category\":\"technical\"}"

REM PATCH request
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"answered\"}"

REM With response headers
curl -i http://localhost:3000/api/prebid-queries/statistics

REM Verbose output for debugging
curl -v http://localhost:3000/api/prebid-queries
```

**Network Testing Commands:**

```cmd
REM Check if backend is running on port 3000
netstat -ano | findstr :3000

REM Check if Screen 8 is running on port 8001
netstat -ano | findstr :8001

REM Check if PostgreSQL is running on port 5432
netstat -ano | findstr :5432

REM Test connection to service
ping localhost
telnet localhost 3000
```

---

## Endpoint-by-Endpoint Testing

### 1️⃣ GET `/statistics`

**Description:** Get query statistics

**Purpose:** Validate data distribution across statuses and categories

#### Test Cases

| Case | Query Params | Expected | Notes |
|------|-------------|----------|-------|
| Basic | None | All stats | Total count, by status, by category |
| Validation | None | Numbers > 0 | Verify data integrity |
| Format | None | Proper JSON | Check structure |

#### cURL Example
```bash
curl http://localhost:3000/api/prebid-queries/statistics | jq '.'
```

#### Windows CMD Examples
```cmd
REM Simple request
curl http://localhost:3000/api/prebid-queries/statistics

REM Pretty print with jq (if installed)
curl http://localhost:3000/api/prebid-queries/statistics | jq "."

REM Save to file
curl http://localhost:3000/api/prebid-queries/statistics > stats.json

REM View response
curl http://localhost:3000/api/prebid-queries/statistics > stats.json && type stats.json
```

#### PowerShell Example
```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/statistics"
Write-Host "Total Queries: $($stats.total_queries)"
Write-Host "Pending: $($stats.by_status.pending)"
Write-Host "Answered: $($stats.by_status.answered)"
Write-Host "Average Confidence: $($stats.avg_confidence)"
```

#### Expected Response
```json
{
  "total_queries": 25,
  "by_status": {
    "pending": 8,
    "under_review": 5,
    "answered": 10,
    "clarification_needed": 2
  },
  "by_category": {
    "technical": 8,
    "commercial": 6,
    "eligibility": 4,
    "contractual": 4,
    "general": 3
  },
  "ai_processed": 17,
  "admin_reviewed": 10,
  "avg_confidence": 0.88
}
```

#### Validation Checklist
- [ ] Response contains all required fields
- [ ] Total queries matches sum of statuses
- [ ] All status counts are non-negative
- [ ] Average confidence is between 0 and 1

---

### 2️⃣ GET `/`

**Description:** Get all queries with filtering and pagination

**Purpose:** Validate filtering, sorting, and pagination functionality

#### Test Cases

| Case | Params | Expected | Notes |
|------|--------|----------|-------|
| No filters | None | All queries | Default pagination (page 1, size 20) |
| By status | `status=pending` | Only pending | Count should match statistics |
| By category | `category=technical` | Technical only | Exact match |
| By RFP | `rfpId=RFP-2024-NHAI-001` | RFP queries | All from same RFP |
| Pagination | `page=2&pageSize=10` | 10 items page 2 | Offset correct |
| Combined | `status=answered&category=technical&page=1` | Filtered & paginated | All filters applied |

#### cURL Examples
```bash
# All queries
curl "http://localhost:3000/api/prebid-queries"

# Pending queries
curl "http://localhost:3000/api/prebid-queries?status=pending"

# Technical category, page 2
curl "http://localhost:3000/api/prebid-queries?category=technical&page=2&pageSize=10"

# Multiple filters
curl "http://localhost:3000/api/prebid-queries?status=answered&category=commercial&aiProcessed=true"
```

#### Windows CMD Examples
```cmd
REM All queries
curl "http://localhost:3000/api/prebid-queries"

REM Pending queries
curl "http://localhost:3000/api/prebid-queries?status=pending"

REM Technical category, page 2
curl "http://localhost:3000/api/prebid-queries?category=technical&page=2&pageSize=10"

REM Multiple filters
curl "http://localhost:3000/api/prebid-queries?status=answered&category=commercial&aiProcessed=true"

REM Save to file
curl "http://localhost:3000/api/prebid-queries?status=pending" > pending_queries.json

REM View response
type pending_queries.json
```

#### PowerShell Examples
```powershell
# Get pending queries
$pending = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries?status=pending"
Write-Host "Found $($pending.pagination.total) pending queries"

# Get with pagination
$page2 = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries?page=2&pageSize=10"
Write-Host "Page 2: $($page2.data.Count) items of $($page2.pagination.total) total"

# Filter by category and status
$filtered = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries?status=answered&category=technical"
Write-Host "Found $($filtered.data.Count) answered technical queries"
```

#### Expected Response
```json
{
  "data": [
    {
      "queryId": "11111111-1111-1111-1111-111111111111",
      "queryNumber": "QRY-SYNC-001",
      "rfpId": "RFP-2024-NHAI-001",
      "queryText": "What is the project duration?",
      "category": "technical",
      "status": "pending",
      "priority": "high",
      "submittedBy": "vendor-001",
      "submittedAt": "2026-01-27T10:30:00Z",
      "aiProcessed": false,
      "adminReviewed": false
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pageSize": 20,
    "totalPages": 2
  }
}
```

#### Validation Checklist
- [ ] All returned queries match filter criteria
- [ ] Pagination metadata is correct
- [ ] Page size matches requested size
- [ ] Total count is accurate
- [ ] No duplicate query IDs
- [ ] All required fields present

---

### 3️⃣ GET `/:id`

**Description:** Get single query by UUID

**Purpose:** Validate retrieval of specific query with all details

#### Test Cases

| Case | Input | Expected | Notes |
|------|-------|----------|-------|
| Valid UUID | `11111111-1111-1111-1111-111111111111` | Complete query | All fields populated |
| Invalid UUID | `invalid-uuid` | 400 Bad Request | Format validation |
| Non-existent | `ffffffff-ffff-ffff-ffff-ffffffffffff` | 404 Not Found | ID validation |
| With AI response | Query with `aiProcessed=true` | Full AI data | Confidence, responses |

#### cURL Examples
```bash
# Valid query
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111

# Invalid UUID (should fail)
curl http://localhost:3000/api/prebid-queries/invalid-uuid

# Non-existent (should fail)
curl http://localhost:3000/api/prebid-queries/ffffffff-ffff-ffff-ffff-ffffffffffff
```

#### Windows CMD Examples
```cmd
REM Valid query
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111

REM Save to file
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111 > query.json

REM View response
type query.json

REM Invalid UUID (should fail with error)
curl http://localhost:3000/api/prebid-queries/invalid-uuid

REM Non-existent (should fail with 404)
curl http://localhost:3000/api/prebid-queries/ffffffff-ffff-ffff-ffff-ffffffffffff
```

#### PowerShell Examples
```powershell
# Get specific query with error handling
try {
    $query = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111"
    
    Write-Host "Query Number: $($query.queryNumber)"
    Write-Host "Status: $($query.status)"
    Write-Host "AI Processed: $($query.aiProcessed)"
    
    if ($query.aiResponse) {
        Write-Host "AI Response: $($query.aiResponse)" -ForegroundColor Green
        Write-Host "Confidence: $($query.confidence * 100)%"
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
```

#### Expected Response
```json
{
  "queryId": "11111111-1111-1111-1111-111111111111",
  "queryNumber": "QRY-SYNC-001",
  "rfpId": "RFP-2024-NHAI-001",
  "queryText": "What is the project duration?",
  "category": "technical",
  "status": "pending",
  "priority": "high",
  "submittedBy": "vendor-tech-001",
  "submittedAt": "2026-01-27T10:30:00Z",
  "aiProcessed": false,
  "adminReviewed": false,
  "aiResponse": null,
  "confidence": null,
  "sourceDocuments": null,
  "metadata": {}
}
```

#### Validation Checklist
- [ ] All query fields returned
- [ ] UUID matches requested ID
- [ ] Timestamps in ISO format
- [ ] Confidence in valid range (0-1) if present
- [ ] Arrays/objects properly formatted

---

### 4️⃣ POST `/:id/process`

**Description:** Trigger AI processing via Chief Engineer Agent

**Purpose:** Validate AI workflow execution and integration with Screen 8

#### Test Cases

| Case | Body | Expected | Notes |
|------|------|----------|-------|
| Basic process | `{}` | Execution started | Screen 8 integration |
| Already processed | Query with `aiProcessed=true` | Error or skip | Duplicate protection |
| Force reprocess | `{"forceReprocess": true}` | Reprocessed | Override check |
| With metadata | `{"metadata":{"priority":"high"}}` | Processed with metadata | Additional context |
| Screen8 down | Any | Connection error | Fallback handling |

#### cURL Examples
```bash
# Basic processing
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/process \
  -H "Content-Type: application/json" \
  -d '{}'

# Force reprocess
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/process \
  -H "Content-Type: application/json" \
  -d '{"forceReprocess": true}'

# With metadata
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/process \
  -H "Content-Type: application/json" \
  -d '{"forceReprocess": false, "metadata": {"priority": "high"}}'
```

#### Windows CMD Examples
```cmd
REM Basic processing
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/process ^
  -H "Content-Type: application/json" ^
  -d "{}"

REM Force reprocess
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/process ^
  -H "Content-Type: application/json" ^
  -d "{\"forceReprocess\": true}"

REM With metadata
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/process ^
  -H "Content-Type: application/json" ^
  -d "{\"forceReprocess\": false, \"metadata\": {\"priority\": \"high\"}}"

REM Save response to file
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/process ^
  -H "Content-Type: application/json" ^
  -d "{}" > process_response.json

REM View response
type process_response.json
```

#### PowerShell Examples
```powershell
# Monitor processing
$queryId = "11111111-1111-1111-1111-111111111111"
$body = @{forceReprocess = $false} | ConvertTo-Json

try {
    Write-Host "🚀 Starting AI processing..." -ForegroundColor Cyan
    $result = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/prebid-queries/$queryId/process" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ Processing started"
    Write-Host "Execution ID: $($result.executionId)"
    Write-Host "Status: $($result.status)"
    Write-Host "Workflow Steps:"
    $result.workflowSteps | Format-Table -AutoSize
    
    # Wait and check status periodically
    Start-Sleep -Seconds 2
    $updated = Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/$queryId"
    Write-Host "Current Status: $($updated.status)"
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
```

#### Expected Response
```json
{
  "success": true,
  "queryId": "11111111-1111-1111-1111-111111111111",
  "executionId": "exec-20260127-103500",
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

#### Validation Checklist
- [ ] Execution ID is generated
- [ ] Status is PROCESSING or COMPLETED
- [ ] All 6 workflow steps present
- [ ] Integration with Screen 8 successful
- [ ] Query marked as aiProcessed
- [ ] Execution ID saved in database

---

### 5️⃣ PATCH `/:id/status`

**Description:** Update query status

**Purpose:** Validate status transitions and state management

#### Test Cases

| Case | From Status | To Status | Expected | Notes |
|------|-------------|-----------|----------|-------|
| Pending → Under Review | pending | under_review | Success | Normal flow |
| Under Review → Answered | under_review | answered | Success | After AI processing |
| Answered → Clarification | answered | clarification_needed | Success | Multiple answers |
| Invalid status | pending | invalid | 400 Bad Request | Validation |
| Already answered → Answered | answered | answered | Success or no-op | Idempotent |

#### cURL Examples
```bash
# Update to answered
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status \
  -H "Content-Type: application/json" \
  -d '{"status": "answered"}'

# Update to under_review
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status \
  -H "Content-Type: application/json" \
  -d '{"status": "under_review"}'
```

#### Windows CMD Examples
```cmd
REM Update to answered
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"answered\"}"

REM Update to under_review
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"under_review\"}"

REM Update to clarification_needed
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"clarification_needed\"}"

REM Save response
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\": \"answered\"}" > status_response.json
```

#### PowerShell Examples
```powershell
# Status transition workflow
$queryId = "11111111-1111-1111-1111-111111111111"
$statuses = @('pending', 'under_review', 'answered')

foreach ($newStatus in $statuses) {
    $body = @{status = $newStatus} | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod `
            -Uri "http://localhost:3000/api/prebid-queries/$queryId/status" `
            -Method Patch `
            -Body $body `
            -ContentType "application/json"
        
        Write-Host "✅ Updated: $($result.previousStatus) → $($result.newStatus)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to update to $newStatus" -ForegroundColor Red
    }
}
```

#### Expected Response
```json
{
  "success": true,
  "queryId": "11111111-1111-1111-1111-111111111111",
  "previousStatus": "pending",
  "newStatus": "under_review",
  "updatedAt": "2026-01-27T11:00:00Z"
}
```

#### Validation Checklist
- [ ] Previous status captured
- [ ] New status correctly set
- [ ] Updated timestamp recorded
- [ ] Invalid statuses rejected
- [ ] Status persisted in database

---

### 6️⃣ POST `/:id/admin-response`

**Description:** Save admin response for a query

**Purpose:** Validate admin review workflow and response storage

#### Test Cases

| Case | Body | Expected | Notes |
|------|------|----------|-------|
| Full response | All fields | Success | Complete review |
| Minimal | Response only | Success | Required field only |
| Long response | 5000+ chars | Success | Large text handling |
| With sources | Multiple docs | Success | Reference tracking |
| Empty response | "" | 400 Bad Request | Validation |

#### cURL Examples
```bash
# Complete admin response
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/admin-response \
  -H "Content-Type: application/json" \
  -d '{
    "response": "The project duration is 24 months as specified in Section 3.2 of the RFP.",
    "notes": "Verified with project management team.",
    "sourceDocuments": ["RFP-2024-NHAI-001-Section-3.2.pdf", "PM-Verification-Email.pdf"]
  }'

# Minimal response
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/admin-response \
  -H "Content-Type: application/json" \
  -d '{"response": "See Section 3.2 for details."}'
```

#### Windows CMD Examples
```cmd
REM Complete admin response (single line)
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/admin-response ^
  -H "Content-Type: application/json" ^
  -d "{\"response\": \"The project duration is 24 months as specified in Section 3.2.\", \"notes\": \"Verified with PMO.\", \"sourceDocuments\": [\"RFP-2024-NHAI-001-Section-3.2.pdf\"]}"

REM Minimal response
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/admin-response ^
  -H "Content-Type: application/json" ^
  -d "{\"response\": \"See Section 3.2 for details.\"}"

REM Save response to file
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/admin-response ^
  -H "Content-Type: application/json" ^
  -d "{\"response\": \"24 months as per Section 3.2\"}" > admin_response.json
```

#### PowerShell Examples
```powershell
# Save comprehensive admin response
$queryId = "11111111-1111-1111-1111-111111111111"
$adminResponse = @{
    response = "Based on Section 3.2 of the RFP document and verification with the project team, the project duration is 24 months from contract signing. This includes a 3-month mobilization phase and 21 months of active implementation."
    notes = "Confirmed with PMO on 2026-01-27. No changes expected."
    sourceDocuments = @(
        "RFP-2024-NHAI-001-Section-3.2.pdf",
        "Project-Timeline-Approved.pdf",
        "PMO-Confirmation-Email.pdf"
    )
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/prebid-queries/$queryId/admin-response" `
        -Method Post `
        -Body $adminResponse `
        -ContentType "application/json"
    
    Write-Host "✅ Response saved successfully" -ForegroundColor Green
    Write-Host "Query Status: $($result.status)"
    Write-Host "Responded At: $($result.respondedAt)"
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
```

#### Expected Response
```json
{
  "success": true,
  "queryId": "11111111-1111-1111-1111-111111111111",
  "adminResponse": "The project duration is 24 months as specified in Section 3.2...",
  "adminReviewed": true,
  "respondedAt": "2026-01-27T11:15:00Z"
}
```

#### Validation Checklist
- [ ] Response text stored correctly
- [ ] Admin reviewed flag set to true
- [ ] Response timestamp recorded
- [ ] Source documents linked
- [ ] Notes/comments saved
- [ ] Status updated appropriately

---

### 7️⃣ GET `/:id/history`

**Description:** Get query audit trail

**Purpose:** Validate audit logging and history tracking

#### Test Cases

| Case | Query | Expected | Notes |
|------|-------|----------|-------|
| With history | Query with multiple updates | Chronological timeline | All actions logged |
| New query | Just created query | Creation event only | Single entry |
| Processed query | After AI processing | Multiple events | Process events included |
| Invalid ID | Non-existent UUID | 404 Not Found | ID validation |

#### cURL Examples
```bash
# Get full history
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/history

# Pretty print
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/history | jq '.'
```

#### Windows CMD Examples
```cmd
REM Get full history
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/history

REM Pretty print with jq (if installed)
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/history | jq "."

REM Save to file
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/history > history.json

REM View response
type history.json
```

#### PowerShell Examples
```powershell
# View query audit trail
$queryId = "11111111-1111-1111-1111-111111111111"

$history = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries/$queryId/history"

Write-Host "📋 Audit Trail for Query $queryId" -ForegroundColor Cyan
Write-Host "Total Events: $($history.history.Count)`n"

$history.history | Format-Table -AutoSize -Property @(
    @{Label='Time'; Expression={[datetime]$_.timestamp | Get-Date -Format 'yyyy-MM-dd HH:mm:ss'}},
    @{Label='Action'; Expression={$_.action}},
    @{Label='Actor'; Expression={$_.actor}},
    @{Label='Details'; Expression={$_.details}}
)
```

#### Expected Response
```json
{
  "queryId": "11111111-1111-1111-1111-111111111111",
  "history": [
    {
      "timestamp": "2026-01-27T10:30:00Z",
      "action": "CREATED",
      "actor": "vendor-001",
      "details": "Query submitted"
    },
    {
      "timestamp": "2026-01-27T10:35:00Z",
      "action": "STATUS_CHANGED",
      "actor": "system",
      "details": "Status changed from pending to under_review"
    },
    {
      "timestamp": "2026-01-27T10:40:00Z",
      "action": "AI_PROCESSING_STARTED",
      "actor": "system",
      "details": "Sent to Chief Engineer Agent"
    },
    {
      "timestamp": "2026-01-27T10:50:00Z",
      "action": "AI_RESPONSE_GENERATED",
      "actor": "system",
      "details": "AI response generated with confidence 0.92"
    },
    {
      "timestamp": "2026-01-27T11:00:00Z",
      "action": "ADMIN_REVIEW",
      "actor": "admin-001",
      "details": "Admin response submitted"
    },
    {
      "timestamp": "2026-01-27T11:05:00Z",
      "action": "STATUS_CHANGED",
      "actor": "admin-001",
      "details": "Status changed to answered"
    }
  ]
}
```

#### Validation Checklist
- [ ] Events in chronological order
- [ ] All major actions logged
- [ ] Actor and timestamp for each event
- [ ] Descriptive details provided
- [ ] No missing events
- [ ] Timestamps are valid ISO format

---

### 8️⃣ GET `/:id/similar`

**Description:** Find similar queries using vector search

**Purpose:** Validate ChromaDB integration and similarity matching

#### Test Cases

| Case | Query | Expected | Notes |
|------|-------|----------|-------|
| Typical query | Technical query | 1-5 similar results | Ranked by score |
| Very specific | Unique wording | Fewer results | Low similarity matches |
| High limit | `limit=10` | Up to 10 results | Respects limit |
| Low limit | `limit=1` | 1 result | Top match only |
| No similar | Highly unique | Empty or low scores | Graceful degradation |

#### cURL Examples
```bash
# Get similar queries (default limit)
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/similar

# Custom limit
curl "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/similar?limit=10"

# Format output
curl "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/similar?limit=5" | jq '.'
```

#### Windows CMD Examples
```cmd
REM Get similar queries (default limit)
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/similar

REM Custom limit
curl "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/similar?limit=10"

REM Format output with jq (if installed)
curl "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/similar?limit=5" | jq "."

REM Save to file
curl "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/similar?limit=5" > similar_queries.json

REM View response
type similar_queries.json
```

#### PowerShell Examples
```powershell
# Find similar queries with analysis
$queryId = "11111111-1111-1111-1111-111111111111"

try {
    $similar = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/prebid-queries/$queryId/similar?limit=5"
    
    Write-Host "Query: $($similar.queryText)" -ForegroundColor Cyan
    Write-Host "Similar Queries Found: $($similar.totalFound)`n"
    
    $similar.similarQueries | ForEach-Object {
        Write-Host "🔗 $($_.queryNumber) - Similarity: $([math]::Round($_.similarityScore * 100, 1))%" -ForegroundColor Green
        Write-Host "   Query: $($_.queryText)"
        Write-Host "   Category: $($_.category) | RFP: $($_.rfpId)"
        Write-Host "   AI Response: $($_.aiResponse.Substring(0, [math]::Min(80, $_.aiResponse.Length)))..."
        Write-Host ""
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
```

#### Expected Response
```json
{
  "queryId": "11111111-1111-1111-1111-111111111111",
  "queryText": "What is the project duration?",
  "similarQueries": [
    {
      "queryId": "22222222-2222-2222-2222-222222222222",
      "queryNumber": "QRY-2024-089",
      "queryText": "What is the implementation timeline?",
      "similarityScore": 0.89,
      "category": "technical",
      "rfpId": "RFP-2024-NHAI-002",
      "aiResponse": "The implementation timeline is 24 months.",
      "confidence": 0.91
    },
    {
      "queryId": "33333333-3333-3333-3333-333333333333",
      "queryNumber": "QRY-2024-112",
      "queryText": "How long does the project take?",
      "similarityScore": 0.85,
      "category": "general",
      "rfpId": "RFP-2024-NHAI-001",
      "aiResponse": "The project duration is 18-24 months.",
      "confidence": 0.88
    }
  ],
  "totalFound": 2
}
```

#### Validation Checklist
- [ ] Similarity scores in descending order
- [ ] All scores between 0 and 1
- [ ] Top matches are semantically similar
- [ ] Respects limit parameter
- [ ] ChromaDB integration working
- [ ] No duplicate results

---

### 9️⃣ GET `/workflow/executions`

**Description:** Get workflow execution history

**Purpose:** Validate workflow tracking and monitoring

#### Test Cases

| Case | Params | Expected | Notes |
|------|--------|----------|-------|
| All executions | None | All execution records | Default pagination |
| By page | `page=2&pageSize=10` | 10 items page 2 | Pagination works |
| Recent | `sortBy=startedAt&order=DESC` | Latest first | Temporal ordering |
| By status | `status=COMPLETED` | Completed only | Filter works |

#### cURL Examples
```bash
# Get all workflow executions
curl http://localhost:3000/api/prebid-queries/workflow/executions

# With pagination
curl "http://localhost:3000/api/prebid-queries/workflow/executions?page=1&pageSize=10"

# Format output
curl "http://localhost:3000/api/prebid-queries/workflow/executions" | jq '.data[] | {executionId, status, duration}'
```

#### Windows CMD Examples
```cmd
REM Get all workflow executions
curl http://localhost:3000/api/prebid-queries/workflow/executions

REM With pagination
curl "http://localhost:3000/api/prebid-queries/workflow/executions?page=1&pageSize=10"

REM Format output with jq (if installed)
curl "http://localhost:3000/api/prebid-queries/workflow/executions" | jq ".data[] | {executionId, status, duration}"

REM Save to file
curl "http://localhost:3000/api/prebid-queries/workflow/executions?page=1&pageSize=10" > executions.json

REM View response
type executions.json
```

#### PowerShell Examples
```powershell
# Monitor workflow executions
$executions = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries/workflow/executions?page=1&pageSize=20"

Write-Host "📊 Workflow Executions Summary" -ForegroundColor Cyan
Write-Host "Total: $($executions.pagination.total) | Page: $($executions.pagination.page)`n"

$executions.data | Format-Table -AutoSize -Property @(
    @{Label='Execution ID'; Expression={$_.executionId}},
    @{Label='Query'; Expression={$_.queryNumber}},
    @{Label='Status'; Expression={$_.status}},
    @{Label='Duration (ms)'; Expression={$_.duration}},
    @{Label='Steps'; Expression={"$($_.stepsCompleted)/$($_.totalSteps)"}},
    @{Label='Completed'; Expression={[datetime]$_.completedAt | Get-Date -Format 'yyyy-MM-dd HH:mm:ss'}}
)
```

#### Expected Response
```json
{
  "data": [
    {
      "executionId": "exec-20260127-103500",
      "queryId": "11111111-1111-1111-1111-111111111111",
      "queryNumber": "QRY-SYNC-001",
      "startedAt": "2026-01-27T10:35:00Z",
      "completedAt": "2026-01-27T10:40:00Z",
      "status": "COMPLETED",
      "duration": 300000,
      "stepsCompleted": 6,
      "totalSteps": 6
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

#### Validation Checklist
- [ ] All executions listed
- [ ] Status values valid
- [ ] Duration in milliseconds
- [ ] Steps completed ≤ total steps
- [ ] Timestamps in order
- [ ] Pagination correct

---

### 🔟 GET `/workflow/executions/:executionId`

**Description:** Get specific workflow execution details

**Purpose:** Validate detailed execution tracking and step information

#### Test Cases

| Case | ID | Expected | Notes |
|------|----|----|--------|
| Valid execution | Valid UUID | All steps detailed | Full workflow data |
| Failed execution | FAILED status | Error information | Exception handling |
| In progress | RUNNING status | Partial completion | Real-time status |
| Invalid ID | Bad format | 400 Bad Request | Format validation |
| Non-existent | Valid UUID, no data | 404 Not Found | ID validation |

#### cURL Examples
```bash
# Get execution details
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260127-103500

# Format with jq
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260127-103500 | jq '.steps[] | {step, name, status, duration}'
```

#### Windows CMD Examples
```cmd
REM Get execution details
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260127-103500

REM Format with jq (if installed)
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260127-103500 | jq ".steps[] | {step, name, status, duration}"

REM Save to file
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260127-103500 > execution_details.json

REM View response
type execution_details.json

REM Extract specific fields
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260127-103500 | jq ".result"
```

#### PowerShell Examples
```powershell
# Detailed workflow analysis
$executionId = "exec-20260127-103500"

$execution = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries/workflow/executions/$executionId"

Write-Host "⚙️ Workflow Execution Details" -ForegroundColor Cyan
Write-Host "Execution ID: $($execution.executionId)"
Write-Host "Query: $($execution.queryId)"
Write-Host "Status: $($execution.status)"
Write-Host "Total Duration: $([math]::Round($execution.duration / 1000, 2))s`n"

Write-Host "📈 Step-by-Step Progress:" -ForegroundColor Yellow
$execution.steps | ForEach-Object {
    $percent = [math]::Round($_.duration / $execution.duration * 100, 1)
    $bar = if ($_.status -eq 'COMPLETED') { "✅" } elseif ($_.status -eq 'IN_PROGRESS') { "🔄" } else { "⏳" }
    Write-Host "$bar Step $($_.step): $($_.name) [$percent%]"
    Write-Host "   Duration: $([math]::Round($_.duration / 1000, 2))s"
}

Write-Host "`n📋 Final Result:" -ForegroundColor Green
Write-Host "Response: $($execution.result.aiResponse.Substring(0, 100))..."
Write-Host "Confidence: $($execution.result.confidence * 100)%"
Write-Host "Sources: $($execution.result.sourceDocuments.Count)"
```

#### Expected Response
```json
{
  "executionId": "exec-20260127-103500",
  "queryId": "11111111-1111-1111-1111-111111111111",
  "queryText": "What is the project duration?",
  "startedAt": "2026-01-27T10:35:00Z",
  "completedAt": "2026-01-27T10:40:00Z",
  "status": "COMPLETED",
  "duration": 300000,
  "steps": [
    {
      "step": 1,
      "name": "Query Vectorization",
      "status": "COMPLETED",
      "startedAt": "2026-01-27T10:35:00Z",
      "completedAt": "2026-01-27T10:35:02Z",
      "duration": 2000,
      "output": {
        "embeddingDimension": 768,
        "vectorId": "query_11111111_vec"
      }
    },
    {
      "step": 2,
      "name": "Historical Data Retrieval",
      "status": "COMPLETED",
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
      "RFP-2024-NHAI-001-Section-3.2.pdf",
      "RFP-2023-NHAI-045-Timeline.pdf"
    ]
  }
}
```

#### Validation Checklist
- [ ] All 6 steps present and sequenced
- [ ] Step durations sum to total duration
- [ ] Status progression is logical
- [ ] Output data provided for each step
- [ ] Final result contains AI response
- [ ] Confidence score in valid range

---

## Testing Workflow

### Complete Testing Sequence

**Phase 1: Preparation (5 minutes)**

**PowerShell:**
```powershell
# 1. Generate synthetic data
.\Generate-SyntheticQueryData.ps1 -Count 25 -OutputFile synthetic_queries.sql

# 2. Load data into database
# Run the SQL script in your PostgreSQL client

# 3. Verify data loaded
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/statistics" | ConvertTo-Json
```

**Windows CMD:**
```cmd
REM 1. Verify backend is running
netstat -ano | findstr :3000

REM 2. Verify database connection
netstat -ano | findstr :5432

REM 3. Load SQL data (using PostgreSQL client or psql)
REM psql -U postgres -d nhai_tender_db -f synthetic_data_setup.sql

REM 4. Verify data loaded
curl http://localhost:3000/api/prebid-queries/statistics
```

---

**Phase 2: Read Operations (10 minutes)**

**PowerShell:**
```powershell
# 1. Test GET /statistics
Write-Host "Testing /statistics endpoint..."
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/statistics"

# 2. Test GET / with filters
Write-Host "Testing filtered queries..."
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries?status=pending"

# 3. Test GET /:id
Write-Host "Testing single query retrieval..."
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111"
```

**Windows CMD:**
```cmd
REM 1. Test GET /statistics
curl http://localhost:3000/api/prebid-queries/statistics

REM 2. Test GET / with filters
curl "http://localhost:3000/api/prebid-queries?status=pending"

REM 3. Test GET /:id
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111

REM 4. View pagination
curl "http://localhost:3000/api/prebid-queries?page=1&pageSize=10"
```

---

**Phase 3: Write Operations (15 minutes)**

**PowerShell:**
```powershell
# 1. Test PATCH /status
$queryId = "11111111-1111-1111-1111-111111111111"
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries/$queryId/status" `
    -Method Patch `
    -Body '{"status":"under_review"}' `
    -ContentType "application/json"

# 2. Test POST /admin-response
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries/$queryId/admin-response" `
    -Method Post `
    -Body '{"response":"Sample admin response"}' `
    -ContentType "application/json"
```

**Windows CMD:**
```cmd
REM 1. Test PATCH /status
curl -X PATCH http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/status ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"under_review\"}"

REM 2. Test POST /admin-response
curl -X POST http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111/admin-response ^
  -H "Content-Type: application/json" ^
  -d "{\"response\":\"Sample admin response\"}"

REM 3. Verify updates
curl http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111
```

---

**Phase 4: Integration Testing (20 minutes)**

**PowerShell:**
```powershell
# 1. Verify Screen 8 is running on port 8001
Test-NetConnection -ComputerName localhost -Port 8001

# 2. Test AI processing
$queryId = "22222222-2222-2222-2222-222222222222"
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries/$queryId/process" `
    -Method Post `
    -Body '{}' `
    -ContentType "application/json"

# 3. Monitor execution
$executionId = $result.executionId
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/prebid-queries/workflow/executions/$executionId"
```

**Windows CMD:**
```cmd
REM 1. Check if Screen 8 is running
netstat -ano | findstr :8001

REM 2. Test AI processing
curl -X POST http://localhost:3000/api/prebid-queries/22222222-2222-2222-2222-222222222222/process ^
  -H "Content-Type: application/json" ^
  -d "{}" > process_result.json

REM 3. View execution details
type process_result.json

REM 4. Monitor workflow (use execution ID from above)
curl http://localhost:3000/api/prebid-queries/workflow/executions/exec-20260127-103500

REM 5. Get workflow execution list
curl "http://localhost:3000/api/prebid-queries/workflow/executions?page=1&pageSize=10"
```

---

**Phase 5: Validation (10 minutes)**

**PowerShell:**
```powershell
# 1. Check final stats
Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries/statistics"

# 2. Verify all data integrity
$allQueries = Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries?pageSize=100"
Write-Host "Total queries: $($allQueries.pagination.total)"
Write-Host "Pages: $($allQueries.pagination.totalPages)"
```

**Windows CMD:**
```cmd
REM 1. Check final stats
curl http://localhost:3000/api/prebid-queries/statistics > final_stats.json

REM 2. View stats
type final_stats.json

REM 3. Verify all queries
curl "http://localhost:3000/api/prebid-queries?pageSize=100" > all_queries.json

REM 4. Check query count (if jq installed)
curl "http://localhost:3000/api/prebid-queries/statistics" | jq ".total_queries"

REM 5. Verify by status
curl "http://localhost:3000/api/prebid-queries/statistics" | jq ".by_status"
```

---

## Validation Checklist

### Pre-Testing
- [ ] All services running (Backend 3000, Screen 8 8001, PostgreSQL 5432)
- [ ] Database connection verified
- [ ] Synthetic data generated and loaded
- [ ] Ollama service available for embeddings
- [ ] ChromaDB directory accessible

### API Response Validation
- [ ] All responses have correct HTTP status codes
- [ ] JSON structure matches documentation
- [ ] All required fields present
- [ ] Data types are correct
- [ ] Timestamps in ISO 8601 format
- [ ] UUIDs are valid format

### Data Integrity
- [ ] Query counts match statistics
- [ ] Filtering returns only matching results
- [ ] Pagination offsets correct
- [ ] Status transitions follow rules
- [ ] Audit trail is complete
- [ ] Confidence scores in range [0, 1]

### Performance
- [ ] Response time < 500ms for GET requests
- [ ] Response time < 2s for AI processing
- [ ] No timeout errors
- [ ] Pagination handles large datasets

### Error Handling
- [ ] Invalid UUIDs return 400
- [ ] Non-existent IDs return 404
- [ ] Invalid status returns error
- [ ] Missing required fields return 400
- [ ] Server errors return 500
- [ ] Error messages are descriptive

---

## Troubleshooting

### Common Issues and Solutions

**Issue: "Failed to connect to port 3000"**

**PowerShell:**
```powershell
# Check if backend is running
Test-NetConnection -ComputerName localhost -Port 3000

# Start backend
cd backend
npm start
```

**Windows CMD:**
```cmd
REM Check if backend is running on port 3000
netstat -ano | findstr :3000

REM Kill process on port 3000 (if needed)
REM Find PID from above and run:
taskkill /PID <PID> /F

REM Start backend
cd backend
npm start
```

---

**Issue: "Failed to connect to Screen 8 port 8001"**

**PowerShell:**
```powershell
# Check Screen 8 service
Test-NetConnection -ComputerName localhost -Port 8001

# Verify Screen 8 is running
curl http://localhost:8001/api/health
```

**Windows CMD:**
```cmd
REM Check if Screen 8 is running on port 8001
netstat -ano | findstr :8001

REM Test connection
curl http://localhost:8001/api/health

REM Check Screen 8 logs
dir logs\screen8*.log
type logs\screen8-api.log | findstr /I "error"
```

---

**Issue: "UUID validation failed"**

**PowerShell:**
```powershell
# Validate UUID format (must be: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
$validUUID = "11111111-1111-1111-1111-111111111111"
[guid]::Parse($validUUID)  # This will error if invalid
```

**Windows CMD:**
```cmd
REM Check UUID format by testing the API call
REM Valid UUID format: 11111111-1111-1111-1111-111111111111
curl "http://localhost:3000/api/prebid-queries/11111111-1111-1111-1111-111111111111"

REM Invalid UUID (will return 400)
curl "http://localhost:3000/api/prebid-queries/invalid-uuid"

REM Look for error message in response
```

---

**Issue: "Query not found in database after insert"**

**PowerShell:**
```powershell
# Verify synthetic data was inserted
$query = Invoke-RestMethod -Uri "http://localhost:3000/api/prebid-queries?pageSize=100"
$query.data | Where-Object {$_.queryNumber -like "QRY-SYNC-*"} | Measure-Object
```

**Windows CMD:**
```cmd
REM Get all queries and save
curl "http://localhost:3000/api/prebid-queries?pageSize=100" > all_queries.json

REM View file to verify data
type all_queries.json

REM Check if synthetic data was created (if jq installed)
curl "http://localhost:3000/api/prebid-queries?pageSize=100" | jq ".data | length"

REM Alternative - count queries by checking statistics
curl "http://localhost:3000/api/prebid-queries/statistics" | jq ".total_queries"
```

---

**Issue: "AI Processing returns error"**

**PowerShell:**
```powershell
# Check Screen 8 health
Invoke-RestMethod -Uri "http://localhost:8001/api/health"

# Check logs
Get-Content .\logs\screen8-api.log -Tail 50
```

**Windows CMD:**
```cmd
REM Check Screen 8 health
curl http://localhost:8001/api/health

REM Check logs (view last 50 lines)
powershell -Command "Get-Content .\logs\screen8-api.log -Tail 50"

REM Alternative - using type command
type .\logs\screen8-api.log | findstr /I "error"

REM Test Screen 8 directly
curl -X POST http://localhost:8001/api/chief-engineer/process ^
  -H "Content-Type: application/json" ^
  -d "{\"query_id\": \"test-id\", \"query_text\": \"test query\"}"
```

---

**Issue: "Vector search returns no results"**

**PowerShell:**
```powershell
# Verify ChromaDB is initialized
Test-Path .\query_db\*.parquet

# Check vectorization job logs
Get-Content .\logs\vectorization.log -Tail 50
```

**Windows CMD:**
```cmd
REM Check if ChromaDB directory exists
dir query_db\

REM Check for parquet files (vectorized data)
dir query_db\*.parquet

REM Check vectorization logs
dir logs\vectorization*.log

REM View recent vectorization logs
type logs\vectorization.log | findstr /I "error"

REM Test query vectorization endpoint directly
curl -X POST http://localhost:8001/api/chief-engineer/store-query ^
  -H "Content-Type: application/json" ^
  -d "{\"query_id\": \"test-id\", \"query_text\": \"test query\"}"
```

---

**Issue: "PostgreSQL connection failed"**

**Windows CMD:**
```cmd
REM Check if PostgreSQL is running
netstat -ano | findstr :5432

REM Test PostgreSQL connection
REM Using psql (if installed):
REM psql -h localhost -U postgres -d nhai_tender_db

REM Check database service
sc query postgresql

REM View PostgreSQL logs
type "%ProgramFiles%\PostgreSQL\data\log\postgresql.log"

REM Start PostgreSQL service (if stopped)
net start PostgreSQL-x64-15
```

**PowerShell:**
```powershell
# Check PostgreSQL service status
Get-Service | Where-Object {$_.Name -like "*postgre*"}

# Start PostgreSQL if stopped
Start-Service PostgreSQL-x64-15
```

---

## Best Practices for Testing

✅ **Do's:**
- Use synthetic data to avoid production concerns
- Test each endpoint independently first
- Document test results
- Test with valid and invalid inputs
- Monitor response times
- Verify database state after operations
- Test error scenarios
- Use consistent data across tests

❌ **Don'ts:**
- Don't use production RFP data for testing
- Don't skip validation testing
- Don't run tests during peak hours
- Don't hardcode IDs in tests
- Don't ignore error responses
- Don't skip edge cases
- Don't test without proper isolation

---

## Performance Baselines

### Expected Response Times

| Endpoint | Method | Expected Time | Notes |
|----------|--------|---------------|-------|
| `/statistics` | GET | 100-200ms | Aggregation query |
| `/` | GET | 150-300ms | With pagination |
| `/:id` | GET | 50-100ms | Single record |
| `/:id/process` | POST | 5-30 seconds | Full workflow |
| `/:id/status` | PATCH | 50-150ms | Simple update |
| `/:id/admin-response` | POST | 100-200ms | Update + audit |
| `/:id/history` | GET | 100-200ms | Timeline query |
| `/:id/similar` | GET | 500-2000ms | Vector search |
| `/workflow/executions` | GET | 150-300ms | Execution list |
| `/workflow/executions/:id` | GET | 100-200ms | Execution detail |

---

**Last Updated:** January 27, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Testing
