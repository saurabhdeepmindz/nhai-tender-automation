# 🔍 ROOT CAUSE ANALYSIS - NHAI Demo Issues

## Issue #1: AI Response showing "0% Match"

### ❌ Root Cause: HARDCODED CONFIDENCE VALUE

**File**: [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L917)
**Lines 890-918**:
```python
def _calculate_confidence_score(
    self,
    response: Dict[str, Any],
    context: Dict[str, Any]
) -> float:
    """Calculate confidence score (0.0 - 1.0)"""
    score = 0.5  # ← THIS IS HARDCODED!
    return score
```

### 📊 Data Flow Tracing:

**Step 1**: Screen 8 generates response with confidence
```python
# Line 866 in chief_engineer_agent.py Step 6
final_response = {
    "response_text": response["response_text"],
    "confidence_score": confidence,  # ← Returns 0.5 (hardcoded)
    ...
}
```

**Step 2**: main.py extracts confidence from result
```python
# Line 521-523 in main.py
conf_score = result.get("confidence_score")  # Gets 0.5
if conf_score is None:
    conf_score = result.get("confidence", 0.0)  # Fallback
```

**Step 3**: main.py ResponseData model receives it
```python
# Line 548 in main.py
response_data = ResponseData(
    confidence=conf_score,  # Sets to 0.5
    ...
)
```

**Step 4**: Backend receives and processes
```typescript
// Line 261-264 in prebid-query.service.ts
const confidenceScoreRaw =
  responseData.confidence ??           // Gets 0.5 ✓
  responseData.confidence_score ??
  responseData.confidenceScore ??
  0;

const confidenceScore =
  confidenceScoreRaw > 0 && confidenceScoreRaw <= 1
    ? confidenceScoreRaw * 100   // Converts 0.5 * 100 = 50
    : confidenceScoreRaw;
```

**Step 5**: Database stores normalized percentage
```sql
-- confidence = 50.00 (should be stored)
-- But if any value in chain is 0, confidence = 0
```

### 🔴 The Bug:
**HARDCODED 0.5 IS NOT CALCULATED**

The `_calculate_confidence_score()` function doesn't actually calculate anything - it just returns 0.5 every time:
- All queries get exactly 0.5 confidence
- This should scale to 50% in UI
- If UI shows 0%, it means either:
  1. Hardcoded value was changed to 0 somewhere
  2. A fallback in the chain is receiving 0 instead
  3. Database or API is not returning confidence field

### ✅ Verification Commands:

Check what's in database:
```sql
SELECT query_id, confidence FROM queries ORDER BY processed_at DESC LIMIT 5;
-- Expected: 50.00 or 50, not 0
```

Check backend API response:
```bash
curl http://localhost:3001/api/queries?limit=1 | jq '.data[0].confidence'
-- Expected: 50
```

Check Python logs:
```bash
tail -50 NHAI-TENDER-AUTOMATION/logs/screen8.log | grep -i confidence
-- Expected: "Confidence: 50.00%"
```

### 📋 Fix Required:
Replace hardcoded 0.5 with actual calculation in `_calculate_confidence_score()`:
```python
def _calculate_confidence_score(self, response: Dict[str, Any], context: Dict[str, Any]) -> float:
    """Calculate actual confidence based on:
    - Response quality
    - Source count
    - Context relevance
    """
    score = 0.0
    
    # Factor 1: Number of sources (max +0.4)
    sources = response.get("sources", [])
    if sources:
        score += min(0.4, len(sources) * 0.1)
    
    # Factor 2: Context quality (max +0.3)
    context_quality = len(context.get("historical_sources", []))
    if context_quality > 0:
        score += min(0.3, context_quality * 0.1)
    
    # Factor 3: Base confidence (0.3)
    score += 0.3
    
    return min(1.0, score)  # Cap at 1.0
```

---

## Issue #2: Past RFP Reference showing empty/no RFP number

### ❌ Root Cause: SCREEN 7 RETURNS DIFFERENT METADATA KEY NAME

**File**: [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L769-L788)
**Lines 769-788** - RFP Number Extraction with Fallbacks:
```python
rfp_number = (
    metadata.get("rfp_number")       # Try 1
    or metadata.get("rfp_no")         # Try 2
    or metadata.get("rfpNumber")      # Try 3
    or metadata.get("rfp_id")         # Try 4
    or metadata.get("rfpId")          # Try 5
    or source.get("rfp_number")       # Try 6
    or source.get("rfp_no")           # Try 7
    or source.get("rfp_id")           # Try 8
    or source.get("rfpId")            # Try 9
    or source.get("document_id")      # Try 10
    or "Unknown RFP"                  # Fallback
)
```

### 📊 Data Flow:

**Step 1**: Step 2 calls Screen 7 for historical data
```python
# Line 525 in chief_engineer_agent.py (Step 2)
response = await self._call_screen7_api(query_text)
# Response format:
# {
#   "results": [{
#     "document_id": "...",
#     "chunk_text": "...",
#     "metadata": { ??? }  # ← Screen 7 returns something here
#   }]
# }
```

