@echo off
REM ============================================================================
REM Synthetic Data Cleanup Script for Screen 8 API Testing (Windows CMD)
REM ============================================================================
REM WARNING: This script will DELETE all test data created with synthetic IDs!
REM Usage:
REM   cleanup_synthetic_data.cmd
REM ============================================================================

setlocal enabledelayedexpansion

REM Database connection parameters
set DB_HOST=localhost
set DB_USER=postgres
set DB_NAME=nhai_tender_db
set DB_PORT=5432

REM Color setup (use cls to clear and mode to set colors)
cls
color 0B

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Screen 8 API Testing - Synthetic Data Cleanup            ║
echo ║           (Windows Command Prompt)                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if psql is available
echo 🔗 Checking for psql...
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ Error: psql command not found
    echo Please ensure PostgreSQL is installed and added to PATH
    echo.
    pause
    exit /b 1
)

echo ✅ psql found
echo.

REM Test database connection
echo 🔗 Testing database connection...
echo SELECT 1; | psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -p %DB_PORT% -t -q >nul 2>nul

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo ❌ Cannot connect to database
    echo Please verify your database connection parameters:
    echo   Host: %DB_HOST%
    echo   User: %DB_USER%
    echo   Database: %DB_NAME%
    echo   Port: %DB_PORT%
    echo.
    pause
    exit /b 1
)

color 0A
echo ✅ Database connection successful
color 0B
echo.

REM Count synthetic data records
echo 🔍 Counting synthetic data records...

set COUNT=0
for /f "tokens=*" %%A in ('echo SELECT COUNT(*) FROM queries WHERE query_number LIKE 'QRY-SYNC-%%'; ^| psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -p %DB_PORT% -t -q 2^>nul') do (
    if "%%A"=="" (
        set COUNT=0
    ) else (
        set COUNT=%%A
    )
)

REM Trim whitespace from COUNT
for /f "tokens=*" %%A in ("%COUNT%") do set COUNT=%%A

if "%COUNT%"=="" set COUNT=0

echo Found %COUNT% synthetic query records
echo.

REM Check if there's anything to delete
if %COUNT% EQU 0 (
    color 0A
    echo ✅ No synthetic data found. Nothing to clean up.
    color 0B
    echo.
    pause
    exit /b 0
)

REM Warning and confirmation
color 0E
echo ⚠️  WARNING: About to DELETE %COUNT% synthetic test data records!
echo.
set /p confirm="Are you sure you want to DELETE all records? (Type 'yes' to confirm): "
color 0B

if /i not "%confirm%"=="yes" (
    color 0C
    echo ❌ Cleanup cancelled
    color 0B
    echo.
    pause
    exit /b 1
)

echo.
echo 🧹 Cleaning up synthetic data...

REM Create cleanup SQL script
set CLEANUP_SQL=%TEMP%\cleanup_synthetic_%RANDOM%.sql

(
    echo DELETE FROM workflow_executions WHERE query_id IN ^(SELECT query_id FROM queries WHERE query_number LIKE 'QRY-SYNC-%%'^);
    echo DELETE FROM query_history WHERE query_id IN ^(SELECT query_id FROM queries WHERE query_number LIKE 'QRY-SYNC-%%'^);
    echo DELETE FROM admin_responses WHERE query_id IN ^(SELECT query_id FROM queries WHERE query_number LIKE 'QRY-SYNC-%%'^);
    echo DELETE FROM queries WHERE query_number LIKE 'QRY-SYNC-%%';
    echo SELECT 'Cleanup complete' as status;
) > "%CLEANUP_SQL%"

REM Execute cleanup
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -p %DB_PORT% -f "%CLEANUP_SQL%" >nul 2>nul

if %ERRORLEVEL% EQU 0 (
    color 0A
    echo ✅ Synthetic data cleanup complete!
    color 0B
    echo.
    echo 🔍 Verifying cleanup...
    
    set REMAINING=0
    for /f "tokens=*" %%A in ('echo SELECT COUNT(*) FROM queries WHERE query_number LIKE 'QRY-SYNC-%%'; ^| psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -p %DB_PORT% -t -q 2^>nul') do (
        if "%%A"=="" (
            set REMAINING=0
        ) else (
            set REMAINING=%%A
        )
    )
    
    REM Trim whitespace
    for /f "tokens=*" %%A in ("%REMAINING%") do set REMAINING=%%A
    
    color 0A
    echo ✅ Remaining synthetic queries: %REMAINING%
    color 0B
    echo.
    echo ✨ Cleanup process complete!
    color 0B
) else (
    color 0C
    echo ❌ Cleanup failed
    color 0B
    echo.
)

REM Cleanup temp file
del "%CLEANUP_SQL%" 2>nul

echo.
pause
