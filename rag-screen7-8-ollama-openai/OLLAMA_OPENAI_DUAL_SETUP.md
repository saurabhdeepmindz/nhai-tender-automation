# 🔄 Dual Setup Guide - Ollama + OpenAI (Windows)

**NHAI Tender Query Automation - Screen 7 & Screen 8**  
**Switch Between Ollama (Free) and OpenAI (Paid) Anytime!**

---

## 🎯 **Overview**

This setup allows you to:
- ✅ Use **Ollama** (free, local) by default
- ✅ Switch to **OpenAI** (paid, cloud) anytime
- ✅ No code changes needed - just edit .env file
- ✅ Keep both configurations ready

---

## 📊 **Comparison**

| Feature | Ollama (Local) | OpenAI (Cloud) |
|---------|---------------|----------------|
| **Cost** | Free | ~$0.002 per query |
| **Privacy** | 100% Local | Data sent to OpenAI |
| **Speed** | Fast (local) | Depends on internet |
| **Quality** | Good | Excellent |
| **Setup** | Complex | Simple |
| **Requirements** | 8GB+ RAM | Internet + API Key |

---

## 🚀 **Quick Start (Ollama Setup)**

### **Step 1: Install Ollama**

1. **Download:** https://ollama.ai/download
2. **Run installer:** `OllamaSetup.exe`
3. **Verify installation:**
   ```cmd
   ollama --version
   ```

### **Step 2: Download AI Models**

```cmd
REM Embedding model (Required - 274MB)
ollama pull nomic-embed-text

REM LLM model (Choose one)
ollama pull llama3        (Recommended - 4.7GB)
REM OR
ollama pull mistral       (Alternative - 4.1GB)
```

**Wait for downloads to complete** (may take 10-20 minutes depending on internet speed)

### **Step 3: Verify Ollama is Running**

```cmd
ollama list
```

**Expected output:**
```
NAME                    ID              SIZE
nomic-embed-text:latest abc123...       274 MB
llama3:latest          def456...       4.7 GB
```

---

## ⚙️ **Configuration Files**

### **Screen 7 - .env Configuration**

**File:** `C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever\.env`

```bash
# ===========================================================================
# NHAI Screen 7 (History Retriever) - Environment Configuration
# Supports BOTH Ollama and OpenAI
# ===========================================================================

# -----------------------------------------------------------------------------
# PROVIDER SELECTION - Change this to switch between Ollama and OpenAI
# -----------------------------------------------------------------------------
# Options: "ollama" or "openai"
EMBEDDING_PROVIDER=ollama

# -----------------------------------------------------------------------------
# OLLAMA CONFIGURATION (Free, Local)
# -----------------------------------------------------------------------------
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# -----------------------------------------------------------------------------
# OPENAI CONFIGURATION (Paid, Cloud)
# -----------------------------------------------------------------------------
# Uncomment and add your API key when using OpenAI
# OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# -----------------------------------------------------------------------------
# SERVER CONFIGURATION
# -----------------------------------------------------------------------------
HOST=0.0.0.0
PORT=8000

# -----------------------------------------------------------------------------
# VECTOR STORE CONFIGURATION
# -----------------------------------------------------------------------------
VECTOR_STORE=chromadb
CHROMA_DB_DIR=./chroma_db

# -----------------------------------------------------------------------------
# LOGGING
# -----------------------------------------------------------------------------
LOG_LEVEL=INFO
```

---

### **Screen 8 - .env Configuration**

**File:** `C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer\.env`

```bash
# ===========================================================================
# NHAI Screen 8 (Chief Engineer Agent) - Environment Configuration
# Supports BOTH Ollama and OpenAI
# ===========================================================================

# -----------------------------------------------------------------------------
# PROVIDER SELECTION - Change this to switch between Ollama and OpenAI
# -----------------------------------------------------------------------------
# Options: "ollama" or "openai"
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama

# -----------------------------------------------------------------------------
# OLLAMA CONFIGURATION (Free, Local)
# -----------------------------------------------------------------------------
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=llama3

# -----------------------------------------------------------------------------
# OPENAI CONFIGURATION (Paid, Cloud)
# -----------------------------------------------------------------------------
# Uncomment and add your API key when using OpenAI
# OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini

# -----------------------------------------------------------------------------
# SERVER CONFIGURATION
# -----------------------------------------------------------------------------
HOST=0.0.0.0
PORT=8001

# -----------------------------------------------------------------------------
# HISTORY RETRIEVER (Screen 7) URL
# -----------------------------------------------------------------------------
HISTORY_RETRIEVER_URL=http://localhost:8000

# -----------------------------------------------------------------------------
# LLM SETTINGS
# -----------------------------------------------------------------------------
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000

# -----------------------------------------------------------------------------
# WORKFLOW CONFIGURATION
# -----------------------------------------------------------------------------
MIN_CONFIDENCE=0.7
DEFAULT_TOP_K=5
USE_HISTORICAL_DATA=true
SEARCH_SIMILAR_QUERIES=true

# -----------------------------------------------------------------------------
# STORAGE
# -----------------------------------------------------------------------------
QUERY_DB_DIR=./query_db

# -----------------------------------------------------------------------------
# LOGGING
# -----------------------------------------------------------------------------
LOG_LEVEL=INFO
```

