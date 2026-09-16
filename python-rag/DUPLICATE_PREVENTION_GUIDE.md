# Q&A Ingestion: Duplicate Prevention Guide

## Overview
When uploading a PDF with Q&A pairs, the system now implements **automatic duplicate detection and prevention** to avoid storing the same Q&A pairs multiple times.

## How It Works

### ✅ Duplicate Detection Strategy

**Unique Key Components:**
- **RFP Number** (e.g., "SRA/IT/29369/2025")
- **Category** (e.g., "Eligibility", "Financial", "Technical")
- **Query Text** (exact match of the question)

If a Q&A pair with the same RFP number, category, AND query text exists → **DUPLICATE DETECTED**

### 🔧 ID Generation (Deterministic)

**BEFORE (Random):**
```
qa_43_a7f92c1d  (random UUID each time)
qa_43_b8e03f2e  (random UUID each time)
→ Same Q&A uploaded twice = 2 different IDs = DUPLICATES
```

**AFTER (Deterministic Hash-based):**
```
qa_43_3f4a2e1b  (MD5 hash of RFP + Category + Query)
qa_43_3f4a2e1b  (same hash = same ID)
→ Same Q&A uploaded twice = same ID = PREVENTED
```

**Hash Formula:**
```python
id_base = f"{rfp_number}_{category}_{query}"
id_hash = MD5(id_base)[:8]
qa_id = f"qa_{document_id}_{id_hash}"
```

## Three Scenarios

### Scenario 1: Fresh Upload (No Duplicates)
```
PDF Upload: 7 Q&A pairs
Database Status: Empty
Result: ✅ All 7 pairs ingested
Logs: 7 "New Q&A pair" messages
```

### Scenario 2: Re-upload Same PDF (All Duplicates)
```
PDF Upload: Same 7 Q&A pairs again
Database Status: 7 pairs already exist
Result: ↩️ All 7 skipped
Logs: 7 "DUPLICATE FOUND - Skipping" messages
ChromaDB: Still 7 rows (no increase)
```

### Scenario 3: Partial Update (Some Duplicates)
```
PDF Upload: 5 existing pairs + 2 new pairs
Database Status: 5 pairs already exist, 2 new
Result: ↩️ 5 skipped, ✅ 2 new ingested
Logs: 5 "Duplicate" messages + 2 "New" messages
ChromaDB: Increases from 7 to 9 rows
```

## In-Depth Logging

When PDF is ingested, check logs for:

```
[add_qa_pair] Processing Q&A pair - RFP: SRA/IT/29369/2025, Category: Eligibility, Query: Can international...
[add_qa_pair] Checking for duplicates (RFP: SRA/IT/29369/2025, Category: Eligibility)...

# If NEW:
[_check_qa_duplicate] No existing QAs found
[add_qa_pair] ✅ New Q&A pair - Generated ID: qa_43_3f4a2e1b
[add_qa_pair] ✅ Added new Q&A pair to ChromaDB: qa_43_3f4a2e1b

# If DUPLICATE:
[_check_qa_duplicate] ⚠️  DUPLICATE DETECTED for RFP SRA/IT/29369/2025, Category: Eligibility, Query: Can international... | Existing ID: qa_43_3f4a2e1b
[add_qa_pair] ❌ DUPLICATE FOUND: qa_43_3f4a2e1b
[add_qa_pair] ↩️  Skipping duplicate (use upsert_if_duplicate=True to update): qa_43_3f4a2e1b
```

## Configuration Options

### In main.py, you can control behavior:

```python
# Default behavior (skip duplicates)
vector_id = chroma_service_qa.add_qa_pair(
    document_id=request.document_id,
    rfp_number=request.rfp_number,
    query=qa['query'],
    response=qa['response'],
    query_embeddings=qa['combined_embedding'],
    category=qa['category'],
    metadata=qa['metadata'],
    check_duplicate=True,           # ✅ Check for duplicates
    upsert_if_duplicate=False       # ⏭️  Skip duplicates (don't update)
)

# To update existing Q&A instead of skipping:
vector_id = chroma_service_qa.add_qa_pair(
    ...,
    check_duplicate=True,           # ✅ Check for duplicates
    upsert_if_duplicate=True        # 🔄 Update if duplicate found
)

# To disable duplicate checking (not recommended):
vector_id = chroma_service_qa.add_qa_pair(
    ...,
    check_duplicate=False           # ❌ Don't check (allows duplicates)
)
```

## Verification Report

After PDF ingestion, the verification report shows:

```
====================================================================================================
INGESTION RECONCILIATION VERIFICATION
====================================================================================================

📊 RECONCILIATION REPORT:
──────────────────────────────────────────────────────────────────────────────────────────────────
  Rows extracted from PDF:        7
  Rows stored in ChromaDB:        7
  Match Status:                   ✅ PERFECT MATCH (x = y = 7)
  
  ⚠️  NOTE: 
  - If re-uploading same PDF: "Rows stored" won't increase (duplicates prevented)
  - Check logs for "DUPLICATE FOUND" messages to confirm duplication prevention
──────────────────────────────────────────────────────────────────────────────────────────────────
```

