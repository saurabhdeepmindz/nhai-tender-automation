# 🏗️ NHAI Tender Query Automation System - Final Merged Project Structure

**Generated:** January 24, 2026  
**Version:** 3.0 (Merged)  
**Status:** ✅ Reconciled with Existing Implementation

---

## 📊 Executive Summary

This document merges:
1. **Existing Implementation** (v4 - Current working system with Screen 7 & 8)
2. **Planned Architecture** (v2 - Complete 14-screen design from PoC requirements)

### Key Integration Points

| Aspect | Existing (v4) | Planned (v2) | Final Decision |
|--------|---------------|--------------|----------------|
| **Screens Implemented** | Screen 7 (History Retriever) + Screen 8 (Chief Engineer) | Screens 01-13 + Historical Data | **Keep existing + Add missing screens** |
| **Python RAG Structure** | `python-rag/screen07-history-retriever/` + `screen08-chief-engineer/` | `python-rag/` with 5 services + shared/ | **Hybrid: Keep existing + Add shared/ + Add remaining services** |
| **Backend Modules** | queries/, prebid-query/, vectorization/, historical-data/ | More granular: vendors/, chatbot/, analytics/, conformance/, etc. | **Keep existing + Add missing modules** |
| **Frontend Structure** | Flat app/ directory | Route groups: (auth), (vendor), (admin), (shared) | **Migrate to route groups for better organization** |
| **Ports** | Backend:3000, Frontend:3001, Screen7:8000, Screen8:8001 | Backend:3001, Frontend:3000, RAG:8000-8004 | **Standardize: Backend:3001, Frontend:3000, RAG:8000-8004** |

---

## 🔄 Changes Summary

### ✅ **KEEP (From Existing Implementation v4)**

**Already Implemented & Working:**
- ✓ Backend NestJS structure with prebid-query, vectorization, historical-data modules
- ✓ Screen 7: History Retriever Agent (Port 8000)
- ✓ Screen 8: Chief Engineer Agent (Port 8001)
- ✓ Database migrations and entities
- ✓ Batch scripts for service management
- ✓ Comprehensive documentation files
- ✓ Python virtual environment setup (nhai-venv/)
- ✓ Database backup system
- ✓ RAG execution scripts

### ➕ **ADD (From Planned Architecture v2)**

**Missing Components to Implement:**
- 📍 Screens 01-06, 09-13 (Login, Vendor Dashboard, Query Submission, etc.)
- 📍 Frontend route groups: (auth), (vendor), (admin), (shared)
- 📍 Additional Python RAG services: chatbot (Screen 04), conformance (Screen 10)
- 📍 Shared Python infrastructure: `python-rag/shared/`
- 📍 Backend modules: vendors/, chatbot/, analytics/, conformance/, corrigendum/
- 📍 Complete frontend component library
- 📍 Test suites for all screens

### 🔧 **MODIFY (Reconciliation Required)**

**Updates to Existing Structure:**
- 🔄 Reorganize frontend from flat to route groups
- 🔄 Add `python-rag/shared/` for common utilities
- 🔄 Standardize port allocation (Backend:3001, Frontend:3000)
- 🔄 Update documentation to reflect all 14 screens
- 🔄 Add comprehensive data flow documentation

---

## 📂 Final Merged Directory Structure

