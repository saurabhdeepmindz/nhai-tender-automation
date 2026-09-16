# 🎯 NHAI Demo - Pre-Demo Checklist

## Before Running the Demo

### ✅ System Requirements
- [ ] Windows 10/11 or WSL2
- [ ] Node.js v18+ installed
- [ ] Python 3.9+ installed
- [ ] PostgreSQL 12+ running on localhost:5432
- [ ] Ollama running (if using local models)
- [ ] Network: http://localhost accessible

### ✅ Database
- [ ] PostgreSQL service is **running**
  - Windows: Open Services → "postgres" → Status should be "Running"
  - Or: `Get-Service postgresql* | Start-Service`
- [ ] Database `nhai_tender_db` exists
  - Verify: `psql -U postgres -d nhai_tender_db -c "SELECT 1"`
- [ ] At least 4 test queries exist in the `queries` table
  - Verify: `psql -U postgres -d nhai_tender_db -c "SELECT COUNT(*) FROM queries"`

### ✅ Code Changes Applied
- [x] Confidence normalization fix (NestJS)
- [x] RFP number extraction fallbacks (Python)
- [x] ChromaDB update endpoint (Python)
- [x] Backend sync call (NestJS)

### ✅ Files Ready
- [ ] `START_SERVICES_DEMO.ps1` exists and is executable
- [ ] `DEMO_README.md` available for reference
- [ ] `FIXES_SUMMARY.md` documents all changes
- [ ] `DIAGNOSTIC_CHECK.ps1` available if needed

### ✅ Node Modules
- [ ] `backend/node_modules/` exists (size > 500MB)
  - If missing, run: `cd backend && npm install`
- [ ] `backend/package.json` has all dependencies

### ✅ Python Packages
- [ ] `python-rag/screen08-chief-engineer/requirements.txt` complete
  - If packages missing, run: `pip install -r requirements.txt`

---

## Demo Execution (Step by Step)

### 1️⃣ Start Services (5 minutes before demo)
```powershell
# From: d:\SaurabhVerma\presales\rfp-pREBID\NHAI-POC-V400\NHAI-TENDER-AUTOMATION
.\START_SERVICES_DEMO.ps1
```

**Expected Output**:
```
[✓] NestJS Backend started (PID: 12345)
[✓] Python Screen 8 started (PID: 12346)

Service URLs:
  Backend API:     http://localhost:3001
  Screen 8 (RAG):  http://localhost:8001
  
Access the UI at:
  http://localhost:3000/admin/prebid-queries
```

### 2️⃣ Open Browser
Navigate to: **http://localhost:3000/admin/prebid-queries**

### 3️⃣ Show Demo Flow
1. **Show Query List** - Display all pending queries
2. **Select a Query** - Click "View" on any query
3. **Show Query Details** - Highlight:
   - Query text
   - RFP context
   - Current status
4. **Click "Process Query"** - Trigger AI workflow
5. **Wait for Processing** - Shows real-time workflow steps
6. **View Results** - Verify populated fields:
   - ✅ **AI Response** - Full text response
   - ✅ **Confidence** - "50% Match" (or similar)
   - ✅ **Past RFP Reference** - RFP identifier visible
   - ✅ **Past Response** - Empty for first query (expected)
7. **Process Second Similar Query** - Show past_response population
8. **Download Response Document** - Generate PDF/Word

### 4️⃣ Key Points to Highlight
- **AI Confidence**: Shows "50% Match" (not "0% Match")
- **Historical References**: Real RFP numbers displayed
- **Dynamic Processing**: 6-step workflow visible in real-time
- **RAG Integration**: Context from historical data included
- **Scalability**: Can handle bulk queries (100s of RFPs)

---

## 🚨 Troubleshooting During Demo

### Issue: "0% Match" displays instead of "50% Match"
**Solution**: Restart backend
```powershell
# Kill backend process
taskkill /F /IM node.exe

# Restart
cd backend && npm start
```

### Issue: "Past RFP Reference" is empty
**Solution**: Restart Screen 8
```powershell
# Kill Python process
taskkill /F /IM python.exe

# Restart
cd python-rag/screen08-chief-engineer && python main.py
```

### Issue: "API Error" when processing query
**Solution**: Check PostgreSQL is running
```powershell
# Verify database connection
psql -U postgres -d nhai_tender_db -c "SELECT 1"
```

### Issue: Slow query processing
**Solution**: This is normal - LLM inference takes 30-60 seconds
- Show the workflow steps while waiting
- Explain each step's purpose

### Issue: Port already in use
**Solution**: Kill existing process
```powershell
# Backend (port 3001)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Screen 8 (port 8001)
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

---

## ✅ Success Criteria

✅ Demo succeeds when:
1. Services start without errors
2. UI loads at localhost:3000
3. Query list displays
4. Query processing triggers successfully
5. Results show:
   - AI Response (text, not "0% Match")
   - Confidence (as "XX% Match")
   - RFP Reference (shows RFP number)
6. Workflow steps visible during processing
7. No console errors (F12 → Console tab)

---

## 📞 Support During Demo

**If something breaks:**
1. Open **DEMO_README.md** for detailed troubleshooting
2. Check logs: `backend/logs/` and `python-rag/screen08-chief-engineer/logs/`
3. Run: `.\DIAGNOSTIC_CHECK.ps1` to verify system state
4. Restart services: `.\START_SERVICES_DEMO.ps1`

---

## 🎯 Time Allocation

- **Setup** (2 min): Start services
- **Demo Flow** (8 min): Walk through UI
- **Processing** (5 min): Show query processing
- **Results** (3 min): Highlight fixed fields
- **Questions** (2 min): Client Q&A

**Total: 20 minutes**

---

**You're ready for the demo!** 🚀