---

## 🔄 **How to Switch Between Ollama and OpenAI**

### **Currently Using: Ollama → Switch to OpenAI**

**Screen 7:**
```bash
# Edit: screen07-history-retriever\.env

# Change this line:
EMBEDDING_PROVIDER=ollama
# To:
EMBEDDING_PROVIDER=openai

# Add your OpenAI API key:
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Screen 8:**
```bash
# Edit: screen08-chief-engineer\.env

# Change these lines:
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
# To:
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai

# Add your OpenAI API key:
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Restart services** after changing .env files!

---

### **Currently Using: OpenAI → Switch to Ollama**

**Screen 7:**
```bash
# Edit: screen07-history-retriever\.env

# Change this line:
EMBEDDING_PROVIDER=openai
# To:
EMBEDDING_PROVIDER=ollama

# Make sure Ollama is running:
# Run: ollama list
```

**Screen 8:**
```bash
# Edit: screen08-chief-engineer\.env

# Change these lines:
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai
# To:
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
```

**Restart services!**

---

## 📝 **Complete Setup Instructions**

### **For Ollama (Free)**

**1. Install Ollama:**
```cmd
REM Download from: https://ollama.ai/download
REM Run: OllamaSetup.exe
```

**2. Download Models:**
```cmd
ollama pull nomic-embed-text
ollama pull llama3
```

**3. Configure .env files:**
```bash
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
```

**4. Start services:**
```cmd
START_BOTH_SERVICES.bat
```

---

### **For OpenAI (Paid)**

**1. Get API Key:**
- Visit: https://platform.openai.com/api-keys
- Create new key
- Copy it (starts with `sk-`)

**2. Configure .env files:**
```bash
EMBEDDING_PROVIDER=openai
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
```

**3. Start services:**
```cmd
START_BOTH_SERVICES.bat
```

---

## 🛠️ **Updated .env.example Files**

### **Screen 7 - .env.example**

Create this file: `screen07-history-retriever\.env.example`

```bash
# ===========================================================================
# NHAI Screen 7 - Environment Configuration Template
# Copy this file to .env and configure
# ===========================================================================

# PROVIDER SELECTION: "ollama" (free) or "openai" (paid)
EMBEDDING_PROVIDER=ollama

# OLLAMA CONFIGURATION (if using Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# OPENAI CONFIGURATION (if using OpenAI)
# OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# SERVER
HOST=0.0.0.0
PORT=8000

# VECTOR STORE
VECTOR_STORE=chromadb
CHROMA_DB_DIR=./chroma_db

# LOGGING
LOG_LEVEL=INFO
```

---

### **Screen 8 - .env.example**

Create this file: `screen08-chief-engineer\.env.example`

```bash
# ===========================================================================
# NHAI Screen 8 - Environment Configuration Template
# Copy this file to .env and configure
# ===========================================================================

# PROVIDER SELECTION: "ollama" (free) or "openai" (paid)
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama

# OLLAMA CONFIGURATION (if using Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=llama3

# OPENAI CONFIGURATION (if using OpenAI)
# OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini

# SERVER
HOST=0.0.0.0
PORT=8001

# HISTORY RETRIEVER URL
HISTORY_RETRIEVER_URL=http://localhost:8000

# LLM SETTINGS
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000

# WORKFLOW
MIN_CONFIDENCE=0.7
DEFAULT_TOP_K=5
USE_HISTORICAL_DATA=true
SEARCH_SIMILAR_QUERIES=true

# STORAGE
QUERY_DB_DIR=./query_db

# LOGGING
LOG_LEVEL=INFO
```

---

## ✅ **Verification**

### **Test Ollama:**

```cmd
REM Check if Ollama is running
ollama list

REM Test embedding model
ollama run nomic-embed-text "test"

REM Test LLM model
ollama run llama3 "Hello, how are you?"
```

### **Test Services:**

```cmd
REM After starting services
curl http://localhost:8000/api/health
curl http://localhost:8001/api/health

REM Should show:
REM "embedding_provider": "ollama"
REM "llm_provider": "ollama"
```

---

## 🐛 **Troubleshooting**

### **Issue 1: "Ollama not found"**

**Solution:**
```cmd
REM 1. Check if Ollama is installed
ollama --version

REM 2. If not installed, download from:
REM https://ollama.ai/download

REM 3. Restart Command Prompt after installation
```

---

### **Issue 2: "Model not found"**

**Solution:**
```cmd
REM Check downloaded models
ollama list

REM If models missing, download them:
ollama pull nomic-embed-text
ollama pull llama3
```

---

### **Issue 3: "Cannot connect to Ollama"**

**Solution:**
```cmd
REM 1. Check if Ollama service is running
REM Look for "Ollama" in Task Manager

REM 2. Start Ollama service
REM Search "Ollama" in Start Menu and run it

REM 3. Verify it's accessible
curl http://localhost:11434
```

