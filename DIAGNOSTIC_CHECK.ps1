# Quick Diagnostic Check for NHAI Demo

Write-Host "NHAI Tender Automation - Diagnostic Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Python Syntax
Write-Host "[1] Checking Python File Syntax..." -ForegroundColor Yellow
$pythonFiles = @(
    "python-rag/screen08-chief-engineer/chief_engineer_agent.py",
    "python-rag/screen08-chief-engineer/main.py"
)

foreach ($file in $pythonFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file found" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file NOT found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "[2] Checking Node Modules..." -ForegroundColor Yellow
if (Test-Path "backend/node_modules") {
    Write-Host "  ✓ Backend node_modules installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend node_modules NOT installed - run 'npm install' in backend folder" -ForegroundColor Red
}

Write-Host ""
Write-Host "[3] Database Status..." -ForegroundColor Yellow
Write-Host "  Note: Make sure PostgreSQL is running on localhost:5432" -ForegroundColor Cyan
Write-Host "  Database: nhai_tender_db" -ForegroundColor Cyan
Write-Host "  User: postgres" -ForegroundColor Cyan

Write-Host ""
Write-Host "[4] Environment Files..." -ForegroundColor Yellow
$envFiles = @(
    ".env",
    "python-rag/screen08-chief-engineer/.env",
    "backend/.env"
)

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file found" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file NOT found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "To start the demo, run:" -ForegroundColor Yellow
Write-Host "  .\START_SERVICES_DEMO.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "This will start:" -ForegroundColor Cyan
Write-Host "  1. NestJS Backend (port 3001)" -ForegroundColor Cyan
Write-Host "  2. Python Screen 8 (port 8001)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then access: http://localhost:3000/admin/prebid-queries" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
