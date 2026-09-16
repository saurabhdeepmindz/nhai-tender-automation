# 🔄 SCREEN MAPPING CORRECTIONS - NHAI Project

## ⚠️ CRITICAL UPDATE REQUIRED

After reviewing the HTML mockup files, there are **significant discrepancies** between the documented project structure and the actual screen implementations.

---

## 📊 Screen Mapping Comparison

### ❌ OLD (Incorrect) Structure from Documents

| Screen # | OLD Name (from docs) | Issue |
|----------|---------------------|-------|
| 01 | Login | ✅ Correct |
| 02 | RFP Upload | ❌ WRONG |
| 03 | Query Submission | ✅ Correct |
| 04 | Query History | ❌ WRONG NUMBER |
| **05** | **Historical Data Management** | ❌ **WRONG - THIS IS AN ADMIN SCREEN, NOT VENDOR** |
| 06 | Admin Dashboard | ✅ Correct |
| 07 | Pre-bid Query Management | ✅ Correct |
| 08 | Corrigendum Generation | ❌ WRONG NAME |

### ✅ NEW (Correct) Structure from HTML Mockups

| Screen # | NEW Name (from HTML) | Type | Route | HTML File |
|----------|---------------------|------|-------|-----------|
| **01** | **Login** | Auth | `/login` | `screen_01_login.html` |
| **02** | **Vendor Dashboard** | Vendor | `/vendor/dashboard` | `screen_02_vendor_dashboard.html` |
| **03** | **Query Submission Form** | Vendor | `/vendor/query-submission` | `screen_03_query_submission.html` |
| **04** | **Interactive Chatbot** | Vendor | `/vendor/chatbot` | `screen_04_chatbot.html` |
| **05** | **Query History** | Vendor | `/vendor/query-history` | `screen_05_query_history.html` |
| **06** | **Admin Dashboard** | Admin | `/admin/dashboard` | `screen_06_admin_dashboard.html` |
| **07** | **Pre-bid Query Management** | Admin | `/admin/pre-bid-query` | `screen_07_prebid_query_management.html` |
| **08** | **Document Generation** | Admin | `/admin/document-generation` | `screen_08_document_generation.html` |
| **09** | **Analytics Dashboard** | Admin | `/admin/analytics` | `screen_09_analytics_dashboard.html` |
| **10** | **Conformance Checker** | Admin | `/admin/conformance-checker` | `screen_10_conformance_checker.html` |
| **11** | **Corrigendum Generator** | Admin | `/admin/corrigendum` | `screen_11_corrigendum_generator.html` |
| **12** | **Document Viewer** | Shared | `/document-viewer` | `screen_12_document_viewer.html` |
| **13** | **Help & Documentation** | Shared | `/help` | `screen_13_help.html` |
| **—** | **Historical Data Management** | Admin | `/admin/historical-data` | `screen_historical_data_management.html` |

---

## 🔑 Key Changes Summary

### 1. Screen 02: RFP Upload → Vendor Dashboard
**OLD:** "RFP Upload"  
**NEW:** "Vendor Dashboard"  
**Impact:** The vendor dashboard is the main landing page for vendors, not just an upload screen.

### 2. Screen 04: NEW - Interactive Chatbot
**OLD:** Not in main sequence  
**NEW:** Screen 04 - Interactive Chatbot  
**Impact:** Chatbot is now a numbered screen in the vendor flow.

### 3. Screen 05: Historical Data Management → Query History
**OLD:** "Historical Data Management" (Admin feature)  
**NEW:** "Query History" (Vendor feature)  
**Impact:** **This is a MAJOR change!**
- Screen 05 is a **VENDOR** screen, not an admin screen
- Historical Data Management is a **separate admin screen** without a number

### 4. Screen 08: Corrigendum Generation → Document Generation
**OLD:** "Corrigendum Generation"  
**NEW:** "Document Generation" (broader scope)  
**Impact:** Screen 08 handles multiple document types, not just corrigenda.

### 5. New Screens Added (9-13)
**NEW Screens:**
- Screen 09: Analytics Dashboard
- Screen 10: Conformance Checker
- Screen 11: Corrigendum Generator (moved from screen 8)
- Screen 12: Document Viewer
- Screen 13: Help & Documentation

### 6. Historical Data Management: No Number Assignment
**Status:** Separate admin screen (unnumbered)  
**HTML File:** `screen_historical_data_management.html`  
**Purpose:** Admin-only screen for uploading historical RFPs, Q&A, and corrigenda

