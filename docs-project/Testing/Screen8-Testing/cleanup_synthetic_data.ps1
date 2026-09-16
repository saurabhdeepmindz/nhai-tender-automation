# ============================================================================
# Synthetic Data Cleanup Script for Screen 8 API Testing (PowerShell)
# ============================================================================
# WARNING: This script will DELETE all test data created with synthetic IDs!
# Usage:
#   .\cleanup_synthetic_data.ps1
#   .\cleanup_synthetic_data.ps1 -Force -DBHost 192.168.1.100
# ============================================================================

param(
    [string]$DBHost = "localhost",
    [string]$DBUser = "postgres",
    [string]$DBName = "nhai_tender_db",
    [string]$DBPort = "5432",
    [switch]$Force = $false,
    [switch]$NoBackup = $false
)

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-DatabaseConnection {
    param([string]$DBHost, [string]$DBUser, [string]$DBName, [string]$DBPort)
    
    try {
        $TestQuery = "SELECT 1;" | psql -h $DBHost -U $DBUser -d $DBName -p $DBPort -t -q 2>&1
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Get-SyntheticDataCount {
    param([string]$DBHost, [string]$DBUser, [string]$DBName, [string]$DBPort)
    
    try {
        $Query = "SELECT COUNT(*) as count FROM queries WHERE query_number LIKE 'QRY-SYNC-%';"
        $result = $Query | psql -h $DBHost -U $DBUser -d $DBName -p $DBPort -t -q
        return [int]($result -split '\s+' | Where-Object {$_ -match '^\d+$'})[0]
    }
    catch {
        return -1
    }
}

function Backup-SyntheticData {
    param([string]$DBHost, [string]$DBUser, [string]$DBName, [string]$DBPort)
    
    $BackupFile = "synthetic_data_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    
    Write-ColorOutput "📦 Creating backup: $BackupFile" -Color Cyan
    
    try {
        $ExportQuery = @"
SELECT * FROM queries 
WHERE query_number LIKE 'QRY-SYNC-%'
ORDER BY submitted_at DESC;
"@
        
        $ExportQuery | psql -h $DBHost -U $DBUser -d $DBName -p $DBPort > $BackupFile
        Write-ColorOutput "✅ Backup created successfully" -Color Green
        return $true
    }
    catch {
        Write-ColorOutput "❌ Backup failed: $_" -Color Red
        return $false
    }
}

function Remove-SyntheticData {
    param([string]$DBHost, [string]$DBUser, [string]$DBName, [string]$DBPort)
    
    $CleanupQuery = @"
DELETE FROM workflow_executions 
WHERE query_id IN (SELECT query_id FROM queries WHERE query_number LIKE 'QRY-SYNC-%');

DELETE FROM query_history 
WHERE query_id IN (SELECT query_id FROM queries WHERE query_number LIKE 'QRY-SYNC-%');

DELETE FROM admin_responses 
WHERE query_id IN (SELECT query_id FROM queries WHERE query_number LIKE 'QRY-SYNC-%');

DELETE FROM queries 
WHERE query_number LIKE 'QRY-SYNC-%';

SELECT 'Cleanup complete' as status;
"@
    
    Write-ColorOutput "🧹 Cleaning up synthetic data..." -Color Cyan
    
    try {
        $CleanupQuery | psql -h $DBHost -U $DBUser -d $DBName -p $DBPort
        Write-ColorOutput "✅ Synthetic data cleanup complete!" -Color Green
        return $true
    }
    catch {
        Write-ColorOutput "❌ Cleanup failed: $_" -Color Red
        return $false
    }
}

function Verify-Cleanup {
    param([string]$DBHost, [string]$DBUser, [string]$DBName, [string]$DBPort)
    
    Write-ColorOutput "`n🔍 Verifying cleanup..." -Color Cyan
    
    $count = Get-SyntheticDataCount -DBHost $DBHost -DBUser $DBUser -DBName $DBName -DBPort $DBPort
    
    if ($count -eq 0) {
        Write-ColorOutput "✅ Remaining synthetic queries: 0" -Color Green
        return $true
    }
    elseif ($count -gt 0) {
        Write-ColorOutput "⚠️  $count records still remain" -Color Yellow
        return $false
    }
    else {
        Write-ColorOutput "❌ Could not verify cleanup" -Color Red
        return $false
    }
}

# Main execution
Clear-Host
Write-ColorOutput "`n╔════════════════════════════════════════════════════════════╗" -Color Cyan
Write-ColorOutput "║  Screen 8 API Testing - Synthetic Data Cleanup            ║" -Color Cyan
Write-ColorOutput "║              (PowerShell Implementation)                   ║" -Color Cyan
Write-ColorOutput "╚════════════════════════════════════════════════════════════╝`n" -Color Cyan

# Test connection
Write-ColorOutput "🔗 Testing database connection..." -Color Cyan
if (-not (Test-DatabaseConnection -DBHost $DBHost -DBUser $DBUser -DBName $DBName -DBPort $DBPort)) {
    Write-ColorOutput "❌ Cannot connect to database" -Color Red
    Write-ColorOutput "Please verify your database connection parameters:" -Color Yellow
    Write-ColorOutput "  Host: $DBHost" -Color Yellow
    Write-ColorOutput "  User: $DBUser" -Color Yellow
    Write-ColorOutput "  Database: $DBName" -Color Yellow
    Write-ColorOutput "  Port: $DBPort" -Color Yellow
    exit 1
}

Write-ColorOutput "✅ Database connection successful`n" -Color Green

# Count records
$count = Get-SyntheticDataCount -DBHost $DBHost -DBUser $DBUser -DBName $DBName -DBPort $DBPort

if ($count -eq 0) {
    Write-ColorOutput "✅ No synthetic data found. Nothing to clean up.`n" -Color Green
    exit 0
}

Write-ColorOutput "Found $count synthetic query records to delete" -Color Yellow

# Backup if requested
if (-not $NoBackup) {
    Backup-SyntheticData -DBHost $DBHost -DBUser $DBUser -DBName $DBName -DBPort $DBPort
}

# Confirm deletion
Write-ColorOutput "`n⚠️  WARNING: About to DELETE all synthetic test data!" -Color Yellow
Write-ColorOutput "This includes all queries with 'QRY-SYNC-' prefix`n" -Color Yellow

if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to DELETE all $count records? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-ColorOutput "❌ Cleanup cancelled`n" -Color Red
        exit 0
    }
}

# Remove data
if (Remove-SyntheticData -DBHost $DBHost -DBUser $DBUser -DBName $DBName -DBPort $DBPort) {
    # Verify
    Verify-Cleanup -DBHost $DBHost -DBUser $DBUser -DBName $DBName -DBPort $DBPort
    Write-ColorOutput "`n✨ Cleanup process complete!`n" -Color Green
}
else {
    Write-ColorOutput "`n❌ Cleanup process failed!`n" -Color Red
    exit 1
}