```
nhai-tender-query-system/
│
├── 📄 .env                                          # ✓ EXISTING - Root environment
├── 📄 .env.example                                  # ➕ ADD - Environment template
├── 📄 .gitignore                                    # ➕ ADD - Git ignore
├── 📄 README.md                                     # 🔄 UPDATE - Main documentation
├── 📄 docker-compose.yml                            # ➕ ADD - Container orchestration
├── 📄 package.json                                  # ✓ EXISTING - Root package
├── 📄 requirements.txt                              # ✓ EXISTING - Python deps
│
├── 📁 docs/                                         # 🔄 REORGANIZE - Documentation
│   │
│   ├── 📄 README_SERVICES.md                        # ✓ EXISTING
│   ├── 📄 POCScopev1.pdf                            # ➕ ADD - PoC scope
│   ├── 📄 Critical_Parameter_for_PoC.docx           # ➕ ADD - PoC parameters
│   ├── 📄 VECTOR_DB_ARCHITECTURE.md                 # ➕ ADD - Vector DB docs
│   │
│   ├── 📂 implementation/                           # ✓ EXISTING - Implementation docs
│   │   ├── 📄 ADMIN_PANEL_IMPLEMENTATION_SUMMARY.md
│   │   ├── 📄 MIGRATION_IMPLEMENTATION_SUMMARY.md
│   │   ├── 📄 MERGE_ANALYSIS_AND_IMPLEMENTATION_GUIDE.md
│   │   └── 📄 SAFE_ROLLBACK_COMPLETE_SUMMARY.md
│   │
│   ├── 📂 testing/                                  # ✓ EXISTING - Testing guides
│   │   ├── 📄 SCREEN7_ENDPOINT_TESTING_GUIDE.md
│   │   ├── 📄 SCREEN8_ENDPOINT_TESTING_GUIDE.md
│   │   ├── 📄 SCREEN7_SCREEN8_ISSUES_FIXED.md
│   │   └── 📄 DEPLOYMENT_VERIFICATION_REPORT.md
│   │
│   ├── 📂 migration/                                # ✓ EXISTING - Migration docs
│   │   ├── 📄 DATABASE_MIGRATION_GUIDE.md
│   │   ├── 📄 MIGRATION_SUMMARY.md
│   │   ├── 📄 POSTGRESQL_TO_CHROMADB_MIGRATION_GUIDE.md
│   │   └── 📄 DATA_FLOW_SCREEN3_TO_VECTOR_DB.md
│   │
│   ├── 📂 quick-start/                              # ✓ EXISTING - Quick start
│   │   ├── 📄 QUICK_START_ADMIN_PANEL.md
│   │   └── 📄 WINDOWS_EXECUTION_GUIDE.md
│   │
│   └── 📂 screens/                                  # ➕ ADD - Screen documentation
│       ├── 📄 screen_01_login.md
│       ├── 📄 screen_02_vendor_dashboard.md
│       ├── 📄 screen_03_query_submission.md
│       ├── 📄 screen_04_chatbot.md
│       ├── 📄 screen_05_query_history.md
│       ├── 📄 screen_06_admin_dashboard.md
│       ├── 📄 screen_07_pre_bid_query.md
│       ├── 📄 screen_08_document_generation.md
│       ├── 📄 screen_09_analytics_dashboard.md
│       ├── 📄 screen_10_conformance_checker.md
│       ├── 📄 screen_11_corrigendum_generator.md
│       ├── 📄 screen_12_document_viewer.md
│       ├── 📄 screen_13_help.md
│       └── 📄 screen_historical_data_management.md
│
├── 📁 scripts/                                      # ✓ EXISTING - Utility scripts
│   ├── 📄 CHECK_SERVICES.bat
│   ├── 📄 START_ALL_SERVICES.bat
│   ├── 📄 START_BACKEND.bat
│   ├── 📄 START_FRONTEND.bat
│   ├── 📄 START_SCREEN7_FIXED.bat
│   ├── 📄 START_SCREEN8_FIXED.bat
│   ├── 📄 STOP_ALL_SERVICES.bat
│   ├── 📄 MIGRATION_TESTING_SCRIPT.ps1
│   └── 📄 quick-test.ps1
│
├── 📁 backend/                                      # 🔄 ENHANCED - NestJS Backend
│   │
│   ├── 📄 .env                                      # ✓ EXISTING
│   ├── 📄 package.json                              # ✓ EXISTING
│   ├── 📄 package-lock.json                         # ✓ EXISTING
│   ├── 📄 tsconfig.json                             # ✓ EXISTING
│   ├── 📄 nest-cli.json                             # ➕ ADD
│   │
│   ├── 📁 src/
│   │   │
│   │   ├── 📄 main.ts                               # ✓ EXISTING - Entry point (Port 3001)
│   │   ├── 📄 app.module.ts                         # ✓ EXISTING - Root module
│   │   ├── 📄 app.controller.ts                     # ✓ EXISTING - Root controller
│   │   │
│   │   ├── 📁 config/                               # ✓ EXISTING - Configuration
│   │   │   ├── 📄 typeorm.config.ts                 # ✓ EXISTING
│   │   │   ├── 📄 database.config.ts                # ➕ ADD
│   │   │   ├── 📄 jwt.config.ts                     # ➕ ADD
│   │   │   └── 📄 redis.config.ts                   # ➕ ADD
│   │   │
│   │   ├── 📁 auth/                                 # 🔄 ENHANCE - Authentication (Screen 01)
│   │   │   ├── 📄 auth.module.ts                    # ✓ EXISTING
│   │   │   ├── 📄 auth.controller.ts                # ✓ EXISTING
│   │   │   ├── 📄 auth.service.ts                   # ✓ EXISTING
│   │   │   ├── 📂 dto/                              # ➕ ADD
│   │   │   │   ├── 📄 login.dto.ts
│   │   │   │   ├── 📄 register.dto.ts
│   │   │   │   └── 📄 reset-password.dto.ts
│   │   │   ├── 📂 guards/                           # ➕ ADD
│   │   │   │   ├── 📄 jwt-auth.guard.ts
│   │   │   │   └── 📄 roles.guard.ts
│   │   │   └── 📂 strategies/                       # ➕ ADD
│   │   │       └── 📄 jwt.strategy.ts
│   │   │
│   │   ├── 📁 users/                                # ➕ ADD - User Management
│   │   │   ├── 📄 users.module.ts
│   │   │   ├── 📄 users.controller.ts
│   │   │   ├── 📄 users.service.ts
│   │   │   ├── 📂 entities/
│   │   │   │   └── 📄 user.entity.ts
│   │   │   └── 📂 dto/
│   │   │       ├── 📄 create-user.dto.ts
│   │   │       └── 📄 update-user.dto.ts
│   │   │
│   │   ├── 📁 vendors/                              # ✓ EXISTING - Vendor Module (Screen 02)
│   │   │   ├── 📄 vendors.module.ts                 # ✓ EXISTING
│   │   │   ├── 📄 vendors.controller.ts             # ✓ EXISTING
│   │   │   ├── 📄 vendors.service.ts                # ✓ EXISTING
│   │   │   ├── 📂 entities/                         # ➕ ADD
│   │   │   │   ├── 📄 vendor.entity.ts
│   │   │   │   └── 📄 vendor-stats.entity.ts
│   │   │   └── 📂 dto/                              # ➕ ADD
│   │   │       ├── 📄 create-vendor.dto.ts
│   │   │       └── 📄 vendor-dashboard.dto.ts
│   │   │
│   │   ├── 📁 queries/                              # ✓ EXISTING - Query Management (Screen 03)
│   │   │   ├── 📄 queries.module.ts                 # ✓ EXISTING
│   │   │   ├── 📄 index.ts                          # ✓ EXISTING
│   │   │   ├── 📂 controller/                       # ✓ EXISTING
│   │   │   │   └── 📄 queries.controller.ts
│   │   │   ├── 📂 services/                         # ✓ EXISTING
│   │   │   │   └── 📄 queries.service.ts
│   │   │   ├── 📂 entities/                         # ✓ EXISTING
│   │   │   │   └── 📄 query.entity.ts
│   │   │   └── 📂 dto/                              # ✓ EXISTING
│   │   │       ├── 📄 create-query.dto.ts
│   │   │       ├── 📄 update-query.dto.ts
│   │   │       └── 📄 query-response.dto.ts
│   │   │
│   │   ├── 📁 chatbot/                              # ➕ ADD - Chatbot Module (Screen 04)
│   │   │   ├── 📄 chatbot.module.ts
│   │   │   ├── 📄 chatbot.controller.ts
│   │   │   ├── 📄 chatbot.service.ts
│   │   │   ├── 📂 entities/
│   │   │   │   └── 📄 chat-session.entity.ts
│   │   │   └── 📂 dto/
│   │   │       └── 📄 chat-message.dto.ts
│   │   │
│   │   ├── 📁 query-history/                        # ➕ ADD - Query History (Screen 05)
│   │   │   ├── 📄 query-history.module.ts
│   │   │   ├── 📄 query-history.controller.ts
│   │   │   └── 📄 query-history.service.ts
│   │   │
│   │   ├── 📁 rfps/                                 # ➕ ADD - RFP Management
│   │   │   ├── 📄 rfps.module.ts
│   │   │   ├── 📄 rfps.controller.ts
│   │   │   ├── 📄 rfps.service.ts
│   │   │   ├── 📂 entities/
│   │   │   │   └── 📄 rfp.entity.ts
│   │   │   └── 📂 dto/
│   │   │       ├── 📄 create-rfp.dto.ts
│   │   │       └── 📄 update-rfp.dto.ts
│   │   │
│   │   ├── 📁 prebid-query/                         # ✓ EXISTING - Prebid Query (Screen 07)
│   │   │   ├── 📄 prebid-query.module.ts            # ✓ EXISTING
│   │   │   ├── 📄 prebid-query.controller.ts        # ✓ EXISTING
│   │   │   ├── 📄 prebid-query.service.ts           # ✓ EXISTING
│   │   │   ├── 📂 dto/                              # ✓ EXISTING
│   │   │   │   ├── 📄 process-query.dto.ts
│   │   │   │   └── 📄 ai-response.dto.ts
│   │   │   └── 📂 entities/                         # ✓ EXISTING
│   │   │       ├── 📄 prebid-query.entity.ts
│   │   │       └── 📄 ai-response.entity.ts
│   │   │
│   │   ├── 📁 documents/                            # ➕ ADD - Document Module (Screen 08)
│   │   │   ├── 📄 documents.module.ts
│   │   │   ├── 📄 documents.controller.ts
│   │   │   ├── 📄 documents.service.ts
│   │   │   ├── 📂 entities/
│   │   │   │   ├── 📄 document.entity.ts
│   │   │   │   └── 📄 document-metadata.entity.ts
│   │   │   └── 📂 dto/
│   │   │       ├── 📄 upload-document.dto.ts
│   │   │       └── 📄 process-document.dto.ts
│   │   │
│   │   ├── 📁 analytics/                            # ➕ ADD - Analytics (Screen 09)
│   │   │   ├── 📄 analytics.module.ts
│   │   │   ├── 📄 analytics.controller.ts
│   │   │   ├── 📄 analytics.service.ts
│   │   │   └── 📂 dto/
│   │   │       └── 📄 analytics-report.dto.ts
│   │   │
│   │   ├── 📁 conformance/                          # ➕ ADD - Conformance (Screen 10)
│   │   │   ├── 📄 conformance.module.ts
│   │   │   ├── 📄 conformance.controller.ts
│   │   │   ├── 📄 conformance.service.ts
│   │   │   ├── 📂 entities/
│   │   │   │   └── 📄 conformance-check.entity.ts
│   │   │   └── 📂 dto/
│   │   │       └── 📄 check-conformance.dto.ts
│   │   │
│   │   ├── 📁 corrigendum/                          # ➕ ADD - Corrigendum (Screen 11)
│   │   │   ├── 📄 corrigendum.module.ts
│   │   │   ├── 📄 corrigendum.controller.ts
│   │   │   ├── 📄 corrigendum.service.ts
│   │   │   ├── 📂 entities/
│   │   │   │   └── 📄 corrigendum.entity.ts
│   │   │   └── 📂 dto/
│   │   │       └── 📄 generate-corrigendum.dto.ts
│   │   │
│   │   ├── 📁 historical-data/                      # ✓ EXISTING - Historical Data (Unnumbered)
│   │   │   ├── 📄 historical-data.module.ts         # ✓ EXISTING
│   │   │   ├── 📄 historical-data.controller.ts     # ✓ EXISTING
│   │   │   ├── 📄 historical-data.service.ts        # ✓ EXISTING
│   │   │   ├── 📄 stub-roles.decorator.ts           # ✓ EXISTING
│   │   │   ├── 📂 entities/                         # ✓ EXISTING
│   │   │   │   ├── 📄 historical-data.entity.ts
│   │   │   │   ├── 📄 historical-document.entity.ts
│   │   │   │   ├── 📄 ai-reference.entity.ts
│   │   │   │   └── 📄 upload-history.entity.ts
│   │   │   └── 📂 dto/                              # ✓ EXISTING
│   │   │       ├── 📄 upload-data.dto.ts
│   │   │       └── 📄 upload-historical-data.dto.ts
│   │   │
│   │   ├── 📁 vectorization/                        # ✓ EXISTING - Vectorization
│   │   │   ├── 📄 vectorization.module.ts           # ✓ EXISTING
│   │   │   ├── 📄 vectorization.controller.ts       # ✓ EXISTING
│   │   │   ├── 📄 vectorization.service.ts          # ✓ EXISTING
│   │   │   ├── 📄 stub-decorators.d.ts              # ✓ EXISTING
│   │   │   └── 📂 entities/                         # ✓ EXISTING
│   │   │       └── 📄 vectorization-log.entity.ts
│   │   │
│   │   ├── 📁 admin/                                # ✓ EXISTING - Admin (Screen 06)
│   │   │   ├── 📄 admin.module.ts                   # ✓ EXISTING
│   │   │   └── 📂 controllers/                      # ✓ EXISTING
│   │   │       └── 📄 admin-vectorization.controller.ts
│   │   │
│   │   ├── 📁 jobs/                                 # ✓ EXISTING - Background Jobs
│   │   │   ├── 📄 jobs.module.ts                    # ✓ EXISTING
│   │   │   └── 📄 query-vectorization.job.ts        # ✓ EXISTING
│   │   │
│   │   ├── 📁 python-rag-client/                    # ➕ ADD - RAG Service HTTP Client
│   │   │   ├── 📄 python-rag.service.ts
│   │   │   └── 📄 python-rag.module.ts
│   │   │
│   │   ├── 📁 common/                               # ➕ ADD - Shared Utilities
│   │   │   ├── 📂 decorators/
│   │   │   │   ├── 📄 roles.decorator.ts
│   │   │   │   └── 📄 current-user.decorator.ts
│   │   │   ├── 📂 filters/
│   │   │   │   ├── 📄 http-exception.filter.ts
│   │   │   │   └── 📄 all-exceptions.filter.ts
│   │   │   ├── 📂 interceptors/
│   │   │   │   ├── 📄 logging.interceptor.ts
│   │   │   │   └── 📄 transform.interceptor.ts
│   │   │   ├── 📂 pipes/
│   │   │   │   └── 📄 validation.pipe.ts
│   │   │   └── 📂 middleware/
│   │   │       └── 📄 logger.middleware.ts
│   │   │
│   │   └── 📁 migrations/                           # ✓ EXISTING - Database Migrations
│   │       └── 📄 1705847291000-AddVectorizationSupport.ts
│   │
│   ├── 📁 dist/                                     # ✓ EXISTING - Compiled JS
│   ├── 📁 test/                                     # ✓ EXISTING - Tests
│   ├── 📁 migration-fix/                            # ✓ EXISTING - Migration fixes
│   ├── 📁 uploads/                                  # ✓ EXISTING - Uploads
│   └── 📁 node_modules/                             # ✓ EXISTING - Dependencies
│
├── 📁 frontend/                                     # 🔄 REORGANIZE - Next.js Frontend
│   │
│   ├── 📄 package.json                              # ✓ EXISTING
│   ├── 📄 package-lock.json                         # ✓ EXISTING
│   ├── 📄 next.config.js                            # ✓ EXISTING
│   ├── 📄 next-env.d.ts                             # ✓ EXISTING
│   ├── 📄 tsconfig.json                             # ✓ EXISTING
│   ├── 📄 tailwind.config.js                        # ✓ EXISTING
│   ├── 📄 postcss.config.js                         # ✓ EXISTING
│   │
│   ├── 📁 src/                                      # ➕ ADD - Source directory
│   │   │
│   │   ├── 📁 app/                                  # 🔄 REORGANIZE - App Router
│   │   │   │
│   │   │   ├── 📄 page.tsx                          # ✓ EXISTING - Home page
│   │   │   ├── 📄 layout.tsx                        # ✓ EXISTING - Root layout
│   │   │   ├── 📄 globals.css                       # ✓ EXISTING - Global styles
│   │   │   │
│   │   │   ├── 📁 (auth)/                           # ➕ ADD - Auth Route Group
│   │   │   │   ├── 📄 layout.tsx
│   │   │   │   ├── 📂 login/                        # Screen 01
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📂 register/
│   │   │   │       └── 📄 page.tsx
│   │   │   │
│   │   │   ├── 📁 (vendor)/                         # ➕ ADD - Vendor Route Group
│   │   │   │   ├── 📄 layout.tsx
│   │   │   │   ├── 📂 dashboard/                    # Screen 02
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📂 query-submission/             # Screen 03
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📂 chatbot/                      # Screen 04
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📂 query-history/                # Screen 05
│   │   │   │       └── 📄 page.tsx
│   │   │   │
│   │   │   ├── 📁 (admin)/                          # 🔄 REORGANIZE - Admin Route Group
│   │   │   │   ├── 📄 layout.tsx
│   │   │   │   ├── 📂 dashboard/                    # Screen 06
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📂 prebid-query/                 # Screen 07 (✓ EXISTING)
│   │   │   │   │   ├── 📄 page.tsx
│   │   │   │   │   └── 📂 [id]/
│   │   │   │   │       └── 📄 page.tsx
│   │   │   │   ├── 📂 document-generation/          # Screen 08
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📂 analytics/                    # Screen 09 (✓ EXISTING)
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📂 conformance-checker/          # Screen 10
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📂 corrigendum/                  # Screen 11
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📂 historical-data/              # Unnumbered
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📂 vectorization-control/        # ✓ EXISTING
│   │   │   │       ├── 📄 page.tsx
│   │   │   │       └── 📄 layout.tsx
│   │   │   │
│   │   │   └── 📁 (shared)/                         # ➕ ADD - Shared Route Group
│   │   │       ├── 📄 layout.tsx
│   │   │       ├── 📂 document-viewer/              # Screen 12
│   │   │       │   └── 📄 page.tsx
│   │   │       └── 📂 help/                         # Screen 13
│   │   │           └── 📄 page.tsx
│   │   │
│   │   ├── 📁 components/                           # 🔄 ENHANCE - Components
│   │   │   ├── 📄 Navbar.tsx                        # ✓ EXISTING
│   │   │   ├── 📄 QueryCard.tsx                     # ✓ EXISTING
│   │   │   ├── 📄 StatCard.tsx                      # ✓ EXISTING
│   │   │   ├── 📄 VectorizationControl.tsx          # ✓ EXISTING
│   │   │   ├── 📄 QueryList.tsx                     # ✓ EXISTING
│   │   │   ├── 📄 QueryDetails.tsx                  # ✓ EXISTING
│   │   │   ├── 📄 AdminPanel.tsx                    # ✓ EXISTING
│   │   │   ├── 📄 LoadingSpinner.tsx                # ✓ EXISTING
│   │   │   │
│   │   │   ├── 📂 ui/                               # ➕ ADD - UI Components
│   │   │   │   ├── 📄 button.tsx
│   │   │   │   ├── 📄 card.tsx
│   │   │   │   ├── 📄 dialog.tsx
│   │   │   │   ├── 📄 input.tsx
│   │   │   │   ├── 📄 select.tsx
│   │   │   │   ├── 📄 table.tsx
│   │   │   │   └── 📄 tabs.tsx
│   │   │   │
│   │   │   ├── 📂 vendor/                           # ➕ ADD - Vendor Components
│   │   │   │   ├── 📄 DashboardStats.tsx
│   │   │   │   ├── 📄 RFPCard.tsx
│   │   │   │   ├── 📄 QueryForm.tsx
│   │   │   │   └── 📄 ChatbotWidget.tsx
│   │   │   │
│   │   │   ├── 📂 admin/                            # 🔄 ENHANCE - Admin Components
│   │   │   │   ├── 📄 DocumentUploadModal.tsx
│   │   │   │   ├── 📄 QueryReviewPanel.tsx
│   │   │   │   ├── 📄 AIResponseEditor.tsx
│   │   │   │   └── 📄 AnalyticsDashboard.tsx
│   │   │   │
│   │   │   └── 📂 shared/                           # ➕ ADD - Shared Components
│   │   │       ├── 📄 Header.tsx
│   │   │       ├── 📄 Footer.tsx
│   │   │       └── 📄 ErrorBoundary.tsx
│   │   │
│   │   ├── 📁 services/                             # ✓ EXISTING - API Services
│   │   │   ├── 📄 api.ts                            # ✓ EXISTING
│   │   │   ├── 📄 queryService.ts                   # ✓ EXISTING
│   │   │   ├── 📄 vectorizationService.ts           # ✓ EXISTING
│   │   │   └── 📄 adminService.ts                   # ✓ EXISTING
│   │   │
│   │   ├── 📁 hooks/                                # ✓ EXISTING - React Hooks
│   │   │   ├── 📄 useQueries.ts                     # ✓ EXISTING
│   │   │   ├── 📄 useVectorization.ts               # ✓ EXISTING
│   │   │   └── 📄 useApi.ts                         # ✓ EXISTING
│   │   │
│   │   ├── 📁 lib/                                  # ✓ EXISTING - Utilities
│   │   │   ├── 📄 utils.ts                          # ✓ EXISTING
│   │   │   ├── 📄 constants.ts                      # ✓ EXISTING
│   │   │   └── 📄 api-client.ts                     # ✓ EXISTING
│   │   │
│   │   ├── 📁 types/                                # ✓ EXISTING - TypeScript Types
│   │   │   ├── 📄 query.types.ts                    # ✓ EXISTING
│   │   │   ├── 📄 vectorization.types.ts            # ✓ EXISTING
│   │   │   └── 📄 api.types.ts                      # ✓ EXISTING
│   │   │
│   │   └── 📁 styles/                               # ✓ EXISTING - Styles
│   │       ├── 📄 globals.css                       # ✓ EXISTING
│   │       └── 📄 components.css                    # ✓ EXISTING
│   │
│   ├── 📁 public/                                   # ✓ EXISTING - Static Assets
│   │   ├── 📄 favicon.ico                           # ✓ EXISTING
│   │   ├── 📄 logo.png                              # ✓ EXISTING
│   │   └── 📂 images/                               # ✓ EXISTING
│   │
│   ├── 📁 .next/                                    # ✓ EXISTING - Build Output
│   └── 📁 node_modules/                             # ✓ EXISTING - Dependencies
│
├── 📁 python-rag/                                   # 🔄 ENHANCED - Python RAG Services
│   │
│   ├── 📁 shared/                                   # ➕ ADD - Shared Infrastructure
│   │   ├── 📄 __init__.py
│   │   │
│   │   ├── 📂 vector_db/                            # Vector DB Operations
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 chroma_service.py                 # ChromaDB client
│   │   │   ├── 📄 chromadb_client.py                # ✓ EXISTING (merge)
│   │   │   └── 📄 base_vector_db.py
│   │   │
│   │   ├── 📂 document_processing/                  # Document Processing
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 document_processor.py
│   │   │
│   │   ├── 📂 embeddings/                           # Embedding Services
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 embedding_service.py              # ✓ EXISTING (from screen07)
│   │   │   ├── 📄 openai_embeddings.py
│   │   │   └── 📄 local_embeddings.py
│   │   │
│   │   ├── 📂 llm_utils/                            # LLM Utilities
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 ollama_client.py                  # ✓ EXISTING
│   │   │   ├── 📄 openai_client.py
│   │   │   └── 📄 prompt_templates.py
│   │   │
│   │   ├── 📂 models/                               # Pydantic Models
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 schemas.py
│   │   │
│   │   └── 📂 utils/                                # Common Utilities
│   │       ├── 📄 __init__.py
│   │       ├── 📄 common_utils.py                   # ✓ EXISTING
│   │       ├── 📄 logger_config.py                  # ✓ EXISTING
│   │       └── 📄 constants.py                      # ✓ EXISTING
│   │
│   ├── 📁 screen04-chatbot/                         # ➕ ADD - Chatbot Service (Port 8001)
│   │   ├── 📄 main.py
│   │   ├── 📄 chatbot_agent.py
│   │   ├── 📄 conversation_manager.py
│   │   ├── 📄 requirements.txt
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 .env
│   │   └── 📄 .env.example
│   │
│   ├── 📁 screen07-history-retriever/               # ✓ EXISTING - History Retriever (Port 8000)
│   │   ├── 📄 main.py                               # ✓ EXISTING
│   │   ├── 📄 .env                                  # ✓ EXISTING
│   │   ├── 📄 .env.example                          # ✓ EXISTING
│   │   ├── 📄 requirements.txt                      # ✓ EXISTING
│   │   ├── 📄 rag_service.py                        # ✓ EXISTING
│   │   ├── 📄 vector_store.py                       # ✓ EXISTING
│   │   ├── 📄 embedding_service.py                  # ✓ EXISTING (move to shared/)
│   │   ├── 📄 document_processor.py                 # ✓ EXISTING (move to shared/)
│   │   ├── 📄 config.py                             # ✓ EXISTING
│   │   ├── 📄 models.py                             # ✓ EXISTING
│   │   ├── 📄 utils.py                              # ✓ EXISTING
│   │   ├── 📂 chroma_db/                            # ✓ EXISTING - Vector DB
│   │   ├── 📂 uploads/                              # ✓ EXISTING - Uploads
│   │   └── 📂 logs/                                 # ✓ EXISTING - Logs
│   │       └── 📄 screen07.log
│   │
│   ├── 📁 screen08-chief-engineer/                  # ✓ EXISTING - Chief Engineer (Port 8001)
│   │   ├── 📄 main.py                               # ✓ EXISTING
│   │   ├── 📄 .env                                  # ✓ EXISTING
│   │   ├── 📄 .env.example                          # ✓ EXISTING
│   │   ├── 📄 requirements.txt                      # ✓ EXISTING
│   │   ├── 📄 chief_engineer_agent.py               # ✓ EXISTING
│   │   ├── 📄 workflow_manager.py                   # ✓ EXISTING
│   │   ├── 📄 query_processor.py                    # ✓ EXISTING
│   │   ├── 📄 vector_store.py                       # ✓ EXISTING
│   │   ├── 📄 embedding_service.py                  # ✓ EXISTING (move to shared/)
│   │   ├── 📄 llm_service.py                        # ✓ EXISTING
│   │   ├── 📄 config.py                             # ✓ EXISTING
│   │   ├── 📄 models.py                             # ✓ EXISTING
│   │   ├── 📄 utils.py                              # ✓ EXISTING
│   │   ├── 📂 query_db/                             # ✓ EXISTING - Query Vector DB
│   │   └── 📂 logs/                                 # ✓ EXISTING - Logs
│   │       └── 📄 screen08.log
│   │
│   ├── 📁 screen10-conformance/                     # ➕ ADD - Conformance Checker (Port 8004)
│   │   ├── 📄 main.py
│   │   ├── 📄 conformance_agent.py
│   │   ├── 📄 rule_engine.py
│   │   ├── 📄 requirements.txt
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 .env
│   │   └── 📄 .env.example
│   │
│   ├── 📁 historical-data-service/                  # ➕ ADD - Historical Data (Port 8005)
│   │   ├── 📄 main.py
│   │   ├── 📄 requirements.txt
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 README.md
│   │   ├── 📄 .env
│   │   ├── 📄 .env.example
│   │   └── 📂 chroma_db/
│   │
│   └── 📄 docker-compose.yml                        # ➕ ADD - Services Orchestration
│
├── 📁 nhai-venv/                                    # ✓ EXISTING - Python Virtual Env
│   ├── 📄 pyvenv.cfg                                # ✓ EXISTING
│   ├── 📂 Scripts/                                  # ✓ EXISTING
│   ├── 📂 Lib/                                      # ✓ EXISTING
│   └── 📂 site-packages/                            # ✓ EXISTING
│
├── 📁 database-backups/                             # ✓ EXISTING - DB Backups
│   ├── 📄 nhai_tender_db_backup_20260122_154038.sql # ✓ EXISTING
│   ├── 📄 add_missing_columns_migration.sql         # ✓ EXISTING
│   └── 📄 rollback_migration.sql                    # ✓ EXISTING
│
├── 📁 uploads/                                      # ✓ EXISTING - Global Uploads
│   ├── 📂 documents/                                # ✓ EXISTING
│   ├── 📂 historical/                               # ✓ EXISTING
│   └── 📂 temp/                                     # ✓ EXISTING
│
├── 📁 logs/                                         # ✓ EXISTING - Application Logs
│   ├── 📄 backend.log                               # ✓ EXISTING
│   ├── 📄 frontend.log                              # ✓ EXISTING
│   ├── 📄 screen07.log                              # ✓ EXISTING
│   ├── 📄 screen08.log                              # ✓ EXISTING
│   ├── 📄 vectorization.log                         # ✓ EXISTING
│   └── 📄 error.log                                 # ✓ EXISTING
│
├── 📁 tests/                                        # ✓ EXISTING - Test Suites
│   ├── 📂 backend/                                  # ✓ EXISTING
│   ├── 📂 frontend/                                 # ✓ EXISTING
│   └── 📂 integration/                              # ✓ EXISTING
│
├── 📁 Staging/                                      # ✓ EXISTING - Staging Environment
│   ├── 📂 admin-panel-vectorize/                    # ✓ EXISTING
│   ├── 📂 document-processing-history-upload/       # ✓ EXISTING
│   └── 📂 experimental/                             # ✓ EXISTING
│
├── 📁 rag-screen7-8-execution/                      # ✓ EXISTING - RAG Execution Scripts
│   ├── 📄 WINDOWS_EXECUTION_GUIDE.md               # ✓ EXISTING
│   ├── 📄 WINDOWS_QUICK_START.md                    # ✓ EXISTING
│   ├── 📄 WINDOWS_FILES_SUMMARY.md                  # ✓ EXISTING
│   ├── 📄 setup-windows.bat                         # ✓ EXISTING
│   ├── 📄 START_BOTH_SERVICES.bat                   # ✓ EXISTING
│   ├── 📄 START_SCREEN7.bat                         # ✓ EXISTING
│   └── 📄 START_SCREEN8.bat                         # ✓ EXISTING
│
├── 📁 rag-screen7-8-ollama-openai/                  # ✓ EXISTING - Dual Provider Config
│   ├── 📄 OLLAMA_OPENAI_DUAL_SETUP.md              # ✓ EXISTING
│   ├── 📄 QUICK_SWITCH_REFERENCE.md                 # ✓ EXISTING
│   ├── 📄 screen07-env-example-dual.txt             # ✓ EXISTING
│   └── 📄 screen08-env-example-dual.txt             # ✓ EXISTING
│
└── 📁 requirements-setup/                           # ✓ EXISTING - Requirements Management
    ├── 📄 PYTHON_SETUP_GUIDE.md                     # ✓ EXISTING
    ├── 📄 requirements.txt                          # ✓ EXISTING
    ├── 📄 requirements-minimal.txt                  # ✓ EXISTING
    ├── 📄 requirements-screen7.txt                  # ✓ EXISTING
    ├── 📄 requirements-screen8.txt                  # ✓ EXISTING
    ├── 📄 install-python-deps.bat                   # ✓ EXISTING
    └── 📄 install-python-deps.sh                    # ✓ EXISTING
```

