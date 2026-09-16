@echo off
REM ===========================================================================
REM NHAI Screen 7 (History Retriever) - Quick Start
REM Port: 8000
REM ===========================================================================

title NHAI Screen 7 - History Retriever (Port 8000)
color 0B

echo.
echo ============================================================
echo  NHAI SCREEN 7 - HISTORY RETRIEVER
echo  Port: 8000
echo ============================================================
echo.

REM Navigate to Screen 7 directory
cd /d C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever

REM Check if main.py exists
if not exist "main.py" (
    echo [ERROR] main.py not found in current directory!
    echo Please copy Screen 7 files to:
    echo C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever
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

echo Starting Screen 7 service...
echo.
echo Press Ctrl+C to stop the service
echo.

REM Start the service
python main.py

REM If service stops
echo.
echo Service stopped.
pause
