@echo off
REM ===========================================================================
REM NHAI - Start Both RAG Services (Screen 7 + Screen 8)
REM ===========================================================================

title NHAI - Starting Both Services
color 0A

echo.
echo ============================================================
echo  NHAI TENDER QUERY AUTOMATION
echo  Starting Both RAG Services
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org
    echo.
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Navigate to project root
cd /d C:\Projects\NHAI-Tender-Automation\python-rag

REM Check Screen 7
echo Checking Screen 7...
if not exist "screen07-history-retriever\main.py" (
    echo [ERROR] Screen 7 files not found!
    echo Please copy files to: screen07-history-retriever\
    echo.
    pause
    exit /b 1
)
echo [OK] Screen 7 files found
echo.

REM Check Screen 8
echo Checking Screen 8...
if not exist "screen08-chief-engineer\main.py" (
    echo [ERROR] Screen 8 files not found!
    echo Please copy files to: screen08-chief-engineer\
    echo.
    pause
    exit /b 1
)
echo [OK] Screen 8 files found
echo.

REM Start Screen 7 in new window
echo Starting Screen 7 (History Retriever) on port 8000...
start "NHAI Screen 7 - History Retriever (Port 8000)" /D "%CD%\screen07-history-retriever" cmd /k "color 0B && python main.py"

echo Waiting for Screen 7 to initialize...
timeout /t 5 /nobreak >nul
echo.

REM Start Screen 8 in new window
echo Starting Screen 8 (Chief Engineer Agent) on port 8001...
start "NHAI Screen 8 - Chief Engineer Agent (Port 8001)" /D "%CD%\screen08-chief-engineer" cmd /k "color 0E && python main.py"

echo.
echo ============================================================
echo  BOTH SERVICES STARTED!
echo ============================================================
echo.
echo  Screen 7 (History Retriever):    http://localhost:8000
echo  Screen 8 (Chief Engineer Agent): http://localhost:8001
echo.
echo  Two new Command Prompt windows have opened.
echo  Keep them open to keep the services running.
echo.
echo  To stop services: Close the windows or press Ctrl+C
echo.
echo ============================================================
echo.

REM Wait 5 seconds before testing
echo Testing services in 5 seconds...
timeout /t 5 /nobreak >nul

REM Test Screen 7
echo.
echo Testing Screen 7...
curl -s http://localhost:8000/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Screen 7 may not be ready yet. Check the Screen 7 window.
) else (
    echo [OK] Screen 7 is responding
)

REM Test Screen 8
echo.
echo Testing Screen 8...
curl -s http://localhost:8001/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Screen 8 may not be ready yet. Check the Screen 8 window.
) else (
    echo [OK] Screen 8 is responding
)

echo.
echo ============================================================
echo.
echo You can now:
echo 1. Access Swagger UI:
echo    - http://localhost:8000/docs (Screen 7)
echo    - http://localhost:8001/docs (Screen 8)
echo.
echo 2. Check service health:
echo    - curl http://localhost:8000/api/health
echo    - curl http://localhost:8001/api/health
echo.
echo 3. Integrate with NestJS backend
echo.
echo ============================================================
echo.
pause
