@echo off
setlocal EnableDelayedExpansion
title NHAI Start-All Orchestrator

REM ============================================================================
REM start-all.bat - brings up the full NHAI Tender Automation stack.
REM
REM Every step below opens its OWN new Command Prompt window and keeps
REM running there. Output from each is shown live in its window AND appended
REM to a persistent log file under logs\<service-name>.log (see
REM scripts\run-logged.bat). If a service's port is already in use, that step
REM is skipped instead of launching a duplicate.
REM ============================================================================

set "SELF=%~dp0"
for %%I in ("%SELF%..") do set "BASE=%%~fI\"
set "SCRIPTS=%SELF%scripts"
set "PYTHON_EXE=C:\Users\user\AppData\Local\Programs\Python\Python311\python.exe"
set "SUMMARY_LOG=%BASE%logs\startup-summary.log"

if not exist "%BASE%logs" mkdir "%BASE%logs" >nul 2>&1

echo ============================================================
echo  NHAI Tender Automation - Starting All Services
echo ============================================================
echo.

if not exist "%PYTHON_EXE%" (
    echo WARNING: Expected Python interpreter not found at:
    echo   %PYTHON_EXE%
    echo The 3 Python services below will likely fail to start.
    echo Edit PYTHON_EXE at the top of this script if your Python is elsewhere.
    echo.
)

REM ---------------------------------------------------------------
REM Step 1: Docker Desktop
REM ---------------------------------------------------------------
echo [1/7] Docker Desktop...
docker info >nul 2>&1
if not errorlevel 1 (
    echo       Already running - skipping.
) else (
    echo       Starting Docker Desktop and waiting until ready ^(can take a minute^)...
    start "NHAI-DockerDesktop" /wait cmd /c call "%SCRIPTS%\run-logged.bat" "docker-desktop" "%BASE%" "docker desktop start" "no"
    docker info >nul 2>&1
    if errorlevel 1 (
        echo       WARNING: Docker does not look ready yet. Continuing anyway -
        echo       the Redis step below may fail if Docker is not actually up.
    ) else (
        echo       Docker Desktop is ready.
    )
)
echo.

REM ---------------------------------------------------------------
REM Step 2: Redis ^(Docker container^)
REM ---------------------------------------------------------------
echo [2/7] Redis ^(port 6379^)...
netstat -ano | findstr ":6379 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo       Port 6379 already in use - assuming Redis is already running, skipping.
) else (
    start "NHAI-Redis" cmd /k call "%SCRIPTS%\run-logged.bat" "redis" "%BASE%backend" "docker run --name nhai-redis --rm -p 6379:6379 redis" "yes"
    timeout /t 3 /nobreak >nul
)
echo.

REM ---------------------------------------------------------------
REM Step 3: Backend ^(NestJS, port 3001^)
REM ---------------------------------------------------------------
echo [3/7] Backend ^(NestJS, port 3001^)...
netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo       Port 3001 already in use - skipping.
) else (
    start "NHAI-Backend" cmd /k call "%SCRIPTS%\run-logged.bat" "backend" "%BASE%backend" "npm run start:dev" "yes"
    timeout /t 3 /nobreak >nul
)
echo.

REM ---------------------------------------------------------------
REM Step 4: Frontend ^(Next.js, port 3000^)
REM ---------------------------------------------------------------
echo [4/7] Frontend ^(Next.js, port 3000^)...
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo       Port 3000 already in use - skipping.
) else (
    start "NHAI-Frontend" cmd /k call "%SCRIPTS%\run-logged.bat" "frontend" "%BASE%frontend" "npm run dev" "yes"
    timeout /t 3 /nobreak >nul
)
echo.

REM ---------------------------------------------------------------
REM Step 5: Historical Data Service ^(port 8005^)
REM ---------------------------------------------------------------
echo [5/7] Historical Data Service ^(port 8005^)...
netstat -ano | findstr ":8005 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo       Port 8005 already in use - skipping.
) else (
    start "NHAI-HistoricalDataService" cmd /k call "%SCRIPTS%\run-logged.bat" "historical-data-service" "%BASE%python-rag\historical-data-service" "%PYTHON_EXE% main.py" "yes"
    timeout /t 3 /nobreak >nul
)
echo.

