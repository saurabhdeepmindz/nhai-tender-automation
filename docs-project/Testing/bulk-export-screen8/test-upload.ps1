# Test Historical Data Upload
# PowerShell script to upload NHAI_AI.pdf

$filePath = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V300\NHAI-TENDER-AUTOMATION\docs\NHAI_AI.pdf"
$url = "http://localhost:3001/api/historical-data/upload"

# Create form data
$form = @{
    rfp_number = "RFP-2026-NH-001"
    title = "NHAI AI Tender Document"
    document_type = "RFP"
    description = "Test upload for Historical Data Management"
    file = Get-Item -Path $filePath
}

# Send POST request
Write-Host "Uploading NHAI_AI.pdf..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Form $form
    Write-Host "✅ Upload Successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Document ID: $($response.document_id)" -ForegroundColor Yellow
    Write-Host "Status: $($response.status)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Monitor processing at:" -ForegroundColor Cyan
    Write-Host "http://localhost:3001/api/historical-data/$($response.document_id)" -ForegroundColor Blue
}
catch {
    Write-Host "❌ Upload Failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
