# NHAI Backend API - Swagger Integration Guide (for Next.js Frontend)

This document provides a comprehensive mapping of all backend API endpoints (as per Swagger), their response schemas, UI section mapping, and test URLs. It is designed for frontend developers integrating with the NHAI Tender Automation backend using Next.js.

---

## API Base URLs
- **Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **API Root:** [http://localhost:3000/api](http://localhost:3000/api)

---

## 1. Prebid Queries (Screen 7/8)

| Endpoint | Method | Description | UI Section | Test URL | Swagger Path |
|----------|--------|-------------|------------|----------|--------------|
| `/api/prebid-queries/statistics` | GET | Query statistics summary (total, pending, answered, etc.) | Statistics Panel (top) | [Test](http://localhost:3000/api/prebid-queries/statistics) | /prebid-queries/statistics |
| `/api/prebid-queries` | GET | List queries (filters: status, category, rfpId, aiProcessed, page/pageSize) | Main Query Table/List | [Test](http://localhost:3000/api/prebid-queries) | /prebid-queries |
| `/api/prebid-queries/filters` | GET | Filter dropdown options (status, RFP, etc.) | Filter Dropdowns | [Test](http://localhost:3000/api/prebid-queries/filters) | /prebid-queries/filters |
| `/api/prebid-queries/:id` | GET | Get query by UUID | Query Details Modal/Drawer | [Test](http://localhost:3000/api/prebid-queries/1) | /prebid-queries/{id} |
| `/api/prebid-queries/:id/history` | GET | Query audit trail/history | Query Details Modal/History Tab | [Test](http://localhost:3000/api/prebid-queries/1/history) | /prebid-queries/{id}/history |
| `/api/prebid-queries/:id/similar` | GET | Suggest similar/related queries | Query Details Modal/Similar Tab | [Test](http://localhost:3000/api/prebid-queries/1/similar) | /prebid-queries/{id}/similar |
| `/api/prebid-queries/:id/process` | POST | Trigger AI workflow (Python RAG) | AI Process Button/Panel | [Test](http://localhost:3000/api/prebid-queries/1/process) | /prebid-queries/{id}/process |
| `/api/prebid-queries/:id/admin-response` | POST | Save admin-reviewed/edited response | Admin Response Editor/Save | [Test](http://localhost:3000/api/prebid-queries/1/admin-response) | /prebid-queries/{id}/admin-response |
| `/api/prebid-queries/:id/status` | PATCH | Update query status (answered, rejected, etc.) | Status Dropdown (table/details) | [Test](http://localhost:3000/api/prebid-queries/1/status) | /prebid-queries/{id}/status |
| `/api/prebid-queries/bulk/status` | POST | Bulk status update for selected queries | Bulk Actions Toolbar | [Test](http://localhost:3000/api/prebid-queries/bulk/status) | /prebid-queries/bulk/status |
| `/api/prebid-queries/generate-document` | POST | Generate consolidated prebid response document | Generate Document Button (Screen 8) | [Test](http://localhost:3000/api/prebid-queries/generate-document) | /prebid-queries/generate-document |
| `/api/prebid-queries/workflow/executions` | GET | List workflow executions | Workflow Executions List/Page | [Test](http://localhost:3000/api/prebid-queries/workflow/executions) | /prebid-queries/workflow/executions |
| `/api/prebid-queries/workflow/executions/:executionId` | GET | Workflow execution details | Workflow Execution Details Page/Drawer | [Test](http://localhost:3000/api/prebid-queries/workflow/executions/1) | /prebid-queries/workflow/executions/{executionId} |

---

## 2. Historical Data (Screen 6)

| Endpoint | Method | Description | UI Section | Test URL | Swagger Path |
|----------|--------|-------------|------------|----------|--------------|
| `/api/historical-data/stats/summary` | GET | Enhanced statistics for all uploaded documents | Statistics Dashboard | [Test](http://localhost:3000/api/historical-data/stats/summary) | /historical-data/stats/summary |
| `/api/historical-data` | GET | Paginated/filterable list of documents | Tabs: Historical, Live, Referenced, Upload History | [Test](http://localhost:3000/api/historical-data) | /historical-data |
| `/api/historical-data/upload` | POST | Upload RFP, Q&A, Corrigendum (multipart) | Upload Section | [Test](http://localhost:3000/api/historical-data/upload) | /historical-data/upload |
| `/api/historical-data/:id` | GET | Get document details | Table Row Actions (View) | [Test](http://localhost:3000/api/historical-data/1) | /historical-data/{id} |
| `/api/historical-data/:id/query` | POST | Query a processed document (Ask AI) | Table Row Actions (Ask AI) | [Test](http://localhost:3000/api/historical-data/1/query) | /historical-data/{id}/query |
| `/api/historical-data/:id/retry` | POST | Retry failed processing | Table Row Actions (Retry) | [Test](http://localhost:3000/api/historical-data/1/retry) | /historical-data/{id}/retry |
| `/api/historical-data/:id` | DELETE | Delete document | Table Row Actions (Delete) | [Test](http://localhost:3000/api/historical-data/1) | /historical-data/{id} |

---

## 3. Response Schema Example (Prebid Query)

```json
{
  "queryId": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
  "rfpId": "RFP-2024-001",
  "clause_ref": "Schedule B, Clause 11.1",
  "page_number": 45,
  "clause_title": "RE Wall Construction",
  "query_text": "Kindly take note of ...",
  "ai_response": "Cl.11.1 of schedule-B ...",
  "past_rfp_ref": "RFP001",
  "past_response": "It will be provided ...",
  "admin_response": "Cl.11.1 of schedule-B ...",
  "status": "accepted",
  "submitted_by": "ABC Construction Ltd.",
  "category": "technical",
  "submitted_at": "2026-01-10T10:30:00Z",
  "updated_at": "2026-01-10T12:00:00Z"
}
```

---

## 4. Table Column to Swagger API Mapping (Prebid Query Table)

| Column Header           | Swagger API Source(s)                                                                 |
|------------------------|--------------------------------------------------------------------------------------|
| Sr.No                  | GET /api/prebid-queries (field: index)                                               |
| Clause of Ref          | GET /api/prebid-queries (field: clause_ref)                                          |
| Page Number            | GET /api/prebid-queries (field: page_number)                                         |
| Clause                 | GET /api/prebid-queries (field: clause_title)                                        |
| Description of Query   | GET /api/prebid-queries (field: query_text)                                          |
| AI Response            | GET /api/prebid-queries (field: ai_response)<br>POST /api/prebid-queries/:id/process |
| Past RFP Reference     | GET /api/prebid-queries/:id/history (field: past_rfp_ref)                            |
| Past Response          | GET /api/prebid-queries/:id/history (field: past_response)                           |
| Admin AI Response      | GET /api/prebid-queries (field: admin_response)<br>POST /api/prebid-queries/:id/admin-response |
| Admin Status           | GET /api/prebid-queries (field: status)<br>PATCH /api/prebid-queries/:id/status      |

---

## 5. Notes for Frontend Integration
- Replace `:id` or `{executionId}` with the actual UUID/ID.
- All endpoints and schemas are available in Swagger UI ([http://localhost:3000/api/docs](http://localhost:3000/api/docs)).
- For bulk actions, see [Bulk Operations - Chat Information](../Chat-History/BULK-Chat-Information.md).
- For more details on request/response bodies, refer to Swagger UI or backend DTOs.
- Use the provided test URLs for local development and API testing.

---

## 6. Additional Resources
- [Screen 7 API Integration Approach](./screen7-Implementation/Screen07-prebidquerymanagement-backend-apiintegrationapproach.md)
- [Screen 8 API Integration Approach](./screen8-Implementation/screen8-backend-API%20Integration%20approach.md)
- [Historical Data API Integration](../docs-project/ImplementationSteps/screen6-Implementation/Screen06-historicaldata-backend-apiintegrationapproach.md)

---

## 7. Example Request Payloads & Responses (POST/PATCH APIs)

### 1. POST `/api/prebid-queries/:id/process`
**Request Payload:**
```json
{}
```
*No body required; triggers AI workflow for the query.*

**Response Example:**
```json
{
  "success": true,
  "message": "AI processing started",
  "data": {
    "queryId": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
    "status": "processing"
  }
}
```

---

### 2. POST `/api/prebid-queries/:id/admin-response`
**Request Payload:**
```json
{
  "admin_response": "This is the admin's answer to the query.",
  "responded_by": "admin@company.com"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Admin response saved",
  "data": {
    "queryId": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
    "admin_response": "This is the admin's answer to the query.",
    "responded_at": "2026-01-30T12:00:00Z"
  }
}
```

---

### 3. PATCH `/api/prebid-queries/:id/status`
**Request Payload:**
```json
{
  "status": "answered"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Status updated",
  "data": {
    "queryId": "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
    "status": "answered"
  }
}
```

---

### 4. POST `/api/prebid-queries/bulk/status`
**Request Payload:**
```json
{
  "queryIds": [
    "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
    "bcd237a9-4f8b-49e1-9a9a-901f855a8b86"
  ],
  "status": "answered"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Bulk status updated",
  "updated": 2
}
```

---

### 5. POST `/api/prebid-queries/generate-document`
**Request Payload:**
```json
{
  "rfpId": "RFP-2024-001",
  "queryIds": [
    "fac137a9-4f8b-49e1-9a9a-901f855a8b85",
    "bcd237a9-4f8b-49e1-9a9a-901f855a8b86"
  ]
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Document generated",
  "documentUrl": "/downloads/prebid-response-RFP-2024-001.pdf"
}
```

---

### 6. POST `/api/historical-data/upload`
**Request Payload:**
*Multipart form-data:*
```
rfpFile: <file>
qaFile: <file>
corrigendumFile: <file>
rfpId: RFP-2024-001
```

**Response Example:**
```json
{
  "success": true,
  "message": "Files uploaded and processing started",
  "documentId": "hist-2026-001"
}
```

---

### 7. POST `/api/historical-data/:id/query`
**Request Payload:**
```json
{
  "question": "What is the bid submission deadline?"
}
```

**Response Example:**
```json
{
  "answer": "The bid submission deadline is 15th Feb 2026, 5:00 PM.",
  "confidence": 0.98,
  "source": "RFP-2024-001.pdf"
}
```

---

### 8. POST `/api/historical-data/:id/retry`
**Request Payload:**
```json
{}
```
*No body required; triggers re-processing of the document.*

**Response Example:**
```json
{
  "success": true,
  "message": "Document re-processing started"
}
```