**Step 2**: Context aggregation passes through as-is
```python
# Line 586 in chief_engineer_agent.py (Step 4)
context["historical_sources"] = [
    {
        "metadata": r.get("metadata", {}),
        # ... other fields ...
    }
]
```

**Step 3**: _format_historical_references tries 10 different keys
```python
# Lines 769-788
# If ALL 10 checks fail, returns: "Unknown RFP"
# Which becomes: past_ref_response = "[RFP: Unknown RFP, ...]"
```

### 🔴 The Bug:
**Screen 7 metadata structure is NOT documented**

Current code tries these keys:
```
rfp_number, rfp_no, rfpNumber, rfp_id, rfpId, document_id
```

But Screen 7 might return:
```
source, file_name, rfp_identifier, tender_id, document_source, etc.
```

### ✅ Verification Required:
**MUST RUN THIS** to identify actual Screen 7 metadata key:
```bash
curl -X POST http://localhost:8000/api/rag/search/sync \
  -H "Content-Type: application/json" \
  -d '{
    "query": "EMD",
    "top_k": 2
  }' | jq '.results[] | {document_id, metadata}'
```

**Output will show actual metadata keys** Screen 7 returns.

---

## Issue #3: Past Response showing empty

### ❌ Root Cause: CHROMADB VENDOR_QUERIES IS INITIALLY EMPTY (EXPECTED)

**File**: [chief_engineer_agent.py](python-rag/screen08-chief-engineer/chief_engineer_agent.py#L800-L835)
**Lines 800-835** - Similar Query Response Formatting:
```python
def _format_similar_query_responses(self, context: Dict[str, Any]) -> str:
    """Format similar past query responses from Screen 8"""
    similar_queries = context.get("similar_queries", [])
    
    if not similar_queries:
        logger.debug("No similar queries found, returning empty string")
        return ""  # ← RETURNS EMPTY STRING
    
    formatted_responses = []
    for idx, query in enumerate(similar_queries[:3], 1):
        try:
            query_text = query.get("query_text", "")
            response = query.get("response", "")
            similarity = query.get("similarity", 0)
            
            if query_text and response:
                formatted_responses.append(
                    f"Similar Query {idx} [Similarity: {similarity:.1%}]:\n"
                    f"Q: {query_text.strip()}\n"
                    f"A: {response.strip()}"
                )
        except Exception as e:
            logger.warning(f"Error formatting query {idx}: {e}")
    
    return "\n\n---\n\n".join(formatted_responses)
```

### 📊 Data Flow:

**Query 1 Processing**:
```
┌─ Step 3: Search ChromaDB vendor_queries
│  └─ ChromaDB: EMPTY (no queries stored yet)
│     └─ similar_queries = []
├─ Step 6: Format response
│  └─ _format_similar_query_responses([])
│     └─ Returns: ""
└─ Database: past_response = NULL ✓ CORRECT
```

**Query 2 Processing** (if similar to Query 1):
```
┌─ After Query 1 completes:
│  └─ ChromaDB stores: Query 1 in vendor_queries
├─ Step 3: Search ChromaDB vendor_queries  
│  └─ Finds Query 1 (similarity: 0.92)
│     └─ similar_queries = [{query_text: "Q1", response: "A1", similarity: 0.92}]
├─ Step 6: Format response
│  └─ _format_similar_query_responses([...])
│     └─ Returns: "Similar Query 1 [Similarity: 92%]:\nQ: Q1\nA: A1"
└─ Database: past_response = "Similar Query 1..." ✓ CORRECT
```

### 🟢 This is NOT a Bug - Expected Behavior

**Why?**
- First query has no similar queries (ChromaDB empty)
- Second query finds first query (if similar)
- Each new query enriches database for future queries

### ✅ Verification:

Check ChromaDB vendor_queries count:
```bash
curl -X POST http://localhost:8001/api/chief-engineer/debug/chroma-info \
  -d '{}' | jq '.vendor_queries_count'
-- Initially: 0
-- After Query 1: 1
-- After Query 2: 2
```

Check test query results:
```bash
# Query 1: "What is EMD?"
curl ... -d '{"query_text": "What is EMD?"}' | jq '.response.past_response'
-- Returns: null (CORRECT - no similar queries yet)

# Query 2: "What is earnest money deposit?" (similar to Q1)
curl ... -d '{"query_text": "What is earnest money deposit?"}' | jq '.response.past_response'  
-- Returns: "Similar Query 1..." (CORRECT - found Q1)
```
       "response": "...",  # ← Should have this
       "similarity": 0.75,
       "metadata": {...}
     }
   ]
   ```
3. **Step 4** passes similar_queries to aggregated_context
4. **Step 5** calls:
   ```python
   past_response = self._format_similar_query_responses(context)
   ```
5. **_format_similar_query_responses** looks for:
   ```python
   for query in similar_queries:
     response = query.get("response")  # ← LOOKING FOR THIS
   ```

### 🔴 The Bug:
**ChromaDB doesn't have any similar queries yet!**

Why? Because:
1. This is the **first time** any query has been stored/processed
2. ChromaDB vendor_queries collection is **EMPTY** for the 4 test queries
3. Step 3 search returns 0 results → similar_queries is empty list
4. _format_similar_query_responses gets empty list → returns empty string

### ✅ Root Cause:
**No historical queries exist in ChromaDB** to match against. The 4 test queries are the FIRST queries ever processed, so there's nothing similar to find.

---

## 📊 Summary Table

| Issue | Root Cause | Location | Fix |
|-------|-----------|----------|-----|
| **0% Match** | Field name mismatch: Python returns `confidence_score`, NestJS looks for `confidence` | Python: line 866<br/>NestJS: line 261 | Make field names match: both use `confidence` |
| **Empty RFP Number** | Screen 7 metadata doesn't include `rfp_number` key (or uses different key like `rfp_id`) | Screen 7 search results → aggregation → formatting | Check what key Screen 7 actually returns for RFP identifier |
| **Empty past_response** | No historical queries exist in ChromaDB yet (first ever processed) | Step 3 ChromaDB search returns 0 results | This is EXPECTED behavior! Will populate once 2nd similar query processed |

---

## 🎯 To Verify Root Causes

### Check Issue #1 (Confidence):
```bash
# Look at actual response from Screen 8
curl -X POST http://localhost:8001/api/chief-engineer/process \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "test-query",
    "query_text": "What is EMD?",
    "rfp_context": {"rfp_number": "NHAI/2026/001"}
  }'