---

### **Issue 4: "Slow responses with Ollama"**

**Solutions:**

1. **Use smaller model:**
   ```bash
   OLLAMA_LLM_MODEL=phi3  # Smaller, faster
   ```

2. **Reduce context:**
   ```bash
   DEFAULT_TOP_K=3  # Instead of 5
   ```

3. **Check RAM:**
   - Llama3 needs 8GB+ RAM
   - Close other applications

---

## 💡 **Best Practices**

### **Development (Use Ollama):**
- Free, unlimited testing
- Fast local processing
- Complete privacy

### **Production (Consider OpenAI):**
- Better accuracy
- More reliable
- Less hardware requirements
- Costs ~$0.002 per query

### **Hybrid Approach:**
- Development: Ollama
- Production: OpenAI
- Keep both configs ready
- Switch by changing .env

---

## 📊 **Performance Comparison**

| Metric | Ollama (Llama3) | OpenAI (GPT-4o-mini) |
|--------|-----------------|----------------------|
| **Cost/Query** | $0 | ~$0.002 |
| **Response Time** | 2-5 seconds | 1-3 seconds |
| **Quality** | Good | Excellent |
| **Privacy** | 100% Local | Cloud |
| **RAM Usage** | 8GB+ | Minimal |
| **Internet** | Not needed | Required |

---

## 🔧 **Quick Switch Commands**

### **Switch to Ollama:**

```cmd
REM Screen 7
cd C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever
notepad .env
REM Change: EMBEDDING_PROVIDER=ollama

REM Screen 8
cd ..\screen08-chief-engineer
notepad .env
REM Change: 
REM EMBEDDING_PROVIDER=ollama
REM LLM_PROVIDER=ollama

REM Restart services
cd ..
START_BOTH_SERVICES.bat
```

---

### **Switch to OpenAI:**

```cmd
REM Screen 7
cd C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever
notepad .env
REM Change: EMBEDDING_PROVIDER=openai
REM Add: OPENAI_API_KEY=sk-your-key

REM Screen 8
cd ..\screen08-chief-engineer
notepad .env
REM Change: 
REM EMBEDDING_PROVIDER=openai
REM LLM_PROVIDER=openai
REM Add: OPENAI_API_KEY=sk-your-key

REM Restart services
cd ..
START_BOTH_SERVICES.bat
```

---

## 📦 **Ollama Models Reference**

### **Embedding Models:**

| Model | Size | Purpose |
|-------|------|---------|
| **nomic-embed-text** | 274MB | Text embeddings (Recommended) |
| all-minilm | 46MB | Lightweight alternative |

**Download:**
```cmd
ollama pull nomic-embed-text
```

---

### **LLM Models:**

| Model | Size | RAM | Speed | Quality |
|-------|------|-----|-------|---------|
| **llama3** | 4.7GB | 8GB | Fast | Excellent |
| mistral | 4.1GB | 8GB | Fast | Very Good |
| phi3 | 2.3GB | 4GB | Very Fast | Good |
| llama3:70b | 40GB | 64GB | Slow | Excellent |

**Download:**
```cmd
REM Choose one:
ollama pull llama3        # Recommended
ollama pull mistral       # Alternative
ollama pull phi3          # Lightweight
```

---

## 🎯 **Recommended Setup**

### **For Your Use Case (Ollama):**

**Screen 7 .env:**
```bash
EMBEDDING_PROVIDER=ollama
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

**Screen 8 .env:**
```bash
EMBEDDING_PROVIDER=ollama
LLM_PROVIDER=ollama
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=llama3
```

### **Keep OpenAI Ready (Future):**

Just keep these lines commented in .env:
```bash
# OPENAI_API_KEY=sk-future-key-here
# EMBEDDING_PROVIDER=openai
# LLM_PROVIDER=openai
```

When you want to switch, just uncomment and change PROVIDER variables!

---

## ✅ **Setup Checklist (Ollama)**

- [ ] Ollama installed (https://ollama.ai)
- [ ] `ollama --version` works
- [ ] `ollama pull nomic-embed-text` completed
- [ ] `ollama pull llama3` completed
- [ ] `ollama list` shows both models
- [ ] Screen 7 .env configured with `EMBEDDING_PROVIDER=ollama`
- [ ] Screen 8 .env configured with both providers as `ollama`
- [ ] Services started with `START_BOTH_SERVICES.bat`
- [ ] Health checks show `"embedding_provider": "ollama"`
- [ ] Test query processed successfully

---

## 🎉 **You're All Set!**

You now have:
- ✅ **Ollama configured** for free local processing
- ✅ **OpenAI support ready** for future use
- ✅ **Easy switching** between providers
- ✅ **Both configurations** in .env files
- ✅ **No code changes** needed to switch

**Just change the PROVIDER variables in .env and restart services!**

---

**Configuration:** Dual (Ollama + OpenAI)  
**Current:** Ollama (Free)  
**Future:** OpenAI (Ready)  
**Platform:** Windows 10/11  
**Status:** Production Ready ✅
