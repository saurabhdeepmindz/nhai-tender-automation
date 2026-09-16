@echo off
setlocal EnableDelayedExpansion
title NHAI Stop-All

REM ============================================================================
REM stop-all.bat - shuts down everything start-all.bat brought up.
REM
REM Docker Desktop itself is left running (only the nhai-redis container is
REM stopped) - shutting down Docker Desktop entirely could affect other,
REM unrelated Docker usage on this machine. If you do want to also quit
REM Docker Desktop, uncomment the "docker desktop stop" line near the bottom.
REM ============================================================================

echo ============================================================
echo  NHAI Tender Automation - Stopping All Services
echo ============================================================
echo.

echo Stopping Redis container (nhai-redis)...
docker stop nhai-redis >nul 2>&1
docker rm nhai-redis >nul 2>&1
echo.

call :kill_port 6379 "Redis"
call :kill_port 3001 "Backend"
call :kill_port 3000 "Frontend"
call :kill_port 8005 "Historical Data Service"
call :kill_port 8000 "History Retriever"
call :kill_port 8001 "Chief Engineer"

echo.
echo Closing any remaining NHAI service windows...
for %%T in (NHAI-Redis NHAI-Backend NHAI-Frontend NHAI-HistoricalDataService NHAI-HistoryRetriever NHAI-ChiefEngineer NHAI-DockerDesktop) do (
    taskkill /FI "WINDOWTITLE eq %%T*" /T /F >nul 2>&1
)

REM Uncomment the next line if you also want stop-all.bat to quit Docker Desktop:
REM docker desktop stop

echo.
echo ============================================================
echo  Done. Docker Desktop itself was left running.
echo ============================================================
pause
exit /b 0

REM ---------------------------------------------------------------
REM :kill_port <port> <friendly name>
REM ---------------------------------------------------------------
:kill_port
set "PORT=%~1"
set "NAME=%~2"
set "FOUND=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo Stopping %NAME% ^(PID %%P on port %PORT%^)...
    taskkill /PID %%P /T /F >nul 2>&1
    set "FOUND=1"
)
if "!FOUND!"=="0" echo %NAME% ^(port %PORT%^) was not running.
goto :eof