---

## 🔌 Port Allocation (Standardized)

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| **Frontend (Next.js)** | 3000 | 🔄 Change from 3001 | User-facing UI |
| **Backend (NestJS)** | 3001 | 🔄 Change from 3000 | REST API server |
| **PostgreSQL** | 5432 | ✓ Keep | Primary database |
| **Redis** | 6379 | ➕ Add | Queue & cache |
| **Screen 07: History Retriever** | 8000 | ✓ Keep | Historical data RAG |
| **Screen 08: Chief Engineer** | 8001 | ✓ Keep | Document generation |
| **Screen 04: Chatbot** | 8002 | ➕ Add | Interactive chatbot |
| **Screen 10: Conformance** | 8004 | ➕ Add | Conformance checking |
| **Historical Data Service** | 8005 | ➕ Add | Document processing |
| **Ollama (Optional)** | 11434 | ➕ Add | Local LLM server |

---

## 📊 Complete Screen Mapping

| Screen | Name | Type | Status | Frontend Route | Backend Module | Python Service |
|--------|------|------|--------|----------------|----------------|----------------|
| **01** | Login | Auth | ➕ TODO | `/login` | auth/ | — |
| **02** | Vendor Dashboard | Vendor | ➕ TODO | `/vendor/dashboard` | vendors/ | — |
| **03** | Query Submission | Vendor | ➕ TODO | `/vendor/query-submission` | queries/ | — |
| **04** | Interactive Chatbot | Vendor | ➕ TODO | `/vendor/chatbot` | chatbot/ | screen04-chatbot (8002) |
| **05** | Query History | Vendor | ➕ TODO | `/vendor/query-history` | query-history/ | — |
| **06** | Admin Dashboard | Admin | ➕ TODO | `/admin/dashboard` | admin/ | — |
| **07** | Pre-bid Query Mgmt | Admin | ✓ DONE | `/admin/prebid-query` | prebid-query/ | screen07-history-retriever (8000) |
| **08** | Document Generation | Admin | ✓ DONE | `/admin/document-generation` | documents/ | screen08-chief-engineer (8001) |
| **09** | Analytics Dashboard | Admin | ✓ PARTIAL | `/admin/analytics` | analytics/ | — |
| **10** | Conformance Checker | Admin | ➕ TODO | `/admin/conformance-checker` | conformance/ | screen10-conformance (8004) |
| **11** | Corrigendum Generator | Admin | ➕ TODO | `/admin/corrigendum` | corrigendum/ | — |
| **12** | Document Viewer | Shared | ➕ TODO | `/document-viewer` | documents/ | — |
| **13** | Help & Documentation | Shared | ➕ TODO | `/help` | — | — |
| **—** | Historical Data Mgmt | Admin | ✓ DONE | `/admin/historical-data` | historical-data/ | historical-data-service (8005) |

