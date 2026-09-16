# 🪟 Windows Execution Guide - Python RAG Services

**NHAI Tender Query Automation System**  
**Screen 7 (History Retriever) & Screen 8 (Chief Engineer Agent)**  
**Platform: Windows 10/11**

---

## 📋 **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Shared Utilities Setup](#shared-utilities-setup)
4. [Screen 7 Setup & Execution](#screen-7-setup--execution)
5. [Screen 8 Setup & Execution](#screen-8-setup--execution)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Starting Both Services](#starting-both-services)

---

## ✅ **Prerequisites**

### **1. Check Python Installation**

Open **Command Prompt** (Press `Win + R`, type `cmd`, press Enter):

```cmd
python --version
```

**Expected output:** `Python 3.10.x` or higher

**If Python is not installed:**
1. Download from: https://www.python.org/downloads/
2. **IMPORTANT:** Check "Add Python to PATH" during installation
3. Restart Command Prompt after installation

### **2. Check pip**

```cmd
pip --version
```

**Expected output:** `pip 23.x.x` or higher

### **3. Get OpenAI API Key**

1. Go to: https://platform.openai.com/api-keys
2. Sign up / Login
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **IMPORTANT:** Save this key - you'll need it later!

---

## 📂 **Initial Setup**

### **Step 1: Create Project Folder**

Open **Command Prompt**:

```cmd
cd C:\
mkdir Projects
cd Projects
mkdir NHAI-Tender-Automation
cd NHAI-Tender-Automation
mkdir python-rag
cd python-rag
```

### **Step 2: Create Folder Structure**

```cmd
mkdir shared
mkdir screen07-history-retriever
mkdir screen08-chief-engineer
```

### **Step 3: Verify Structure**

```cmd
dir
```

**You should see:**
```
Directory of C:\Projects\NHAI-Tender-Automation\python-rag

<DIR>          shared
<DIR>          screen07-history-retriever
<DIR>          screen08-chief-engineer
```

---

## 🔗 **Shared Utilities Setup**

### **Step 1: Copy Shared Files**

Copy these 2 files to `C:\Projects\NHAI-Tender-Automation\python-rag\shared\`:

1. `embeddings.py`
2. `llm_utils.py`

**To copy files:**
- Download the files
- Open `C:\Projects\NHAI-Tender-Automation\python-rag\shared\` in File Explorer
- Paste the files there

### **Step 2: Install Shared Dependencies**

```cmd
cd C:\Projects\NHAI-Tender-Automation\python-rag\shared
pip install langchain langchain-openai langchain-community openai sentence-transformers chromadb tiktoken numpy --break-system-packages
```

**Wait for installation to complete** (may take 2-3 minutes)

### **Step 3: Verify Installation**

```cmd
python -c "from embeddings import create_embedding_generator; print('✅ embeddings.py OK')"
python -c "from llm_utils import create_llm_manager; print('✅ llm_utils.py OK')"
```

**Expected output:**
```
✅ embeddings.py OK
✅ llm_utils.py OK
```

**If you get errors**, see [Troubleshooting](#troubleshooting) section.

---

## 📊 **Screen 7 Setup & Execution**

### **Step 1: Copy Screen 7 Files**

Copy these files to `C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever\`:

1. `main.py`
2. `requirements.txt`
3. `.env.example`

### **Step 2: Install Dependencies**

```cmd
cd C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever
pip install -r requirements.txt --break-system-packages
```

**Wait for installation** (may take 2-3 minutes)

### **Step 3: Configure Environment**

**Create .env file:**

```cmd
copy .env.example .env
notepad .env
```

**In Notepad, edit the file:**

```bash
# REQUIRED: Add your OpenAI API key here
OPENAI_API_KEY=sk-your-actual-api-key-here

# Server Configuration (don't change these)
HOST=0.0.0.0
PORT=8000

# Embedding Configuration (don't change)
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small

# Vector Store (don't change)
VECTOR_STORE=chromadb
CHROMA_DB_DIR=./chroma_db
```

**Replace `sk-your-actual-api-key-here` with your actual OpenAI API key!**

**Save and close** (File → Save, then close Notepad)

### **Step 4: Start Screen 7 Service**

```cmd
python main.py
```

**Expected output:**
```
============================================================
Starting NHAI History Retriever Agent (Screen 7)
============================================================
INFO:     Started server process
Initializing services...
✓ Embedding generator initialized
✓ ChromaDB initialized
✅ All services initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**✅ Screen 7 is now running!**

**IMPORTANT: Keep this Command Prompt window open!**

---

## 🤖 **Screen 8 Setup & Execution**

### **Step 1: Open NEW Command Prompt**

**Press `Win + R`, type `cmd`, press Enter**

This will open a second Command Prompt window.

### **Step 2: Copy Screen 8 Files**

Copy these files to `C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer\`:

1. `main.py`
2. `chief_engineer_agent.py`
3. `workflow_manager.py`
4. `requirements.txt`
5. `.env.example`

### **Step 3: Install Dependencies**

**In the NEW Command Prompt:**

```cmd
cd C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer
pip install -r requirements.txt --break-system-packages
```

**Wait for installation** (may take 2-3 minutes)

### **Step 4: Configure Environment**

```cmd
copy .env.example .env
notepad .env
```

**In Notepad, edit the file:**

```bash
# REQUIRED: Add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Server Configuration (don't change)
HOST=0.0.0.0
PORT=8001

# History Retriever URL (don't change)
HISTORY_RETRIEVER_URL=http://localhost:8000

# LLM Configuration (don't change)
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.7
```

**Replace `sk-your-actual-api-key-here` with your actual OpenAI API key!**

**Save and close**

### **Step 5: Start Screen 8 Service**

```cmd
python main.py
```

**Expected output:**
```
============================================================
NHAI Chief Engineer Agent - Screen 8
============================================================
Starting server on 0.0.0.0:8001
============================================================
Initializing services...
✓ Embedding generator initialized
✓ LLM manager initialized
✓ Workflow manager initialized
✓ Chief Engineer Agent initialized
✅ All services initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**✅ Screen 8 is now running!**

**IMPORTANT: Keep this Command Prompt window open too!**

---

## ✅ **Testing**

### **Step 1: Open THIRD Command Prompt**

**Press `Win + R`, type `cmd`, press Enter**

### **Step 2: Test Screen 7**

```cmd
curl http://localhost:8000/api/health
```

**Expected response:**
```json
{"status":"healthy","service":"History Retriever","version":"1.0.0",...}
```

**If `curl` is not recognized:**

Use PowerShell instead:

```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/health -Method GET
```

Or install curl:
```cmd
winget install curl
```

### **Step 3: Test Screen 8**

```cmd
curl http://localhost:8001/api/health
```

**Expected response:**
```json
{"status":"healthy","service":"Chief Engineer Agent","version":"1.0.0",...}
```

### **Step 4: Test Document Upload (Screen 7)**

**Create a test file:**

```cmd
echo Sample RFP document content > test.txt
```

**Upload to Screen 7:**

**Using PowerShell:**

```powershell
$uri = "http://localhost:8000/api/rag/ingest"
$form = @{
    file = Get-Item -Path "test.txt"
    document_id = "test-001"
    document_type = "rfp"
    title = "Test RFP"
}
Invoke-WebRequest -Uri $uri -Method Post -Form $form
```

**Or using curl (if installed):**

```cmd
curl -X POST http://localhost:8000/api/rag/ingest -F "file=@test.txt" -F "document_id=test-001" -F "document_type=rfp" -F "title=Test RFP"
```

### **Step 5: Test Query Processing (Screen 8)**

**Create a test query file:**

```cmd
echo {"query_id":"test-001","query_text":"What is EMD?","top_k":5} > query.json
```

**Process query:**

**PowerShell:**

```powershell
$body = @{
    query_id = "test-001"
    query_text = "What is EMD?"
    use_historical_data = $true
    search_similar_queries = $true
    top_k = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8001/api/chief-engineer/process -Method Post -Body $body -ContentType "application/json"
```

**✅ If all tests pass, your setup is complete!**

---

## 🐛 **Troubleshooting**

### **Issue 1: "Python is not recognized"**

**Problem:** Python not in PATH

**Solution:**

1. Reinstall Python from https://www.python.org/downloads/
2. **Check "Add Python to PATH"** during installation
3. Restart Command Prompt
4. Test: `python --version`

### **Issue 2: "pip is not recognized"**

**Solution:**

```cmd
python -m pip --version
```

If this works, use `python -m pip install` instead of `pip install`

### **Issue 3: "ModuleNotFoundError: No module named 'embeddings'"**

**Problem:** Shared utilities not found

**Solution:**

```cmd
# Check if files exist
dir C:\Projects\NHAI-Tender-Automation\python-rag\shared\embeddings.py
dir C:\Projects\NHAI-Tender-Automation\python-rag\shared\llm_utils.py

# If files don't exist, copy them to the shared folder
```

### **Issue 4: "AuthenticationError: Invalid API key"**

**Problem:** Wrong or missing OpenAI API key

**Solution:**

1. Check your .env file:
```cmd
type .env
```

2. Verify API key:
   - Should start with `sk-`
   - No spaces before or after
   - No quotes around it

3. Get new key: https://platform.openai.com/api-keys

4. Update .env file:
```cmd
notepad .env
```

### **Issue 5: "Port 8000 is already in use"**

**Problem:** Another program using port 8000

**Solution:**

**Find the process:**
```cmd
netstat -ano | findstr :8000
```

**Kill the process** (replace PID with actual number):
```cmd
taskkill /PID <PID> /F
```

**Or change port in .env:**
```cmd
notepad .env
```
Change `PORT=8000` to `PORT=8002`

### **Issue 6: "curl is not recognized"**

**Solution:**

**Option 1: Install curl**
```cmd
winget install curl
```

**Option 2: Use PowerShell** (recommended)
```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/health
```

**Option 3: Use browser**
- Open: http://localhost:8000/api/health
- Open: http://localhost:8001/api/health

### **Issue 7: Services start but don't respond**

**Problem:** Firewall blocking

**Solution:**

1. Open **Windows Defender Firewall**
2. Click **Allow an app through firewall**
3. Find **Python** in the list
4. Check both **Private** and **Public**
5. Click **OK**
6. Restart services

### **Issue 8: "Error loading shared libraries"**

**Solution:**

Reinstall dependencies:

```cmd
cd C:\Projects\NHAI-Tender-Automation\python-rag\shared
pip uninstall -y langchain langchain-openai chromadb
pip install langchain langchain-openai langchain-community openai chromadb --break-system-packages
```

---

## 🚀 **Starting Both Services**

### **Method 1: Manual (2 Command Prompts)**

**Window 1 - Screen 7:**
```cmd
cd C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever
python main.py
```

**Window 2 - Screen 8:**
```cmd
cd C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer
python main.py
```

### **Method 2: Batch File (Automated)**

**Create `start-services.bat`:**

```cmd
notepad start-services.bat
```

**Add this content:**

```batch
@echo off
title NHAI RAG Services
cd C:\Projects\NHAI-Tender-Automation\python-rag

echo Starting Screen 7 (History Retriever)...
start "Screen 7" cmd /k "cd screen07-history-retriever && python main.py"
timeout /t 5

echo Starting Screen 8 (Chief Engineer)...
start "Screen 8" cmd /k "cd screen08-chief-engineer && python main.py"

echo.
echo Both services started!
echo Screen 7: http://localhost:8000
echo Screen 8: http://localhost:8001
echo.
pause
```

**Save and close**

**Run the batch file:**
```cmd
start-services.bat
```

This will open 2 new windows automatically!

### **Method 3: PowerShell Script**

**Create `Start-Services.ps1`:**

```powershell
# Start Screen 7
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever; python main.py"

# Wait 5 seconds
Start-Sleep -Seconds 5

# Start Screen 8
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer; python main.py"

Write-Host "Both services started!"
Write-Host "Screen 7: http://localhost:8000"
Write-Host "Screen 8: http://localhost:8001"
```

**Run:**
```powershell
.\Start-Services.ps1
```

---

## 📊 **Quick Status Check**

**Create `check-services.bat`:**

```batch
@echo off
echo Checking Screen 7...
curl http://localhost:8000/api/health
echo.
echo.
echo Checking Screen 8...
curl http://localhost:8001/api/health
echo.
pause
```

**Run:**
```cmd
check-services.bat
```

---

## 🛑 **Stopping Services**

### **Method 1: Close Windows**

Simply close the Command Prompt windows running the services.

### **Method 2: Ctrl+C**

In each Command Prompt window:
- Press `Ctrl + C`
- Type `Y` when asked
- Press `Enter`

### **Method 3: Kill Processes**

```cmd
taskkill /F /IM python.exe
```

**Warning:** This kills ALL Python processes!

---

## 📁 **Complete Folder Structure**

After setup, your folder should look like this:

```
C:\Projects\NHAI-Tender-Automation\
└── python-rag\
    ├── shared\
    │   ├── embeddings.py
    │   └── llm_utils.py
    │
    ├── screen07-history-retriever\
    │   ├── main.py
    │   ├── requirements.txt
    │   ├── .env
    │   ├── .env.example
    │   └── chroma_db\          (created automatically)
    │
    └── screen08-chief-engineer\
        ├── main.py
        ├── chief_engineer_agent.py
        ├── workflow_manager.py
        ├── requirements.txt
        ├── .env
        ├── .env.example
        └── query_db\           (created automatically)
```

---

## ✅ **Verification Checklist**

- [ ] Python 3.10+ installed
- [ ] pip working
- [ ] OpenAI API key obtained
- [ ] Folder structure created
- [ ] Shared files copied (`embeddings.py`, `llm_utils.py`)
- [ ] Shared dependencies installed
- [ ] Screen 7 files copied
- [ ] Screen 7 dependencies installed
- [ ] Screen 7 .env configured with API key
- [ ] Screen 7 starts successfully on port 8000
- [ ] Screen 7 health check passes
- [ ] Screen 8 files copied
- [ ] Screen 8 dependencies installed
- [ ] Screen 8 .env configured with API key
- [ ] Screen 8 starts successfully on port 8001
- [ ] Screen 8 health check passes
- [ ] Can upload document to Screen 7
- [ ] Can process query through Screen 8

---

## 🎯 **Quick Commands Reference**

```cmd
# Navigate to project
cd C:\Projects\NHAI-Tender-Automation\python-rag

# Start Screen 7
cd screen07-history-retriever
python main.py

# Start Screen 8 (new window)
cd screen08-chief-engineer
python main.py

# Health checks
curl http://localhost:8000/api/health
curl http://localhost:8001/api/health

# View API documentation
# Open in browser:
# http://localhost:8000/docs
# http://localhost:8001/docs
```

---

## 💡 **Pro Tips**

1. **Use Windows Terminal** (better than Command Prompt)
   - Download from Microsoft Store
   - Supports tabs
   - Better colors and fonts

2. **Pin to Taskbar**
   - Create shortcut to `start-services.bat`
   - Pin to taskbar for quick access

3. **Auto-start on Login**
   - Press `Win + R`
   - Type `shell:startup`
   - Copy `start-services.bat` here

4. **Monitor Logs**
   - Services output to console
   - Can redirect to file: `python main.py > output.log 2>&1`

---

## 📞 **Getting Help**

If you encounter issues:

1. Check the error message in Command Prompt
2. Verify .env file configuration
3. Ensure both services are running
4. Check Windows Firewall settings
5. Restart Command Prompt after installing Python/pip
6. Verify API key is correct

---

## 🎉 **Success!**

When both services are running, you should have:

- ✅ **Screen 7** on http://localhost:8000
- ✅ **Screen 8** on http://localhost:8001
- ✅ Both services responding to health checks
- ✅ Ready to integrate with NestJS backend

---

**Version:** 1.0.0 (Windows)  
**Platform:** Windows 10/11  
**Python:** 3.10+  
**Status:** Production Ready ✅
