<#
NHAI Tender Automation — Endpoint Test Runner

Runs tests from docs/RUN_TEST_MATRIX.csv. Supports executing GET endpoints
and the Historical RFP Upload POST via curl.exe with multipart/form-data.

Usage examples:

- Basic GET tests only:
  powershell -ExecutionPolicy Bypass -File "docs\run-tests.ps1"

- Upload a document first, then run status and list:
  powershell -ExecutionPolicy Bypass -File "docs\run-tests.ps1" -UploadFilePath "C:\Docs\document.pdf" -RfpNumber "RFP-2024-NH-001" -Title "Sample Title" -DocumentType "RFP"

Params:
-CsvPath: Path to the CSV matrix (default: docs\RUN_TEST_MATRIX.csv)
-BaseApi: Base API URL for backend (default: http://localhost:3000/api)
-UploadFilePath: Local file path for upload (optional; enables upload test)
-RfpNumber, -Title, -DocumentType, -Description: Upload fields (row values override when present)
-OutputDir: Directory to write JSON responses (default: docs\test-results)
-StartBackend / -StartFrontend / -StartAll: optionally launch services via batch scripts from repo root
-DryRun: If set, prints planned actions without executing
#>

param(
  [string]$CsvPath = "docs\\RUN_TEST_MATRIX.csv",
  [string]$BaseApi = "http://localhost:3000/api",
  [string]$UploadFilePath,
  [string]$RfpNumber = "RFP-2024-NH-001",
  [string]$Title = "Sample Upload",
  [string]$DocumentType = "RFP",
  [string]$Description = "Historical RFP for reference",
  [string]$OutputDir = "docs\\test-results",
  [switch]$StartBackend,
  [switch]$StartFrontend,
  [switch]$StartAll,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BatchBackend = Join-Path $RepoRoot "START_BACKEND.bat"
$BatchFrontend = Join-Path $RepoRoot "START_FRONTEND.bat"
$BatchAll = Join-Path $RepoRoot "START_ALL_SERVICES.bat"

function Start-ServiceBatch {
  param(
    [string]$Path,
    [string]$Label
  )
  if (-not (Test-Path -Path $Path)) {
    Write-Warning "Cannot start $Label: $Path not found"
    return
  }
  Write-Host "Starting $Label via $Path" -ForegroundColor Yellow
  if ($DryRun) { return }
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c","\"$Path\"" -WindowStyle Normal | Out-Null
}

function Ensure-Dir($path) {
  if (-not (Test-Path -Path $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
  }
}

function Save-Json([string]$name, $content) {
  Ensure-Dir $OutputDir
  $file = Join-Path $OutputDir $name
  if ($content -is [string]) {
    Set-Content -Path $file -Value $content -Encoding UTF8
  } else {
    $json = $content | ConvertTo-Json -Depth 6
    Set-Content -Path $file -Value $json -Encoding UTF8
  }
  Write-Host "Saved: $file" -ForegroundColor Green
}

function Invoke-Get($url, [string]$label) {
  Write-Host "GET $url" -ForegroundColor Cyan
  if ($DryRun) { return }
  try {
    $resp = Invoke-RestMethod -Method GET -Uri $url -Headers @{ Accept = 'application/json' }
    Save-Json "$label.json" $resp
  } catch {
    Write-Warning "GET failed: $($_.Exception.Message)"
    Save-Json "$label.error.json" $($_.Exception.Message)
  }
}

function Invoke-UploadHistorical() {
  param(
    [string]$url,
    [string]$FilePath,
    [string]$RowRfpNumber,
    [string]$RowTitle,
    [string]$RowDocumentType,
    [string]$RowDescription
  )

  $effectiveFile = if ($FilePath) { $FilePath } else { $UploadFilePath }
  $effectiveRfp = if ($RowRfpNumber) { $RowRfpNumber } else { $RfpNumber }
  $effectiveTitle = if ($RowTitle) { $RowTitle } else { $Title }
  $effectiveDocType = if ($RowDocumentType) { $RowDocumentType } else { $DocumentType }
  $effectiveDesc = if ($RowDescription) { $RowDescription } else { $Description }

  if (-not $effectiveFile) {
    Write-Warning "Upload skipped: no file path provided"
    return $null
  }
  if (-not (Test-Path -Path $effectiveFile)) {
    Write-Warning "Upload skipped: file not found at $effectiveFile"
    return $null
  }
  $curl = (Get-Command curl.exe -ErrorAction SilentlyContinue)
  if (-not $curl) {
    Write-Warning "curl.exe not found. Please ensure curl is available on PATH."
    return $null
  }
  Write-Host "POST (upload) $url" -ForegroundColor Cyan
  Write-Host "  file=$effectiveFile, rfp_number=$effectiveRfp, title=$effectiveTitle, document_type=$effectiveDocType" -ForegroundColor DarkGray
  if ($DryRun) { return $null }
  $args = @(
    '-X','POST',"$url",
    '-H','Accept: application/json',
    '-H','Content-Type: multipart/form-data',
    '-F',"file=@$effectiveFile",
    '-F',"rfp_number=$effectiveRfp",
    '-F',"title=$effectiveTitle",
    '-F',"document_type=$effectiveDocType",
    '-F',"description=$effectiveDesc"
  )
  $proc = & $curl.Source $args 2>&1
  $out = $proc | Out-String
  Save-Json "upload.raw.json" $out
  try {
    $json = $out | ConvertFrom-Json
    if ($json.document_id) {
      Save-Json "upload.parsed.json" $json
      return [int]$json.document_id
    }
  } catch {
    Write-Warning "Upload response is not valid JSON."
  }
  return $null
}

# Load CSV
if (-not (Test-Path -Path $CsvPath)) {
  throw "CSV not found: $CsvPath"
}
$rows = Import-Csv -Path $CsvPath

Write-Host "Loaded $($rows.Count) rows from $CsvPath" -ForegroundColor Yellow
Ensure-Dir $OutputDir

# Optionally start services
if ($StartAll) {
  Start-ServiceBatch -Path $BatchAll -Label "All Services"
} else {
  if ($StartBackend) { Start-ServiceBatch -Path $BatchBackend -Label "Backend" }
  if ($StartFrontend) { Start-ServiceBatch -Path $BatchFrontend -Label "Frontend" }
}

$lastUploadedId = $null

foreach ($row in $rows) {
  $name = $row.Name
  $type = $row.Type
  $cmdOrMethod = $row.CommandOrMethod
  $url = $row.URL
  $notes = $row.Notes

  # Normalize URLs using BaseApi if they start with /
  if ($url -match '^/'){ $url = "$BaseApi" + $url }

  switch ($type) {
    'Endpoint' {
      if ($cmdOrMethod -match '^GET$') {
        # Replace {id} placeholders if available
        if ($url -match '\{id\}' -and $lastUploadedId) {
          $url = $url -replace '\{id\}', "$lastUploadedId"
        }
        if ($url -match '\{id\}' -and -not $lastUploadedId) {
          Write-Warning "Skipping $name: {id} placeholder without a known uploaded ID"
          continue
        }
        $label = ($name -replace '[^a-zA-Z0-9_-]', '_')
        Invoke-Get -url $url -label $label
      }
      elseif ($cmdOrMethod -match '^POST$' -and $url -match '/historical-data/upload') {
        $lastUploadedId = Invoke-UploadHistorical -url $url -FilePath $row.FilePath -RowRfpNumber $row.RfpNumber -RowTitle $row.Title -RowDocumentType $row.DocumentType -RowDescription $row.Description
        if ($lastUploadedId) {
          Write-Host "Captured uploaded document_id: $lastUploadedId" -ForegroundColor Green
        } else {
          Write-Warning "Upload did not return document_id; status checks may be skipped."
        }
      }
      else {
        if ($notes -match 'Requires auth') {
          Write-Warning "Skipping $name: requires authentication"
        } else {
          Write-Warning "Skipping $name: unsupported method or special handling not implemented"
        }
      }
    }
    default {
      # Services/UI/docs rows are informational; no action
      Write-Host "Info: $name ($type) -> $url" -ForegroundColor DarkGray
    }
  }
}

Write-Host "\nDone. Results saved in $OutputDir" -ForegroundColor Yellow