**Legend:**
- ✓ DONE = Fully implemented
- ✓ PARTIAL = Partially implemented
- ➕ TODO = To be implemented

---

## 🔄 Data Flow Architecture

### Overview Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTIONS                        │
└─────────────┬───────────────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐     ┌─────────────┐
│ Vendor  │     │    Admin    │
│ Portal  │     │   Portal    │
│(Screens │     │ (Screens    │
│ 01-05)  │     │  06-13)     │
└────┬────┘     └──────┬──────┘
     │                 │
     │    Frontend     │
     │   (Next.js)     │
     │   Port 3000     │
     └────────┬────────┘
              │
              │ HTTP API Calls
              ▼
     ┌────────────────┐
     │    Backend     │◄──────┐
     │   (NestJS)     │       │
     │   Port 3001    │       │
     └───┬────────┬───┘       │
         │        │            │
         │        │    ┌───────┴────────┐
         │        └───►│  PostgreSQL    │
         │             │  Port 5432     │
         │             └────────────────┘
         │
         │        ┌────────────────┐
         ├───────►│     Redis      │
         │        │  Port 6379     │
         │        └────────────────┘
         │
         │ RAG Service Calls
         │
    ┌────┴────────────────────────────────────┐
    │                                          │
    │        Python RAG Services               │
    │                                          │
    ├──────────────┬──────────────┬───────────┤
    │              │              │           │
    ▼              ▼              ▼           ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│Screen 07│  │Screen 08│  │Screen 04│  │Screen 10│
