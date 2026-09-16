# 🐍 Python RAG Services - Complete Setup Guide

**NHAI Tender Query Automation System**  
**Python Environment Setup & Installation**

---

## 📦 **Requirements Files Available**

You have **4 requirements files** to choose from:

1. **requirements.txt** (RECOMMENDED)
   - Complete installation with all dependencies
   - ~50 packages, ~2.5 GB download
   - Includes testing, development, and optional features

2. **requirements-minimal.txt**
   - Essential dependencies only
   - ~22 packages, ~800 MB download
   - Perfect for production, Docker, or limited resources

3. **requirements-screen7.txt**
   - Screen 7 (History Retriever) specific
   - Use if deploying Screen 7 separately

4. **requirements-screen8.txt**
   - Screen 8 (Chief Engineer) specific
   - Use if deploying Screen 8 separately

**For most users:** Use `requirements.txt` for complete installation.

---

## 🚀 **Quick Start (5 Minutes)**

### **Option A: Windows (Recommended)**

```bash
# 1. Check Python version
python --version
# Should be 3.10 or higher

# 2. Navigate to project
cd C:\Projects\NHAI-Tender-Automation\python-rag

# 3. Install dependencies
pip install -r requirements.txt --break-system-packages

# 4. Verify installation
python -c "import fastapi, langchain, chromadb; print('✓ All imports successful')"

# 5. Install Ollama (for local LLM)
# Download from: https://ollama.ai/download
# Then run: ollama pull nomic-embed-text
#           ollama pull llama3
```

### **Option B: Linux/macOS**

```bash
# 1. Check Python version
python3 --version

# 2. Navigate to project
cd ~/NHAI-Tender-Automation/python-rag

# 3. Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Verify installation
python -c "import fastapi, langchain, chromadb; print('✓ All imports successful')"

# 6. Install Ollama (Linux)
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull nomic-embed-text
ollama pull llama3
```

---

## 📋 **Prerequisites**

### **System Requirements:**

- **Python:** 3.10 or higher (3.11 recommended)
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** 5GB free space (for models and dependencies)
- **OS:** Windows 10/11, Ubuntu 20.04+, macOS 12+

### **Check Python Version:**

```bash
# Windows
python --version

# Linux/Mac
python3 --version
```

**If Python is not 3.10+:**
- Windows: Download from https://www.python.org/downloads/
- Linux: `sudo apt install python3.11`
- macOS: `brew install python@3.11`

---

## 🔧 **Installation Methods**

### **Method 1: Standard Installation (All Platforms)**

```bash
# Navigate to python-rag folder
cd NHAI-Tender-Automation/python-rag

# Install all dependencies
pip install -r requirements.txt --break-system-packages

# This installs ~50 packages including:
# - FastAPI & Uvicorn
# - LangChain & LangGraph
# - ChromaDB
# - OpenAI & Ollama clients
# - Document processing libraries
# - And more...
```

**Estimated time:** 5-10 minutes  
**Download size:** ~2.5 GB  
**Installed size:** ~5 GB

---

### **Method 2: Minimal Installation (Production)**

```bash
# Install only essential dependencies
pip install -r requirements-minimal.txt --break-system-packages

# This installs ~22 packages
# Perfect for:
# - Production servers
# - Docker containers
# - Limited resources
```

**Estimated time:** 2-3 minutes  
**Download size:** ~800 MB  
**Installed size:** ~1.5 GB

---

### **Method 3: Virtual Environment (Recommended for Development)**

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Deactivate when done
deactivate
```

**Benefits:**
- Isolated environment
- No conflicts with other projects
- Easy to delete and recreate
- Recommended for development

---

### **Method 4: Separate Services**

**If deploying Screen 7 only:**
```bash
pip install -r requirements-screen7.txt --break-system-packages
```

**If deploying Screen 8 only:**
```bash
pip install -r requirements-screen8.txt --break-system-packages
```

---

## 🔍 **Verification**

### **Step 1: Verify Python Packages**

```bash
# Check if all packages installed
pip list

# Should see:
# fastapi, langchain, chromadb, openai, ollama, etc.
```

### **Step 2: Test Imports**

```bash
# Test critical imports
python -c "import fastapi; print('✓ FastAPI OK')"
python -c "import langchain; print('✓ LangChain OK')"
python -c "import chromadb; print('✓ ChromaDB OK')"
python -c "import openai; print('✓ OpenAI OK')"
python -c "import ollama; print('✓ Ollama OK')"
```

**All should print "OK" without errors.**

### **Step 3: Start Services**

**Screen 7:**
```bash
cd screen07-history-retriever
python main.py
```

**Expected output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Screen 8:**
```bash
cd screen08-chief-engineer
python main.py
```

**Expected output:**
```
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### **Step 4: Health Checks**

```bash
# Screen 7
curl http://localhost:8000/api/health

# Screen 8
curl http://localhost:8001/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "Screen 7/8",
  "version": "1.0.0",
  "embedding_provider": "ollama"
}
```

---

## 🐛 **Troubleshooting**

### **Issue 1: Python not found**

**Error:**
```
'python' is not recognized as an internal or external command
```

**Solution:**
```bash
# Windows: Add Python to PATH during installation
# Or use full path:
C:\Python311\python.exe -m pip install -r requirements.txt

# Linux/Mac: Use python3
python3 -m pip install -r requirements.txt
```

---

### **Issue 2: Permission denied**

**Error:**
```
ERROR: Could not install packages due to an OSError: [Errno 13] Permission denied
```

**Solution:**
```bash
# Windows: Use --break-system-packages
pip install -r requirements.txt --break-system-packages

# Linux/Mac: Don't use sudo, use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### **Issue 3: Package conflicts**

**Error:**
```
ERROR: Cannot install X because these packages have conflicting dependencies
```

**Solution:**
```bash
# Clear pip cache
pip cache purge