---

## 📁 Updated Frontend Folder Structure

### OLD Structure (Incorrect)
```
frontend/src/app/
├── (vendor)/
│   ├── dashboard/          # Was "RFP Upload"
│   ├── rfp-upload/
│   ├── query-submission/
│   └── query-history/
│
└── (admin)/
    ├── dashboard/
    ├── historical-data/    # Was Screen 05!
    └── pre-bid-query/
```

### NEW Structure (Correct)
```
frontend/src/app/
│
├── 📂 (auth)/
│   ├── login/                    # Screen 01
│   │   └── page.tsx
│   └── layout.tsx
│
├── 📂 (vendor)/
│   ├── dashboard/                # Screen 02 ✅ CHANGED FROM "RFP Upload"
│   │   └── page.tsx
│   ├── query-submission/         # Screen 03
│   │   └── page.tsx
│   ├── chatbot/                  # Screen 04 ✅ NEW
│   │   └── page.tsx
│   ├── query-history/            # Screen 05 ✅ MOVED FROM SCREEN 04
│   │   └── page.tsx
│   └── layout.tsx
│
├── 📂 (admin)/
│   ├── dashboard/                # Screen 06
│   │   └── page.tsx
│   ├── pre-bid-query/            # Screen 07
│   │   └── page.tsx
│   ├── document-generation/      # Screen 08 ✅ CHANGED FROM "Corrigendum"
│   │   └── page.tsx
│   ├── analytics/                # Screen 09 ✅ NEW
│   │   └── page.tsx
│   ├── conformance-checker/      # Screen 10 ✅ NEW
│   │   └── page.tsx
│   ├── corrigendum/              # Screen 11 ✅ MOVED FROM SCREEN 08
│   │   └── page.tsx
│   ├── historical-data/          # NO NUMBER ✅ MOVED FROM SCREEN 05
│   │   └── page.tsx
│   └── layout.tsx
│
├── 📂 (shared)/
│   ├── document-viewer/          # Screen 12 ✅ NEW
│   │   └── page.tsx
│   ├── help/                     # Screen 13 ✅ NEW
│   │   └── page.tsx
│   └── layout.tsx
│
├── layout.tsx
└── page.tsx
```

---

## 🗺️ Screen Flow Diagram

### Vendor Flow (Screens 01-05)
```
Screen 01: Login
    ↓
Screen 02: Vendor Dashboard ← Main vendor landing page
    ↓
    ├─→ Screen 03: Query Submission ← Submit new queries
    ├─→ Screen 04: Interactive Chatbot ← AI assistant
    └─→ Screen 05: Query History ← View past queries
```

### Admin Flow (Screens 06-13 + Historical Data)
```
Screen 01: Login
    ↓
Screen 06: Admin Dashboard ← Main admin landing page
    ↓
    ├─→ Screen 07: Pre-bid Query Management ← Review vendor queries
    ├─→ Screen 08: Document Generation ← Generate various documents
    ├─→ Screen 09: Analytics Dashboard ← View system analytics
    ├─→ Screen 10: Conformance Checker ← Check RFP conformance
    ├─→ Screen 11: Corrigendum Generator ← Generate corrigenda
    ├─→ Screen 12: Document Viewer ← View documents
    ├─→ Screen 13: Help & Documentation ← Help resources
    └─→ Historical Data Management ← Upload historical data
```

---

## 📝 Route Mapping Table

| Screen | Route | Component Path |
|--------|-------|----------------|
| 01 | `/login` | `app/(auth)/login/page.tsx` |
| 02 | `/vendor/dashboard` | `app/(vendor)/dashboard/page.tsx` |
| 03 | `/vendor/query-submission` | `app/(vendor)/query-submission/page.tsx` |
| 04 | `/vendor/chatbot` | `app/(vendor)/chatbot/page.tsx` |
| 05 | `/vendor/query-history` | `app/(vendor)/query-history/page.tsx` |
| 06 | `/admin/dashboard` | `app/(admin)/dashboard/page.tsx` |
| 07 | `/admin/pre-bid-query` | `app/(admin)/pre-bid-query/page.tsx` |
| 08 | `/admin/document-generation` | `app/(admin)/document-generation/page.tsx` |
| 09 | `/admin/analytics` | `app/(admin)/analytics/page.tsx` |
| 10 | `/admin/conformance-checker` | `app/(admin)/conformance-checker/page.tsx` |
| 11 | `/admin/corrigendum` | `app/(admin)/corrigendum/page.tsx` |
| 12 | `/document-viewer` | `app/(shared)/document-viewer/page.tsx` |
| 13 | `/help` | `app/(shared)/help/page.tsx` |
| — | `/admin/historical-data` | `app/(admin)/historical-data/page.tsx` |