│History  │  │Chief    │  │Chatbot  │  │Conform  │
│8000     │  │Engineer │  │8002     │  │8004     │
│         │  │8001     │  │         │  │         │
└────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
     │            │            │            │
     │            │            │            │
     └────────────┴────────────┴────────────┘
                  │
                  ▼
          ┌───────────────┐
          │   ChromaDB    │
          │ (Vector Store)│
          └───────────────┘
```

### Screen-by-Screen Data Flow

#### **Screen 01: Login → Authentication**

```
User Login Form
    ↓
Frontend (Next.js)
    ↓ POST /api/auth/login
Backend: auth.controller.ts
    ↓
auth.service.ts → Validate credentials
    ↓
PostgreSQL: users table
    ↓
Generate JWT token
    ↓
Return: { token, user, role }
    ↓
Frontend: Store token, Redirect
    ↓
Vendor → Screen 02 (Dashboard)
Admin  → Screen 06 (Dashboard)
```

#### **Screen 02: Vendor Dashboard**

```
Vendor Login
    ↓
Frontend: /vendor/dashboard
    ↓ GET /api/vendors/dashboard-stats
Backend: vendors.controller.ts
    ↓
vendors.service.ts → Fetch statistics
    ↓
PostgreSQL: queries
│         rfps
│         documents
    ↓
