# Quick Migration Test

Write-Host "`n=== Quick Migration Test ===" -ForegroundColor Cyan

# Test 1: Screen 7
Write-Host "`n1. Testing Screen 7 (Port 8000)..." -NoNewline
try {
    $screen7 = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get -TimeoutSec 5
    Write-Host " ✓ PASS" -ForegroundColor Green
    Write-Host "   Status: $($screen7.status)" -ForegroundColor Gray
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

# Test 2: Screen 8
Write-Host "`n2. Testing Screen 8 (Port 8001)..." -NoNewline
try {
    $screen8 = Invoke-RestMethod -Uri "http://localhost:8001/api/health" -Method Get -TimeoutSec 5
    Write-Host " ✓ PASS" -ForegroundColor Green
    Write-Host "   Status: $($screen8.status)" -ForegroundColor Gray
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

# Test 3: Backend
Write-Host "`n3. Testing Backend (Port 3000)..." -NoNewline
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 5
    Write-Host " ✓ PASS" -ForegroundColor Green
    Write-Host "   Status: $($backend.status)" -ForegroundColor Gray
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

# Test 4: Store Query Endpoint
Write-Host "`n4. Testing /store-query endpoint..." -NoNewline
try {
    $testPayload = @{
        query_id = "test-query-001"
        query_text = "What is the contract duration for project X?"
        embedding_model = "nomic-embed-text"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/chief-engineer/store-query" -Method Post -Body $testPayload -Headers $headers -TimeoutSec 10
    Write-Host " ✓ PASS" -ForegroundColor Green
    Write-Host "   Query ID: $($response.query_id)" -ForegroundColor Gray
    Write-Host "   Stored: $($response.stored)" -ForegroundColor Gray
} catch {
    Write-Host " ✗ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
