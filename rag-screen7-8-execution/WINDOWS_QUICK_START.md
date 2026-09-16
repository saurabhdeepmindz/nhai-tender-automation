# ⚡ Windows Quick Start - 5 Minutes Setup

**NHAI Tender Query Automation - Python RAG Services**

---

## 🎯 **What You'll Do**

1. Copy 7 files to specific folders
2. Run 1 setup batch script
3. Add your OpenAI API key
4. Start both services

**Total time: ~5 minutes**

---

## 📋 **Step-by-Step**

### **Step 1: Create Folders (30 seconds)**

Open **Command Prompt** and run:

```cmd
cd C:\
mkdir Projects\NHAI-Tender-Automation\python-rag\shared
mkdir Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever
mkdir Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer
```

### **Step 2: Copy Files (1 minute)**

Copy these files to the folders:

**To `C:\Projects\NHAI-Tender-Automation\python-rag\shared\`:**
1. `embeddings.py`
2. `llm_utils.py`

**To `C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever\`:**
3. `main.py`
4. `requirements.txt`
5. `.env.example`

**To `C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer\`:**
6. `main.py`
7. `chief_engineer_agent.py`
8. `workflow_manager.py`
9. `requirements.txt`
10. `.env.example`

### **Step 3: Run Setup Script (2 minutes)**

**Copy `setup-windows.bat` to:** `C:\Projects\NHAI-Tender-Automation\python-rag\`

**Double-click `setup-windows.bat`**

Wait for it to install all dependencies.

### **Step 4: Add API Key (1 minute)**

1. Get OpenAI API key from: https://platform.openai.com/api-keys
2. Open: `C:\Projects\NHAI-Tender-Automation\python-rag\screen07-history-retriever\.env`
3. Replace `sk-your-actual-api-key-here` with your actual key
4. Save and close
5. Do the same for: `C:\Projects\NHAI-Tender-Automation\python-rag\screen08-chief-engineer\.env`

### **Step 5: Start Services (30 seconds)**

**Double-click `START_BOTH_SERVICES.bat`**

Two new windows will open automatically!

---

## ✅ **Verify It's Working**

Open browser and visit:

- http://localhost:8000/docs - Screen 7 API
- http://localhost:8001/docs - Screen 8 API

You should see Swagger UI for both services.

---

## 🎉 **Done!**

Both services are now running:

- ✅ Screen 7 on port 8000
- ✅ Screen 8 on port 8001
- ✅ Ready to integrate with NestJS backend

---

## 🔧 **Batch Scripts Summary**

| Script | Purpose |
|--------|---------|
| `setup-windows.bat` | One-time setup & dependency installation |
| `START_SCREEN7.bat` | Start only Screen 7 |
| `START_SCREEN8.bat` | Start only Screen 8 |
| `START_BOTH_SERVICES.bat` | Start both services automatically |

---

## 🐛 **Quick Troubleshooting**

**Problem:** "Python is not recognized"
**Solution:** Install Python from https://www.python.org (check "Add to PATH")

**Problem:** "API key error"
**Solution:** Check .env file has correct key (starts with `sk-`)

**Problem:** Services won't start
**Solution:** Run setup script again: `setup-windows.bat`

---

## 📞 **Need Help?**

See full guide: `WINDOWS_EXECUTION_GUIDE.md`

---

**Quick Start Complete! 🚀**
