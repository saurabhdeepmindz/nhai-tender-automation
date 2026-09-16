# 🚀 NHAI Tender Automation - DEMO STARTUP GUIDE

## ⚠️ CRITICAL: Services Not Running!

The screenshot shows **"0% Match"** and missing RFP data because **the backend and Screen 8 services are NOT running**.

---

## ✅ Quick Fix (Windows - PowerShell)

### **Step 1: Open PowerShell as Administrator**
```powershell
Start-Process powershell -Verb RunAs
```

### **Step 2: Navigate to Project Root**
```powershell
cd "d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION"
```

### **Step 3: Start All Services**
```powershell
.\START_SERVICES_DEMO.ps1
```

This will automatically start:
- ✅ **NestJS Backend** (port 3001)
- ✅ **Python Screen 8** (port 8001)
- ✅ **PostgreSQL** (must be running on port 5432)

---

## 🔍 Alternative: Manual Startup (If Script Fails)

### **Terminal 1: Start Backend**
```bash
cd backend
npm start
```

Wait for: `NestJS application successfully started on port 3001`

### **Terminal 2: Start Screen 8 (Python)**
```bash
cd python-rag/screen08-chief-engineer
python main.py
```

Wait for: `Uvicorn running on http://0.0.0.0:8001`

---

## 🌐 Access the Demo

Once services are running:

1. **Prebid Query Management UI:**
   ```
   http://localhost:3000/admin/prebid-queries
   ```

2. **Backend API (Swagger):**
   ```
   http://localhost:3001/api/docs
   ```

3. **Screen 8 API:**
   ```
   http://localhost:8001/docs
   ```

---

## ✅ What's Fixed in This Version

### **Issue 1: AI Response showing "0% Match"**
- ✅ **FIXED**: Backend now normalizes confidence score from 0-1 range to 0-100%
- ✅ **Code**: `backend/src/prebid-query/prebid-query.service.ts` line 261-264

### **Issue 2: Past RFP Reference not showing RFP number**
- ✅ **FIXED**: Added fallback extraction for RFP number from multiple metadata keys
- ✅ **Code**: `python-rag/screen08-chief-engineer/chief_engineer_agent.py` line 760-789

### **Issue 3: ChromaDB response update failing**
- ✅ **FIXED**: Changed to metadata-only update instead of upsert
- ✅ **Code**: `python-rag/screen08-chief-engineer/main.py` line 585-616

---

## 🧪 Quick Test

After services start, do this:

1. Open **Prebid Query Management** at http://localhost:3000/admin/prebid-queries
2. Select a query
3. Click **"Process Query"** button
4. Wait for processing to complete
5. Verify the following columns populate:
   - ✅ **AI Response** (should show text, not "0% Match")
   - ✅ **Confidence** (should show "50% Match" or similar)
   - ✅ **Past RFP Reference** (should show RFP number if historical data exists)
   - ✅ **Past Response** (will populate when similar query exists)

---

## 🔧 Troubleshooting

### **Backend won't start (Port 3001 in use)**
```bash
# Kill the process using port 3001 (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### **Screen 8 won't start (Port 8001 in use)**
```bash
# Kill the process using port 8001 (Windows)
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

### **PostgreSQL connection error**
Ensure PostgreSQL is running:
```bash
# Windows - Check services
Get-Service postgresql* | Where-Object {$_.Status -eq 'Running'}

# Start if not running
Start-Service postgresql-x64-15  # Adjust version number
```

### **Python module not found errors**
Reinstall Python dependencies:
```bash
cd python-rag/screen08-chief-engineer
pip install -r requirements.txt
```

---

## 📊 Expected Data

Your test queries should have:

| Field | Expected Value |
|-------|----------------|
| Query ID | NHAI/QRY/... (UUID) |
| AI Response | Full text response (1000+ chars) |
| Confidence | 50% Match (or similar) |
| Past RFP Reference | RFP number (if historical matches found) |
| Past Response | Response from similar query (if exists) |

---

## 🎯 Demo Points

Show your client:
1. **AI Processing**: Real-time query processing with RFP context
2. **Confidence Score**: Shows match percentage confidence
3. **Historical Matching**: Retrieves similar past RFP references
4. **Similar Query Search**: Shows past responses for similar queries
5. **Full Response**: Complete AI-generated tender response

---

## ❌ If Still Not Working

Check the **logs**:
```bash
# Backend logs
backend/logs/*.log

# Screen 8 logs
python-rag/screen08-chief-engineer/logs/*.log
```

Or run diagnostic:
```powershell
.\DIAGNOSTIC_CHECK.ps1
```

---

**Good luck with your demo!** 🚀
