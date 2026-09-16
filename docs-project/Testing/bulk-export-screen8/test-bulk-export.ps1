# Test script for bulk update and export endpoints
# Screen 7 - Prebid Query Management

$baseUrl = "http://localhost:3001/api/queries"

Write-Host "`n=== Testing Screen 7 Bulk Update and Export Endpoints ===" -ForegroundColor Cyan

# First, get some query IDs from the database
Write-Host "`n1. Fetching existing queries..." -ForegroundColor Yellow
try {
    $queriesResponse = Invoke-RestMethod -Uri "$baseUrl" -Method Get -ContentType "application/json"
    if ($queriesResponse.queries -and $queriesResponse.queries.Count -gt 0) {
        $testQueryIds = $queriesResponse.queries[0..1] | ForEach-Object { $_.queryId }
        Write-Host "Found queries: $($testQueryIds -join ', ')" -ForegroundColor Green
    } else {
        Write-Host "No queries found in database. Using sample IDs..." -ForegroundColor Yellow
        $testQueryIds = @('7577375a-a6e7-45e1-9c7e-9c65c1aaca36', '5b79647f-9f62-411f-b659-3a800b66651c')
    }
} catch {
    Write-Host "Error fetching queries: $_" -ForegroundColor Red
    Write-Host "Using sample IDs..." -ForegroundColor Yellow
    $testQueryIds = @('7577375a-a6e7-45e1-9c7e-9c65c1aaca36', '5b79647f-9f62-411f-b659-3a800b66651c')
}

# Test 1: Bulk Update - Accept queries
Write-Host "`n2. Testing Bulk Update - Accept action..." -ForegroundColor Yellow
$bulkUpdateBody = @{
    queryIds = $testQueryIds
    action = "accept"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $bulkUpdateBody
    Write-Host "✓ Bulk Update Success:" -ForegroundColor Green
    Write-Host "  Action: $($response.action)" -ForegroundColor White
    Write-Host "  Updated: $($response.updatedCount)" -ForegroundColor White
    Write-Host "  Total Requested: $($response.totalRequested)" -ForegroundColor White
    if ($response.failedIds -and $response.failedIds.Count -gt 0) {
        Write-Host "  Failed IDs: $($response.failedIds -join ', ')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Bulk Update Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: Bulk Update - Reject queries
Write-Host "`n3. Testing Bulk Update - Reject action..." -ForegroundColor Yellow
$bulkUpdateBody = @{
    queryIds = $testQueryIds
    action = "reject"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $bulkUpdateBody
    Write-Host "✓ Bulk Update Success:" -ForegroundColor Green
    Write-Host "  Action: $($response.action)" -ForegroundColor White
    Write-Host "  Updated: $($response.updatedCount)" -ForegroundColor White
    Write-Host "  Total Requested: $($response.totalRequested)" -ForegroundColor White
    if ($response.failedIds -and $response.failedIds.Count -gt 0) {
        Write-Host "  Failed IDs: $($response.failedIds -join ', ')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Bulk Update Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: Bulk Update - Assign queries to user
Write-Host "`n4. Testing Bulk Update - Assign action..." -ForegroundColor Yellow
$bulkUpdateBody = @{
    queryIds = $testQueryIds
    action = "assign"
    assignTo = "admin@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $bulkUpdateBody
    Write-Host "✓ Bulk Update Success:" -ForegroundColor Green
    Write-Host "  Action: $($response.action)" -ForegroundColor White
    Write-Host "  Updated: $($response.updatedCount)" -ForegroundColor White
    Write-Host "  Total Requested: $($response.totalRequested)" -ForegroundColor White
    if ($response.failedIds -and $response.failedIds.Count -gt 0) {
        Write-Host "  Failed IDs: $($response.failedIds -join ', ')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Bulk Update Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 4: Export queries as CSV
Write-Host "`n5. Testing Export - CSV format..." -ForegroundColor Yellow
$exportBody = @{
    queryIds = $testQueryIds
    format = "csv"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/export" -Method Post -ContentType "application/json" -Body $exportBody
    Write-Host "✓ Export Success:" -ForegroundColor Green
    Write-Host "  File Name: $($response.fileName)" -ForegroundColor White
    Write-Host "  Content Type: $($response.contentType)" -ForegroundColor White
    Write-Host "  Count: $($response.count)" -ForegroundColor White
    
    # Save the CSV file
    $csvBytes = [Convert]::FromBase64String($response.data)
    $csvPath = Join-Path (Get-Location) "exported_queries.csv"
    [IO.File]::WriteAllBytes($csvPath, $csvBytes)
    Write-Host "  Saved to: $csvPath" -ForegroundColor Green
    
    # Display first few lines
    Write-Host "`nCSV Preview:" -ForegroundColor Cyan
    $csvContent = [System.Text.Encoding]::UTF8.GetString($csvBytes)
    $lines = $csvContent -split "`n" | Select-Object -First 5
    $lines | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} catch {
    Write-Host "✗ Export Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 5: Export queries as XLSX
Write-Host "`n6. Testing Export - XLSX format..." -ForegroundColor Yellow
$exportBody = @{
    queryIds = $testQueryIds
    format = "xlsx"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/export" -Method Post -ContentType "application/json" -Body $exportBody
    Write-Host "✓ Export Success:" -ForegroundColor Green
    Write-Host "  File Name: $($response.fileName)" -ForegroundColor White
    Write-Host "  Content Type: $($response.contentType)" -ForegroundColor White
    Write-Host "  Count: $($response.count)" -ForegroundColor White
    
    # Save the XLSX file
    $xlsxBytes = [Convert]::FromBase64String($response.data)
    $xlsxPath = Join-Path (Get-Location) "exported_queries.xlsx"
    [IO.File]::WriteAllBytes($xlsxPath, $xlsxBytes)
    Write-Host "  Saved to: $xlsxPath" -ForegroundColor Green
} catch {
    Write-Host "✗ Export Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 6: Error handling - Invalid action
Write-Host "`n7. Testing Error Handling - Invalid action..." -ForegroundColor Yellow
$invalidBody = @{
    queryIds = $testQueryIds
    action = "invalid_action"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $invalidBody
    Write-Host "✗ Should have failed but succeeded" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected invalid action" -ForegroundColor Green
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor White
}

# Test 7: Error handling - Empty queryIds array
Write-Host "`n8. Testing Error Handling - Empty queryIds..." -ForegroundColor Yellow
$emptyBody = @{
    queryIds = @()
    action = "accept"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $emptyBody
    Write-Host "✗ Should have failed but succeeded" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected empty queryIds" -ForegroundColor Green
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor White
}

# Test 8: Error handling - Missing assignTo for assign action
Write-Host "`n9. Testing Error Handling - Missing assignTo for assign..." -ForegroundColor Yellow
$missingAssignBody = @{
    queryIds = $testQueryIds
    action = "assign"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/bulk-update" -Method Post -ContentType "application/json" -Body $missingAssignBody
    Write-Host "✗ Should have failed but succeeded" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected missing assignTo" -ForegroundColor Green
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor White
}

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host "`nNOTE: Some tests may fail if query IDs don't exist in database." -ForegroundColor Yellow
Write-Host "Use real query IDs from your database for accurate testing.`n" -ForegroundColor Yellow
