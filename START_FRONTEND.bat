@echo off
REM ===========================================================================
REM NHAI Frontend (Next.js) - Quick Start
REM Port: 3001 (by default Next.js uses 3000, but backend uses 3000)
REM ===========================================================================

title NHAI Frontend - Next.js (Port 3001)
color 0D

echo.
echo ============================================================
echo  NHAI FRONTEND - NEXT.JS APPLICATION
echo  Port: 3001
echo ============================================================
echo.

REM Navigate to frontend directory
cd /d "%~dp0frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] node_modules not found!
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo [WARNING] .env.local not found, creating from template...
    echo NEXT_PUBLIC_API_URL=http://localhost:3000 > .env.local
    echo NEXT_PUBLIC_REFRESH_INTERVAL=30000 >> .env.local
    echo [OK] .env.local created
    echo.
)

echo Starting Frontend Application on port 3001...
echo.
echo Frontend URL: http://localhost:3001
echo Admin Panel: http://localhost:3001/admin/vectorization-control
echo.
echo Note: Make sure Backend is running on port 3000
echo.
echo Press Ctrl+C to stop the service
echo.
echo ============================================================
echo.

REM Start Next.js on port 3001 (backend uses 3000)
call npm run dev -- -p 3001

REM If service stops
echo.
echo ============================================================
echo Frontend service stopped.
echo ============================================================
pause