# Check the response body for "confidence" vs "confidence_score"
```

### Check Issue #2 (RFP Number):
```bash
# Look at what Screen 7 actually returns
curl http://localhost:8000/api/rag/search/sync \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "EMD",
    "top_k": 5
  }' | jq '.results[0].metadata'

# Check which key contains the RFP number
```

### Check Issue #3 (past_response):
```bash
# Check ChromaDB vendor_queries collection
# Run this in Python:
from chromadb.config import Settings
import chromadb
settings = Settings(chroma_db_impl="duckdb", persist_directory="./chroma_db")
client = chromadb.Client(settings)
collection = client.get_collection("vendor_queries")
print(f"Total queries in ChromaDB: {collection.count()}")
```

---

## 💡 REAL Issues vs Expected Behavior

| Issue | Type | Explanation |
|-------|------|-------------|
| 0% Match | **BUG** ❌ | Field name mismatch - needs fix |
| Empty RFP Number | **LIKELY BUG** ⚠️ | Screen 7 metadata key issue - needs investigation |
| Empty past_response | **EXPECTED** ✅ | Normal for first/unique queries - will populate later |

---

## Summary Table

| Issue | Status | Root Cause | Action Required |
|-------|--------|-----------|-----------------|
| **0% Match** | 🔴 **BUG** | Hardcoded 0.5 confidence OR chain receives 0 | 1. Verify database has value<br/>2. Update `_calculate_confidence_score()` for dynamic logic |
| **Empty RFP Number** | 🟡 **LIKELY BUG** | Screen 7 uses different metadata key name | 1. Run diagnostic curl command<br/>2. Add actual key to fallback chain |
| **Empty past_response** | 🟢 **EXPECTED** | No similar queries in ChromaDB yet | 1. Process 2nd similar query<br/>2. Verify population works |

---

## Immediate Debugging Steps

### Step 1: Identify Screen 7 Metadata Structure (CRITICAL)
```bash
curl -X POST http://localhost:8000/api/rag/search/sync \
  -H "Content-Type: application/json" \
  -d '{"query": "EMD", "top_k": 2}' | jq '.results[] | {document_id, metadata}'
```

This command reveals actual keys Screen 7 returns in metadata.

### Step 2: Check Database Confidence Values
```bash
sqlplus << EOF
SELECT query_id, confidence, ai_response FROM queries ORDER BY processed_at DESC LIMIT 5;
EOF
```

Expected: `confidence = 50` (or similar value), NOT `0`

### Step 3: Check Python Logs
```bash
tail -100 NHAI-TENDER-AUTOMATION/logs/screen8.log | grep -E "Confidence:|Processing"
```

Expected: `Confidence: 50.00%` or similar

### Step 4: Test Backend Response
```bash
curl -X POST http://localhost:3001/api/prebid-query/process \
  -H "Content-Type: application/json" \
  -d '{
    "query_id": "test-debug-123",
    "query_text": "What is EMD?",
    "rfp_context": {}
  }' | jq '.data | {confidence, past_ref_response, past_response}'
```

Expected: All three fields populated (confidence = number, not 0)

---

## Code Fixes Required

### After Verification, Apply These Fixes:

1. **Replace hardcoded 0.5 in `_calculate_confidence_score()`** (lines 917-920)
2. **Add actual Screen 7 metadata key to fallback chain** (line 769)
3. **No fix needed for past_response** (working as designed)

---

**Recommendation**: Before fixing code, verify what Screen 7 is actually returning by running Step 1 diagnostic!