Return: {
  activeQueries: 12,
  pendingRFPs: 3,
  recentActivity: [...]
}
    ↓
Frontend: Display stats cards
```

#### **Screen 03: Query Submission → Screen 07 (RAG Processing)**

```
Vendor submits query
    ↓
Frontend: /vendor/query-submission
    ↓ POST /api/queries/submit
Backend: queries.controller.ts
    ↓
queries.service.ts
    ├─► Save to PostgreSQL (query entity)
    │   Status: PENDING
    │
    └─► Background Job: query-vectorization.job.ts
            ↓
        POST http://localhost:8000/api/rag/ingest
            ↓
        Screen 07 (Python RAG)
            ├─► Extract text from query
            ├─► Generate embeddings
            └─► Store in ChromaDB
                ↓
            Return: { success, vector_id }
                ↓
        Update PostgreSQL
        Status: VECTORIZED
            ↓
        Trigger: Admin notification
        Screen 07 ready for semantic search
```

#### **Screen 04: Chatbot (Interactive Q&A)**

```
Vendor opens chatbot
    ↓
Frontend: /vendor/chatbot
    ↓
WebSocket connection established
    ↓
User types: "What is the bid deadline?"
    ↓ WS message
Backend: chatbot.controller.ts
    ↓
chatbot.service.ts
    ↓ POST http://localhost:8002/api/chat
Screen 04 RAG (Python)
    ├─► Generate query embedding
    ├─► Search ChromaDB for similar Q&A
    ├─► Retrieve RFP context
    └─► LLM generates response
        ↓
    Return: {
      response: "Based on RFP-2024-145...",
      confidence: 0.92,
      sources: ["RFP-2024-145", "Corrigendum-01"]
    }
        ↓
    WebSocket → Frontend
        ↓
    Display: Chat message with sources
```

#### **Screen 05: Query History**

```
Vendor views history
    ↓
Frontend: /vendor/query-history
    ↓ GET /api/query-history?vendorId=123
Backend: query-history.controller.ts
    ↓
query-history.service.ts
    ↓
PostgreSQL: SELECT * FROM queries
            WHERE vendor_id = 123
            ORDER BY created_at DESC
    ↓
Return: [
  { id, query_text, status, response, created_at }
]
    ↓
Frontend: Display table with filters
```

#### **Screen 06: Admin Dashboard**

```
Admin login
    ↓
Frontend: /admin/dashboard
    ↓ GET /api/admin/dashboard-stats
