# ============================================================================
# PostgreSQL to ChromaDB Migration Testing Script
# NHAI Tender Query Automation System
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  PostgreSQL → ChromaDB Migration Testing                      ║" -ForegroundColor Cyan
Write-Host "║  NHAI Tender Query Automation System                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================
Write-Host "STEP 1: Checking Prerequisites..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$allServicesRunning = $true

Write-Host "`n  Checking Backend (port 3000)... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✓ Running" -ForegroundColor Green
} catch {
    Write-Host "✗ NOT Running" -ForegroundColor Red
    $allServicesRunning = $false
}

Write-Host "  Checking Screen 7 (port 8000)... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✓ Running" -ForegroundColor Green
} catch {
    Write-Host "✗ NOT Running" -ForegroundColor Red
    $allServicesRunning = $false
}

Write-Host "  Checking Screen 8 (port 8001)... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8001/api/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✓ Running" -ForegroundColor Green
} catch {
    Write-Host "✗ NOT Running" -ForegroundColor Red
    $allServicesRunning = $false
}

Write-Host "  Checking Ollama (port 11434)... " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/version" -Method GET -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✓ Running" -ForegroundColor Green
} catch {
    Write-Host "✗ NOT Running" -ForegroundColor Red
    $allServicesRunning = $false
}

if (-not $allServicesRunning) {
    Write-Host "`n❌ ERROR: Not all services are running!" -ForegroundColor Red
    Write-Host "`nPlease start the missing services:" -ForegroundColor Yellow
    Write-Host "  1. Backend:  cd backend && npm run start:dev" -ForegroundColor White
    Write-Host "  2. Screen 7: cd python-rag\screen07-history-retriever && ..\..\nhai-venv\Scripts\python.exe main.py" -ForegroundColor White
    Write-Host "  3. Screen 8: cd python-rag\screen08-chief-engineer && ..\..\nhai-venv\Scripts\python.exe main.py" -ForegroundColor White
    Write-Host "  4. Ollama:   ollama serve" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "`n✅ All services are running!`n" -ForegroundColor Green

# ============================================================================
# STEP 2: Create Test Query in PostgreSQL (if not exists)
# ============================================================================
Write-Host "STEP 2: Creating Test Query in PostgreSQL..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$testQueryBody = @{
    rfp_id = "00000000-0000-0000-0000-000000000001"
    category_id = 1
    query_text = "What is the minimum experience required for contractors in highway construction projects?"
    priority = "normal"
} | ConvertTo-Json

Write-Host "`n  Creating query via API..." -NoNewline
try {
    $createResponse = Invoke-WebRequest `
        -Uri "http://localhost:3000/api/queries" `
        -Method POST `
        -Body $testQueryBody `
        -ContentType "application/json" `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    $query = $createResponse.Content | ConvertFrom-Json
    $queryId = $query.queryId
    Write-Host " ✓ Created" -ForegroundColor Green
    Write-Host "  Query ID: $queryId" -ForegroundColor Cyan
    Write-Host "  Status: $($query.status)" -ForegroundColor White
    Write-Host "  Vectorized: $($query.vectorized)" -ForegroundColor White
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host " ⚠ API not available" -ForegroundColor Yellow
        Write-Host "`n  Note: You'll need to create queries through the frontend or database directly" -ForegroundColor Yellow
    } else {
        Write-Host " ✗ Failed" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    $queryId = $null
}

# ============================================================================
# STEP 3: Test Direct Vectorization (Screen 8)
# ============================================================================
Write-Host "`nSTEP 3: Testing Direct Vectorization..." -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$storeQueryBody = @{
    query_id = if ($queryId) { $queryId } else { "test-query-" + [guid]::NewGuid().ToString() }
    query_text = "What is the minimum experience required for contractors?"
    category = "Technical"
    rfp_number = "RFP-2024-NH-001"
    metadata = @{
        submitted_by = "test@example.com"
        submitted_at = (Get-Date -Format "o")
        priority = "normal"
        rfp_title = "Test RFP Project"
        project_name = "NH-44 Highway Construction"
    }
} | ConvertTo-Json -Depth 3

Write-Host "`n  Sending query to Screen 8 for vectorization..." -NoNewline
try {
    $vectorizeResponse = Invoke-WebRequest `
        -Uri "http://localhost:8001/api/chief-engineer/store-query" `
        -Method POST `
        -Body $storeQueryBody `
        -ContentType "application/json" `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $result = $vectorizeResponse.Content | ConvertFrom-Json
    Write-Host " ✓ Success" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Response:" -ForegroundColor Cyan
    Write-Host "  ├─ Success: $($result.success)" -ForegroundColor White
    Write-Host "  ├─ Query ID: $($result.query_id)" -ForegroundColor White
    Write-Host "  ├─ Message: $($result.message)" -ForegroundColor White
    if ($result.embedding_dimension) {
        Write-Host "  ├─ Embedding Dimension: $($result.embedding_dimension)" -ForegroundColor White
    }
    if ($result.processing_time) {
        Write-Host "  └─ Processing Time: $($result.processing_time)s" -ForegroundColor White
    }
    
    Write-Host "`n✅ Query successfully stored in ChromaDB!" -ForegroundColor Green
    
} catch {
    Write-Host " ✗ Failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorBody = $reader.ReadToEnd()
        Write-Host "  Details: $errorBody" -ForegroundColor Red
    }
}

# ============================================================================
# STEP 4: Trigger Background Job (if needed)
# ============================================================================
Write-Host "`nSTEP 4: Background Job Information" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Write-Host "`n  The QueryVectorizationJob runs automatically every 5 minutes." -ForegroundColor White
Write-Host "  It will:" -ForegroundColor White
Write-Host "    1. Find queries with vectorized=false" -ForegroundColor Gray
Write-Host "    2. Send them to Screen 8" -ForegroundColor Gray
Write-Host "    3. Store embeddings in ChromaDB" -ForegroundColor Gray
Write-Host "    4. Update PostgreSQL (vectorized=true)" -ForegroundColor Gray

Write-Host "`n  To trigger manually, use the admin endpoint:" -ForegroundColor Cyan
Write-Host "    POST http://localhost:3000/api/admin/vectorization/trigger" -ForegroundColor Gray

# ============================================================================
# STEP 5: Summary
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Migration Test Complete                                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📊 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Check ChromaDB: Query stored in ./query_db directory" -ForegroundColor White
Write-Host "  2. Monitor Logs: Watch backend console for vectorization job" -ForegroundColor White
Write-Host "  3. Verify Database: Check PostgreSQL queries table" -ForegroundColor White
Write-Host "  4. Wait 5 minutes: Background job will process remaining queries" -ForegroundColor White

Write-Host "`n📁 ChromaDB Locations:" -ForegroundColor Yellow
Write-Host "  • Screen 7 (Historical): python-rag\screen07-history-retriever\chroma_db" -ForegroundColor Gray
Write-Host "  • Screen 8 (Queries):    python-rag\screen08-chief-engineer\chroma_db" -ForegroundColor Gray

Write-Host "`n🔗 Useful URLs:" -ForegroundColor Yellow
Write-Host "  • Backend API:     http://localhost:3000/api" -ForegroundColor Gray
Write-Host "  • Backend Swagger: http://localhost:3000/api/docs" -ForegroundColor Gray
Write-Host "  • Screen 7 Health: http://localhost:8000/api/health" -ForegroundColor Gray
Write-Host "  • Screen 8 Health: http://localhost:8001/api/health" -ForegroundColor Gray
Write-Host "  • Screen 8 Swagger: http://localhost:8001/docs" -ForegroundColor Gray

Write-Host ""
