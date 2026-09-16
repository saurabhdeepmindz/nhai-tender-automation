@echo off
REM Start all required services for demo
REM This script starts: Backend (NestJS), Screen 8 (Python), and other services

echo.
echo ====================================================================
echo NHAI Tender Automation - Service Startup Script (DEMO)
echo ====================================================================
echo.

REM Start Backend (NestJS) on port 3001
echo [1/2] Starting NestJS Backend on port 3001...
start "NestJS Backend" cmd /k "cd backend && npm start"
echo.

REM Wait 5 seconds for backend to start
echo Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak

REM Start Screen 8 (Python Chief Engineer) on port 8001
echo [2/2] Starting Python Screen 8 (Chief Engineer) on port 8001...
start "Python Screen 8" cmd /k "cd python-rag/screen08-chief-engineer && python main.py"
echo.

echo ====================================================================
echo Services started:
echo  - Backend: http://localhost:3001 (NestJS)
echo  - Screen 8: http://localhost:8001 (Python)
echo  - Screen 7: http://localhost:8000 (History Retriever)
echo.
echo Demo is ready! Access the UI at: http://localhost:3000/admin/prebid-queries
echo ====================================================================
echo.

pause
