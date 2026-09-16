# Screen 7 Backend-API Integration Approach (Prebid Query Management)

## 1. Initial Page Load: Fetch Core Data

- **a. Fetch Query Statistics**
  - **Endpoint:** `GET /api/prebid-queries/statistics`
  - **UI Section:** (If present) Statistics Summary Panel (top of Screen 7)
  - **Swagger:** `/api/prebid-queries/statistics` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesStatistics))
  - **Purpose:** Display summary stats (total, pending, answered, etc.)

- **b. Fetch All Prebid Queries (Paginated)**
  - **Endpoint:** `GET /api/prebid-queries?status=pending&page=1&pageSize=20`
  - **UI Section:** Main Query Table/List
  - **Swagger:** `/api/prebid-queries` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueries))
  - **Purpose:** Populate the main table/list with current queries

- **c. Fetch Filter Options**
  - **Endpoint:** `GET /api/prebid-queries/filters`
  - **UI Section:** Filter Dropdowns/Sidebar
  - **Swagger:** `/api/prebid-queries/filters` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesFilters))
  - **Purpose:** Populate dropdowns for filtering (status, RFP, etc.)

---

## 2. User Interactions: Query Actions

- **a. View Query Details**
  - **Endpoint:** `GET /api/prebid-queries/:id`
  - **UI Section:** Query Details Modal/Drawer
  - **Swagger:** `/api/prebid-queries/{id}` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesId))
  - **Purpose:** Show full details of a selected query

- **b. View Query History**
  - **Endpoint:** `GET /api/prebid-queries/:id/history`
  - **UI Section:** (If present) Query History Tab/Section (within details)
  - **Swagger:** `/api/prebid-queries/{id}/history` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesIdHistory))
  - **Purpose:** Show audit trail for the query

- **c. View Similar Queries**
  - **Endpoint:** `GET /api/prebid-queries/:id/similar`
  - **UI Section:** (If present) Similar Queries Panel/Tab (within details)
  - **Swagger:** `/api/prebid-queries/{id}/similar` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueriesIdSimilar))
  - **Purpose:** Suggest similar/related queries (uses RAG/Python backend)

---

## 3. AI Processing & Automated Response (Python RAG)

- **a. Process Query with AI**
  - **Endpoint:** `POST /api/prebid-queries/:id/process`
  - **UI Section:** (If present) AI Process Button/Panel (within details)
  - **Swagger:** `/api/prebid-queries/{id}/process` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/postApiPrebidQueriesIdProcess))
  - **Purpose:** Trigger backend to call Python RAG service for answer generation

- **b. Save Admin/AI Response**
  - **Endpoint:** `POST /api/prebid-queries/:id/admin-response`
  - **UI Section:** Admin Response Editor/Save Button
  - **Swagger:** `/api/prebid-queries/{id}/admin-response` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/postApiPrebidQueriesIdAdminResponse))
  - **Purpose:** Save admin-reviewed or edited response

---

## 4. Status Updates & Workflow

- **a. Update Query Status**
  - **Endpoint:** `PATCH /api/prebid-queries/:id/status`
  - **UI Section:** Status Update Dropdown/Action (table or details)
  - **Swagger:** `/api/prebid-queries/{id}/status` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/patchApiPrebidQueriesIdStatus))
  - **Purpose:** Mark query as answered, rejected, etc.

- **b. Bulk Status Update**
  - **Endpoint:** `POST /api/prebid-queries/bulk/status`
  - **UI Section:** Bulk Actions Toolbar/Selection Panel
  - **Swagger:** `/api/prebid-queries/bulk/status` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/postApiPrebidQueriesBulkStatus))
  - **Purpose:** Update status for multiple queries at once

---

## 5. Document Generation (Screen 8 Link/Button)

- **a. Generate Prebid Response Document**
  - **Endpoint:** (Screen 8) `POST /api/prebid-queries/generate-document` (if implemented)
  - **UI Section:** Generate Document Button (top right)
  - **Swagger:** `/api/prebid-queries/generate-document` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/postApiPrebidQueriesGenerateDocument))
  - **Purpose:** Generate consolidated prebid response document

---

## 6. Pagination

- **a. Paginate Query List**
  - **Endpoint:** `GET /api/prebid-queries?page=1&pageSize=20&...`
  - **UI Section:** Pagination Controls (bottom of table)
  - **Swagger:** `/api/prebid-queries` ([Swagger UI](http://localhost:3000/api/docs#/Prebid%20Queries/getApiPrebidQueries))
  - **Purpose:** Paginate through queries

---


## 7. Table Column to Swagger API Mapping

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

----

## 8. Notes
- Replace `:id` with the actual query UUID.
- Some endpoints (e.g., document generation) may be implemented in Screen 8 proper.
- All endpoints are available in Swagger UI at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).
- For bulk actions, see [Bulk Operations - Chat Information](../Chat-History/BULK-Chat-Information.md).
