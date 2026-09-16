@echo off
REM ===========================================================================
REM NHAI - Stop All Services
REM This will kill all Node.js and Python processes
REM ===========================================================================

title NHAI - Stopping All Services
color 0C

echo.
echo ============================================================
echo  NHAI TENDER AUTOMATION - STOP ALL SERVICES
echo ============================================================
echo.
echo Stopping all services...
echo.

REM Kill all Node.js processes
echo [1/2] Stopping Node.js processes (Frontend + Backend)...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo [OK] Node.js processes stopped
) else (
    echo [INFO] No Node.js processes were running
)
echo.

REM Kill all Python processes
echo [2/2] Stopping Python processes (Screen 7 + Screen 8)...
taskkill /F /IM python.exe 2>nul
if %errorlevel% == 0 (
    echo [OK] Python processes stopped
) else (
    echo [INFO] No Python processes were running
)
echo.

echo ============================================================
echo  ALL SERVICES STOPPED
echo ============================================================
echo.
pause
