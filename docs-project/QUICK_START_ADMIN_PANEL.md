# 🚀 Admin Panel Quick Start Guide

**Date:** January 22, 2026  
**NHAI Tender Query Automation System**

---

## ✅ What Was Done

All files from the `Staging/admin-panel-vectorize` folder have been successfully copied to their production locations:

1. ✅ **Backend Controller** → `backend/src/admin/controllers/admin-vectorization.controller.ts`
2. ✅ **Backend Module** → `backend/src/admin/admin.module.ts`
3. ✅ **Frontend Page** → `frontend/app/admin/vectorization-control/page.tsx`
4. ✅ **Frontend Config** → `frontend/.env.local` (created)
5. ✅ **Backups Created** → All original files backed up with timestamps

---

## 🔧 Complete These Steps to Start

### **Step 1: Install Frontend Dependencies**

```bash
cd frontend
npm install lucide-react
```

### **Step 2: Start Backend Server**

```bash
cd backend
npm run start:dev
```

**Look for these logs:**
```
[Nest] LOG [AdminVectorizationController] Admin controller initialized
[Nest] LOG [RouterExplorer] Mapped {/api/admin/vectorization/stats, GET}
[Nest] LOG [RouterExplorer] Mapped {/api/admin/vectorization/queries, GET}
```

### **Step 3: Start Frontend Server**

```bash
cd frontend
npm run dev
```

### **Step 4: Access Admin Panel**

1. Open browser: `http://localhost:3001/admin/vectorization-control`
2. Login with admin credentials
3. Start managing vectorization!

---

## 📋 Quick Test Commands

Test backend API endpoints:

```bash
# Get Statistics
curl http://localhost:3000/api/admin/vectorization/stats -H "Authorization: Bearer YOUR_TOKEN"

# Get Job Config
curl http://localhost:3000/api/admin/vectorization/job/config -H "Authorization: Bearer YOUR_TOKEN"

# Pause Job
curl -X POST http://localhost:3000/api/admin/vectorization/job/pause -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Features Available

✅ **Statistics Dashboard** - View total, vectorized, pending queries  
✅ **Manual Control** - Vectorize queries individually or in batch  
✅ **Job Management** - Pause/resume background vectorization job  
✅ **Failed Query Retry** - Retry all failed vectorizations  
✅ **Search & Filter** - Find queries by text or RFP number  
✅ **Real-time Updates** - Auto-refresh every 30 seconds  
✅ **Delete Vectors** - Remove queries from vector database  

---

## 📂 Backup Files (For Rollback)

If something goes wrong, restore from these backups:

- `backend/src/admin/controllers/admin-vectorization.controller.ts.backup-20260122-002151`
- `backend/src/admin/admin.module.ts.backup-20260122-002209`
- `frontend/app/admin/vectorization-control/vectorization-control-page.tsx.backup-20260122-002209`

---

## 📚 Full Documentation

See [ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md](./ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md) for:
- Complete file structure
- API endpoint reference
- Troubleshooting guide
- Rollback instructions

---

**Status:** ✅ Ready to test!  
**Next:** Install `lucide-react` and start servers
