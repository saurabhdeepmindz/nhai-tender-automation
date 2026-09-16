# CHROMADB INSTANCE 4 (query_db) - DATA CAPTURE SPECIFICATION
## Option 1: Structured Q&A Extraction from PDF

---

## 📋 PDF STRUCTURE ANALYSIS

**Source PDF:** `SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf`
- **RFP Number:** SRA/IT/29369/2025
- **Total Q&A Pairs:** 7 pre-bid clarifications
- **Format:** Structured table with 6 columns

---

## 🎯 DATA CAPTURE SPECIFICATION

### For EACH Q&A Pair from the PDF:

#### **1. CHROMADB VECTOR DOCUMENT**
```json
{
  "id": "SRA-IT-29369-2025-Q1",
  "document_text": "Can international consortium experience be considered for eligibility evaluation?",
  "embedding": [768-dimensional vector],
  "metadata": {
    "rfp_number": "SRA/IT/29369/2025",
    "category": "Eligibility",
    "sr_no": "1",
    "rfp_section": "Pg 22, Sec 1.3 & 4.6",
    "rfp_requirement": "Consortium eligibility as mentioned in the datasheet.",
    "response": "Yes. International consortium experience will be considered, subject to submission of valid documentary evidence as per pre-qualification norms.",
    "source_file": "SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf",
    "document_type": "PreBid-QA",
    "extraction_date": "2026-02-04",
    "ingest_timestamp": "2026-02-04T10:30:00Z"
  }
}
```

---

## 📊 METADATA COLUMNS CAPTURED

| Field | Source | Value Type | Example |
|-------|--------|-----------|---------|
| **rfp_number** | From PDF header | String | "SRA/IT/29369/2025" |
| **category** | Column: "Category" | String | "Eligibility", "Financial", "Technical" |
| **sr_no** | Column: "Sr. No" | String | "1", "2", "3"... |
| **rfp_section** | Column: "RFP Document Reference" | String | "Pg 22, Sec 1.3 & 4.6" |
| **rfp_requirement** | Column: "Content of RFP Requiring Clarification" | String | "Consortium eligibility as mentioned..." |
| **response** | Column: "Response (SRA)" | String | "Yes. International consortium experience..." |
| **source_file** | Auto-generated | String | "SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf" |
| **document_type** | Auto-generated | String | "PreBid-QA" |
| **extraction_date** | Auto-generated | Date | "2026-02-04" |
| **ingest_timestamp** | Auto-generated | DateTime | "2026-02-04T10:30:00Z" |

---

## 🔄 COMPLETE DATA FLOW

### **Step 1: PDF Ingestion (One-time)**
```
PDF File → Parse Table Rows → Extract Q&A Pairs → ChromaDB Instance 4
   ↓
   Q1: "Can international consortium...?" 
       └─ Response + RFP metadata stored
   Q2: "Is EMD exemption available...?"
       └─ Response + RFP metadata stored
   Q3-Q7: Similar extraction...
```

### **Step 2: When User Submits New Query (Continuous)**
```
User Query (Screen 3) 
   ↓
PostgreSQL: Store query (response=empty)
   ↓
Screen 8 Vectorization Job
   ├─ Generate embedding for new query
   └─ Search ChromaDB Instance 4 for similar queries
      ├─ If "Can consortium be used?" → Finds Q1 with 92% similarity
      ├─ Extract: response = "Yes. International consortium..."
      ├─ Extract: rfp_number = "SRA/IT/29369/2025"
      ├─ Extract: category = "Eligibility"
      └─ Extract: All metadata
   ↓
Screen 8 Response Generation
   ├─ past_response = "Yes. International consortium..." ✓
   ├─ past_ref_response = "SRA/IT/29369/2025" ✓
   └─ ai_response = Phi LLM synthesis using context ✓
   ↓
Backend Saves to PostgreSQL
   ├─ ai_response field ✓
   ├─ past_response field ✓
   └─ past_ref_response field ✓
   ↓
UI Displays All Three Fields
```

---

## 📈 EXPECTED RESULTS

### **Q&A Pairs from PDF:**

| Sr | Category | Query | Response |
|----|----------|-------|----------|
| 1 | Eligibility | Can international consortium experience be considered for eligibility evaluation? | Yes. International consortium experience will be considered... |
| 2 | Financial | Is EMD exemption available for MSME registered bidders? | No. As per RFP provisions, no exemption from EMD... |
| 3 | Technical | Will SRA facilitate WhatsApp Business API onboarding and verification? | Yes. SRA will facilitate the onboarding and approval process... |
| 4 | AI Governance | Are explainable AI and audit reports mandatory for deployed models? | Yes. Explainable AI reports, audit logs... |
| 5 | Payment | Is milestone-based payment allowed in addition to quarterly billing? | Yes. Payments shall be released based on approved milestones... |
| 6 | SLA | Will penalties be capped at a maximum limit? | Yes. Penalties shall be capped at a maximum of 15%... |
| 7 | Security | Is CERT-In empanelled audit mandatory? | Yes. Security audits shall be conducted through CERT-In... |

---

## ✅ IMPLEMENTATION PLAN

### **Code Changes Required:**
1. ✅ Create PDF table parser to extract rows (7 Q&A pairs)
2. ✅ Extract all columns from each row
3. ✅ Generate embeddings for each query
4. ✅ Store in ChromaDB Instance 4 (vendor_queries collection) with metadata
5. ✅ Update ai_response logic to return similar queries AS IS
6. ✅ Test with sample queries

### **Expected Outcomes:**
- **ChromaDB Instance 4:** 7 vendor queries with full metadata
- **ai_response field:** Will show similar Q&A from PDF
- **past_response field:** Will show official SRA response
- **past_ref_response field:** Will show RFP number
- **Metadata Rich:** All PDF columns preserved for future queries

---

## 🎬 APPROVAL CHECKLIST

- [ ] **Metadata fields are correct?**
- [ ] **All PDF columns captured?**
- [ ] **RFP number included in metadata?**
- [ ] **Each Q&A stored separately (not as one row)?**
- [ ] **Response text format acceptable?**
- [ ] **Ready to proceed with code implementation?**

---

**Status:** ⏳ **AWAITING YOUR APPROVAL** ⏳

Please confirm if this structure matches your requirements before I proceed with code implementation.
