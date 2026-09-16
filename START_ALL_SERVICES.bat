@echo off
REM ===========================================================================
REM NHAI - Start All Services
REM This will open separate command windows for each service
REM ===========================================================================

title NHAI - Starting All Services
color 0F

echo.
echo ============================================================
echo  NHAI TENDER AUTOMATION - START ALL SERVICES
echo ============================================================
echo.
echo Starting services in separate windows...
echo.

REM Start Backend (NestJS) - Port 3000
echo [1/4] Starting Backend (NestJS) on port 3000...
start "NHAI Backend (Port 3000)" cmd /k "%~dp0START_BACKEND.bat"
timeout /t 3 /nobreak >nul

REM Start Frontend (Next.js) - Port 3001
echo [2/4] Starting Frontend (Next.js) on port 3001...
start "NHAI Frontend (Port 3001)" cmd /k "%~dp0START_FRONTEND.bat"
timeout /t 3 /nobreak >nul

REM Start Screen 7 (History Retriever) - Port 8000
echo [3/4] Starting Screen 7 (History Retriever) on port 8000...
start "NHAI Screen 7 (Port 8000)" cmd /k "%~dp0START_SCREEN7_FIXED.bat"
timeout /t 3 /nobreak >nul

REM Start Screen 8 (Chief Engineer) - Port 8001
echo [4/4] Starting Screen 8 (Chief Engineer) on port 8001...
start "NHAI Screen 8 (Port 8001)" cmd /k "%~dp0START_SCREEN8_FIXED.bat"
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo  ALL SERVICES STARTED
echo ============================================================
echo.
echo Services running:
echo  - Backend API       : http://localhost:3000/api
echo  - Backend API Docs  : http://localhost:3000/api/docs
echo  - Frontend          : http://localhost:3001
echo  - Admin Panel       : http://localhost:3001/admin/vectorization-control
echo  - Screen 7 API      : http://localhost:8000
echo  - Screen 7 Docs     : http://localhost:8000/docs
echo  - Screen 8 API      : http://localhost:8001
echo  - Screen 8 Docs     : http://localhost:8001/docs
echo.
echo ============================================================
echo.
echo Press any key to close this window (services will keep running)
pause >nul