Backend: admin.controller.ts
    ↓
admin.service.ts → Aggregate stats
    ↓
PostgreSQL: queries
│         historical_data
│         vectorization_logs
│         rfps
    ↓
Return: {
  pendingQueries: 45,
  processedToday: 120,
  vectorizationRate: 0.98,
  activeRFPs: 12
}
    ↓
Frontend: Display admin overview
```

#### **Screen 07: Pre-bid Query Management (History Retriever)**

```
Admin reviews vendor query
    ↓
Frontend: /admin/prebid-query/[id]
    ↓ GET /api/prebid-query/:id
Backend: prebid-query.controller.ts
    ↓
prebid-query.service.ts
    ├─► Fetch query from PostgreSQL
    │   Status: PENDING_REVIEW
    │
    └─► POST http://localhost:8000/api/rag/search
        ↓
    Screen 07 (Python RAG)
        ├─► Generate query embedding
        ├─► Semantic search in ChromaDB
        │   (historical Q&A, RFPs, corrigenda)
        │
        └─► Return top 5 similar matches:
            [
              {
                content: "Past query about timelines",
                similarity: 0.94,
                source: "RFP-2023-NH-145-QA.csv",
                response: "Bid submission: 30 days..."
              }
            ]
            ↓
        Backend: prebid-query.service.ts
            ↓
        POST http://localhost:8000/api/rag/generate-response
            ↓
        Screen 07: Use past Q&A as context
                   Generate AI response
            ↓
        Return: {
          suggested_response: "Based on similar...",
          confidence: 0.89,
          references: [...]
        }
            ↓
        Frontend: Display AI response
                 Admin can edit/approve
            ↓
        Admin clicks "Approve"
            ↓
        PUT /api/prebid-query/:id/approve
            ↓
        Update PostgreSQL
        Status: APPROVED
            ↓
        Vendor notification sent
```

#### **Screen 08: Document Generation (Chief Engineer)**

```
Admin requests document generation
    ↓
Frontend: /admin/document-generation
    ↓
Select: Type (Corrigendum, Response Doc, Report)
Input: Parameters
    ↓ POST /api/documents/generate
Backend: documents.controller.ts
    ↓
documents.service.ts
    ↓ POST http://localhost:8001/api/generate
Screen 08 (Python RAG)
    ↓
chief_engineer_agent.py
    │
    ├─► Step 1: Validate input parameters
    ├─► Step 2: Gather context from ChromaDB
    │   (Semantic search for relevant docs)
    │
    ├─► Step 3: Query processing
    │   workflow_manager.py
    │
    ├─► Step 4: LLM generation
    │   llm_service.py (Ollama/OpenAI)
    │
    ├─► Step 5: Format document
    │   (PDF/DOCX generation)
    │
    └─► Step 6: Quality validation
        ↓
    Return: {
      document_url: "/downloads/corrigendum_001.pdf",
      metadata: { ... },
      confidence: 0.91
    }
        ↓
    Backend: Save to PostgreSQL
             Save file to uploads/
        ↓
    Frontend: Display download link
              Preview document
```

#### **Screen 09: Analytics Dashboard**

```
Admin views analytics
    ↓
Frontend: /admin/analytics
    ↓ GET /api/analytics/dashboard
Backend: analytics.controller.ts
    ↓
analytics.service.ts
    ├─► Query PostgreSQL for metrics
    │   (queries, responses, timelines)
    │
    ├─► GET http://localhost:8000/api/statistics
    │   (RAG service statistics)
    │
    └─► Aggregate data:
        {
          queryTrends: [...],
          categoryDistribution: {...},
          responseTime: { avg: 45s },
          vectorizationRate: 0.98,
          aiAccuracy: 0.87
        }
        ↓
    Frontend: Display charts
              (Charts.js/Recharts)
```

#### **Screen 10: Conformance Checker**

```
Admin uploads RFP for conformance check
    ↓
Frontend: /admin/conformance-checker
    ↓ POST /api/conformance/check (with file)
Backend: conformance.controller.ts
    ↓
conformance.service.ts
    ├─► Save RFP to uploads/
    │
    └─► POST http://localhost:8004/api/conformance/validate
        ↓
    Screen 10 (Python RAG)
        ├─► Load RFP document
        ├─► Load SBD templates from ChromaDB
        ├─► Extract clauses from RFP
        ├─► Rule engine: Compare with SBD
        │   rule_engine.py
        │
        └─► Generate conformance report:
            {
              overallScore: 0.89,
              missingClauses: [
                "Payment terms clause missing",
                "Penalty clause incomplete"
              ],
              deviations: [...],
              recommendations: [...]
            }
            ↓
        Backend: Save report to PostgreSQL
        ↓
    Frontend: Display conformance report
              Highlight issues
              Generate corrigendum button
```

#### **Screen 11: Corrigendum Generator**

```
Admin generates corrigendum
    ↓
Frontend: /admin/corrigendum
    ↓
Input: RFP number, Changes required
    ↓ POST /api/corrigendum/generate
Backend: corrigendum.controller.ts
    ↓
corrigendum.service.ts
    ↓ POST http://localhost:8001/api/generate
    (Uses Screen 08 Chief Engineer)
    ↓
Screen 08: Generate corrigendum document
    ├─► Load original RFP
    ├─► Apply changes
    ├─► Format as official corrigendum
    └─► Generate PDF
        ↓
    Return: { document_url, version: "Corr-01" }
        ↓
    Backend: Save to PostgreSQL
             Link to original RFP
        ↓
    Frontend: Display corrigendum
              Publish to vendors
```

#### **Screen 12: Document Viewer**

```
User (Vendor/Admin) clicks document link
    ↓
Frontend: /document-viewer?id=123
    ↓ GET /api/documents/:id
Backend: documents.controller.ts
    ↓
documents.service.ts
    ├─► Check permissions
    ├─► Fetch document metadata from PostgreSQL
    └─► Return: { url, type, metadata }
        ↓
    Frontend: Render document
              PDF.js for PDFs
              DOCX preview for Word docs
              Markdown renderer
```

#### **Screen 13: Help & Documentation**

```
User clicks Help
    ↓
Frontend: /help
    ↓
Static content rendering
    ├─► FAQs
    ├─► User guides
    ├─► Video tutorials
    └─► Contact support
        ↓
    Optional: Search functionality
        ↓ GET /api/help/search?q=query
    Backend: Search documentation database
        ↓
    Frontend: Display results
```

#### **Historical Data Management (Unnumbered Admin Screen)**

```
Admin uploads historical documents
    ↓
Frontend: /admin/historical-data
    ↓
Upload files:
  - RFP documents (PDF/DOCX)
  - Q&A pairs (CSV/XLSX)
  - Corrigenda (PDF/DOCX)
    ↓ POST /api/historical-data/upload (multipart)
Backend: historical-data.controller.ts
    ↓