REM ---------------------------------------------------------------
REM Step 6: History Retriever ^(Screen 7, port 8000^)
REM ---------------------------------------------------------------
echo [6/7] History Retriever ^(Screen 7, port 8000^)...
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo       Port 8000 already in use - skipping.
) else (
    start "NHAI-HistoryRetriever" cmd /k call "%SCRIPTS%\run-logged.bat" "history-retriever" "%BASE%python-rag\screen07-history-retriever" "%PYTHON_EXE% main.py" "yes"
    timeout /t 3 /nobreak >nul
)
echo.

REM ---------------------------------------------------------------
REM Step 7: Chief Engineer ^(Screen 8, port 8001^)
REM ---------------------------------------------------------------
echo [7/7] Chief Engineer ^(Screen 8, port 8001^)...
netstat -ano | findstr ":8001 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo       Port 8001 already in use - skipping.
) else (
    start "NHAI-ChiefEngineer" cmd /k call "%SCRIPTS%\run-logged.bat" "chief-engineer" "%BASE%python-rag\screen08-chief-engineer" "%PYTHON_EXE% main.py" "yes"
)
echo.

REM ---------------------------------------------------------------
REM Final status + demo URLs - printed to console AND appended to
REM logs\startup-summary.log (never overwritten, same append rule
REM as the per-service logs).
REM ---------------------------------------------------------------
netstat -ano | findstr ":6379 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (set "S_REDIS=RUNNING") else (set "S_REDIS=NOT RUNNING")
netstat -ano | findstr ":3001 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (set "S_BACKEND=RUNNING") else (set "S_BACKEND=NOT RUNNING")
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (set "S_FRONTEND=RUNNING") else (set "S_FRONTEND=NOT RUNNING")
netstat -ano | findstr ":8005 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (set "S_HDS=RUNNING") else (set "S_HDS=NOT RUNNING")
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (set "S_HR=RUNNING") else (set "S_HR=NOT RUNNING")
netstat -ano | findstr ":8001 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (set "S_CE=RUNNING") else (set "S_CE=NOT RUNNING")

(
echo(
echo ============================================================
echo  NHAI Tender Automation - Startup Summary (%DATE% %TIME%^)
echo ============================================================
echo  Redis                    (6379^) : !S_REDIS!
echo  Backend / NestJS         (3001^) : !S_BACKEND!
echo  Frontend / Next.js       (3000^) : !S_FRONTEND!
echo  Historical Data Service  (8005^) : !S_HDS!
echo  History Retriever        (8000^) : !S_HR!
echo  Chief Engineer           (8001^) : !S_CE!
echo(
echo ------------------------------------------------------------
echo  Demo URLs (customer-facing - use these for the demo^)
echo ------------------------------------------------------------
echo  Home                  : http://localhost:3000
echo  Login                 : http://localhost:3000/login
echo  Vendor Dashboard      : http://localhost:3000/vendor/dashboard
echo  Vendor Query Submit   : http://localhost:3000/vendor/query-submission
echo  Vendor Query History  : http://localhost:3000/vendor/query-history
echo  Admin Dashboard       : http://localhost:3000/admin/dashboard
echo  Admin Historical Data : http://localhost:3000/admin/historical-data
echo  Prebid Query Workflow : http://localhost:3000/prebid-query/workflow
echo(
echo  Demo login accounts:
echo    Vendor : vendor@example.com / password123
echo    Admin  : admin@nhai.gov.in / admin123
echo(
echo ------------------------------------------------------------
echo  Service API endpoints (technical checks, not for the demo^)
echo ------------------------------------------------------------
echo  Backend API base          : http://localhost:3001/api
echo  Historical Data Service   : http://localhost:8005/docs
echo  History Retriever docs    : http://localhost:8000/docs
echo  Chief Engineer docs       : http://localhost:8001/docs
echo ============================================================
echo  Logs folder   : %BASE%logs\
echo  Summary log   : %SUMMARY_LOG%
echo  Use stop-all.bat to shut everything down again.
echo ============================================================
) > "%TEMP%\nhai-startup-summary.tmp"
type "%TEMP%\nhai-startup-summary.tmp"
type "%TEMP%\nhai-startup-summary.tmp" >> "%SUMMARY_LOG%"
del "%TEMP%\nhai-startup-summary.tmp" >nul 2>&1

echo.
echo Opening demo-urls.html in your browser...
start "" "%SELF%demo-urls.html"

pause
exit /b 0
