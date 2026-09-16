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
cd /d C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer

REM Check if main.py exists
if not exist "main.py" (
    echo [ERROR] main.py not found in current directory!
    echo Please copy Screen 8 files to:
    echo C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer
    echo.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo.
    if exist ".env.example" (
        echo Creating .env from .env.example...
        copy .env.example .env >nul
        echo [CREATED] .env file
        echo.
        echo [ACTION REQUIRED] Please edit .env and add your OPENAI_API_KEY
        echo Opening .env in Notepad...
        timeout /t 2 >nul
        notepad .env
        echo.
        echo After saving your API key, press any key to start the service...
        pause >nul
    ) else (
        echo [ERROR] .env.example not found!
        pause
        exit /b 1
    )
)

echo Starting Screen 8 service...
echo.
echo NOTE: Screen 8 works best when Screen 7 is also running (port 8000)
echo.
echo Press Ctrl+C to stop the service
echo.

REM Start the service
python main.py

REM If service stops
echo.
echo Service stopped.
pause