---

## 🔧 Required Updates

### 1. Update PROJECT_STRUCTURE.md
- [ ] Correct all screen references
- [ ] Update folder structure
- [ ] Fix route mappings

### 2. Update Backend Module References
- [ ] Update queries module for Screen 07
- [ ] Add historical-data module (unnumbered admin screen)
- [ ] Update document-generation module (Screen 08)

### 3. Update Documentation References
- [ ] Fix HISTORICAL_DATA_QUICK_REFERENCE.md references
- [ ] Update any references to "Screen 05 = Historical Data"
- [ ] Correct vendor vs admin screen assignments

### 4. Update Setup Scripts
- [ ] Correct folder creation in setup-project.bat
- [ ] Fix route references in documentation

---

## 📋 Critical Corrections Checklist

### Screen 05 Corrections
- [x] **IDENTIFIED:** Screen 05 was incorrectly listed as "Historical Data Management"
- [ ] **UPDATE:** All documentation to reflect Screen 05 = "Query History"
- [ ] **VERIFY:** Query History is a vendor feature, not admin
- [ ] **RELOCATE:** Historical Data Management to admin section (unnumbered)

### Vendor vs Admin Screen Separation
- [ ] **VENDOR SCREENS:** 01, 02, 03, 04, 05 (Login + 4 vendor screens)
- [ ] **ADMIN SCREENS:** 06, 07, 08, 09, 10, 11, + Historical Data (unnumbered)
- [ ] **SHARED SCREENS:** 12, 13 (Document Viewer, Help)

### New Screens to Implement
- [ ] Screen 04: Interactive Chatbot (vendor)
- [ ] Screen 08: Document Generation (broader than just corrigendum)
- [ ] Screen 09: Analytics Dashboard (admin)
- [ ] Screen 10: Conformance Checker (admin)
- [ ] Screen 12: Document Viewer (shared)
- [ ] Screen 13: Help & Documentation (shared)

---

## 🎯 Impact Assessment

### High Impact Changes
1. **Screen 05 reassignment** - Affects all references to Historical Data Management
2. **Screen 02 rename** - Vendor Dashboard vs RFP Upload
3. **New chatbot screen** - Requires separate implementation
4. **Screen 08 scope expansion** - Document Generation vs just Corrigendum

### Medium Impact Changes
1. **Screen 11 moved** - Corrigendum Generator now has dedicated screen
2. **Historical Data unnumbered** - No longer in main sequence
3. **New admin screens** - Analytics, Conformance Checker

### Low Impact Changes
1. **Screen 12 & 13 additions** - Document Viewer and Help are straightforward
2. **Route reorganization** - Logical grouping by user type

---

## 💡 Recommendations

### 1. Immediate Actions
- Update all project documentation with correct screen mappings
- Revise folder structure in setup scripts
- Correct references in HISTORICAL_DATA_QUICK_REFERENCE.md

### 2. Development Priorities
1. Implement vendor screens first (02-05)
2. Then admin screens (06-11 + Historical Data)
3. Finally shared screens (12-13)

### 3. Testing Strategy
- Test vendor flow (01 → 02 → 03 → 04 → 05)
- Test admin flow (01 → 06 → 07 → 08 → ... → Historical Data)
- Test navigation between screens
- Verify role-based access control

---

## 📞 Questions for Clarification

1. **Historical Data Management:**
   - Why is it unnumbered? Is it accessed from Admin Dashboard?
   - Should it be integrated into the main admin flow?

2. **Screen 08 - Document Generation:**
   - What documents besides corrigendum are generated here?
   - Is Screen 11 redundant if Screen 08 handles corrigenda?

3. **Screen 04 - Chatbot:**
   - Is this the same chatbot mentioned in POC requirements?
   - Does it integrate with RAG service for RFP queries?

---

**Document Version:** 2.0  
**Last Updated:** January 2026  
**Status:** 🔴 CRITICAL - Requires Immediate Review and Updates
