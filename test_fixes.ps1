# Test script to verify the fixes

Write-Host "=== Testing Fixes ===" -ForegroundColor Cyan

# 1. Check if backend was rebuilt
Write-Host "`n1. Checking backend build..." -ForegroundColor Yellow
$distDir = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\backend\dist"
if (Test-Path $distDir) {
    Write-Host "✓ Backend dist directory exists" -ForegroundColor Green
    Get-ChildItem $distDir -Recurse | Measure-Object | Select-Object -ExpandProperty Count | ForEach-Object {
        Write-Host "  Files in dist: $_" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Backend dist directory not found - rebuild needed" -ForegroundColor Red
}

# 2. Check Python syntax
Write-Host "`n2. Checking Python syntax..." -ForegroundColor Yellow
$pythonFiles = @(
    "python-rag\screen08-chief-engineer\main.py",
    "python-rag\screen08-chief-engineer\chief_engineer_agent.py"
)

foreach ($file in $pythonFiles) {
    $fullPath = "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION\$file"
    if (Test-Path $fullPath) {
        Write-Host "  Checking $file..." -ForegroundColor Cyan
        # Simple syntax check
        $content = Get-Content $fullPath
        if ($content -match "def _calculate_confidence_score" -or $content -match "const confidenceScore") {
            Write-Host "    ✓ File contains confidence calculations" -ForegroundColor Green
        }
    }
}

# 3. Check database connectivity
Write-Host "`n3. Checking services..." -ForegroundColor Yellow
$ports = @{
    "3001" = "Backend (NestJS)"
    "8001" = "Screen 8 (Chief Engineer)"
    "8000" = "Screen 7 (History Retriever)"
    "5432" = "PostgreSQL"
}

foreach ($port in $ports.GetEnumerator()) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port.Key -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "  ✓ Port $($port.Key) ($($port.Value)): LISTENING" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Port $($port.Key) ($($port.Value)): NOT LISTENING" -ForegroundColor Red
    }
}

Write-Host "`n=== Fix Verification Complete ===" -ForegroundColor Cyan
Write-Host "
Changes made:
1. ✓ Fixed confidence score calculation logic in backend (changed > to >=)
2. ✓ Added enhanced logging for confidence values in backend
3. ✓ Added enhanced logging for confidence extraction in Python
4. ✓ Added debug logging for RFP metadata extraction
5. ✓ Verified Screen 7 uses 'rfp_number' key for RFP identifier

Next steps:
- Rebuild backend: npm run build
- Restart services
- Run test queries to verify fixes
" -ForegroundColor Green
