# 🪟 Windows Execution Package - Complete Summary

**NHAI Tender Query Automation - Python RAG Services for Windows**

---

## 📦 **What You Have**

You now have **6 files** specifically for Windows execution:

### **📚 Documentation (2 files):**

1. **WINDOWS_EXECUTION_GUIDE.md** (~1,000 lines)
   - Complete step-by-step Windows guide
   - Prerequisites and setup
   - Screen 7 and Screen 8 installation
   - Testing and verification
   - Comprehensive troubleshooting
   - Production deployment options

2. **WINDOWS_QUICK_START.md** (~100 lines)
   - 5-minute quick setup
   - Simplified instructions
   - Essential steps only
   - Quick troubleshooting

### **⚡ Batch Scripts (4 files):**

3. **setup-windows.bat**
   - One-time automated setup
   - Installs all dependencies
   - Creates directory structure
   - Configures .env files
   - Verifies installation

4. **START_SCREEN7.bat**
   - Starts Screen 7 only (port 8000)
   - Auto-checks configuration
   - Creates .env if missing
   - Color-coded terminal (blue)

5. **START_SCREEN8.bat**
   - Starts Screen 8 only (port 8001)
   - Auto-checks configuration
   - Creates .env if missing
   - Color-coded terminal (yellow)

6. **START_BOTH_SERVICES.bat**
   - Starts both services automatically
   - Opens 2 separate windows
   - Tests services after startup
   - Shows status and URLs

---

## 🚀 **Quick Start (5 Minutes)**

### **Option 1: Automated (Recommended)**

1. **Create folders:**
   ```cmd
   cd C:\
   mkdir Projects\NHAI-Tender-Automation\python-rag\shared
   mkdir Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever
   mkdir Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer
   ```

2. **Copy all files to folders** (see file placement below)

3. **Run setup:**
   ```cmd
   cd C:\Projects\NHAI-Tender-Automation\python-rag
   setup-windows.bat
   ```

4. **Add API key:**
   - Edit `screen07-history-retriever\.env`
   - Edit `screen08-chief-engineer\.env`
   - Add your OpenAI API key

5. **Start services:**
   ```cmd
   START_BOTH_SERVICES.bat
   ```

**Done!** Both services are now running.

---

### **Option 2: Manual**

Follow **WINDOWS_EXECUTION_GUIDE.md** for detailed step-by-step instructions.

---

## 📂 **File Placement**

```
C:\Projects\NHAI-Tender-Automation\
└── python-rag\
    │
    ├── setup-windows.bat                    ← Copy here
    ├── START_SCREEN7.bat                    ← Copy here
    ├── START_SCREEN8.bat                    ← Copy here
    ├── START_BOTH_SERVICES.bat              ← Copy here
    │
    ├── shared\
    │   ├── embeddings.py                    ← Copy here
    │   └── llm_utils.py                     ← Copy here
    │
    ├── screen07-history-retriever\
    │   ├── main.py                          ← Copy here
    │   ├── requirements.txt                 ← Copy here
    │   └── .env.example                     ← Copy here
    │
    └── screen08-chief-engineer\
        ├── main.py                          ← Copy here
        ├── chief_engineer_agent.py          ← Copy here
        ├── workflow_manager.py              ← Copy here
        ├── requirements.txt                 ← Copy here
        └── .env.example                     ← Copy here
```

---

## 🎯 **Usage Guide**

### **First Time Setup:**

1. Run `setup-windows.bat` (only once)
2. Configure .env files with API key
3. Use `START_BOTH_SERVICES.bat` to start

### **Daily Use:**

Simply double-click: `START_BOTH_SERVICES.bat`

### **Individual Services:**

- For Screen 7 only: `START_SCREEN7.bat`
- For Screen 8 only: `START_SCREEN8.bat`

---

## ✅ **Verification**

After starting services, open browser and visit:

- **Screen 7 API Documentation:** http://localhost:8000/docs
- **Screen 8 API Documentation:** http://localhost:8001/docs

You should see interactive Swagger UI for both services.

**Test with Command Prompt:**

```cmd
curl http://localhost:8000/api/health
curl http://localhost:8001/api/health
```

**Test with PowerShell:**

```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/health
Invoke-WebRequest -Uri http://localhost:8001/api/health
```

---

## 🔧 **Batch Script Details**

### **setup-windows.bat**

**What it does:**
- Checks Python installation
- Creates directory structure
- Installs shared dependencies
- Installs Screen 7 dependencies
- Installs Screen 8 dependencies
- Creates .env files from .env.example
- Verifies installation

**Run it:**
```cmd
cd C:\Projects\NHAI-Tender-Automation\python-rag
setup-windows.bat
```

### **START_SCREEN7.bat**

**What it does:**
- Navigates to Screen 7 directory
- Checks for main.py
- Checks for .env (creates if missing)
- Starts Screen 7 on port 8000
- Blue colored terminal