# Upgrade pip
python -m pip install --upgrade pip

# Retry installation
pip install -r requirements.txt --break-system-packages

# If still fails, use minimal requirements
pip install -r requirements-minimal.txt --break-system-packages
```

---

### **Issue 4: ChromaDB errors**

**Error:**
```
chromadb.errors.InvalidDimensionException
```

**Solution:**
```bash
# Delete old ChromaDB database
rm -rf chroma_db/  # Linux/Mac
rmdir /s chroma_db  # Windows

# Restart services
```

---

### **Issue 5: Torch/PyTorch installation fails**

**Error:**
```
ERROR: Could not find a version that satisfies the requirement torch
```

**Solution:**
```bash
# Install PyTorch separately
# CPU only (smaller, faster install):
pip install torch --index-url https://download.pytorch.org/whl/cpu

# GPU support (requires CUDA):
pip install torch --index-url https://download.pytorch.org/whl/cu121

# Then install other requirements
pip install -r requirements.txt --break-system-packages
```

---

### **Issue 6: Import errors**

**Error:**
```
ModuleNotFoundError: No module named 'langchain'
```

**Solution:**
```bash
# Verify package is installed
pip show langchain

# If not installed
pip install langchain==0.1.6

# If using virtual environment, make sure it's activated
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows
```

---

### **Issue 7: Ollama not found**

**Error:**
```
ConnectionError: Cannot connect to Ollama at localhost:11434
```

**Solution:**
```bash
# Install Ollama
# Windows: https://ollama.ai/download
# Linux: curl -fsSL https://ollama.ai/install.sh | sh
# macOS: brew install ollama

# Start Ollama service
ollama serve

# Pull models
ollama pull nomic-embed-text
ollama pull llama3

# Verify
ollama list
```

---

## 📊 **Dependency Tree**

### **Core Dependencies:**

```
fastapi (Web Framework)
  └── uvicorn (ASGI Server)
  └── pydantic (Validation)

langchain (LLM Framework)
  ├── langchain-core
  ├── langchain-community
  ├── langchain-openai
  └── langgraph (Workflow)

chromadb (Vector Database)
  └── sentence-transformers (Embeddings)

LLM Providers:
  ├── openai (Cloud)
  └── ollama (Local)

Document Processing:
  ├── PyPDF2 (PDF)
  ├── python-docx (Word)
  ├── openpyxl (Excel)
  └── pandas (CSV)
```

---

## 🔄 **Upgrade Guide**

### **Upgrade All Packages:**

```bash
pip install -r requirements.txt --upgrade
```

### **Upgrade Specific Package:**

```bash
pip install --upgrade langchain
```

### **Check Outdated Packages:**

```bash
pip list --outdated
```

---

## 🐳 **Docker Installation (Alternative)**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements-minimal.txt .
RUN pip install -r requirements-minimal.txt --no-cache-dir

COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
```

**Build & Run:**
```bash
docker build -t nhai-screen7 .
docker run -p 8000:8000 nhai-screen7
```

---

## 📦 **Package Summary**

### **Full Installation (requirements.txt):**

- **Total Packages:** ~50
- **Download Size:** ~2.5 GB
- **Installed Size:** ~5 GB
- **Installation Time:** 5-10 minutes

### **Minimal Installation (requirements-minimal.txt):**

- **Total Packages:** ~22
- **Download Size:** ~800 MB
- **Installed Size:** ~1.5 GB
- **Installation Time:** 2-3 minutes

---

## ✅ **Post-Installation Checklist**

- [ ] Python 3.10+ installed
- [ ] All packages from requirements.txt installed
- [ ] No import errors when testing
- [ ] Ollama installed and running
- [ ] Models downloaded (nomic-embed-text, llama3)
- [ ] Screen 7 starts without errors (port 8000)
- [ ] Screen 8 starts without errors (port 8001)
- [ ] Health checks pass for both services
- [ ] Environment variables configured (.env files)

---

## 🎯 **Next Steps**

After successful installation:

1. **Configure Environment:**
   - Copy `.env.example` to `.env` in each service folder
   - Set `EMBEDDING_PROVIDER=ollama` or `openai`
   - Add `OPENAI_API_KEY` if using OpenAI

2. **Start Services:**
   - Run Screen 7: `cd screen07-history-retriever && python main.py`
   - Run Screen 8: `cd screen08-chief-engineer && python main.py`

3. **Test Integration:**
   - Upload test documents to Screen 7
   - Submit test queries to Screen 8
   - Verify AI responses

4. **Connect to Backend:**
   - Start NestJS backend: `cd backend && npm run start:dev`
   - Backend will call Python services via HTTP

---

## 📚 **Additional Resources**

**Package Documentation:**
- FastAPI: https://fastapi.tiangolo.com
- LangChain: https://python.langchain.com
- ChromaDB: https://docs.trychroma.com
- Ollama: https://ollama.ai/docs

**Python Resources:**
- Virtual Environments: https://docs.python.org/3/library/venv.html
- pip Documentation: https://pip.pypa.io

---

## 🆘 **Support**

**If you encounter issues:**

1. Check the troubleshooting section above
2. Review service logs for error messages
3. Verify all prerequisites are met
4. Test with minimal requirements first
5. Check GitHub issues for similar problems

**Common log locations:**
- Screen 7: `screen07-history-retriever/logs/`
- Screen 8: `screen08-chief-engineer/logs/`

---

**Installation Status:** Complete ✅  
**Requirements Files:** 4 files provided  
**Total Packages:** 50 (full) / 22 (minimal)  
**Installation Time:** 5-10 minutes  
**Python Version:** 3.10+
