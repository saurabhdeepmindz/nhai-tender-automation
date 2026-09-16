@echo off
REM ===========================================================================
REM NHAI Screen 8 (Chief Engineer Agent) - Quick Start
REM Port: 8001
REM ===========================================================================

title NHAI Screen 8 - Chief Engineer Agent (Port 8001)
color 0E

echo.
echo ============================================================
echo  NHAI SCREEN 8 - CHIEF ENGINEER AGENT
echo  Port: 8001
echo ============================================================
echo.

REM Navigate to Screen 8 directory
cd /d "%~dp0python-rag\screen08-chief-engineer"

REM Check if main.py exists
if not exist "main.py" (
    echo [ERROR] main.py not found in current directory!
    echo Current directory: %CD%
    echo.
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call "%~dp0nhai-venv\Scripts\activate.bat"

if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment!
    echo Please ensure nhai-venv exists
    pause
    exit /b 1
)

echo [OK] Virtual environment activated
echo.

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found, but continuing...
    echo.
)

echo Starting Screen 8 service on port 8001...
echo NOTE: Screen 8 works best when Screen 7 is also running (port 8000)
echo.
echo Press Ctrl+C to stop the service
echo.
echo ============================================================
echo.

REM Start the service
python main.py

REM If service stops
echo.
echo ============================================================
echo Service stopped.
echo ============================================================
pause