**Run it:**
```cmd
START_SCREEN7.bat
```

### **START_SCREEN8.bat**

**What it does:**
- Navigates to Screen 8 directory
- Checks for main.py
- Checks for .env (creates if missing)
- Starts Screen 8 on port 8001
- Yellow colored terminal

**Run it:**
```cmd
START_SCREEN8.bat
```

### **START_BOTH_SERVICES.bat**

**What it does:**
- Checks Python installation
- Verifies both services exist
- Starts Screen 7 in new window
- Waits 5 seconds
- Starts Screen 8 in new window
- Tests both services
- Shows status and URLs

**Run it:**
```cmd
START_BOTH_SERVICES.bat
```

---

## 🐛 **Troubleshooting**

### **"Python is not recognized"**

**Fix:**
1. Download Python from https://www.python.org
2. **Check "Add Python to PATH"** during installation
3. Restart Command Prompt

### **"pip is not recognized"**

**Fix:**
Use `python -m pip` instead of `pip`:
```cmd
python -m pip install -r requirements.txt
```

### **Services won't start**

**Fix:**
1. Check .env files exist
2. Verify API key is correct (starts with `sk-`)
3. Run setup again: `setup-windows.bat`
4. Check Python version: `python --version` (should be 3.10+)

### **Port already in use**

**Fix:**
```cmd
# Find process on port 8000
netstat -ano | findstr :8000

# Kill it (replace PID)
taskkill /PID <PID> /F
```

### **Import errors**

**Fix:**
```cmd
# Reinstall dependencies
cd C:\Projects\NHAI-Tender-Automation\python-rag\shared
pip install langchain langchain-openai chromadb --break-system-packages --force-reinstall
```

---

## 📊 **Services Overview**

| Service | Port | Purpose | Color |
|---------|------|---------|-------|
| Screen 7 | 8000 | History Retriever - Document storage & search | Blue |
| Screen 8 | 8001 | Chief Engineer - Query processing & AI workflow | Yellow |

**Dependencies:**
- Screen 8 optionally calls Screen 7 for historical data
- Both can run independently
- Best when running together

---

## 💡 **Pro Tips**

1. **Taskbar Shortcut:**
   - Right-click `START_BOTH_SERVICES.bat`
   - Send to → Desktop (create shortcut)
   - Drag to taskbar

2. **Auto-start on Login:**
   - Press `Win + R`
   - Type `shell:startup`
   - Copy `START_BOTH_SERVICES.bat` there

3. **Quick Status Check:**
   - Open browser
   - Visit http://localhost:8000/docs
   - Visit http://localhost:8001/docs

4. **Windows Terminal:**
   - Install from Microsoft Store
   - Better than Command Prompt
   - Supports tabs and colors

---

## 📈 **What's Next?**

After services are running:

1. ✅ **Test with Swagger UI** (http://localhost:8000/docs)
2. ✅ **Upload test documents** to Screen 7
3. ✅ **Process test queries** through Screen 8
4. ✅ **Integrate with NestJS backend**
5. ✅ **Connect to frontend**

---

## 🔗 **Integration**

Your NestJS backend should connect to:

```typescript
// Screen 7 - History Retriever
const SCREEN7_URL = 'http://localhost:8000';

// Screen 8 - Chief Engineer
const SCREEN8_URL = 'http://localhost:8001';

// Example API calls
axios.post(`${SCREEN7_URL}/api/rag/ingest`, formData);
axios.post(`${SCREEN8_URL}/api/chief-engineer/process`, queryData);
```

---

## 📞 **Getting Help**

**For detailed instructions:**
- See `WINDOWS_EXECUTION_GUIDE.md`

**For quick setup:**
- See `WINDOWS_QUICK_START.md`

**For troubleshooting:**
- Check service terminal windows for errors
- Verify .env configuration
- Ensure OpenAI API key is valid
- Check Windows Firewall settings

---

## ✅ **Success Checklist**

- [ ] Python 3.10+ installed
- [ ] OpenAI API key obtained
- [ ] All files copied to correct folders
- [ ] `setup-windows.bat` completed successfully
- [ ] .env files configured with API key
- [ ] `START_BOTH_SERVICES.bat` opens 2 windows
- [ ] Both services show "initialized successfully"
- [ ] http://localhost:8000/docs accessible
- [ ] http://localhost:8001/docs accessible
- [ ] Health checks return "healthy"
- [ ] Ready for NestJS integration

---

## 🎉 **You're All Set!**

All files are:
- ✅ Windows-optimized
- ✅ Automated with batch scripts
- ✅ Well-documented
- ✅ Production-ready
- ✅ Easy to use

**Just double-click `START_BOTH_SERVICES.bat` and you're running!**

---

**Package:** Windows Execution Files  
**Total Files:** 6 (2 docs + 4 batch scripts)  
**Platform:** Windows 10/11  
**Python:** 3.10+  
**Status:** Production Ready ✅  
**Version:** 1.0.0
