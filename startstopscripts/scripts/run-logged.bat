@echo off
REM ============================================================================
REM run-logged.bat - shared helper used by start-all.bat
REM
REM Runs ONE command inside the current window, showing its output live in
REM the console AND appending it to a persistent per-service log file
REM (logs\<service-name>.log). The log file is never overwritten - every run
REM is appended, with a timestamped separator line marking where it starts.
REM
REM Usage:
REM   run-logged.bat "<ServiceName>" "<WorkingDirectory>" "<CommandToRun>" "<PauseOnExit: yes|no>"
REM ============================================================================

set "SERVICE_NAME=%~1"
set "WORK_DIR=%~2"
set "RUN_CMD=%~3"
set "PAUSE_ON_EXIT=%~4"
for %%I in ("%~dp0..\..") do set "LOG_DIR=%%~fI\logs"
set "LOG_FILE=%LOG_DIR%\%SERVICE_NAME%.log"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1

if not exist "%WORK_DIR%" (
    echo [%SERVICE_NAME%] ERROR: working directory not found:
    echo   %WORK_DIR%
    echo.
    pause
    exit /b 1
)

cd /d "%WORK_DIR%"

echo ============================================================
echo  %SERVICE_NAME%
echo ============================================================
echo  Working directory : %WORK_DIR%
echo  Command           : %RUN_CMD%
echo  Log file          : %LOG_FILE%
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; $sep = '=' * 70; Add-Content -Encoding utf8 -Path '%LOG_FILE%' -Value ([Environment]::NewLine + $sep + [Environment]::NewLine + '[' + $ts + '] Starting: %SERVICE_NAME%  (cwd: %WORK_DIR%)' + [Environment]::NewLine + 'Command: %RUN_CMD%' + [Environment]::NewLine + $sep); & cmd /c 'chcp 65001>nul & %RUN_CMD% 2>&1' | ForEach-Object { Write-Host $_; Add-Content -Encoding utf8 -Path '%LOG_FILE%' -Value $_ }"

set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo [%SERVICE_NAME%] Process exited (exit code %EXIT_CODE%).

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; Add-Content -Encoding utf8 -Path '%LOG_FILE%' -Value ('[' + $ts + '] %SERVICE_NAME% exited with code %EXIT_CODE%')"

if /i "%PAUSE_ON_EXIT%"=="yes" (
    echo.
    echo Press any key to close this window...
    pause >nul
)
