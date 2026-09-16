@echo off
REM ===========================================================================
REM NHAI Backend (NestJS) - Quick Start
REM Port: 3000
REM ===========================================================================

title NHAI Backend - NestJS API (Port 3000)
color 0A

echo.
echo ============================================================
echo  NHAI BACKEND - NESTJS API SERVER
echo  Port: 3000
echo ============================================================
echo.

REM Navigate to backend directory
cd /d "%~dp0backend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] node_modules not found!
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please create .env file with database configuration
    pause
    exit /b 1
)

echo Starting Backend API Server on port 3000...
echo.
echo API Base URL: http://localhost:3000/api
echo API Documentation: http://localhost:3000/api/docs
echo Admin Vectorization: http://localhost:3000/api/admin/vectorization
echo.
echo Press Ctrl+C to stop the service
echo.
echo ============================================================
echo.

REM Start the backend in development mode
call npm run start:dev

REM If service stops
echo.
echo ============================================================
echo Backend service stopped.
echo ============================================================
pause
