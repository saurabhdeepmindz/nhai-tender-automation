# NHAI Tender Automation - Service Startup Script (DEMO)
# This script starts: Backend (NestJS), Screen 8 (Python), and other services

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "NHAI Tender Automation - Service Startup Script (DEMO)" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Colors for status
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Start-Service {
    param(
        [string]$ServiceName,
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$Port,
        [int]$WaitTime = 0
    )
    
    Write-Host "[*] Starting $ServiceName on port $Port..." -ForegroundColor $InfoColor
    
    # Create a new process
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "powershell.exe"
    $processInfo.Arguments = "-NoExit -Command `"cd '$WorkingDirectory'; $Command`""
    $processInfo.UseShellExecute = $true
    $processInfo.CreateNoWindow = $false
    $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
    
    try {
        $process = [System.Diagnostics.Process]::Start($processInfo)
        Write-Host "[✓] $ServiceName started (PID: $($process.Id))" -ForegroundColor $SuccessColor
        
        if ($WaitTime -gt 0) {
            Write-Host "    Waiting $WaitTime seconds for initialization..." -ForegroundColor $WarningColor
            Start-Sleep -Seconds $WaitTime
        }
        
        return $process.Id
    }
    catch {
        Write-Host "[✗] Failed to start $ServiceName : $_" -ForegroundColor $ErrorColor
        return $null
    }
}

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host ""
Write-Host "Step 1: Starting NestJS Backend..." -ForegroundColor $InfoColor
$backendDir = Join-Path $scriptPath "backend"
$backendPid = Start-Service -ServiceName "NestJS Backend" -WorkingDirectory $backendDir -Command "npm start" -Port "3001" -WaitTime 8

Write-Host ""
Write-Host "Step 2: Starting Python Screen 8 (Chief Engineer)..." -ForegroundColor $InfoColor
$screen8Dir = Join-Path $scriptPath "python-rag\screen08-chief-engineer"
$screen8Pid = Start-Service -ServiceName "Python Screen 8" -WorkingDirectory $screen8Dir -Command "python main.py" -Port "8001" -WaitTime 5

Write-Host ""
Write-Host "====================================================================" -ForegroundColor $SuccessColor
Write-Host "All services started!" -ForegroundColor $SuccessColor
Write-Host "====================================================================" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor $InfoColor
Write-Host "  Backend API:     http://localhost:3001" -ForegroundColor $InfoColor
Write-Host "  Screen 8 (RAG):   http://localhost:8001" -ForegroundColor $InfoColor
Write-Host "  Screen 7 (Data):  http://localhost:8000" -ForegroundColor $InfoColor
Write-Host ""
Write-Host "Access the UI at:" -ForegroundColor $InfoColor
Write-Host "  http://localhost:3000/admin/prebid-queries" -ForegroundColor $SuccessColor
Write-Host ""
Write-Host "====================================================================" -ForegroundColor $SuccessColor
Write-Host ""

# Keep the script running
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor $WarningColor
while ($true) {
    Start-Sleep -Seconds 1
}
