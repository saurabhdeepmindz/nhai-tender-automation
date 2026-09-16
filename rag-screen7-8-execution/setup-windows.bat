@echo off
REM ===========================================================================
REM NHAI Tender Query Automation - Windows Setup & Execution Script
REM Screen 7 (History Retriever) & Screen 8 (Chief Engineer Agent)
REM ===========================================================================

color 0A
title NHAI RAG Services - Setup and Execution

echo.
echo ============================================================
echo  NHAI TENDER QUERY AUTOMATION - RAG SERVICES
echo  Screen 7 (History Retriever) + Screen 8 (Chief Engineer)
echo ============================================================
echo.

REM Check Python installation
echo [1/10] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org
    pause
    exit /b 1
)
python --version
echo [OK] Python found
echo.

REM Check pip
echo [2/10] Checking pip installation...
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip is not installed!
    pause
    exit /b 1
)
echo [OK] pip found
echo.

REM Create directory structure
echo [3/10] Creating directory structure...
if not exist "python-rag" mkdir python-rag
cd python-rag
if not exist "shared" mkdir shared
if not exist "screen07-history-retriever" mkdir screen07-history-retriever
if not exist "screen08-chief-engineer" mkdir screen08-chief-engineer
echo [OK] Directory structure created
echo.

REM Check if files exist
echo [4/10] Checking for required files...
if not exist "shared\embeddings.py" (
    echo [WARNING] shared\embeddings.py not found
    echo Please copy embeddings.py to python-rag\shared\
)
if not exist "shared\llm_utils.py" (
    echo [WARNING] shared\llm_utils.py not found
    echo Please copy llm_utils.py to python-rag\shared\
)
if not exist "screen07-history-retriever\main.py" (
    echo [WARNING] screen07-history-retriever\main.py not found
    echo Please copy Screen 7 files to python-rag\screen07-history-retriever\
)
if not exist "screen08-chief-engineer\main.py" (
    echo [WARNING] screen08-chief-engineer\main.py not found
    echo Please copy Screen 8 files to python-rag\screen08-chief-engineer\
)
echo.

REM Install shared dependencies
echo [5/10] Installing shared dependencies...
cd shared
pip install langchain langchain-openai langchain-community openai sentence-transformers chromadb tiktoken numpy --break-system-packages --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install shared dependencies
    pause
    exit /b 1
)
echo [OK] Shared dependencies installed
cd ..
echo.

REM Install Screen 7 dependencies
echo [6/10] Installing Screen 7 dependencies...
cd screen07-history-retriever
if exist "requirements.txt" (
    pip install -r requirements.txt --break-system-packages --quiet
    if errorlevel 1 (
        echo [ERROR] Failed to install Screen 7 dependencies
        pause
        exit /b 1
    )
    echo [OK] Screen 7 dependencies installed
) else (
    echo [WARNING] requirements.txt not found in screen07-history-retriever
)
cd ..
echo.

REM Install Screen 8 dependencies
echo [7/10] Installing Screen 8 dependencies...
cd screen08-chief-engineer
if exist "requirements.txt" (
    pip install -r requirements.txt --break-system-packages --quiet
    if errorlevel 1 (
        echo [ERROR] Failed to install Screen 8 dependencies
        pause
        exit /b 1
    )
    echo [OK] Screen 8 dependencies installed
) else (
    echo [WARNING] requirements.txt not found in screen08-chief-engineer
)
cd ..
echo.

REM Check .env files
echo [8/10] Checking environment configuration...
cd screen07-history-retriever
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [CREATED] .env file for Screen 7
        echo [ACTION REQUIRED] Please edit screen07-history-retriever\.env and add your OPENAI_API_KEY
    ) else (
        echo [WARNING] .env.example not found for Screen 7
    )
) else (
    echo [OK] .env exists for Screen 7
)
cd ..

cd screen08-chief-engineer
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [CREATED] .env file for Screen 8
        echo [ACTION REQUIRED] Please edit screen08-chief-engineer\.env and add your OPENAI_API_KEY
    ) else (
        echo [WARNING] .env.example not found for Screen 8
    )
) else (
    echo [OK] .env exists for Screen 8
)
cd ..
echo.

REM Verification
echo [9/10] Verifying setup...
cd shared
python -c "from embeddings import create_embedding_generator; print('[OK] embeddings.py verified')" 2>nul
if errorlevel 1 (
    echo [ERROR] embeddings.py verification failed
)
python -c "from llm_utils import create_llm_manager; print('[OK] llm_utils.py verified')" 2>nul
if errorlevel 1 (
    echo [ERROR] llm_utils.py verification failed
)
cd ..
echo.

REM Final instructions
echo [10/10] Setup complete!
echo.
echo ============================================================
echo  NEXT STEPS:
echo ============================================================
echo.
echo 1. Edit environment files and add your OpenAI API key:
echo    - screen07-history-retriever\.env
echo    - screen08-chief-engineer\.env
echo.
echo 2. To start services:
echo.
echo    Screen 7 (Port 8000):
echo    cd screen07-history-retriever
echo    python main.py
echo.
echo    Screen 8 (Port 8001) - Open NEW terminal:
echo    cd screen08-chief-engineer
echo    python main.py
echo.
echo 3. Test services:
echo    curl http://localhost:8000/api/health
echo    curl http://localhost:8001/api/health
echo.
echo ============================================================
echo.

REM Ask if user wants to continue with service startup
echo.
set /p continue="Do you want to start Screen 7 now? (Y/N): "
if /i "%continue%"=="Y" (
    echo.
    echo Starting Screen 7 on port 8000...
    echo Press Ctrl+C to stop the service
    echo.
    cd screen07-history-retriever
    python main.py
) else (
    echo.
    echo Setup completed. Start services manually when ready.
    echo.
)

pause
