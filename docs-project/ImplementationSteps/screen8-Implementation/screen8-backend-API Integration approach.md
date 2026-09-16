# Screen 8 Backend-API Integration Approach (v2)

This document outlines the recommended sequence and approach for integrating the Screen 8 Prebid Query Management frontend with the backend (NestJS) and Python RAG services.

---

## 1. Initial Page Load: Fetch Core Data

- **a. Fetch Query Statistics**
  - Endpoint: `GET /api/prebid-queries/statistics`
    - UI Section: Statistics Summary Panel (top of Screen 8)
    - [Test Link](http://localhost:3000/api/prebid-queries/statistics)
    - swagger API: `/api/prebid-queries/statistics` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesStatistics))
    - UI Section: Statistics Summary Panel (top of Screen 8)
    - [Test Link](http://localhost:3000/api/prebid-queries/statistics)
  - Purpose: Display summary stats (total, pending, answered, etc.)

- **b. Fetch All Prebid Queries (Paginated)**
  - Endpoint: `GET /api/prebid-queries?status=pending&page=1&pageSize=20`
    - UI Section: Main Query Table/List
    - [Test Link](http://localhost:3000/api/prebid-queries?status=pending&page=1&pageSize=20)
    - swagger API: `/api/prebid-queries` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueries))
    - UI Section: Main Query Table/List
    - [Test Link](http://localhost:3000/api/prebid-queries?status=pending&page=1&pageSize=20)
  - Purpose: Populate the main table/list with current queries

- **c. Fetch Filter Options (if applicable)**
  - Endpoint: `GET /api/prebid-queries/filters` (if implemented)
    - UI Section: Filter Dropdowns/Sidebar
    - [Test Link](http://localhost:3000/api/prebid-queries/filters)
    - swagger API: `/api/prebid-queries/filters` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesFilters))
    - UI Section: Filter Dropdowns/Sidebar
    - [Test Link](http://localhost:3000/api/prebid-queries/filters)
  - Purpose: Populate dropdowns for filtering (status, RFP, etc.)

---

## 2. User Interactions: Query Actions

- **a. View Query Details**
  - Endpoint: `GET /api/prebid-queries/:id`
    - UI Section: Query Details Drawer/Modal
    - [Test Link](http://localhost:3000/api/prebid-queries/1) (replace `1` with actual query ID)
    - swagger API: `/api/prebid-queries/{id}` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesId))
    - UI Section: Query Details Drawer/Modal
    - [Test Link](http://localhost:3000/api/prebid-queries/1) (replace `1` with actual query ID)
  - Purpose: Show full details of a selected query

- **b. View Query History**
  - Endpoint: `GET /api/prebid-queries/:id/history`
    - UI Section: Query History Tab/Section (within details)
    - [Test Link](http://localhost:3000/api/prebid-queries/1/history) (replace `1` with actual query ID)
    - swagger API: `/api/prebid-queries/{id}/history` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesIdHistory))
    - UI Section: Query History Tab/Section (within details)
    - [Test Link](http://localhost:3000/api/prebid-queries/1/history) (replace `1` with actual query ID)
  - Purpose: Show audit trail for the query

- **c. View Similar Queries**
  - Endpoint: `GET /api/prebid-queries/:id/similar`
    - UI Section: Similar Queries Panel/Tab (within details)
    - [Test Link](http://localhost:3000/api/prebid-queries/1/similar) (replace `1` with actual query ID)
    - swagger API: `/api/prebid-queries/{id}/similar` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesIdSimilar))
    - UI Section: Similar Queries Panel/Tab (within details)
    - [Test Link](http://localhost:3000/api/prebid-queries/1/similar) (replace `1` with actual query ID)
  - Purpose: Suggest similar/related queries (uses RAG/Python backend)

---

## 3. AI Processing & Automated Response (Python RAG)

- **a. Process Query with AI**
  - Endpoint: `POST /api/prebid-queries/:id/process`
    - UI Section: AI Process Button/Panel (within details)
    - [Test Link](http://localhost:3000/api/prebid-queries/1/process) (replace `1` with actual query ID)
    - swagger API: `/api/prebid-queries/{id}/process` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/postApiPrebidQueriesIdProcess))
    - UI Section: AI Process Button/Panel (within details)
    - [Test Link](http://localhost:3000/api/prebid-queries/1/process) (replace `1` with actual query ID)
  - Purpose: Trigger backend to call Python RAG service for answer generation
  - Backend (NestJS) will forward the request to the Python RAG API and return the result

- **b. Save Admin/AI Response**
  - Endpoint: `POST /api/prebid-queries/:id/admin-response`
    - UI Section: Admin Response Editor/Save Button
    - [Test Link](http://localhost:3000/api/prebid-queries/1/admin-response) (replace `1` with actual query ID)
    - swagger API: `/api/prebid-queries/{id}/admin-response` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/postApiPrebidQueriesIdAdminResponse))
    - UI Section: Admin Response Editor/Save Button
    - [Test Link](http://localhost:3000/api/prebid-queries/1/admin-response) (replace `1` with actual query ID)
  - Purpose: Save the response (manual or AI-generated) to the query

---

## 4. Status Updates & Workflow

- **a. Update Query Status**
  - Endpoint: `PATCH /api/prebid-queries/:id/status`
    - UI Section: Status Update Dropdown/Action (table or details)
    - [Test Link](http://localhost:3000/api/prebid-queries/1/status) (replace `1` with actual query ID)
    - swagger API: `/api/prebid-queries/{id}/status` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/patchApiPrebidQueriesIdStatus))
    - UI Section: Status Update Dropdown/Action (table or details)
    - [Test Link](http://localhost:3000/api/prebid-queries/1/status) (replace `1` with actual query ID)
  - Purpose: Mark query as answered, rejected, etc.

- **b. Bulk Status Update**
  - Endpoint: `POST /api/prebid-queries/bulk/status`
    - UI Section: Bulk Actions Toolbar/Selection Panel
    - [Test Link](http://localhost:3000/api/prebid-queries/bulk/status)
    - swagger API: `/api/prebid-queries/bulk/status` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/postApiPrebidQueriesBulkStatus))
    - UI Section: Bulk Actions Toolbar/Selection Panel
    - [Test Link](http://localhost:3000/api/prebid-queries/bulk/status)
  - Purpose: Update status for multiple queries at once

---

## 5. Workflow Execution (if applicable)

- **a. List Executions**
  - Endpoint: `GET /api/prebid-queries/workflow/executions`
    - UI Section: Workflow Executions List/Page
    - [Test Link](http://localhost:3000/api/prebid-queries/workflow/executions)
    - swagger API: `/api/prebid-queries/workflow/executions` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesWorkflowExecutions))
    - UI Section: Workflow Executions List/Page
    - [Test Link](http://localhost:3000/api/prebid-queries/workflow/executions)

- **b. Execution Details**
  - Endpoint: `GET /api/prebid-queries/workflow/executions/:executionId`
    - UI Section: Workflow Execution Details Page/Drawer
    - [Test Link](http://localhost:3000/api/prebid-queries/workflow/executions/1) (replace `1` with actual execution ID)
    - swagger API: `/api/prebid-queries/workflow/executions/{executionId}` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesWorkflowExecutionsExecutionId))
    - UI Section: Workflow Execution Details Page/Drawer
    - [Test Link](http://localhost:3000/api/prebid-queries/workflow/executions/1) (replace `1` with actual execution ID)

---

## 6. Integration Sequence on Screen8 Load

1. Fetch statistics and initial query list in parallel
2. Render table/list and summary stats
3. On user action (select/view/process), call the relevant detail/history/similar/process endpoints
4. For AI processing, ensure backend triggers Python RAG and returns the answer
5. Allow admin to review/edit/save responses
6. Update status as needed (single or bulk)

---

## 7. Notes
- All endpoints are authenticated (ensure token/session is handled)
- For AI/RAG endpoints, handle async processing and show loading indicators
- Log errors and show user-friendly messages for failures
- Use pagination and filtering for large query sets

---

**Last Updated:** January 29, 2026  
**Version:** 2
