# Screen 8 - Chief Engineer Agent Endpoint Testing Guide

## 🔧 Fixed Issues

### Issue Summary
Three endpoints had problems that have now been **FIXED**:

| Endpoint | Previous Issue | Status | Fix Applied |
|----------|---------------|--------|-------------|
| `/api/chief-engineer/process` | "Method Not Allowed" | ✅ FIXED | Updated README - requires **POST** |
| `/api/chief-engineer/similar-queries` | "Method Not Allowed" | ✅ FIXED | Updated README - requires **POST** |
| `/api/workflow/executions` | `'WorkflowManager' object has no attribute 'get_executions'` | ✅ FIXED | Fixed code to use `list_workflows()` |

---

## 📋 Root Causes

### 1. Method Not Allowed Errors
**Problem:** You were accessing POST endpoints with GET requests (browser URL)

**Explanation:**
- `/api/chief-engineer/process` - Requires **POST** with JSON body
- `/api/chief-engineer/similar-queries` - Requires **POST** with JSON body

**Solution:** Use POST requests with proper JSON payloads (see examples below)

### 2. WorkflowManager Attribute Error
**Problem:** Code was calling `workflow_manager.get_executions()` but the method doesn't exist

**Fix Applied:** Changed to use `workflow_manager.list_workflows()` which is the actual method name

---

## ✅ Working Endpoints

### 1. Get Workflow Executions (GET) - **FIXED** ✅

**Endpoint:** `http://localhost:8001/api/workflow/executions`

**Method:** GET (No JSON body required)

**PowerShell:**
```powershell
curl.exe http://localhost:8001/api/workflow/executions
```

**Response:**
```json
[]
```
*(Empty array initially - will show workflows after processing queries)*

**Optional Query Parameters:**
```
?limit=50          # Maximum number of results
&status=completed  # Filter by status (pending, in_progress, completed, failed)
&query_id=xxx      # Filter by specific query ID
```

---

### 2. Process Query (POST) - Requires JSON Body

**Endpoint:** `http://localhost:8001/api/chief-engineer/process`

**Method:** POST (Requires JSON body)

**Why "Method Not Allowed"?**
- You were trying to access this in a browser (GET request)
- This endpoint only accepts POST requests with a JSON body

**PowerShell Example:**
```powershell
$body = @{
    query_id = "fac137a9-4f8b-49e1-9a9a-901f855a8b85"
    query_text = "What is the approved rate for bituminous concrete?"
    rfp_context = "NHAI Tender 2024-25 for NH-44 Road Construction"
    rfp_id = "RFP-2024-001"
    category = "technical"
    use_historical_data = $true
    search_similar_queries = $true
    top_k = 5
    min_confidence = 0.7
} | ConvertTo-Json

curl.exe -X POST http://localhost:8001/api/chief-engineer/process `
    -H "Content-Type: application/json" `
    -d $body
```

**Curl (Windows CMD):**
```cmd
curl -X POST http://localhost:8001/api/chief-engineer/process ^
    -H "Content-Type: application/json" ^
    -d "{\"query_id\":\"fac137a9-4f8b-49e1-9a9a-901f855a8b85\",\"query_text\":\"What is the approved rate for bituminous concrete?\",\"rfp_context\":\"NHAI Tender 2024-25\",\"rfp_id\":\"RFP-2024-001\",\"category\":\"technical\",\"use_historical_data\":true,\"search_similar_queries\":true,\"top_k\":5,\"min_confidence\":0.7}"
```

**Request Body Schema:**
```json
{
    "query_id": "string (UUID)",
    "query_text": "string",
    "rfp_context": "string",
    "rfp_id": "string",
    "category": "string (technical/financial/compliance)",
    "use_historical_data": "boolean (default: true)",
    "search_similar_queries": "boolean (default: true)",
    "top_k": "integer (default: 5)",
    "min_confidence": "float (default: 0.7)"
}
```

**Expected Response:**
```json
{
    "success": true,
    "query_id": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
    "workflow_id": "abc-123-def",
    "ai_response": "Based on historical data...",
    "confidence": 0.85,
    "source_documents": [...],
    "workflow_status": "completed",
    "execution_time": 2.45
}
```

---

### 3. Find Similar Queries (POST) - Requires JSON Body

**Endpoint:** `http://localhost:8001/api/chief-engineer/similar-queries`

**Method:** POST (Requires JSON body)