historical-data.service.ts
    ├─► Save files to uploads/historical/
    ├─► Save metadata to PostgreSQL
    │   (historical_documents table)
    │
    └─► Background Job:
        POST http://localhost:8005/api/process-document
            ↓
        Historical Data Service (Python)
            ├─► Extract text (PDF/DOCX)
            ├─► Parse CSV Q&A pairs
            ├─► Generate embeddings
            │   (OpenAI or local Sentence Transformers)
            │
            └─► Store in ChromaDB
                Collection: "historical_data"
                Metadata: {
                  document_id,
                  rfp_number,
                  type: "RFP" | "QA" | "CORRIGENDUM",
                  upload_date,
                  title
                }
                ↓
            Return: {
              success: true,
              chunks_processed: 45,
              vector_ids: [...]
            }
                ↓
        Backend: Update PostgreSQL
                Status: PROCESSED
                ↓
        Frontend: Show success notification
                  Document now searchable in Screen 07
```

### Cross-Service Integration

```
┌────────────────────────────────────────────────────────────┐
│              Cross-Service Communication                    │
└────────────────────────────────────────────────────────────┘

Backend (NestJS) ←→ Screen 07 (History Retriever)
  └─► Use Case: Query submission, Semantic search
      Protocol: HTTP REST API
      Data: JSON (queries, search requests)

Backend (NestJS) ←→ Screen 08 (Chief Engineer)
  └─► Use Case: Document generation
      Protocol: HTTP REST API
      Data: JSON (generation requests, documents)

Backend (NestJS) ←→ Screen 04 (Chatbot)
  └─► Use Case: Real-time chat, RFP Q&A
      Protocol: WebSocket + HTTP
      Data: Chat messages, context

Backend (NestJS) ←→ Screen 10 (Conformance)
  └─► Use Case: RFP validation
      Protocol: HTTP REST API
      Data: RFP documents, validation reports

Backend (NestJS) ←→ Historical Data Service
  └─► Use Case: Document ingestion
      Protocol: HTTP REST API
      Data: Uploaded files, processing status

All Python Services ←→ ChromaDB
  └─► Use Case: Vector storage and retrieval
      Protocol: ChromaDB Python Client
      Data: Embeddings, metadata, documents

Python Services ←→ shared/ modules
  └─► Use Case: Common utilities
      Protocol: Python imports
      Data: Embeddings, LLM calls, utilities
```

---

## 📋 Implementation Checklist

### Phase 1: Core Infrastructure (Weeks 1-2)

- [ ] ✅ **DONE:** Backend modules (queries, prebid-query, vectorization, historical-data)
- [ ] ✅ **DONE:** Screen 07 (History Retriever) Python service
- [ ] ✅ **DONE:** Screen 08 (Chief Engineer) Python service
- [ ] ✅ **DONE:** PostgreSQL database setup
- [ ] ✅ **DONE:** ChromaDB vector storage
- [ ] ➕ **TODO:** Create `python-rag/shared/` infrastructure
- [ ] ➕ **TODO:** Refactor duplicate code from Screen 07/08 to shared/
- [ ] ➕ **TODO:** Standardize port allocation (Backend:3001, Frontend:3000)

### Phase 2: Frontend Reorganization (Week 3)

- [ ] ➕ **TODO:** Migrate to route groups: (auth), (vendor), (admin), (shared)
- [ ] ➕ **TODO:** Implement Screen 01 (Login) UI
- [ ] ➕ **TODO:** Implement Screen 02 (Vendor Dashboard) UI
- [ ] ➕ **TODO:** Implement Screen 03 (Query Submission) UI
- [ ] ➕ **TODO:** Implement Screen 05 (Query History) UI
- [ ] ➕ **TODO:** Implement Screen 06 (Admin Dashboard) UI

### Phase 3: Missing Backend Modules (Week 4)

- [ ] ➕ **TODO:** Implement `auth/` module with JWT
- [ ] ➕ **TODO:** Implement `users/` module
- [ ] ➕ **TODO:** Implement `chatbot/` module (Screen 04)
- [ ] ➕ **TODO:** Implement `query-history/` module (Screen 05)
- [ ] ➕ **TODO:** Implement `analytics/` module (Screen 09)
- [ ] ➕ **TODO:** Implement `conformance/` module (Screen 10)
- [ ] ➕ **TODO:** Implement `corrigendum/` module (Screen 11)
- [ ] ➕ **TODO:** Implement `documents/` module (Screen 12)

### Phase 4: Additional Python Services (Week 5)

- [ ] ➕ **TODO:** Implement `screen04-chatbot/` service (Port 8002)
- [ ] ➕ **TODO:** Implement `screen10-conformance/` service (Port 8004)
- [ ] ➕ **TODO:** Implement `historical-data-service/` (Port 8005)
- [ ] ➕ **TODO:** Create Docker Compose for all Python services

### Phase 5: Frontend Screens (Weeks 6-7)

- [ ] ➕ **TODO:** Screen 04 (Interactive Chatbot) UI
- [ ] ✅ **PARTIAL:** Screen 09 (Analytics Dashboard) UI
- [ ] ➕ **TODO:** Screen 10 (Conformance Checker) UI
- [ ] ➕ **TODO:** Screen 11 (Corrigendum Generator) UI
- [ ] ➕ **TODO:** Screen 12 (Document Viewer) UI
- [ ] ➕ **TODO:** Screen 13 (Help & Documentation) UI

### Phase 6: Testing & Documentation (Week 8)

- [ ] ➕ **TODO:** E2E tests for all screens
- [ ] ➕ **TODO:** API integration tests
- [ ] ➕ **TODO:** Performance testing
- [ ] ➕ **TODO:** Update all documentation
- [ ] ➕ **TODO:** Create deployment guide
- [ ] ➕ **TODO:** User training materials

---

## 📊 Summary Statistics

### Implementation Status

| Category | Done | Partial | TODO | Total |
|----------|------|---------|------|-------|
| **Screens** | 2 | 1 | 11 | 14 |
| **Backend Modules** | 6 | 1 | 8 | 15 |
| **Python Services** | 2 | 0 | 3 | 5 |
| **Frontend Routes** | 3 | 1 | 10 | 14 |

### Effort Estimate

| Phase | Effort (Person-Weeks) | Status |
|-------|----------------------|--------|
| Phase 1: Core Infrastructure | 2 | ✅ 90% Complete |
| Phase 2: Frontend Reorganization | 1 | ➕ Not Started |
| Phase 3: Missing Backend Modules | 1 | ➕ Not Started |
| Phase 4: Additional Python Services | 1 | ➕ Not Started |
| Phase 5: Frontend Screens | 2 | ➕ 20% Complete |
| Phase 6: Testing & Documentation | 1 | ➕ Not Started |
| **TOTAL** | **8 weeks** | **30% Complete** |

---

## 🎯 Immediate Next Steps

1. **Standardize Port Allocation**
   - Switch Backend to port 3001
   - Switch Frontend to port 3000
   - Update all scripts and documentation

2. **Create Shared Python Infrastructure**
   - Extract common code from Screen 07 and 08
   - Create `python-rag/shared/` directory
   - Implement reusable modules

3. **Implement Authentication (Screen 01)**
   - Backend: auth module with JWT
   - Frontend: Login/register pages
   - Route protection middleware

4. **Implement Vendor Dashboard (Screen 02)**
   - Backend: vendors module
   - Frontend: Dashboard with stats
   - Integration with existing queries

5. **Complete Screen 09 (Analytics)**
   - Enhance existing partial implementation
   - Add comprehensive charts
   - Integrate RAG service statistics

---

**Document Version:** 3.0  
**Last Updated:** January 24, 2026  
**Status:** 🔄 Active Development (30% Complete)  
**Next Review:** After Phase 2 completion
