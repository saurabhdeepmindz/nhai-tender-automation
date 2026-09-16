# Test Script for Bulk Update and Export Endpoints
# Screen 7 - Prebid Query Management
# Date: January 26, 2026

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Testing Bulk Update & Export Endpoints" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001/api/queries"

# Test Query IDs (update these with actual query IDs from your database)
$queryIds = @(
    "7577375a-a6e7-45e1-9c7e-9c65c1aaca36",
    "5b79647f-9f62-411f-b659-3a800b66651c"
)

Write-Host "Using Query IDs:" -ForegroundColor Yellow
$queryIds | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""

# ===========================================
# Test 1: Bulk Update with Accept Action
# ===========================================
Write-Host "Test 1: Bulk Update - Accept Action" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Gray

$bulkUpdateBody = @{
    queryIds = $queryIds
    action = "accept"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $bulkUpdateBody -ForegroundColor Gray
Write-Host ""

try {
    $bulkUpdateResult = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $bulkUpdateBody -ErrorAction Stop
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $bulkUpdateResult | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ===========================================
# Test 2: Bulk Update with Reject Action
# ===========================================
Write-Host "Test 2: Bulk Update - Reject Action" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Gray

$rejectBody = @{
    queryIds = $queryIds
    action = "reject"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $rejectBody -ForegroundColor Gray
Write-Host ""

try {
    $rejectResult = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $rejectBody -ErrorAction Stop
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $rejectResult | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ===========================================
# Test 3: Bulk Update with Assign Action
# ===========================================
Write-Host "Test 3: Bulk Update - Assign Action" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Gray

$assignBody = @{
    queryIds = $queryIds
    action = "assign"
    assignTo = "admin@example.com"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $assignBody -ForegroundColor Gray
Write-Host ""

try {
    $assignResult = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $assignBody -ErrorAction Stop
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $assignResult | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ===========================================
# Test 4: Export Queries as CSV
# ===========================================
Write-Host "Test 4: Export Queries - CSV Format" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Gray

$exportBody = @{
    queryIds = $queryIds
    format = "csv"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $exportBody -ForegroundColor Gray
Write-Host ""

try {
    $exportResult = Invoke-RestMethod -Uri "$baseUrl/export" -Method Post -ContentType "application/json" -Body $exportBody -ErrorAction Stop
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Export Response:" -ForegroundColor Yellow
    Write-Host "  - File Name: $($exportResult.fileName)" -ForegroundColor Gray
    Write-Host "  - Content Type: $($exportResult.contentType)" -ForegroundColor Gray
    Write-Host "  - Query Count: $($exportResult.count)" -ForegroundColor Gray
    Write-Host ""
    
    # Save CSV file
    $csvFilePath = ".\exported_queries_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    $csvBytes = [Convert]::FromBase64String($exportResult.data)
    [IO.File]::WriteAllBytes($csvFilePath, $csvBytes)
    
    Write-Host "CSV file saved: $csvFilePath" -ForegroundColor Green
    
    # Display first 5 lines
    $csvContent = [System.Text.Encoding]::UTF8.GetString($csvBytes)
    $csvLines = $csvContent -split "`n" | Select-Object -First 5
    Write-Host ""
    Write-Host "CSV Preview (first 5 lines):" -ForegroundColor Yellow
    $csvLines | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    Write-Host ""
} catch {
    Write-Host "Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ===========================================
# Test 5: Export Queries as XLSX
# ===========================================
Write-Host "Test 5: Export Queries - XLSX Format" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Gray

$exportXlsxBody = @{
    queryIds = $queryIds
    format = "xlsx"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $exportXlsxBody -ForegroundColor Gray
Write-Host ""

try {
    $exportXlsxResult = Invoke-RestMethod -Uri "$baseUrl/export" -Method Post -ContentType "application/json" -Body $exportXlsxBody -ErrorAction Stop
    
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Export Response:" -ForegroundColor Yellow
    Write-Host "  - File Name: $($exportXlsxResult.fileName)" -ForegroundColor Gray
    Write-Host "  - Content Type: $($exportXlsxResult.contentType)" -ForegroundColor Gray
    Write-Host "  - Query Count: $($exportXlsxResult.count)" -ForegroundColor Gray
    Write-Host ""
    
    # Save XLSX file
    $xlsxFilePath = ".\exported_queries_$(Get-Date -Format 'yyyyMMdd_HHmmss').xlsx"
    $xlsxBytes = [Convert]::FromBase64String($exportXlsxResult.data)
    [IO.File]::WriteAllBytes($xlsxFilePath, $xlsxBytes)
    
    Write-Host "XLSX file saved: $xlsxFilePath" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# ===========================================
# Test 6: Invalid Action (Error Handling)
# ===========================================
Write-Host "Test 6: Invalid Action - Error Handling" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Gray

$invalidBody = @{
    queryIds = $queryIds
    action = "invalid_action"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $invalidBody -ForegroundColor Gray
Write-Host ""

try {
    $invalidResult = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $invalidBody -ErrorAction Stop
    
    Write-Host "Unexpected Success (Should have failed!)" -ForegroundColor Red
} catch {
    Write-Host "Expected Error!" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    Write-Host ""
}

# ===========================================
# Test 7: Empty Query IDs (Error Handling)
# ===========================================
Write-Host "Test 7: Empty Query IDs - Error Handling" -ForegroundColor Green
Write-Host "---------------------------------------" -ForegroundColor Gray

$emptyBody = @{
    queryIds = @()
    action = "accept"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $emptyBody -ForegroundColor Gray
Write-Host ""

try {
    $emptyResult = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $emptyBody -ErrorAction Stop
    
    Write-Host "Unexpected Success (Should have failed!)" -ForegroundColor Red
} catch {
    Write-Host "Expected Error!" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    Write-Host ""
}

# ===========================================
# Summary
# ===========================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints tested:" -ForegroundColor Yellow
Write-Host "  1. POST /api/queries/bulk-update (Accept)" -ForegroundColor Gray
Write-Host "  2. POST /api/queries/bulk-update (Reject)" -ForegroundColor Gray
Write-Host "  3. POST /api/queries/bulk-update (Assign)" -ForegroundColor Gray
Write-Host "  4. POST /api/queries/export (CSV)" -ForegroundColor Gray
Write-Host "  5. POST /api/queries/export (XLSX)" -ForegroundColor Gray
Write-Host "  6. Error handling (Invalid action)" -ForegroundColor Gray
Write-Host "  7. Error handling (Empty query IDs)" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: Update the query IDs at the top of this script" -ForegroundColor Yellow
Write-Host "with actual IDs from your database for better testing." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