## Data Integrity Features

### ✅ What's Protected
- **Prevents accidental duplicates** from re-uploading same PDF
- **Maintains data consistency** across multiple uploads
- **Tracks timestamps** for created_at and last_updated
- **Logs all operations** for audit trail
- **Deterministic IDs** mean same content = same ID

### 🔍 What You Can Verify
```sql
-- Check all Q&A pairs for an RFP
SELECT id, query, response, category, created_at, last_updated 
FROM chromadb 
WHERE rfp_number = 'SRA/IT/29369/2025';

-- Verify no duplicates exist
SELECT rfp_number, category, query, COUNT(*) 
FROM chromadb 
GROUP BY rfp_number, category, query
HAVING COUNT(*) > 1;  -- Should return nothing
```

## Common Scenarios

### Scenario A: First-time PDF Upload
- Upload PDF with 7 Q&A pairs
- System: Checks for duplicates → None found → Adds all 7 ✅
- ChromaDB count: 0 → 7 rows

### Scenario B: Accidental Re-upload (Same PDF)
- Upload same PDF again with 7 Q&A pairs
- System: Checks for duplicates → 7 found → Skips all 7 ↩️
- ChromaDB count: 7 (unchanged)
- Logs: "DUPLICATE FOUND" × 7

### Scenario C: Updated PDF (New Q&A Added)
- Upload updated PDF with 8 Q&A pairs (7 existing + 1 new)
- System: Checks each pair → 7 duplicates, 1 new
  - 7 existing: Skipped ↩️
  - 1 new: Added ✅
- ChromaDB count: 7 → 8 rows
- Logs: "DUPLICATE FOUND" × 7, "New Q&A pair" × 1

### Scenario D: Updated Q&A Response (Needs Update)
- Original Q&A has old response
- PDF has same question but updated response
- Need to update: Pass `upsert_if_duplicate=True`
- System: Finds duplicate → Updates instead of skipping 🔄
- ChromaDB: Same 7 rows, but 1 has updated response
- Logs: "DUPLICATE FOUND" → "Updating existing Q&A pair"

## Metadata Tracking

### For New Q&A Pairs:
```json
{
  "created_at": "2026-02-04T10:30:45.123456",
  "rfp_number": "SRA/IT/29369/2025",
  "category": "Eligibility"
}
```

### For Updated Q&A Pairs:
```json
{
  "created_at": "2026-02-04T10:00:00.000000",  // Original creation time
  "last_updated": "2026-02-04T10:30:45.123456", // Update timestamp
  "rfp_number": "SRA/IT/29369/2025",
  "category": "Eligibility"
}
```

## Testing the Feature

### Test 1: Verify Duplicates Prevented
```bash
# Step 1: Upload PDF
curl -X POST http://localhost:8005/api/process-document \
  -F "file=@SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf" \
  -F "document_type=Q&A" \
  -F "document_id=43" \
  -F "rfp_number=SRA/IT/29369/2025"
# Response: 7 Q&A pairs ingested

# Step 2: Upload same PDF again
curl -X POST http://localhost:8005/api/process-document \
  -F "file=@SRA_Synthetic_PreBid_QA_2025_Wrapped_v2.pdf" \
  -F "document_type=Q&A" \
  -F "document_id=43" \
  -F "rfp_number=SRA/IT/29369/2025"
# Response: 0 new pairs added (all 7 duplicates detected)

# Step 3: Check logs
# Should show: "DUPLICATE FOUND" × 7 messages
# Verification report: "7 rows in PDF, 7 rows in ChromaDB" (unchanged)
```

### Test 2: Verify No Duplicates in Database
```python
# Run this verification script
from python_rag.shared.vector_db.chroma_service import ChromaService

service = ChromaService()
duplicates = service.find_duplicate_qa_pairs(rfp_number="SRA/IT/29369/2025")
print(f"Duplicates found: {len(duplicates)}")  # Should be 0
```

## Summary

| Feature | Behavior |
|---------|----------|
| **Duplicate Detection** | Checks RFP + Category + Query |
| **ID Generation** | Deterministic (MD5 hash) |
| **Skip Duplicate** | Default behavior (↩️) |
| **Update Duplicate** | Optional with `upsert_if_duplicate=True` (🔄) |
| **Logging** | Full audit trail with timestamps |
| **Data Safety** | Prevents accidental duplicates ✅ |

---

**Key Takeaway:** Upload the same PDF multiple times without worrying about duplicates. The system will automatically detect and prevent them while maintaining data integrity! 🚀
