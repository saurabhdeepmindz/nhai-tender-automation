@echo off
REM ============================================================================
REM NHAI Tender Query Automation System
REM Python RAG Services - Automated Installation Script (Windows)
REM ============================================================================
REM 
REM This script automates the installation of Python dependencies
REM for both Screen 7 and Screen 8
REM
REM Usage: Double-click this file or run: install-python-deps.bat
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo NHAI Python RAG Services - Automated Installation
echo ============================================================================
echo.

REM Check if Python is installed
echo [1/7] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.10 or higher from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

REM Get Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python version: %PYTHON_VERSION%

REM Check Python version (should be 3.10+)
for /f "tokens=1,2 delims=." %%a in ("%PYTHON_VERSION%") do (
    set MAJOR=%%a
    set MINOR=%%b
)
if %MAJOR% LSS 3 (
    echo [ERROR] Python version must be 3.10 or higher
    echo Current version: %PYTHON_VERSION%
    pause
    exit /b 1
)
if %MAJOR% EQU 3 if %MINOR% LSS 10 (
    echo [ERROR] Python version must be 3.10 or higher
    echo Current version: %PYTHON_VERSION%
    pause
    exit /b 1
)

echo.
echo [2/7] Upgrading pip...
python -m pip install --upgrade pip --break-system-packages
if %errorlevel% neq 0 (
    echo [WARNING] Failed to upgrade pip, continuing anyway...
)

echo.
echo [3/7] Installing Python dependencies...
echo This may take 5-10 minutes depending on your internet connection...
echo.

REM Check if requirements.txt exists
if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found in current directory
    echo Please run this script from the python-rag folder
    pause
    exit /b 1
)

REM Install dependencies
echo Installing packages from requirements.txt...
python -m pip install -r requirements.txt --break-system-packages
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies
    echo.
    echo Trying minimal installation instead...
    if exist "requirements-minimal.txt" (
        python -m pip install -r requirements-minimal.txt --break-system-packages
        if %errorlevel% neq 0 (
            echo [ERROR] Minimal installation also failed
            echo Please check the error messages above
            pause
            exit /b 1
        )
        echo [OK] Minimal installation completed successfully
    ) else (
        echo [ERROR] requirements-minimal.txt not found
        pause
        exit /b 1
    )
) else (
    echo [OK] All dependencies installed successfully
)

echo.
echo [4/7] Verifying installation...

REM Test critical imports
echo Testing FastAPI...
python -c "import fastapi; print('[OK] FastAPI')" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] FastAPI import failed
    set IMPORT_FAILED=1
)

echo Testing LangChain...
python -c "import langchain; print('[OK] LangChain')" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] LangChain import failed
    set IMPORT_FAILED=1
)

echo Testing ChromaDB...
python -c "import chromadb; print('[OK] ChromaDB')" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] ChromaDB import failed
    set IMPORT_FAILED=1
)

echo Testing OpenAI...
python -c "import openai; print('[OK] OpenAI')" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] OpenAI import failed
    set IMPORT_FAILED=1
)

echo Testing Ollama...
python -c "import ollama; print('[OK] Ollama')" 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Ollama import failed
    set IMPORT_FAILED=1
)

if defined IMPORT_FAILED (
    echo.
    echo [WARNING] Some imports failed. Please check the errors above.
    echo You may need to reinstall specific packages.
) else (
    echo.
    echo [OK] All critical packages verified successfully!
)

echo.
echo [5/7] Checking Ollama installation...
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Ollama is not installed
    echo.
    echo To use local LLM inference, install Ollama:
    echo 1. Download from: https://ollama.ai/download
    echo 2. Run: ollama pull nomic-embed-text
    echo 3. Run: ollama pull llama3
    echo.
) else (
    echo [OK] Ollama is installed
    
    REM Check if models are downloaded
    echo Checking Ollama models...
    ollama list | findstr "nomic-embed-text" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [INFO] nomic-embed-text model not found
        echo Downloading nomic-embed-text model...
        ollama pull nomic-embed-text
    ) else (
        echo [OK] nomic-embed-text model available
    )
    
    ollama list | findstr "llama3" >nul 2>&1
    if %errorlevel% neq 0 (
        echo [INFO] llama3 model not found
        echo Downloading llama3 model (this may take a few minutes)...
        ollama pull llama3
    ) else (
        echo [OK] llama3 model available
    )
)

echo.
echo [6/7] Creating .env files if they don't exist...

REM Screen 7
if exist "screen07-history-retriever\" (
    if not exist "screen07-history-retriever\.env" (
        if exist "screen07-history-retriever\.env.example" (
            copy "screen07-history-retriever\.env.example" "screen07-history-retriever\.env" >nul
            echo [OK] Created screen07-history-retriever/.env
        )
    ) else (
        echo [OK] screen07-history-retriever/.env already exists
    )
) else (
    echo [WARNING] screen07-history-retriever folder not found
)

REM Screen 8
if exist "screen08-chief-engineer\" (
    if not exist "screen08-chief-engineer\.env" (
        if exist "screen08-chief-engineer\.env.example" (
            copy "screen08-chief-engineer\.env.example" "screen08-chief-engineer\.env" >nul
            echo [OK] Created screen08-chief-engineer/.env
        )
    ) else (
        echo [OK] screen08-chief-engineer/.env already exists
    )
) else (
    echo [WARNING] screen08-chief-engineer folder not found
)

echo.
echo [7/7] Installation Summary
echo ============================================================================

REM List installed packages
echo Installed packages:
python -m pip list | findstr /C:"fastapi" /C:"langchain" /C:"chromadb" /C:"openai" /C:"ollama"

echo.
echo ============================================================================
echo Installation Complete!
echo ============================================================================
echo.
echo Next Steps:
echo.
echo 1. Configure .env files:
echo    - screen07-history-retriever/.env
echo    - screen08-chief-engineer/.env
echo.
echo 2. Start Screen 7:
echo    cd screen07-history-retriever
echo    python main.py
echo.
echo 3. Start Screen 8:
echo    cd screen08-chief-engineer
echo    python main.py
echo.
echo 4. Test services:
echo    curl http://localhost:8000/api/health
echo    curl http://localhost:8001/api/health
echo.
echo For detailed instructions, see PYTHON_SETUP_GUIDE.md
echo.
echo ============================================================================

pause