**Why "Method Not Allowed"?**
- You were trying to access this in a browser (GET request)
- This endpoint only accepts POST requests with a JSON body

**PowerShell Example:**
```powershell
$body = @{
    query_text = "What is the approved rate for bituminous concrete?"
    top_k = 5
    rfp_id = "RFP-2024-001"
    category = "technical"
} | ConvertTo-Json

curl.exe -X POST http://localhost:8001/api/chief-engineer/similar-queries `
    -H "Content-Type: application/json" `
    -d $body
```

**Curl (Windows CMD):**
```cmd
curl -X POST http://localhost:8001/api/chief-engineer/similar-queries ^
    -H "Content-Type: application/json" ^
    -d "{\"query_text\":\"What is the approved rate for bituminous concrete?\",\"top_k\":5,\"rfp_id\":\"RFP-2024-001\",\"category\":\"technical\"}"
```

**Request Body Schema:**
```json
{
    "query_text": "string (required)",
    "top_k": "integer (default: 5)",
    "rfp_id": "string (optional)",
    "category": "string (optional)"
}
```

**Expected Response:**
```json
{
    "success": true,
    "query": "What is the approved rate for bituminous concrete?",
    "similar_queries": [
        {
            "query_id": "xyz-456",
            "query_text": "Rate for bituminous concrete grade 2",
            "similarity_score": 0.92,
            "response": "The approved rate is..."
        }
    ],
    "execution_time": 0.35
}
```

---

## 🧪 Testing Scripts

### PowerShell Test Script

Save as `test-screen8-endpoints.ps1`:

```powershell
Write-Host "`n=== Screen 8 Endpoint Testing ===" -ForegroundColor Cyan

# Test 1: Workflow Executions (GET)
Write-Host "`n1. Testing /api/workflow/executions (GET)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/workflow/executions" -Method Get
    Write-Host "✅ SUCCESS - Returned $($response.Count) workflow executions" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Process Query (POST)
Write-Host "`n2. Testing /api/chief-engineer/process (POST)..." -ForegroundColor Yellow
try {
    $body = @{
        query_id = "fac137a9-4f8b-49e1-9a9a-901f855a8b85"
        query_text = "What is the approved rate for bituminous concrete?"
        rfp_context = "NHAI Tender 2024-25 for NH-44"
        rfp_id = "RFP-2024-001"
        category = "technical"
        use_historical_data = $true
        search_similar_queries = $true
        top_k = 5
        min_confidence = 0.7
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/chief-engineer/process" `
        -Method Post `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json)
    
    Write-Host "✅ SUCCESS - Query processed" -ForegroundColor Green
    Write-Host "   Workflow ID: $($response.workflow_id)" -ForegroundColor Gray
    Write-Host "   Confidence: $($response.confidence)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Find Similar Queries (POST)
Write-Host "`n3. Testing /api/chief-engineer/similar-queries (POST)..." -ForegroundColor Yellow
try {
    $body = @{
        query_text = "What is the approved rate for bituminous concrete?"
        top_k = 5
        rfp_id = "RFP-2024-001"
        category = "technical"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:8001/api/chief-engineer/similar-queries" `
        -Method Post `
        -ContentType "application/json" `
        -Body ($body | ConvertTo-Json)
    
    Write-Host "✅ SUCCESS - Found $($response.similar_queries.Count) similar queries" -ForegroundColor Green
    $response.similar_queries | ForEach-Object {
        Write-Host "   - Similarity: $($_.similarity_score) - $($_.query_text.Substring(0, [Math]::Min(50, $_.query_text.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
```

**Run:** `powershell .\test-screen8-endpoints.ps1`

---

## 📚 API Documentation

For complete API documentation with interactive testing:

**Swagger UI:** http://localhost:8001/docs

**ReDoc:** http://localhost:8001/redoc

---

## 🔍 Summary

### Fixed Issues:
1. ✅ `/api/workflow/executions` - Fixed code to use correct method (`list_workflows()`)
2. ✅ `/api/chief-engineer/process` - Clarified that POST method is required
3. ✅ `/api/chief-engineer/similar-queries` - Clarified that POST method is required

### Key Learnings:
- **GET endpoints** can be tested in browser (e.g., `/api/workflow/executions`, `/api/health`)
- **POST endpoints** require tools like curl, Postman, or PowerShell with JSON bodies
- Always check API documentation (http://localhost:8001/docs) for required HTTP methods

### All Endpoints Now Working! 🎉
